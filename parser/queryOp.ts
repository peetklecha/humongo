import Token, { SimpleQueryToken, DisjunctQOToken } from '../lexer/token.ts';
import * as Expr from './expression.ts';
import type { Tree } from './tree.ts'
import type BMQLGenerator from '../generator/index.ts';

export type TopQOExpr = TopQO | DisjunctQOExpr;
export type DisjunctQOExpr = DisjunctQO | ConjunctQOExpr;
export type ConjunctQOExpr = ConjunctQO | GroupingQO;

export class TopQO implements Tree {
	constructor(public left: TopQOExpr, public op: Token, public right: DisjunctQOExpr) {}
	getInterpreted(generator: BMQLGenerator): string {
		return generator.interpretTopQO(this);
	}
}

export class DisjunctQO implements Tree {
	constructor(public left: DisjunctQOExpr, public op: DisjunctQOToken, public right: ConjunctQOExpr) {}
	getInterpreted(generator: BMQLGenerator): string {
		return generator.interpretDisjunctQO(this);
	}
}

export class ConjunctQO implements Tree {
	constructor(public op: SimpleQueryToken, public right: Expr.Primary | GroupingQO | Expr.ArrayLiteral) {}
	getInterpreted(generator: BMQLGenerator): string {
		return generator.interpretConjunctQO(this);
	}
}

export class GroupingQO implements Tree {
	constructor(public content: TopQOExpr) {}
	getInterpreted(generator: BMQLGenerator): string {
		return generator.interpretGroupingQO(this);
	}
}
