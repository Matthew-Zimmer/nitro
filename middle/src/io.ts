import { nitro } from "./formal";
import * as fs from 'fs/promises';

export const read = async (filename: string): Promise<nitro.ast.root> => {
    const data = (await fs.readFile(filename)).toString();
    return JSON.parse(data);
}

export const write = async (filename: string, c_source: string) => {
    await fs.writeFile(filename, c_source);
}