export * from './formal';
export * from './generator';
export * from './stack';
export * from './translator';
export * from './binder';
export * from './type_util';
export * from './error';

// import * as fs from 'fs/promises';
// import { nitro } from './formal';
// import { generator } from './generator';
// import { translator } from './translator';

// async function main() {
//     const t = new translator();
//     const g = new generator();

//     const tast: nitro.tast.root = [{
//         kind: 'variable_definition',
//         name: 'x',
//         type: { kind: 'int' },
//         value: { kind: 'integer', type: { kind: 'int' }, value: 8 }
//     }, {
//         kind: 'variable_definition',
//         name: 'y',
//         type: { kind: 'int' },
//         value: { kind: 'integer', type: { kind: 'int' }, value: 2 }
//     }, {
//         kind: 'function_definition',
//         name: 'f',
//         type: { kind: 'func', args: [], ret: { kind: 'void' }},
//         parameters: [],
//         block: { kind: 'group_statement', block: [] }
//     }, {
//         kind: 'class_definition',
//         name: 'a',
//         variables: [{
//             kind: 'variable_definition',
//             name: 'x',
//             type: { kind: 'int' },
//         }, {
//             kind: 'variable_definition',
//             name: 'y',
//             type: { kind: 'float' },
//         }],
//         functions: [{
//             kind: 'function_definition',
//             name: 'g',
//             type: { kind: 'func', args: [{ kind: 'pointer', base: { kind: 'classname', name: 'a' }  }], ret: { kind: 'void' }},
//             parameters: [{ kind: 'parameter', name: 'this', type: { kind: 'pointer', base: { kind: 'classname', name: 'a' }  } }],
//             block: { kind: 'group_statement', block: [] }
//         }, {
//             kind: 'function_definition',
//             name: 'h',
//             type: { kind: 'func', args: [{ kind: 'pointer', base: { kind: 'classname', name: 'a' }  }, { kind: 'int' }], ret: { kind: 'void' }},
//             parameters: [{ kind: 'parameter', name: 'this', type: { kind: 'pointer', base: { kind: 'classname', name: 'a' }  } }, { kind: 'parameter', name: 'b', type: { kind: 'int' }}],
//             block: { kind: 'group_statement', block: [] }
//         }]
//     }, {
//         kind: 'variable_definition',
//         name: 'z',
//         type: { kind: 'classname', name: 'a' },
//     }];
//     const c_ast = t.root(tast);
//     const c_source = g.root(c_ast);
//     await fs.writeFile('out.nt.c', c_source);
// }

// main();
