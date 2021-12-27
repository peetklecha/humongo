export default class Token {
	constructor(
		public type: TokenType,
		public lexeme: string,
		public literal: unknown,
		public line: number,
	) {}

	toString() {
		return `${this.type} ${this.lexeme} ${this.literal}`
	}
}

export class TabToken extends Token {
	constructor(public line: number, public count: number) {
		super(TokenType.TAB, '\t', null, line);
	}

	increment() {
		this.lexeme += '\t';
		this.count += 1;
	}
}

export enum TokenType {
	LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE, COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,
	BANG, BANG_EQUAL, GREATER, GREATER_EQUAL, LESS, LESS_EQUAL, IDENTIFIER, STRING, NUMBER, AND, ELSE, TRUE, FALSE, IF, NULL, OR, EOF, EQUAL, EQUAL_EQUAL, TAB, BREAK, COLON, BAR, BAR_BAR, NOT_EQUAL, IN, NOT_IN, MOD, LEFT_BRACKET, RIGHT_BRACKET, QM, OID, DATE, AT_AT,
	JAVASCRIPT
}

export const simpleQueryOperators = [
	TokenType.EQUAL,
	TokenType.GREATER_EQUAL,
	TokenType.GREATER,
	TokenType.LESS,
	TokenType.LESS_EQUAL,
	TokenType.NOT_EQUAL,
	TokenType.IN,
	TokenType.NOT_IN
]

export type SimpleQueryOperator =
	| TokenType.EQUAL
	| TokenType.GREATER_EQUAL
	| TokenType.GREATER
	| TokenType.LESS
	| TokenType.LESS_EQUAL
	| TokenType.NOT_EQUAL
	| TokenType.IN
	| TokenType.NOT_IN

export interface SimpleQueryToken extends Token {
	type: SimpleQueryOperator
}

export interface DisjunctQOToken extends Token {
	type: TokenType.COMMA
}

export function isSimpleQueryOperator(obj: TokenType) : obj is SimpleQueryOperator {
	return simpleQueryOperators.includes(obj);
}


