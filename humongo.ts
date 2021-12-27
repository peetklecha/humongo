import Lexer from './lexer/index.ts';
import Parser from './parser/index.ts';
import BMQLGenerator from './generator/index.ts';

export default class Humongo {
	static runFile(target: string, verbose = false) {
		if (typeof Deno === 'undefined') throw new Error(`File system access only available with the Deno runtime -- you are either attempting to access the file system from the browser or using node.js!`)
		const source = Deno.readTextFileSync(target);
		return this.run(source, verbose);
	}

	static run(source: string, verbose = false) {
		if (verbose) console.log(source);
		const lexer = new Lexer(source);
		const tokens = lexer.lex();
		if (verbose) console.log(tokens);
		const parser = new Parser(tokens);
		const tree = parser.parse();
		if (verbose) console.log(tree);
		const generator = new BMQLGenerator();
		const output = generator.interpret(tree);
		if (verbose) console.log(output);
		return output;
	}

	static greet() {
		console.log("Welcome to Humongo. I hope you enjoy it!")
	}
}

