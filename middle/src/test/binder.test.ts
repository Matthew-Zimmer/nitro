import { binder, class_environment, environment } from "../binder";
import { compile_error } from '../error';
import { test_stack_for } from "../stack";

describe('environment tests', () => {
    test('test push and pop', () => {
        const e = new environment();

        e.push();

        expect((e as any).env.length).toStrictEqual(2);

        e.pop();

        expect((e as any).env.length).toStrictEqual(1);
    });

    test('test get set', () => {
        const e = new environment();

        e.set('x', { kind: 'int' });

        expect(e.get('x')).toStrictEqual({
            kind: 'int'
        });
    });

    test('test set override', () => {
        const e = new environment();

        e.set('x', { kind: 'int' });

        expect(() => e.set('x', { kind: 'float' })).toThrowError(new compile_error('x is already defined'));
    });

    test('test set override union', () => {
        const e = new environment();

        e.set('x', { kind: 'union', types: [{ kind: 'int' }] });

        e.set('x', { kind: 'union', types: [{ kind: 'float' }] });
        
        expect(e.get('x')).toStrictEqual({
            kind: 'union',
            types: [{
                kind: 'int'
            }, {
                kind: 'float'
            }]
        })
    });

    test('test set override union non union', () => {
        const e = new environment();

        e.set('x', { kind: 'union', types: [{ kind: 'int' }] });

        e.set('x', { kind: 'float' });
        
        expect(e.get('x')).toStrictEqual({
            kind: 'union',
            types: [{
                kind: 'int'
            }, {
                kind: 'float'
            }]
        })
    });

    test('test get undefined', () => {
        const e = new environment();

        expect(() => e.get('x')).toThrowError(new compile_error('x is not defined'));
    });

    test('test scope', () => {
        const e = new environment();

        e.scope([], () => {
            expect((e as any).env.length).toStrictEqual(2);
        });

        expect((e as any).env.length).toStrictEqual(1);
    });
});

describe('class environment tests', () => {
    test('test set get', () => {
        const e = new class_environment();

        const type = { kind: 'classname' as const, name: 'a' };

        e.set(type, [['x', { kind: 'int' }]]);

        expect(e.get(type)).toStrictEqual([
            ['x', { kind: 'int' }]
        ]);
    });

    test('test set override', () => {
        const e = new class_environment();

        const type = { kind: 'classname' as const, name: 'a' };

        e.set(type, []);

        expect(() => e.set(type, [])).toThrowError(new compile_error('a is already defined'));
    });

    test('test get undefined', () => {
        const e = new class_environment();

        const type = { kind: 'classname' as const, name: 'a' };

        expect(() => e.get(type)).toThrowError(new compile_error('a is not defined'));
    });
});

describe('bind expressions', () => {
    test('bind integer expression', () => {
        const b = test_stack_for(binder);

        b.expression({
            kind: 'integer',
            value: 2
        });

        expect(b.working_stack).toStrictEqual([{
            kind: 'expression',
            value: {
                kind: 'integer',
                value: 2,
                type: { kind: 'int' }
            }
        }]);
    });

    test('bind floating point expression', () => {
        const b = test_stack_for(binder);

        b.expression({
            kind: 'floating_point',
            value: 2.9
        });

        expect(b.working_stack).toStrictEqual([{
            kind: 'expression',
            value: {
                kind: 'floating_point',
                value: 2.9,
                type: { kind: 'float' }
            }
        }]);
    });

    test('bind boolean expression', () => {
        const b = test_stack_for(binder);

        b.expression({
            kind: 'boolean',
            value: true
        });

        expect(b.working_stack).toStrictEqual([{
            kind: 'expression',
            value: {
                kind: 'boolean',
                value: true,
                type: { kind: 'bool' }
            }
        }]);
    });

    describe('bind identifier expressions', () => {
        test('bind unknown identifier expression', () => {
            const b = test_stack_for(binder);

            expect(() => b.expression({
                kind: 'identifier',
                value: 'x'
            })).
            toThrowError(new compile_error('x is not defined'));
        });

        test('bind known identifier expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env: environment }).name_env.set('x', { kind: 'int' });

            b.expression({
                kind: 'identifier',
                value: 'x'
            });
            
            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'identifier',
                    value: 'x',
                    type: { kind: 'int' },
                    next: undefined
                }
            }]);
        });

        test('bind known compound identifier expression', () => {
            const b = test_stack_for(binder);

            (b as any as { type_env: class_environment }).type_env.set({ kind: 'classname', name: 'a' }, [['y', { kind: 'int' }]]);
            (b as any as { name_env: environment }).name_env.set('x', { kind: 'classname', name: 'a' });

            b.expression({
                kind: 'identifier',
                value: 'x',
                next: {
                    kind: 'identifier',
                    value: 'y'
                }
            });
            
            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'identifier',
                    value: 'x',
                    type: { kind: 'classname', name: 'a' },
                    next: {
                        kind: 'identifier',
                        value: 'y',
                        type: { kind: 'int' },
                        next:  undefined
                    }
                }
            }]);
        });

        test('bind nonclass compound identifier expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env: environment }).name_env.set('x', { kind: 'int' });

            const f = () => b.expression({
                kind: 'identifier',
                value: 'x',
                next: {
                    kind: 'identifier',
                    value: 'y'
                }
            });
            
            expect(f).toThrowError(new compile_error('int is not a class'));
        });
    });

    describe('bind function call expressions', () => {
        test('bind correct function call expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('f', {
                kind:  'union',
                types: [{
                    kind: 'func',
                    args: [{
                        kind: 'int'
                    }, {
                        kind: 'int'
                    }],
                    ret: { kind: 'void' }
                }]
            });

            b.function_call({
                kind: 'function_call',
                func: { 
                    kind: 'identifier',
                    value: 'f',
                },
                parameters: [{
                    kind: 'integer',
                    value: 1
                }, {
                    kind: 'integer',
                    value: 2
                }]
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: { 
                        kind: 'identifier',
                        value: 'f',
                        type: {
                            kind: 'union',
                            types: [{
                                kind: 'func',
                                args: [{
                                    kind: 'int'
                                }, {
                                    kind: 'int'
                                }],
                                ret: { kind: 'void' }
                            }]
                        },
                        next:  undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 1,
                        type: { kind: 'int' }
                    }, {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    }],
                    type: {
                        kind: 'void'
                    }
                }
            }]);
        });

        test('bind not enough args function call expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('f', {
                kind: 'func',
                args: [{
                    kind: 'int'
                }, {
                    kind: 'int'
                }],
                ret: { kind: 'void' }
            });

            const f = () => b.function_call({
                kind: 'function_call',
                func: { 
                    kind: 'identifier',
                    value: 'f',
                },
                parameters: [{
                    kind: 'integer',
                    value: 1
                }]
            });

            expect(f).toThrowError(new compile_error('expected 2 parameters but got 1'));
        });

        test('bind invalid parameter type function call expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('f', {
                kind: 'func',
                args: [{
                    kind: 'int'
                }, {
                    kind: 'int'
                }],
                ret: { kind: 'void' }
            });

            const f = () => b.function_call({
                kind: 'function_call',
                func: { 
                    kind: 'identifier',
                    value: 'f',
                },
                parameters: [{
                    kind: 'integer',
                    value: 1
                }, {
                    kind: 'floating_point',
                    value: 1.6
                }]
            });

            expect(f).toThrowError(new compile_error('expected (int, int) but got (int, float)'));
        });

        test('bind invalid function type function call expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('f', { kind: 'int' });

            const f = () => b.function_call({
                kind: 'function_call',
                func: { 
                    kind: 'identifier',
                    value: 'f',
                },
                parameters: [{
                    kind: 'integer',
                    value: 1
                }, {
                    kind: 'floating_point',
                    value: 1.6
                }]
            });

            expect(f).toThrowError(new compile_error('can not call non function type: int'));
        });
    });

    describe('bind add expressions', () => {
        test('bind correct add(+) expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('_op_+', {
                kind: 'func',
                args: [{
                    kind: 'int'
                }, {
                    kind: 'int'
                }],
                ret: { kind: 'int' }
            });

            b.expression({
                kind: 'add_expression',
                op: '+',
                left: {
                    kind: 'integer',
                    value: 2
                },
                right: {
                    kind: 'integer',
                    value: 2
                }
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'add_expression',
                    op: '+',
                    left: {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    },
                    right: {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    },
                    type: { kind: 'int' }
                }
            }]);
        });
    });

    describe('bind mul expressions', () => {
        test('bind correct mul(*) expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('_op_*', {
                kind: 'func',
                args: [{
                    kind: 'int'
                }, {
                    kind: 'int'
                }],
                ret: { kind: 'int' }
            });

            b.expression({
                kind: 'mul_expression',
                op: '*',
                left: {
                    kind: 'integer',
                    value: 2
                },
                right: {
                    kind: 'integer',
                    value: 2
                }
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'mul_expression',
                    op: '*',
                    left: {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    },
                    right: {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    },
                    type: { kind: 'int' }
                }
            }]);
        });
    });

    describe('bind cmp expressions', () => {
        test('bind correct cmp(+) expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('_op_==', {
                kind: 'func',
                args: [{
                    kind: 'int'
                }, {
                    kind: 'int'
                }],
                ret: { kind: 'bool' }
            });

            b.expression({
                kind: 'cmp_expression',
                op: '==',
                left: {
                    kind: 'integer',
                    value: 2
                },
                right: {
                    kind: 'integer',
                    value: 2
                }
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'cmp_expression',
                    op: '==',
                    left: {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    },
                    right: {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    },
                    type: { kind: 'bool' }
                }
            }]);
        });
    });

    describe('bind and expressions', () => {
        test('bind correct and(and) expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('_op_and', {
                kind: 'func',
                args: [{
                    kind: 'bool'
                }, {
                    kind: 'bool'
                }],
                ret: { kind: 'bool' }
            });

            b.expression({
                kind: 'and_expression',
                op: 'and',
                left: {
                    kind: 'boolean',
                    value: true
                },
                right: {
                    kind: 'boolean',
                    value: true
                }
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'and_expression',
                    op: 'and',
                    left: {
                        kind: 'boolean',
                        value: true,
                        type: { kind: 'bool' }
                    },
                    right: {
                        kind: 'boolean',
                        value: true,
                        type: { kind: 'bool' }
                    },
                    type: { kind: 'bool' }
                }
            }]);
        });
    });

    describe('bind or expressions', () => {
        test('bind correct or(or) expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('_op_or', {
                kind: 'func',
                args: [{
                    kind: 'bool'
                }, {
                    kind: 'bool'
                }],
                ret: { kind: 'bool' }
            });

            b.expression({
                kind: 'or_expression',
                op: 'or',
                left: {
                    kind: 'boolean',
                    value: true
                },
                right: {
                    kind: 'boolean',
                    value: true
                }
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'or_expression',
                    op: 'or',
                    left: {
                        kind: 'boolean',
                        value: true,
                        type: { kind: 'bool' }
                    },
                    right: {
                        kind: 'boolean',
                        value: true,
                        type: { kind: 'bool' }
                    },
                    type: { kind: 'bool' }
                }
            }]);
        });
    });

    describe('bind assign expressions', () => {
        test('bind correct assign expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('x', {
                kind: 'bool'
            });

            b.expression({
                kind: 'assign_expression',
                left: {
                    kind: 'identifier',
                    value: 'x'
                },
                right: {
                    kind: 'boolean',
                    value: true
                }
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'assign_expression',
                    left: {
                        kind: 'identifier',
                        value: 'x',
                        type: { kind: 'bool' },
                        next: undefined
                    },
                    right: {
                        kind: 'boolean',
                        value: true,
                        type: { kind: 'bool' }
                    },
                    type: { kind: 'bool' }
                }
            }]);
        });
    });

    describe('bind pre unary expressions', () => {
        test('bind correct pre unary(-) expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('_op_pre_-', {
                kind: 'func',
                args: [{
                    kind: 'int'
                }],
                ret: { kind: 'int' }
            });

            b.expression({
                kind: 'pre_unary_expression',
                op: '-',
                value: {
                    kind: 'integer',
                    value: 1
                }
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'pre_unary_expression',
                    op: '-',
                    value: {
                        kind: 'integer',
                        value: 1,
                        type: { kind: 'int' }
                    },
                    type: { kind: 'int' }
                }
            }]);
        });
    });

    describe('bind post unary expressions', () => {
        test('bind correct post unary(!) expression', () => {
            const b = test_stack_for(binder);

            (b as any as { name_env:  environment }).name_env.set('_op_post_!', {
                kind: 'func',
                args: [{
                    kind: 'int'
                }],
                ret: { kind: 'int' }
            });

            b.expression({
                kind: 'post_unary_expression',
                op: '!',
                value: {
                    kind: 'integer',
                    value: 1
                }
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'post_unary_expression',
                    op: '!',
                    value: {
                        kind: 'integer',
                        value: 1,
                        type: { kind: 'int' }
                    },
                    type: { kind: 'int' }
                }
            }]);
        });
    });
});

describe('bind statements', () => {
    test('bind group statement', () => {
        const b = test_stack_for(binder);

        b.statement({
            kind: 'group_statement',
            block: []
        });

        expect(b.working_stack).toStrictEqual([{
            kind: 'statement',
            value: {
                kind: 'group_statement',
                block: []
            }
        }]);
    });

    describe('bind if statements', () => {
        test('bind only if statement', () => {
            const b = test_stack_for(binder);
    
            b.statement({
                kind: 'if_statement',
                cond: {
                    kind: 'boolean',
                    value: true
                },
                block: {
                    kind: 'group_statement',
                    block: []
                }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: {
                        kind: 'boolean',
                        value: true,
                        type: { kind: 'bool' }
                    },
                    block: {
                        kind: 'group_statement',
                        block: []
                    },
                    next: undefined
                }
            }]);
        });

        test('bind if else statement', () => {
            const b = test_stack_for(binder);
    
            b.statement({
                kind: 'if_statement',
                cond: {
                    kind: 'boolean',
                    value: true
                },
                block: {
                    kind: 'group_statement',
                    block: []
                },
                next: {
                    kind: 'else_statement',
                    block: {
                        kind: 'group_statement',
                        block: []
                    }
                }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: {
                        kind: 'boolean',
                        value: true,
                        type: { kind: 'bool' }
                    },
                    block: {
                        kind: 'group_statement',
                        block: []
                    },
                    next: {
                        kind: 'else_statement',
                        block: {
                            kind: 'group_statement',
                            block: []
                        }
                    }
                }
            }]);
        });

        test('bind if else if statement', () => {
            const b = test_stack_for(binder);
    
            b.statement({
                kind: 'if_statement',
                cond: {
                    kind: 'boolean',
                    value: false
                },
                block: {
                    kind: 'group_statement',
                    block: []
                },
                next: {
                    kind: 'else_if_statement',
                    cond: {
                        kind: 'boolean',
                        value: true
                    },
                    block: {
                        kind: 'group_statement',
                        block: []
                    }
                }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: {
                        kind: 'boolean',
                        value: false,
                        type: { kind: 'bool' }
                    },
                    block: {
                        kind: 'group_statement',
                        block: []
                    },
                    next: {
                        kind: 'else_if_statement',
                        cond: {
                            kind: 'boolean',
                            value: true,
                            type: { kind: 'bool' }
                        },
                        block: {
                            kind: 'group_statement',
                            block: []
                        },
                        next: undefined
                    }
                }
            }]);
        });

        test('bind if else if else if else statement', () => {
            const b = test_stack_for(binder);
    
            b.statement({
                kind: 'if_statement',
                cond: {
                    kind: 'boolean',
                    value: false
                },
                block: {
                    kind: 'group_statement',
                    block: []
                },
                next: {
                    kind: 'else_if_statement',
                    cond: {
                        kind: 'boolean',
                        value: false
                    },
                    block: {
                        kind: 'group_statement',
                        block: []
                    },
                    next: {
                        kind: 'else_if_statement',
                        cond: {
                            kind: 'boolean',
                            value: false
                        },
                        block: {
                            kind: 'group_statement',
                            block: []
                        },
                        next: {
                            kind: 'else_statement',
                            block: {
                                kind: 'group_statement',
                                block: []
                            }
                        }
                    }
                }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: {
                        kind: 'boolean',
                        value: false,
                        type: { kind: 'bool' }
                    },
                    block: {
                        kind: 'group_statement',
                        block: []
                    },
                    next: {
                        kind: 'else_if_statement',
                        cond: {
                            kind: 'boolean',
                            value: false,
                            type: { kind: 'bool' }
                        },
                        block: {
                            kind: 'group_statement',
                            block: []
                        },
                        next: {
                            kind: 'else_if_statement',
                            cond: {
                                kind: 'boolean',
                                value: false,
                                type: { kind: 'bool' }
                            },
                            block: {
                                kind: 'group_statement',
                                block: []
                            },
                            next: {
                                kind: 'else_statement',
                                block: {
                                    kind: 'group_statement',
                                    block: []
                                }
                            }
                        }
                    }
                }
            }]);
        });
    });
});

describe('bind definitions', () => {
    describe('bind variable definitions', () => {
        test('bind variable definition with type and value', () => {
            const b = test_stack_for(binder);
    
            b.definition({
                kind: 'variable_definition',
                name: 'x',
                value: {
                    kind: 'integer',
                    value: 2
                },
                type: { kind: 'int' }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'definition', 
                value: {
                    kind: 'variable_definition',
                    name: 'x',
                    value: {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    },
                    type: { kind: 'int' }
                }
            }]);
    
            expect((b as any).name_env.get('x')).toStrictEqual({
                kind: 'int'
            });
        });
    
        test('bind variable definition with type and no value', () => {
            const b = test_stack_for(binder);
    
            b.definition({
                kind: 'variable_definition',
                name: 'x',
                type: { kind: 'int' }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'definition', 
                value: {
                    kind: 'variable_definition',
                    name: 'x',
                    type: { kind: 'int' },
                    value: undefined
                }
            }]);
    
            expect((b as any).name_env.get('x')).toStrictEqual({
                kind: 'int'
            });
        });
    
        test('bind variable definition with no type and value', () => {
            const b = test_stack_for(binder);
    
            b.definition({
                kind: 'variable_definition',
                name: 'x',
                value: {
                    kind: 'integer',
                    value: 2
                }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'definition', 
                value: {
                    kind: 'variable_definition',
                    name: 'x',
                    value: {
                        kind: 'integer',
                        value: 2,
                        type: { kind: 'int' }
                    },
                    type: { kind: 'int' }
                }
            }]);
    
            expect((b as any).name_env.get('x')).toStrictEqual({
                kind: 'int'
            });
        });
    
        test('bind variable definition with no type and no value', () => {
            const b = test_stack_for(binder);
    
            const f = () => b.definition({
                kind: 'variable_definition',
                name: 'x'
            });
    
            expect(f).toThrowError(new compile_error('variable definition x needs a type or a value'));
        });
    });

    describe('bind functions definitions', () => {
        test('bind function definition', () => {
            const b = test_stack_for(binder);
    
            b.definition({
                kind: 'function_definition',
                name: 'f',
                parameters: [{
                    kind: 'parameter',
                    name: 'x',
                    type: { kind: 'int' }
                }, {
                    kind: 'parameter',
                    name: 'y',
                    type: { kind: 'int' }
                }],
                block: {
                    kind: 'group_statement',
                    block: []
                }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'definition', 
                value: {
                    kind: 'function_definition',
                    name: 'f',
                    parameters: [{
                        kind: 'parameter',
                        name: 'x',
                        type: { kind: 'int' }
                    }, {
                        kind: 'parameter',
                        name: 'y',
                        type: { kind: 'int' }
                    }],
                    block: {
                        kind: 'group_statement',
                        block: []
                    },
                    type: { kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'void' } }
                }
            }]);
    
            expect((b as any).name_env.get('f')).toStrictEqual({
                kind: 'union',
                types: [{
                    kind: 'func',
                    args: [{
                        kind: 'int'
                    }, {
                        kind: 'int'
                    }],
                    ret: { kind: 'void' }
                }]
            });
        });

        test('bind function definition using parameters', () => {
            const b = test_stack_for(binder);
    
            b.definition({
                kind: 'function_definition',
                name: 'f',
                parameters: [{
                    kind: 'parameter',
                    name: 'x',
                    type: { kind: 'int' }
                }, {
                    kind: 'parameter',
                    name: 'y',
                    type: { kind: 'int' }
                }],
                block: {
                    kind: 'group_statement',
                    block: [{
                        kind: 'if_statement',
                        cond: {
                            kind: 'identifier',
                            value: 'x'
                        },
                        block: {
                            kind: 'group_statement',
                            block: []
                        }
                    }]
                }
            });
    
            expect(b.working_stack).toStrictEqual([{
                kind: 'definition', 
                value: {
                    kind: 'function_definition',
                    name: 'f',
                    parameters: [{
                        kind: 'parameter',
                        name: 'x',
                        type: { kind: 'int' }
                    }, {
                        kind: 'parameter',
                        name: 'y',
                        type: { kind: 'int' }
                    }],
                    block: {
                        kind: 'group_statement',
                        block: [{
                            kind: 'if_statement',
                            cond: {
                                kind: 'identifier',
                                value: 'x',
                                type: { kind: 'int' },
                                next: undefined
                            },
                            block: {
                                kind: 'group_statement',
                                block: []
                            },
                            next: undefined
                        }]
                    },
                    type: { kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'void' } }
                }
            }]);
    
            expect((b as any).name_env.get('f')).toStrictEqual({
                kind: 'union',
                types: [{
                    kind: 'func',
                    args: [{
                        kind: 'int'
                    }, {
                        kind: 'int'
                    }],
                    ret: { kind: 'void' }
                }]
            });
        });
    });

    describe('bind class definitions', () => {
        test('bind class definition', () => {
            const b = test_stack_for(binder);

            // add the int == int func
            (b as any).name_env.set('_op_==', {
                kind: 'union',
                types: [{
                    kind: 'func',
                    args: [{ kind: 'int' }, { kind: 'int' }],
                    ret: { kind: 'bool' }
                }]
            });

            b.definition({
                kind: 'class_definition',
                name: 'a',
                variables: [{
                    kind: 'variable_definition',
                    name: 'x',
                    value: {
                        kind: 'integer',
                        value: 2
                    }
                }],
                functions: [{
                    kind: 'function_definition',
                    name: 'f',
                    parameters: [{
                        kind: 'parameter',
                        name: 'y',
                        type: { kind: 'int' }
                    }],
                    block: {
                        kind: 'group_statement',
                        block: [{
                            kind: 'if_statement',
                            cond: {
                                kind: 'cmp_expression',
                                op: '==',
                                left: {
                                    kind: 'identifier',
                                    value: 'y',
                                },
                                right: {
                                    kind: 'identifier',
                                    value: 'this',
                                    next: {
                                        kind: 'identifier',
                                        value: 'x'
                                    }
                                },
                            },
                            block: {
                                kind: 'group_statement',
                                block: []
                            }
                        }]
                    }
                }]
            });

            expect(b.working_stack).toStrictEqual([{
                kind: 'definition',
                value: {
                    kind: 'class_definition',
                    name: 'a',
                    variables: [{
                        kind: 'variable_definition',
                        name: 'x',
                        value: {
                            kind: 'integer',
                            value: 2,
                            type: { kind: 'int' }    
                        },
                        type: { kind: 'int' }
                    }],
                    functions: [{
                        kind: 'function_definition',
                        name: 'f',
                        parameters: [{
                            kind: 'parameter',
                            name: 'this',
                            type: {
                                kind: 'pointer',
                                base: {
                                    kind: 'classname', 
                                    name: 'a'
                                }
                            }
                        }, {
                            kind: 'parameter',
                            name: 'y',
                            type: { kind: 'int' }
                        }],
                        block: {
                            kind: 'group_statement',
                            block: [{
                                kind: 'if_statement',
                                cond: {
                                    kind: 'cmp_expression',
                                    op: '==',
                                    left: {
                                        kind: 'identifier',
                                        value: 'y',
                                        type: { kind: 'int' },
                                        next: undefined
                                    },
                                    right: {
                                        kind: 'identifier',
                                        value: 'this',
                                        next: {
                                            kind: 'identifier',
                                            value: 'x',
                                            type: { kind: 'int' },
                                            next: undefined
                                        },
                                        type: { 
                                            kind: 'pointer',
                                            base: {
                                                kind: 'classname', 
                                                name: 'a'
                                            }
                                        }
                                    },
                                    type: {
                                        kind: 'bool'
                                    }
                                },
                                block: {
                                    kind: 'group_statement',
                                    block: []
                                },
                                next: undefined
                            }]
                        },
                        type: { kind: 'func', args: [{ kind: 'pointer', base: { kind: 'classname', name: 'a' } }, { kind: 'int' }], ret: { kind: 'void' } }
                    }],
                    type: { kind: 'classname', name: 'a' }
                }
            }]);

            expect((b as any as { type_env: class_environment }).type_env.get({ kind: 'classname', name: 'a' })).toStrictEqual([
                ['x', { kind: 'int' }],
                ['f', { kind: 'func', args: [{ kind: 'pointer', base: { kind: 'classname', name: 'a' } }, { kind: 'int' }], ret: { kind: 'void' } }],
            ]);
        });
    });
});