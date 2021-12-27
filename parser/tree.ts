import type BMQLGenerator from '../generator/index.ts';

export interface Tree {
	getInterpreted(generator: BMQLGenerator, indent?: number): string;
}
