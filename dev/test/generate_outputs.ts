import { existsSync } from '../dev_deps.ts';
import Humongo from '../../humongo.ts';

let didSomething = false;

for (const file of Deno.readDirSync('./dev/test/inputs')) {
	if (!existsSync(`./dev/test/outputs/${file.name.slice(0, -5)}.js`)) {
		didSomething = true;
		const output = Humongo.runFile(`./dev/test/inputs/${file.name}`, true);
		Deno.writeTextFileSync(`./dev/test/outputs/${file.name.slice(0, -5)}.js`, output);
	}
}

if (!didSomething) console.log('No output was produced.');
