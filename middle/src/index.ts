export * from './formal';
export * from './generator';
export * from './stack';
export * from './translator';
export * from './binder';
export * from './type_util';
export * from './error';
export * from './io';

import { binder } from './binder';
import { generator } from './generator';
import { read, write } from './io';
import { translator } from './translator';

export async function middle() {
    const b = new binder();
    const t = new translator();
    const g = new generator();

    const input_file = process.argv[2];
    const output_file = `${input_file}.c`;

    const ast = await read(input_file);
    const tast = b.root(ast);
    const c_ast = t.root(tast);
    const c_source = g.root(c_ast);
    await write(output_file, c_source);
}