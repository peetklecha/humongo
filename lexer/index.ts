import Token, { TokenType, TabToken } from './token.ts';

export default class Lexer {
	private tokens: Token[] = [];
	private current = 0;
	private start = 0;
	private line = 1;
	constructor(private source: string) {}

	lex(): Token[] {
		while (!this.isAtEnd) {
			this.start = this.current;
			this.scanToken();
		}

		this.tokens.push(new Token(TokenType.EOF, '', null, this.line));
		return this.tokens;
	}

	private get isAtEnd() {
		return this.current >= this.source.length;
	}

	private scanToken() {
		const char = this.advance();
		if (char === '\n') this.line++;
		switch (char) {
			case '"': return this.string();
			case "'": return this.javascript();
			case '#': return this.objectId();
			case ' ':
				if (this.lastToken.type !== TokenType.BREAK) break;
				return this.tabsFromSpaces();
			case '\t':
				if (this.lastToken instanceof TabToken) return this.lastToken.increment();
				else return this.addTabToken();
			default:
				if (Lexer.startsComplexSymbol(char)) {
					const { next } = this;
					const complex = char + next;
					if (complex === '@@') {
						this.advance();
						this.date();
					} else if (Lexer.isComplexSymbol(complex)) {
						this.addToken(Lexer.complexSymbols[complex]);
						this.advance();
					} else {
						this.addToken(Lexer.simpleSymbols[char]);
					}
				} else if (Lexer.isSimpleSymbol(char)) this.addToken(Lexer.simpleSymbols[char]);
				else if (Lexer.isDigit(char)) this.number();
				else if (Lexer.isAlpha(char)) this.identifier();
				else throw new Error(`Unexpected character: ${char}`);
		}
	}

	public advance() {
		return this.source[this.current++];
	}

	private addToken(type: TokenType, literal: unknown = null) {
		const text = this.source.slice(this.start, this.current);
		this.tokens.push(new Token(type, text, literal, this.line))
	}

	private addTabToken() {
		this.tokens.push(new TabToken(this.line, 1))
	}

	private tabsFromSpaces() {
		if (this.next === ' ') {
			this.addTabToken();
			this.advance()
		}
		while (this.next === ' ' && this.afterNext === ' ') {
			(this.lastToken as TabToken).increment();
			this.advance();
			this.advance();
		}
	}

	private static simpleSymbols: Record<SimpleSymbols, TokenType> = {
		'(': TokenType.LEFT_PAREN,
		')': TokenType.RIGHT_PAREN,
		'{': TokenType.LEFT_BRACE,
		'}': TokenType.RIGHT_BRACE,
		',': TokenType.COMMA,
		'.': TokenType.DOT,
		'-': TokenType.MINUS,
		'+': TokenType.PLUS,
		';': TokenType.SEMICOLON,
		'*': TokenType.STAR,
		'/': TokenType.SLASH,
		'\n': TokenType.BREAK,
		':': TokenType.COLON,
		"@": TokenType.IN,
		'!': TokenType.BANG,
		'=': TokenType.EQUAL,
		'<': TokenType.LESS,
		'>': TokenType.GREATER,
		'|': TokenType.BAR,
		'%': TokenType.MOD,
		'[': TokenType.LEFT_BRACKET,
		']': TokenType.RIGHT_BRACKET,
		'?': TokenType.QM,
	}

	private static isSimpleSymbol(char: string): char is SimpleSymbols {
		return char in this.simpleSymbols;
	}

	private static complexSymbols: Record<ComplexSymbols, TokenType> = {
		'!=': TokenType.NOT_EQUAL,
		'!@': TokenType.NOT_IN,
		'<=': TokenType.LESS_EQUAL,
		'>=': TokenType.GREATER_EQUAL,
		'==': TokenType.EQUAL_EQUAL,
		'||': TokenType.BAR_BAR,
		'@@': TokenType.AT_AT,
	}

	private static startsComplexSymbol(char: string): char is SimpleSymbols {
		return Object.keys(this.complexSymbols).map(key => key[0]).includes(char);
	}

	private static isComplexSymbol(char: string): char is ComplexSymbols {
		return char in this.complexSymbols;
	}

	private match(expected: string) {
		if (this.isAtEnd) return false;
		if (this.source[this.current] !== expected) return false;
		this.current++;
		return true;
	}

	private get next() {
		if (this.isAtEnd) return '\0';
		return this.source[this.current];
	}

	private get afterNext() {
		if (this.current + 1 >= this.source.length) return '\0';
		return this.source[this.current + 1];
	}

	private get lastToken() {
		return this.tokens[this.tokens.length - 1];
	}

	private string() {
		while (!this.stringShouldTerminate()) {
			if (this.next === '\n') this.line++;
			this.advance();
		}

		if (this.isAtEnd) throw new Error('Unterminated string');

		this.advance();
		this.addToken(TokenType.STRING, this.source.slice(this.start + 1, this.current - 1));
	}

	private stringShouldTerminate() {
		return this.next === '"' && this.source[this.current - 1] !== '\\'
			|| this.isAtEnd;
	}

	private javascript() {
		while (!this.jsShouldTerminate()) {
			if (this.next === '\n') this.line++
			this.advance()
		}

		if (this.isAtEnd) throw new Error('Unterminated interpolated JavaScript');
		this.advance();
		this.addToken(TokenType.JAVASCRIPT, this.source.slice(this.start + 1, this.current - 1));
	}

	private jsShouldTerminate() {
		return this.next === "'" && this.source[this.current - 1] !== '\\'
			|| this.isAtEnd;
	}

	private static isDigit(char: string) {
		return char >= '0' && char <= '9';
	}

	private static isAlpha(char: string) {
		return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char === '.' || char === "$"
	}

	private static isAlphaNumeric(char: string) {
		return this.isDigit(char) || this.isAlpha(char);
	}

	private static isHex(char: string) {
		return this.isDigit(char) || char >= 'a' && char <= 'f';
	}

	private static isDateChar(char: string) {
		return this.isDigit(char) || char === "T" || char === "-" || char === ":"
	}

	private number() {
		while (Lexer.isDigit(this.next)) this.advance();

		if (this.next === '.' && Lexer.isDigit(this.afterNext)) {
			this.advance();
			while (Lexer.isDigit(this.next)) this.advance();
		}

		this.addToken(TokenType.NUMBER, +this.source.slice(this.start, this.current));
	}

	private identifier() {
		while (Lexer.isAlphaNumeric(this.next)) this.advance();
		switch (this.source.slice(this.start, this.current)) {
			case 'true': return this.addToken(TokenType.TRUE);
			case 'false': return this.addToken(TokenType.FALSE);
			case 'null': return this.addToken(TokenType.NULL);
			default: this.addToken(TokenType.IDENTIFIER);
		}
	}

	private objectId() {
		while (Lexer.isHex(this.next)) this.advance();
		const hex = this.source.slice(this.start + 1, this.current);
		if (hex.length !== 12) throw new Error(`ObjectId must have length of 12, found ${hex.length}`);
		this.addToken(TokenType.OID, hex);
	}

	private date() {
		while (Lexer.isDateChar(this.next)) this.advance();
		const date = this.source.slice(this.start + 2, this.current);
		this.addToken(TokenType.DATE, date);
	}
}

type SimpleSymbols = '(' | ')' | '{' | '}' | ',' | '.' | '-' | '+' | ';' | '*' | '/' | '\n' | ':' | '@' | '!' | '|' | '=' | '<' | '>' | '%' | '[' | ']' | '?'

type ComplexSymbols = '!=' | '==' | '<=' | '>=' | '!@' | '||' | '@@'
