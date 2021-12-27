import Humongo from '../../humongo.ts';

const [file] = Deno.args;

const output = Humongo.runFile(`./dev/test/inputs/${file}.bmql`, true);
Deno.writeTextFileSync(`./dev/test/outputs/${file}.js`, output);

console.log('done');
