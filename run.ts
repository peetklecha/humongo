import Humongo from './humongo.ts';

const [target, verbose] = Deno.args;
Humongo.runFile(target, !!verbose);
