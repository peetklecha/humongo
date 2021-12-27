import Token from '../lexer/token.ts';
import type { Tree } from './tree.ts';
import type BMQLGenerator from '../generator/index.ts';

export type Expr = CastExpr | Ternary;
export type CastExpr = EqualityExpr | Cast;
export type EqualityExpr = ComparisonExpr | Equality;
export type ComparisonExpr = TermExpr | Comparison;
export type TermExpr = FactorExpr | Term;
export type FactorExpr = UnaryExpr | Factor;
export type UnaryExpr = Unary | Primary | Grouping | Identifier | Invocation | ObjectLiteral | ArrayLiteral | Access;

export class Expression implements Tree {
	constructor(public content: Expr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretExpression(this);
	}
}

export class Cast implements Tree {
	constructor(public expr: EqualityExpr, public type: string) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretCast(this);
	}
}

export class Equality implements Tree {
	constructor(public left: ComparisonExpr, public op: Token, public right: ComparisonExpr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretEqualityExpr(this);
	}
}

export class Comparison implements Tree {
	constructor(public left: TermExpr, public op: Token, public right: TermExpr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretComparisonExpr(this);
	}
}

export class Term implements Tree {
	constructor(public left: FactorExpr, public op: Token, public right: FactorExpr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretTermExpr(this);
	}
}

export class Factor implements Tree {
	constructor(public left: UnaryExpr, public op: Token, public right: UnaryExpr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretFactorExpr(this);
	}
}

export class Unary implements Tree {
	constructor(public op: Token, public right: UnaryExpr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretUnaryExpr(this);
	}
}

export class Grouping implements Tree {
	constructor(public expression: Expr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretGroupingExpr(this);
	}
}

export class Primary implements Tree {
	constructor(public value: unknown, public verbatim?: boolean) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretPrimaryExpr(this);
	}
}

export class Identifier implements Tree {
	constructor(public name: string) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretIdentifierExpr(this);
	}
}

export type Binary = Equality | Comparison | Term | Factor


export class Invocation implements Tree {
	constructor(public func: string, public args: Expr[]) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretInvocation(this);
	}
}

export class Access implements Tree {
	constructor(public array: Expr, public index: Expr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretAccess(this);
	}
}

export class ObjectLiteral implements Tree {
	constructor(public entries: readonly [string, Expr][]) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretObjectLiteral(this);
	}
}

export class ArrayLiteral implements Tree {
	constructor(public entries: Expr[]) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretArrayLiteral(this);
	}
}

export class Ternary implements Tree {
	constructor(public left: CastExpr, public middle: CastExpr, public right: CastExpr) {}
	getInterpreted(generator: BMQLGenerator) {
		return generator.interpretTernary(this);
	}
}
