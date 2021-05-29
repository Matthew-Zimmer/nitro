import { generate_c_code, generator } from '../index';

describe('Generate variable definitions', () => {
    test('variable definition with no initial value: int', () => {
        expect(generate_c_code([
            { kind: 'variable_definition', name: 'x', type: { kind: 'int' } }
        ])).toStrictEqual('int x;');
    });

    test('variable definition with initial value: int', () => {
        expect(generate_c_code([
            { kind: 'variable_definition', name: 'x', type: { kind: 'int' }, value: { kind: 'integer', value: 2  } }
        ])).toStrictEqual('int x = 2;');
    });

    test('variable definition with no initial value: float', () => {
        expect(generate_c_code([
            { kind: 'variable_definition', name: 'x', type: { kind: 'float' } }
        ])).toStrictEqual('double x;');
    });

    test('variable definition with initial value: float', () => {
        expect(generate_c_code([
            { kind: 'variable_definition', name: 'x', type: { kind: 'float' }, value: { kind: 'floating_point', value: 2.0  } }
        ])).toStrictEqual('double x = 2.0;');
    });
});

describe('identifiers', () => {
    test('single identifier', () => {
        const g = new generator();
        expect(g.identifier({ kind: 'identifier', value: 'x', is_pointer: false })).
        toStrictEqual('x');
    });

    test('2 identifier', () => {
        const g = new generator();
        expect(g.identifier({ kind: 'identifier', value: 'x',  next: { kind: 'identifier', value: 'y', is_pointer: false }, is_pointer: false })).
        toStrictEqual('x.y');
    });

    test('3 identifier', () => {
        const g = new generator();
        expect(g.identifier({ kind: 'identifier', value: 'x', is_pointer: false, next: { kind: 'identifier', value: 'y',  is_pointer: false, next: { kind: 'identifier', value: 'z', is_pointer: false } } })).
        toStrictEqual('x.y.z');
    });

    test('2 ptr identifier', () => {
        const g = new generator();
        expect(g.identifier({ kind: 'identifier', value: 'x', is_pointer: true,  next: { kind: 'identifier', value: 'y', is_pointer: false } })).
        toStrictEqual('x->y');
    });
});

describe('function calls', () => {
    test('function calls with 0 parameters', () => {
        const g = new generator();
        expect(g.function_call({ kind: 'function_call', func: { kind: 'identifier', value: 'f', is_pointer: false }, parameters: [] })).toStrictEqual('f()');
    });

    test('function calls with 1 parameters', () => {
        const g = new generator();
        expect(g.function_call({ kind: 'function_call', func: { kind: 'identifier', value: 'f', is_pointer: false }, parameters: [{ kind: 'integer', value: 2 }] })).toStrictEqual('f(2)');
    });

    test('function calls with 2 parameters', () => {
        const g = new generator();
        expect(g.function_call({ kind: 'function_call', func: { kind: 'identifier', value: 'f', is_pointer: false }, parameters: [{ kind: 'integer', value: 2 }, { kind: 'floating_point', value: 2.0 }] })).toStrictEqual('f(2, 2.0)');
    });
});

describe('if statements', () => {
    test('single if with empty block', () => {
        const g = new generator();
        expect(g.if_statement({ kind: 'if_statement', cond: { kind: 'integer',  value: 1 }, block: { kind: 'group_statement', block: [] } })).
        toStrictEqual('if (1)\n{\n}');
    });

    test('if else if with empty blocks', () => {
        const g = new generator();
        expect(g.if_statement({ kind: 'if_statement', cond: { kind: 'integer',  value: 1 }, block: { kind: 'group_statement', block: [] }, next: { kind: 'else_if_statement', cond: { kind: 'integer',  value: 0 }, block: { kind: 'group_statement', block: [] } } })).
        toStrictEqual('if (1)\n{\n}\nelse if (0)\n{\n}');
    });

    test('if else if else with empty blocks', () => {
        const g = new generator();
        expect(g.if_statement({ kind: 'if_statement', cond: { kind: 'integer',  value: 1 }, block: { kind: 'group_statement', block: [] }, next: { kind: 'else_if_statement', cond: { kind: 'integer',  value: 0 }, block: { kind: 'group_statement', block: [] }, next: { kind: 'else_statement', block: { kind: 'group_statement', block: [] } } } })).
        toStrictEqual('if (1)\n{\n}\nelse if (0)\n{\n}\nelse\n{\n}');
    });
});

describe('group statement', () => {
    test('empty group statement', () => {
        const g = new generator();
        expect(g.group_statement({ kind: 'group_statement', block: [] })).
        toStrictEqual('{\n}');
    });

    test('1 group statement', () => {
        const g = new generator();
        expect(g.group_statement({ kind: 'group_statement', block: [{ kind: 'group_statement', block: [] }] })).
        toStrictEqual('{\n\t{\n\t}\n}');
    });

    test('2 group statement', () => {
        const g = new generator();
        expect(g.group_statement({ kind: 'group_statement', block: [{ kind: 'group_statement', block: [{ kind: 'group_statement', block: [] }] }] })).
        toStrictEqual('{\n\t{\n\t\t{\n\t\t}\n\t}\n}');
    });

    test('nested if', () => {
        const g = new generator();
        expect(g.if_statement({ kind: 'if_statement', block: { kind: 'group_statement', block: [{ kind: 'if_statement', block: { kind: 'group_statement', block: [] }, cond: { kind: 'integer',  value: 1 } }] }, cond: { kind: 'integer',  value: 1 } })).
        toStrictEqual('if (1)\n{\n\tif (1)\n\t{\n\t}\n}');
    });
});

describe('for statements', () => {
    test('infinite for loop', () => {
        const g = new generator();
        expect(g.for_statement({ kind: 'for_statement', block: { kind: 'group_statement', block: [] } })).
        toStrictEqual('for (;;)\n{\n}');
    });

    test('for with only def', () => {
        const g = new generator();
        expect(g.for_statement({ kind: 'for_statement', block: { kind: 'group_statement', block: [] }, init: { kind: 'variable_definition', name: 'x', type: { kind: 'int' }, value: { kind: 'integer', value: 2 } }})).
        toStrictEqual('for (int x = 2;;)\n{\n}');
    });

    test('for with only cond', () => {
        const g = new generator();
        expect(g.for_statement({ kind: 'for_statement', block: { kind: 'group_statement', block: [] }, cond: { kind: 'integer', value: 0 } })).
        toStrictEqual('for (;0;)\n{\n}');
    });

    test('for with only post', () => {
        const g = new generator();
        expect(g.for_statement({ kind: 'for_statement', block: { kind: 'group_statement', block: [] }, post: { kind: 'integer', value: 0 } })).
        toStrictEqual('for (;;0)\n{\n}');
    });
});

describe('while statements', () => {
    test('infinite while loop', () => {
        const g = new generator();
        expect(g.while_statement({ kind: 'while_statement', block: { kind: 'group_statement', block: [] }, cond: { kind: 'integer',  value: 1 } })).
        toStrictEqual('while (1)\n{\n}');
    });
});

describe('function definitions', () => {
    test('void function', () => {
        const g = new generator();
        expect(g.function_definition({ kind: 'function_definition', name: 'f', ret_type: { kind: 'void' }, parameters: [], block: { kind: 'group_statement', block: [] } })).
        toStrictEqual('void f()\n{\n}');
    });

    test('function with 1 parameter', () => {
        const g = new generator();
        expect(g.function_definition({ kind: 'function_definition', name: 'f', ret_type: { kind: 'void' }, parameters: [{ name: 'x',  kind: 'parameter', type: { kind: 'int' } }], block: { kind: 'group_statement', block: [] } })).
        toStrictEqual('void f(int x)\n{\n}');
    });

    test('function with 3 parameter', () => {
        const g = new generator();
        expect(g.function_definition({ kind: 'function_definition', name: 'f', ret_type: { kind: 'void' }, parameters: [{ name: 'x',  kind: 'parameter',type: { kind: 'int' } }, { name: 'y',  kind: 'parameter', type: { kind: 'int' } }, { name: 'z',  kind: 'parameter', type: { kind: 'float' } }], block: { kind: 'group_statement', block: [] } })).
        toStrictEqual('void f(int x, int y, double z)\n{\n}');
    });
});

describe('struct definitions', () => {
    test('empty struct', () => {
        const g = new generator();
        expect(g.struct_definition({ kind: 'struct_definition', name: 'a', properties: [] })).
        toStrictEqual('struct a\n{\n};');
    });

    test('1 properties struct', () => {
        const g = new generator();
        expect(g.struct_definition({ kind: 'struct_definition', name: 'a', properties: [{ kind: 'variable_definition', name: 'p', type: { kind: 'int' } }] })).
        toStrictEqual('struct a\n{\n\tint p;\n};');
    });

    test('3 properties struct', () => {
        const g = new generator();
        expect(g.struct_definition({ kind: 'struct_definition', name: 'a', properties: [{ kind: 'variable_definition', name: 'p1', type: { kind: 'int' }},  { kind: 'variable_definition', name: 'p2', type: { kind: 'int' } },  { kind: 'variable_definition', name: 'p3', type: { kind: 'float' } }] })).
        toStrictEqual('struct a\n{\n\tint p1;\n\tint p2;\n\tdouble p3;\n};');
    });
});

describe('class names types', () => {
    test('class in variable definition', () => {
        const g = new generator();
        expect(g.variable_definition({ kind: 'variable_definition', name: 'x', type: { kind: 'classname', name: '_a' } })).
        toStrictEqual('_a x;');
    });

    test('class in function parameter definition', () => {
        const g = new generator();
        expect(g.function_definition({ kind: 'function_definition', name: 'f', parameters: [{ kind: 'parameter', name: 'x', type: { kind: 'classname', name: '_a' } }], ret_type: { kind: 'void' }, block: { kind: 'group_statement', block: [] } })).
        toStrictEqual('void f(_a x)\n{\n}');
    });

    test('class in function return definition', () => {
        const g = new generator();
        expect(g.function_definition({ kind: 'function_definition', name: 'f', parameters: [], block: { kind: 'group_statement', block: [] }, ret_type: { kind: 'classname', name: '_a' } })).
        toStrictEqual('_a f()\n{\n}');
    });
});

describe('type definitions', () => {
    test('class typedef', () => {
        const g = new generator();
        expect(g.type_definition({ kind: 'type_definition', name: 't', type: { kind: 'classname', name: 'struct a' } })).
        toStrictEqual('typedef struct a t;');
    });

    test('primitive typedef', () => {
        const g = new generator();
        expect(g.type_definition({ kind: 'type_definition', name: 't', type: { kind: 'int' } })).
        toStrictEqual('typedef int t;');
    });
});

describe('pointer type', () => {
    test('int pointer', () => {
        const g = new generator();
        expect(g.pointer({ kind: 'pointer', base: { kind: 'int' } })).
        toStrictEqual('int*');
    });
});

describe('pointer expressions', () => {
    test('address of literal', () => {
        const g = new generator();
        expect(g.address_of({ kind: 'address_of', base: { kind: 'identifier', value: 'x', is_pointer: false }})).
        toStrictEqual('(&(x))');
    });

    test('deference a pointer', () => {
        const g = new generator();
        expect(g.dereference({ kind: 'dereference', base: { kind: 'identifier', value: 'x', is_pointer: true }})).
        toStrictEqual('(*(x))');
    });
});

test('function types TODO', () => {
    const g = new generator();
    expect(() => g.func({ kind: 'func', ret: { kind: 'int' }, args: [] })).
    toThrowError('TODO');
});

test('assign expression', () => {
    const g = new generator();
    expect(g.assign({ 
        kind: 'assign', 
        left: { 
            kind: 'identifier',
            value: 'x',
            is_pointer: false,
         },
         right: {
             kind: 'integer',
             value: 2
         }
    })).
    toStrictEqual('(x = 2)');
});