import { compile } from "./compile";

compile(process.argv.slice(2)).catch((e) => console.error(e));
