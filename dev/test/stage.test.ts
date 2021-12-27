import { existsSync, assertEquals } from "../dev_deps.ts";
import todo from './todo.ts';
import Humongo from '../../index.ts';

function test(suite: "aggregation_stages" | "expressions" | "query_ops") {
	for (const item of todo[suite]) {
		Deno.test(item, () => {
			console.log('testing')
			const inputExists = existsSync(`./dev/test/inputs/${item}.bmql`);
			const outputExists = existsSync(`./dev/test/outputs/${item}.js`)
			if (inputExists && outputExists) {
				const output = Humongo.runFile(`./dev/test/inputs/${item}.bmql`);
				const target = Deno.readTextFileSync(`./dev/test/outputs/${item}.js`);
				assertEquals(output, target, `Mismatch at char ${[...output].findIndex((ch, i) => target[i] !== ch)}`);
			} else assertEquals(inputExists && outputExists, true, `Feature '${item}' not yet implemented.`);
		})
	}
}

for (const suite of ['aggregation_stages', 'expressions', "query_ops"] as const) {
	test(suite);
}
