import { rm, mkdir, readFile, writeFile } from "fs/promises";
import { toGoMainModule, toGoMod, toGoSum } from "../compiler/go/lowering";
import { parse } from "../compiler/nitro/grammar";
import { rewriteToGo } from "../compiler/nitro/lowering";
import { inferAndTypeCheck } from "../compiler/nitro/type-system";

export async function compile(args: string[]) {
  try {
    await rm("out", { recursive: true });
  } catch {}
  await mkdir("out");
  await mkdir("out/log");

  const nitroSource = (await readFile(args[0])).toString();

  const untypedMod = parse(nitroSource);
  const typedMod = inferAndTypeCheck(untypedMod);
  const goMod = rewriteToGo(typedMod);

  await writeFile("out/main.go", toGoMainModule(goMod));
  await writeFile("out/go.mod", toGoMod());
  await writeFile("out/go.sum", toGoSum());
}
