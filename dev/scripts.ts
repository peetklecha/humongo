import { exec } from './util.ts'
import { stage } from './stage.ts'

function run(
	args: string[],
	tasks: Record<string, (...args: string[]) => void | Promise<void>>
) {
	const [name = '', ...args_] = args;
  if (name in tasks) tasks[name](...args_)
  else console.log(`Task "${name}" not found`);
}

run(Deno.args, {
	async test(...args: string[]) {
		await exec('deno', 'test', '--allow-read', '--unstable', ...args);
	},
	async generate() {
		await exec('deno', 'run', '--allow-read', '--allow-write', '--unstable', 'dev/test/generate_outputs.ts');
	},
	async compile(filename: string) {
		await exec('deno', 'run', '--allow-read', '--unstable', 'run.ts', `./dev/test/inputs/${filename}.bmql`, 'true');
	},
	async docs() {
		await exec('deno', 'run', '--allow-read', '--allow-write', '--allow-net', '--unstable', 'dev/generate_docs.ts');
	},
	async recompile(filename: string) {
		await exec('deno', 'run', '--allow-read', '--allow-write', '--unstable', 'dev/test/compile.ts', filename);
	},
	stage: stage || (async () => {}),
})

//alias deno-run='deno run --allow-run dev/scripts.ts'
