export async function exec(...args: string[]) {
  const proc = await Deno.run({ cmd: args }).status();
  if(proc.success == false) {
    Deno.exit(proc.code);
  }
  return proc;
}
