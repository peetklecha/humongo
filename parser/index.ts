import Token, { TokenType, TabToken, simpleQueryOperators, SimpleQueryToken, DisjunctQOToken } from '../lexer/token.ts';
import * as Expr from './expression.ts';
import * as QO from './queryOp.ts';
import { operators as o, stages, Body, Stage, File, QuerySubStage, SetStage, FieldsStage, ImportSpec } from './statement.ts';
import { comap } from '../util.ts';

export default class Parser {
	private indent = 0;
	private current = 0;
	constructor(private tokens: Token[]) {}

	public parse() {
		try {
			return this.file()
		} catch (err) {
			console.log(`Syntax error at ${this.next.line}: ${this.next.toString()}`)
			throw err;
		}
	}

	private file() {
		if (this.matchContent(o.AGGREGATE)) {
			const collection = this.expression();
			if (collection instanceof Expr.Identifier) {
				const body = this.body();
				return new File(collection.name, body);
			} else throw new Error('`aggregate` must be followed by an identifier.')
		} else {
			console.log(this)
			throw 'not yet implemented'
		}
	}

	private *block() {
		this.consume(TokenType.COLON, str => `Expected block, found ${str}`);
		this.consume(TokenType.BREAK, str => `Expected line return after colon, found ${str}`)
		if (this.matchIndent(+1)) {
			this.indent += 1;
			while (this.matchIndent(0)) {
				this.advance();
				console.log(`parsing ${this.next}`)
				yield;
				if (this.previous.type !== TokenType.BREAK)
					this.consume(TokenType.BREAK, str => `Expected line return after stage, found ${str}`)
			}
			console.log('block finished')
			this.indent -= 1;
		} else throw new Error(`Expected ${this.indent + 1} indents after return, found ${
			this.next instanceof TabToken
				? this.next.count
				: `non-tab: ${this.next.lexeme}`
		}.`)
	}

	private body() {
		const stages = comap(this.block(), () => this.stage());
		return new Body(stages);
	}

	private stage(): Stage | Stage[] {
		if (this.check(TokenType.JAVASCRIPT)) {
			return new Stage('', this.primary());
		}
		const stage = this.consumeContent(str => `${str} is not a valid aggregation stage.`, ...Object.keys(stages));
		// if (this.matchContent(...Object.keys(stages))) {
		// 	const stage = this.previous;
		switch (stage.lexeme) {
			case 'match':
				if (this.matchContent('if')) return this.matchIf();
				return this.matchStage();
			case 'set': return this.setStage();
			case 'limit': return this.limitStage();
			case 'project': return this.projectStage();
			case 'import':
				if (this.matchContent('one')) return this.importOneStage();
				return this.importStage();
			case 'count': return this.countStage();
			case 'group': return this.groupStage();
			case 'sort': return this.sortStage();
			case 'unwind': return this.unwindStage();
			default:
				throw "this shouldn't happen";
		}
	}

	private unwindStage() {
		const id = this.identifier();
		return new Stage('unwind', id);
	}

	private sortStage() {
		const stages = comap(this.block(), () => this.sortSubStage());
		return new Stage('sort', stages);
	}

	private sortSubStage() {
		const id = this.identifier();
		let dir;
		if (this.matchContent("asc")) dir = "1"
		else if (this.matchContent("desc")) dir = "-1"
		else if (this.matchContent("text")) dir = '{ $meta: "textScore" }'
		else throw new Error("invalid sort stage");
		return new SetStage(id.name, new Expr.Primary(dir, true));
	}

	private groupStage() {
		this.consumeContent(() => `Invalid group stage. Syntax is: 'group by <expression>:'`, 'by');
		const _id = this.expression();
		const stages = comap(this.block(), () => this.setSubStage());
		return new Stage('group', [new SetStage("_id", _id), ...stages])
	}

	private countStage() {
		let alias = "count";
		if (this.matchContent("as")) {
			const id = this.identifier();
			alias = id.name;
		} else if (this.matchContent("by")) {
			const expr = this.expression();
			return new Stage('sortByCount', expr)
		}
		return new Stage('count', new Expr.Primary(alias))
	}

	private importOneStage() {
		const importStage = this.importStage();
		const importSpec = importStage.body as ImportSpec;
		const idString = importSpec.alias || importSpec.collection;
		const id = new Expr.Identifier(idString);
		const rhsValue = new Expr.Access(id, new Expr.Primary(0));
		return [
			importStage,
			new Stage('set', [new SetStage(idString, rhsValue)])
		];
	}

	private importStage() {
		const first = this.identifier();
		let collection, foreign, local, alias;
		if (this.matchContent('from')) [collection, alias] = [this.identifier(), first];
		else collection = first;
		if (this.matchContent('by')) foreign = this.identifier();
		if (this.matchContent('using')) local = this.identifier();
		if (!this.check(TokenType.BREAK)) throw new Error("invalid import stage");
		const spec = new ImportSpec(collection.name, local?.name, foreign?.name, alias?.name);
		return new Stage('lookup', spec);
	}

	private projectStage() {
		if (this.check(TokenType.COLON)) {
			const substages = comap(this.block(), () => this.projectSubStage());
			return new Stage('project', substages);
		} else {
			const substage = this.projectSubStage();
			return new Stage('project', [substage]);
		}
	}

	private projectSubStage() {
		const id = this.consume(TokenType.IDENTIFIER, str => `Expected identifier, found ${str}`);
		if (this.match(TokenType.EQUAL)) {
			const value = this.expression();
			return new SetStage(id.lexeme, value);
		} else if (this.check(TokenType.COMMA)) {
			const ids = [id];
			while(this.match(TokenType.COMMA)) {
				const nextId = this.consume(TokenType.IDENTIFIER, str => `Expected identifier, found ${str}`);
				ids.push(nextId);
			}
			return new FieldsStage(ids.map(id => id.lexeme), 'project');
		}
		throw new Error('Invalid project stage.')
	}

	private limitStage() {
		const num = this.literal();
		if (typeof num.value !== 'number') throw new Error('Limit should be a number.')
		return new Stage('limit', num);
	}

	private setStage() {
		if (this.check(TokenType.COLON)) {
			const substages = comap(this.block(), () => this.setSubStage());
			return new Stage('set', substages);
		} else {
			const substage = this.setSubStage();
			return new Stage('set', [substage]);
		}
	}

	private setSubStage() {
		const id = this.consume(TokenType.IDENTIFIER, str => `Expected identifier, found ${str}`);
		this.consume(TokenType.EQUAL, () => `Expected equal sign.`);
		const value = this.expression();
		return new SetStage(id.lexeme, value)
	}

	private matchIf() {
		const expr = this.expression();
		return new Stage("match", new Expr.Expression(expr))
	}

	private matchStage() {
		if (this.check(TokenType.COLON)) {
			const substages = comap(this.block(), () => this.matchSubstage());
			return new Stage('match', substages);
		} else {
			const substage = this.matchSubstage();
			return new Stage('match', [substage]);
		}
	}

	private matchSubstage() {
		const id = this.consume(TokenType.IDENTIFIER, str => `Expected idnetifier, found ${str}`);
		const body = this.expressionQO();
		return new QuerySubStage(id, body);
	}

	private expressionQO() {
		let expr: QO.TopQOExpr = this.disjunctQO();
		while (this.match(TokenType.BAR_BAR)) {
			const operator = this.previous;
			const right = this.disjunctQO();
			expr = new QO.TopQO(expr, operator, right);
		}
		return expr;	}

	private disjunctQO() {
		let expr: QO.DisjunctQOExpr = this.conjunctQO();
		while (this.match(TokenType.COMMA)) {
			const operator = this.previous as DisjunctQOToken;
			const right = this.conjunctQO();
			expr = new QO.DisjunctQO(expr, operator, right);
		}
		return expr;
	}

	private conjunctQO(): QO.ConjunctQOExpr {
		if (this.match(TokenType.LEFT_PAREN)) {
			const expr = this.expressionQO();
			this.consume(TokenType.RIGHT_PAREN, str => `Expected ")", found ${str}`)
			return new QO.GroupingQO(expr);
		} else if (this.match(...simpleQueryOperators)) {
			const operator = this.previous as SimpleQueryToken;
			const right = [TokenType.IN, TokenType.NOT_IN].includes(operator.type) ? this.arrayLiteral(false) : this.literal();
			return new QO.ConjunctQO(operator, right);
		} else {
			throw new Error('Expected query statement.')
		}
	}

	private expression() {
		const expr = this.castable();
		if (this.match(TokenType.QM)) {
			const middle = this.castable();
			this.consume(TokenType.COLON, str => `Expected :, found ${str}`);
			const right = this.castable();
			return new Expr.Ternary(expr, middle, right);
		} else return expr;
	}

	private castable() {
		const expr = this.equality();
		if (this.matchContent("as")) {
			const { lexeme } = this.consume(TokenType.IDENTIFIER, str => `Expected type identifier, found ${str}`);
			return new Expr.Cast(expr, lexeme);
		}
		return expr;
	}

	private equality() {
		return this.rightAssociative(this.comparison, Expr.Equality, TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)
	}

	private comparison() {
		const tokenTypes = [TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL, TokenType.IN, TokenType.NOT_IN]
		return this.rightAssociative(this.term, Expr.Comparison, ...tokenTypes)
	}

	private term() {
		return this.rightAssociative(this.factor, Expr.Term, TokenType.MINUS, TokenType.PLUS);
	}

	private factor() {
		return this.rightAssociative(this.unary, Expr.Factor, TokenType.SLASH, TokenType.STAR, TokenType.MOD);
	}

	private unary(): Expr.UnaryExpr {
		if (this.match(TokenType.BANG, TokenType.MINUS)) {
			const operator = this.previous;
			const right = this.unary();
			return new Expr.Unary(operator, right);
		}

		return this.primary();
	}

	private literal() {
		if (this.match(TokenType.FALSE)) return new Expr.Primary(false);
		if (this.match(TokenType.TRUE)) return new Expr.Primary(true);
		if (this.match(TokenType.NULL)) return new Expr.Primary(null);
		if (this.match(TokenType.NUMBER, TokenType.STRING)) return new Expr.Primary(this.previous.literal);
		if (this.match(TokenType.OID)) return new Expr.Primary(`ObjectId("${this.previous.literal}")`, true);
		if (this.match(TokenType.DATE)) return new Expr.Primary(`ISODate("${this.previous.literal}")`, true);
		if (this.match(TokenType.JAVASCRIPT)) return new Expr.Primary(this.previous.literal, true)
		throw new Error('Expected literal.');
	}

	private primary() {
		if (this.match(TokenType.LEFT_PAREN)) {
			const expr = this.expression();
			this.consume(TokenType.RIGHT_PAREN, str => `Expect ')' after expression, found ${str}`);
			return new Expr.Grouping(expr);
		} else if (this.match(TokenType.LEFT_BRACE)) {
			this.allowWhitespace();
			const entries = [this.keyValuePair()];
			while (this.match(TokenType.COMMA)) {
				this.allowWhitespace();
				entries.push(this.keyValuePair());
			}
			this.allowWhitespace();
			this.consume(TokenType.RIGHT_BRACE, str => `Expected closing } for object literal, found ${str}`);
			return new Expr.ObjectLiteral(entries)
		} else if (this.match(TokenType.LEFT_BRACKET)) {
			return this.arrayLiteral(true);
		} else {
			try {
				return this.literal()
			} catch {
				return this.identifierOrInvocation();
			}
		}
	}

	private arrayLiteral(bracketAlreadyConsumed: boolean) {
		if (!bracketAlreadyConsumed) this.consume(TokenType.LEFT_BRACKET, str => `Expected [, found ${str}`)
		this.allowWhitespace();
		const entries = [this.expression()];
		while (this.match(TokenType.COMMA)) {
			this.allowWhitespace();
			entries.push(this.expression());
		}
		this.allowWhitespace();
		this.consume(TokenType.RIGHT_BRACKET, str => `Expected closing ] for array literal, found ${str}`);
		return new Expr.ArrayLiteral(entries);
	}

	private keyValuePair() {
		const key = this.identifier();
		this.consume(TokenType.COLON, str => `Expected colon, found ${str}`);
		const expr = this.expression();
		return [key.name, expr] as [string, Expr.Expr];
	}

	private identifierOrInvocation() {
		const token = this.advance();
		if (this.match(TokenType.LEFT_PAREN)) {
			const args = [this.expression()];
			while (this.match(TokenType.COMMA)) args.push(this.expression());
			this.consume(TokenType.RIGHT_PAREN, str =>  `Expect ')' after expression, found ${str}`);
			return new Expr.Invocation(token.lexeme, args);
		} else if (this.match(TokenType.LEFT_BRACKET)) {
			const index = this.expression();
			this.consume(TokenType.RIGHT_BRACKET, str => `Expected ']', found ${str}`);
			return new Expr.Access(new Expr.Identifier(token.lexeme), index);
		}
		return new Expr.Identifier(token.lexeme);
	}

	private identifier() {
		const token = this.advance();
		return new Expr.Identifier(token.lexeme);
	}

	private rightAssociative<
		T extends new (left: Expr.EqualityExpr, op: Token, right: Expr.EqualityExpr) => Expr.Binary,
		>(constituent: () => Expr.EqualityExpr, ExprType: T, ...tokens: TokenType[]) {
		let expr: Expr.EqualityExpr = constituent.call(this);
		while (this.match(...tokens)) {
			const operator = this.previous;
			const right = constituent.call(this);
			expr = new ExprType(expr, operator, right);
		}
		return expr;
	}

	private match(...types: TokenType[]) {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	private matchContent(...contents: string[]) {
		for (const content of contents) {
			if (this.checkContent(content)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	// private matchTab(count: number) {
	// 	if (this.check(TokenType.TAB) && this.next.count === count)
	// }

	private check(type: TokenType) {
		if (this.isAtEnd) return false;
		return this.next.type === type;
	}

	private checkContent(content: string) {
		if (this.isAtEnd) return false;
		return this.next.lexeme === content;
	}

	private advance() {
		if (!this.isAtEnd) this.current++;
		return this.previous;
	}

	private get isAtEnd() {
		return this.next.type === TokenType.EOF
	}

	private get next() {
		return this.tokens[this.current];
	}

	private get previous() {
		return this.tokens[this.current - 1];
	}

	private consume(type: TokenType, message: (msg: string) => string) {
		if (this.check(type)) return this.advance();
		console.log(this.next);
		throw new Error(message(this.next.lexeme));
	}

	private consumeContent(message: (msg: string) => string, ...contents: string[]) {
		if (this.matchContent(...contents)) return this.previous;
		throw new Error(message(this.next.lexeme));
	}

	private matchIndent(offset: number) {
		return this.next instanceof TabToken && this.next.count === this.indent + offset
	}

	private allowWhitespace() {
		if (this.match(TokenType.BREAK)) this.match(TokenType.TAB);
	}
}
