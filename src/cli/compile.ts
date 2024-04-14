import { rm, mkdir, readFile, writeFile } from "fs/promises";
import { toGoMainModule, toGoMod, toGoSum } from "../compiler/go/lowering";
import { parse } from "../compiler/nitro/grammar";
import { rewriteToGo } from "../compiler/nitro/lowering";
import { inferAndTypeCheck } from "../compiler/nitro/type-system";
import { NitroProject } from "../compiler/nitro/modules";
import { GoModule } from "../compiler/go/ast";

export async function compile() {
  try {
    await rm(".out", { recursive: true });
  } catch {}
  await mkdir(".out");
  await mkdir(".out/log");

  const project = new NitroProject(process.env.NITRO_HOME!, process.cwd());

  const modules = project.compile();

  const goMod: GoModule = {
    kind: "GoModule",
    definitions: [],
  };

  for (const mod of modules) {
    const m = rewriteToGo(mod);
    goMod.definitions.push(...m.definitions);
  }

  await writeFile(".out/main.go", toGoMainModule(goMod));
  await writeFile(".out/go.mod", toGoMod());
  await writeFile(".out/go.sum", toGoSum());
}
