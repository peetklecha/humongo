import type { File, Body, Stage, QuerySubStage, SetStage, FieldsStage, ImportSpec } from '../parser/statement.ts';
import type { Tree } from '../parser/tree.ts';
import type * as Expr from '../parser/expression.ts';
import type * as QO from '../parser/queryOp.ts';
import { TokenType } from '../lexer/token.ts';
import { zip } from '../util.ts';


export const REQUIRED = Symbol();

export default class BMQLGenerator {
	interpret(tree: Tree, indent = 0) {
		return tree.getInterpreted(this, indent);
	}

	interpretFile(file: File, indent: number): string {
		return `db.getCollection("${file.collection}").aggregate([\n${this.interpret(file.body, indent + 1)}\n])\n`
	}

	interpretBody(body: Body, indent: number): string {
		return body.aggregations.map(stage => `${this.interpret(stage, indent)}`).join(',\n')
	}

	interpretStage(stage: Stage, indent: number): string {
		if (stage.head === '' && !Array.isArray(stage.body)) return `${'\t'.repeat(indent)}${this.interpret(stage.body)}`;
		const heads = stage.head.split('.');
		if (Array.isArray(stage.body)) {
			const output = stage.body.map(qss => `${this.interpret(qss, indent + 1)},\n`)
			output.unshift(`${'\t'.repeat(indent)}${heads.map(head => `{ $${head}:`).join(' ')} {\n`);
			output.push('\t'.repeat(indent) + '} '.repeat(heads.length + 1).trim());
			return output.join('');
		} else {
			let output = this.interpret(stage.body, indent);
			for (const head of heads.reverse()) {
				if (!BMQLGenerator.LITERAL_STAGES.includes(head)) output = `{${margin(output)}}`
				output = `{ $${head}:${margin(output)}}`
			}
			return `${"\t".repeat(indent)}${output}`;
		}
	}

	interpretQuerySubStage(query: QuerySubStage, indent: number): string {
		let { lexeme } = query.id;
		if (lexeme.includes('.')) lexeme = `"${lexeme}"`
		return '\t'.repeat(indent) + `${lexeme}: ${this.interpret(query.body, indent)}`;
	}

	interpretPrimaryExpr(expr: Expr.Primary): string {
		if (expr.verbatim) return `${expr.value}`;
		if (typeof expr.value === 'string') return `"${expr.value}"`;
		return `${expr.value}`;
	}

	interpretGroupingQO(expr: QO.GroupingQO): string {
		return this.interpret(expr.content);
	}

	interpretConjunctQO(expr: QO.ConjunctQO): string {
		const mapping = {
			[TokenType.EQUAL]: 'eq',
			[TokenType.LESS]: 'lt',
			[TokenType.LESS_EQUAL]: 'lte',
			[TokenType.GREATER]: 'gt',
			[TokenType.GREATER_EQUAL]: 'gte',
			[TokenType.IN]: 'in',
			[TokenType.NOT_IN]: 'nin',
			[TokenType.NOT_EQUAL]: 'ne',
		}
		return `{ $${mapping[expr.op.type]}: ${this.interpret(expr.right)} }`;
	}

	interpretDisjunctQO(expr: QO.DisjunctQO): string {
		return `{ $and: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
	}

	interpretTopQO(expr: QO.TopQO) : string {
		return `{ $or: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
	}

	interpretIdentifierExpr(expr: Expr.Identifier) : string {
		if (expr.name.startsWith("$$")) return `"${expr.name}"`;
		return `"$${expr.name}"`;
	}

	interpretGroupingExpr(expr: Expr.Grouping): string {
		return this.interpret(expr.expression);
	}

	interpretUnaryExpr(expr: Expr.Unary): string {
		switch (expr.op.type) {
			case TokenType.BANG:
				return `{ $not: ${this.interpret(expr.right)} }`
			case TokenType.MINUS:
				return `{ $multiply: [${this.interpret(expr.right)}, -1] }`
			default:
				throw "this shouldn't happen";
		}
	}

	interpretFactorExpr(expr: Expr.Factor): string {
		switch (expr.op.type) {
			case TokenType.STAR:
				return `{ $multiply: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
			case TokenType.SLASH:
				return `{ $divide: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
			case TokenType.MOD:
				return `{ $mod: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
			default:
				throw "this shouldn't happen";
		}
	}

	interpretTermExpr(expr: Expr.Term): string {
		switch (expr.op.type) {
			case TokenType.PLUS:
				return `{ $add: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
			case TokenType.MINUS:
				return `{ $subtract: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
			default:
				throw "this shouldn't happen";
		}
	}

	interpretComparisonExpr(expr: Expr.Comparison): string {
		const body = `[${this.interpret(expr.left)}, ${this.interpret(expr.right)}]`;
		switch (expr.op.type) {
			case TokenType.LESS:
				return `{ $lt: ${body} }`
			case TokenType.LESS_EQUAL:
				return `{ $lte: ${body} }`
			case TokenType.GREATER:
				return `{ $gt: ${body} }`
			case TokenType.GREATER_EQUAL:
				return `{ $gte: ${body} }`
			case TokenType.IN:
				return `{ $in: ${body} }`
			case TokenType.NOT_IN:
				return `{ $not: { $in: ${body} } }`
			default:
				throw "this shouldn't happen";
		}
	}

	interpretEqualityExpr(expr: Expr.Equality): string {
		switch (expr.op.type) {
			case TokenType.EQUAL_EQUAL:
			case TokenType.EQUAL:
				return `{ $eq: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
			case TokenType.BANG_EQUAL:
				return `{ $ne: [${this.interpret(expr.left)}, ${this.interpret(expr.right)}] }`
			default:
				throw "this shouldn't happen";
		}
	}

	interpretExpression(expr: Expr.Expression): string {
		return `$expr: ${this.interpret(expr.content)}`;
	}

	interpretSetStage(expr: SetStage, indent: number): string {
		let { id } = expr;
		if (id.includes(".")) id = `"${id}"`;
		return '\t'.repeat(indent) + `${id}: ${this.interpret(expr.value)}`
	}

	interpretFieldsStage(expr: FieldsStage, indent: number): string {
		switch (expr.type) {
			case "project":
				return expr.fields.map(field => '\t'.repeat(indent) + `${field}: true`).join(',\n');
			default:
				throw "this shouldn't happen";
		}
	}

	interpretImportSpec(expr: ImportSpec, indent: number): string {
		return '\n'
			+ '\t'.repeat(indent + 1) + `from: "${expr.collection}",\n`
			+ '\t'.repeat(indent + 1) + `localField: "${expr.localField || expr.collection}",\n`
			+ '\t'.repeat(indent + 1) + `foreignField: "${expr.foreignField || '_id'}",\n`
			+ '\t'.repeat(indent + 1) + `as: "${expr.alias || expr.collection}",\n`
			+ '\t'.repeat(indent)
	}

	invocation(func: string, args: Expr.Expr[], defs = BMQLGenerator.FUNCS): string {
		if (func in defs) {
			const value: FuncSpec | undefined = defs[func];
			if (!value) throw "this shouldn't happen";
			if (value === 'single') {
				const [arg, ...rest] = args;
				if (!arg) throw new Error(`Function ${func} expects 1 argument, found 0.`);
				if (rest.length) throw new Error(`Function ${func} expects 1 argument, found ${rest.length}`);
				return `{ $${func}: ${this.interpret(arg)} }`;
			} else if (typeof value === 'number') {
				const { length } = args;
				if (length !== value && value !== Infinity)
					throw new Error(`Function ${func} expects ${value} argument, found ${length}.`);
				const rhs = length ? `[${args.map(arg => this.interpret(arg)).join(', ')}]` : '{}'
				return `{ $${func}: ${rhs} }`;
			} else if (Array.isArray(value)) {
				const outputArgs = [];
				for (const [def, val] of zip(value, args)) {
					if (!val) {
						if (def === REQUIRED) throw new Error(`Required argument omitted from ${func}`);
						outputArgs.push(`${def}`);
					} else outputArgs.push(val);
				}
				return ` $${func}: [${outputArgs.map(thing => typeof thing === 'string' ? thing : this.interpret(thing))}]`
			} else if (isDetailedFuncSpec(value)) {
				const { args: argNum = Infinity, alias = func, argStyle } = value;
				return this.invocation(alias, args, { [alias]: argStyle === "double" ? argNum : "single" });
			} else {
				if (value.overloads.includes(args.length)) {
					return this.invocation(func, args, { [func]: args.length });
				} else throw new Error(`Function ${func} expected ${value.overloads.join('/')} arguments, found ${args.length}`);
			}
		} else throw new Error(`Function ${func} is not defined.`)
	}

	interpretInvocation(expr: Expr.Invocation): string {
		return this.invocation(expr.func, expr.args);
	}

	interpretCast(expr: Expr.Cast): string {
		return `{ $to${expr.type}: ${this.interpret(expr.expr)} }`
	}

	interpretObjectLiteral(expr: Expr.ObjectLiteral): string {
		const intermediate = `{ ${expr.entries.map(([key, value]) => `${key}: ${this.interpret(value)}`).join(', ')} }`;
		if (expr.entries.some(([key]) => key.startsWith("$"))) return `{ $literal: ${intermediate} }`;
		return intermediate;
	}

	interpretArrayLiteral(expr: Expr.ArrayLiteral): string {
		return `[${expr.entries.map(entry => this.interpret(entry)).join(", ")}]`
	}

	interpretTernary(expr: Expr.Ternary): string {
		return `{ $cond: { if: ${this.interpret(expr.left)}, then: ${this.interpret(expr.middle)}, else: ${this.interpret(expr.right)} } }`
	}

	interpretAccess(expr: Expr.Access): string {
		return `{ $arrayElemAt: [${this.interpret(expr.array)}, ${this.interpret(expr.index)}] }`
	}

	static LITERAL_STAGES = ["limit", "count", "sortByCount", "unwind"]

	static FUNCS: Record<string, FuncSpec> = {
		abs: "single",
		acos: "single",
		acosh: "single",
		all: {
			args: Infinity,
			alias: "allElementsTrue",
			argStyle: "double"
		},
		any: {
			args: Infinity,
			alias: "anyElementTrue",
			argStyle: "double"
		},
		arrayToObject: "single",
		asin: "single",
		asinh: "single",
		atan: "single",
		atanh: "single",
		atan2: "single",
		avg: "single",
		ceil: "single",
		cmp: 2,
		concat: Infinity,
		concatArrays: Infinity,
		cos: "single",
		cosh: "single",
		dayOfMonth: "single",
		dayOfWeek: "single",
		dayOfYear: "single",
		degreesToRadians: "single",
		exp: "single",
		filter: "single",
		first: "single",
		floor: "single",
		hour: "single",
		indexOfArray: {
			overloads: [2, 3, 4]
		},
		indexOfBytes: {
			overloads: [2, 3, 4]
		},
		isArray: 1,
		isNumber: "single",
		isoDayOfWeek: "single",
		isoWeek: "single",
		isoWeekYear: "single",
		last: "single",
		let: "single",
		ln: "single",
		log: "single",
		log10: "single",
		map: "single",
		millisecond: "single",
		minute: "single",
		month: "single",
		objectToArray: "single",
		pow: 2,
		push: "single",
		radiansToDegrees: "single",
		rand: 0,
		range: [REQUIRED, REQUIRED, 1],
		reduce: "single",
		reverseArray: "single",
		round: [REQUIRED, 0],
		sampleRate: "single",
		second: "single",
		setDifference: 2,
		setEquals: Infinity,
		setIntersection: Infinity,
		setIsSubset: 2,
		setUnion: Infinity,
		size: "single",
		sin: "single",
		sinh: "single",
		slice: {
			overloads: [2, 3]
		},
		split: 2,
		sqrt: "single",
		strcasecmp: 2,
		strLenBytes: "single",
		strLenCP: "single",
		substr: 3,
		substrBytes: 3,
		substrCP: 3,
		sum: "single",
		switch: "single",
		tan: "single",
		tanh: "single",
		trunc: [REQUIRED, 0],
		type: "single",
		week: "single",
		year: "single",
		zip: "single",
	}

	static CASTS = [
		"Bool",
		"Date",
		"Decimal",
		"Double",
		"Int",
		"Long",
		"ObjectId",
		"String",
		"Lower",
		"Upper"
	]
}

interface DetailedFuncSpec {
	args?: number
	alias?: string
	argStyle?: "single" | "double"
}

interface OverloadSpec {
	overloads: FuncSpec[];
}

type ArgList = (typeof REQUIRED | number)[]

type FuncSpec = DetailedFuncSpec | ArgList | "single" | number | OverloadSpec

function isDetailedFuncSpec(obj: object): obj is DetailedFuncSpec {
	return 'args' in obj || 'alias' in obj || 'argStyle' in obj;
}

function margin(str: string) {
	const begin = (str.startsWith('\t') || str.startsWith(' ')) ? '' : ' '
	const end = (str.endsWith('\t') || str.endsWith(' ')) ? '' : ' '
	return `${begin}${str}${end}`
}
