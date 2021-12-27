import type { TopQOExpr } from './queryOp.ts';
import type Token from '../lexer/token.ts'
import type { Tree } from './tree.ts';
import type BMQLGenerator from '../generator/index.ts';
import type * as Expr from './expression.ts';

export const stages = {
	bucket: "bucket",
	count: "count",
	group: "group",
	limit: "limit",
	import: "lookup",
	match: "match",
	project: "project",
	set: "set",
	unset: "unset",
	unwind: "unwind",
	sort: "sort"
}

export const operators = {
	AGGREGATE: "aggregate",
	...stages,
}

export class File implements Tree {
	constructor(public collection: string, public body: Body) {}
	getInterpreted(generator: BMQLGenerator, indent: number) {
		return generator.interpretFile(this, indent);
	}
}

export class Body implements Tree {
	constructor(public aggregations: Stage[]) {}
	getInterpreted(generator: BMQLGenerator, indent: number) {
		return generator.interpretBody(this, indent);
	}
}

export class Stage implements Tree {
	constructor(public head: string, public body: Tree | Tree[]) {}
	getInterpreted(generator: BMQLGenerator, indent: number) {
		return generator.interpretStage(this, indent);
	}
}

export class MatchStage extends Stage {
	constructor(head: string, body: QuerySubStage[]) { super(head, body) }
}

export class SetStage implements Tree {
	constructor(public id: string, public value: Expr.Expr) {}
	getInterpreted(generator: BMQLGenerator, indent: number) {
		return generator.interpretSetStage(this, indent);
	}
}

export class FieldsStage implements Tree {
	constructor(public fields: string[], public type: string) {}
	getInterpreted(generator: BMQLGenerator, indent: number) {
		return generator.interpretFieldsStage(this, indent);
	}
}

export class ComplexStage extends Stage implements Tree {
	constructor(head: string, body: Body) { super(head, body) }
	// getInterpreted(generator: BMQLGenerator, indent?: number): string {
	// 	return generator.interpretStage(this, indent);
	// }
}

// export class ExprStmt extends Stage implements Tree {
// 	constructor(expr: Expr) { super("expr", expr) }
// 	// getInterpreted(generator: BMQLGenerator, indent?: number): string {
// 	// 	return generator.interpretStage(this, indent);
// 	// }
// }

export class QuerySubStage implements Tree {
	constructor(public id: Token, public body: TopQOExpr) {}
	getInterpreted(generator: BMQLGenerator, indent: number) {
		return generator.interpretQuerySubStage(this, indent);
	}
}

export class ImportSpec implements Tree {
	constructor(public collection: string, public localField?: string, public foreignField?: string, public alias?: string) {}
	getInterpreted(generator: BMQLGenerator, indent: number) {
		return generator.interpretImportSpec(this, indent);
	}
}
