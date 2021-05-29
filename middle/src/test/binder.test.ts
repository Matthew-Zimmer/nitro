import { binder, class_environment, compile_error, environment } from "../binder";
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
                kind: 'func',
                args: [{
                    kind: 'int'
                }, {
                    kind: 'int'
                }],
                ret: { kind: 'void' }
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
                            kind: 'func',
                            args: [{
                                kind: 'int'
                            }, {
                                kind: 'int'
                            }],
                            ret: { kind: 'void' }
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

            expect(f).toThrowError(new compile_error('f expected 2 parameters but got 1'));
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

            expect(f).toThrowError(new compile_error('f expected (int, int) but got (int, float)'));
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
});