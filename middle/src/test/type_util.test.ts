import { pretty_typename, type_comparer } from "../type_util";
import { compile_error } from '../error';


describe('nitro pretty typename tests', () => {

    test('int pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'int' })).toStrictEqual('int');
    });

    test('float pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'float' })).toStrictEqual('float');
    });

    test('bool pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'bool' })).toStrictEqual('bool');
    });

    test('void pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'void' })).toStrictEqual('void');
    });

    test('literal int pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'literal_int', value: 2 })).toStrictEqual('2');
    });

    test('literal float pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'literal_float', value: 22.9 })).toStrictEqual('22.9');
    });

    test('literal bool pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'literal_bool', value: false })).toStrictEqual('false');
    });

    test('pointer pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'pointer', base: { kind: 'int' } })).toStrictEqual('int*');
    });

    describe('func pretty typenames', () => {
        test('func with args pretty typename', () => {
            const p = new pretty_typename();
    
            expect(p.type({ kind: 'func', args: [{ kind: 'int' }, { kind: 'float' }], ret: { kind: 'void' } })).toStrictEqual('(int, float) => void');
        });

        test('func without args pretty typename', () => {
            const p = new pretty_typename();
    
            expect(p.type({ kind: 'func', args: [], ret: { kind: 'void' } })).toStrictEqual('() => void');
        });

        test('func with one args pretty typename', () => {
            const p = new pretty_typename();
    
            expect(p.type({ kind: 'func', args: [{ kind: 'int' }], ret: { kind: 'void' } })).toStrictEqual('(int) => void');
        });
    });

    test('classname pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'classname', name: 'a' })).toStrictEqual('a');
    });

    test('union pretty typename', () => {
        const p = new pretty_typename();

        expect(p.type({ kind: 'union', types: [{ kind: 'int' }, { kind: 'bool' }] })).toStrictEqual('int | bool');
    });
});

describe('nitro type comparer tests', () => {
    describe('nitro int satisfies other', () => {
        test('nitro int satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'int' })).toStrictEqual(true);
        });
        test('nitro int satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro int satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro int satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro int satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro int satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro int satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro int satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro int satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro int satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'int' }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro int satisfies union', () => {
            test('nitro int satisfies union(int | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'int' }, { kind: 'union', types: [{ kind: 'int'}, { kind: 'float' }] })).toStrictEqual(true);
            });
            test('nitro int satisfies union(bool | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'int' }, { kind: 'union', types: [{ kind: 'bool'}, { kind: 'float' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro float satisfies other', () => {
        test('nitro float satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro float satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'float' })).toStrictEqual(true);
        });
        test('nitro float satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro float satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro float satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro float satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro float satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro float satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro float satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro float satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'float' }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro float satisfies union', () => {
            test('nitro float satisfies union(int | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'float' }, { kind: 'union', types: [{ kind: 'int'}, { kind: 'float' }] })).toStrictEqual(true);
            });
            test('nitro float satisfies union(bool | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'float' }, { kind: 'union', types: [{ kind: 'bool'}, { kind: 'int' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro bool satisfies other', () => {
        test('nitro bool satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro bool satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro bool satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'bool' })).toStrictEqual(true);
        });
        test('nitro bool satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro bool satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro bool satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro bool satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro bool satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro bool satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro bool satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'bool' }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro bool satisfies union', () => {
            test('nitro bool satisfies union(int | bool)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'bool' }, { kind: 'union', types: [{ kind: 'int'}, { kind: 'bool' }] })).toStrictEqual(true);
            });
            test('nitro bool satisfies union(int | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'bool' }, { kind: 'union', types: [{ kind: 'int'}, { kind: 'float' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro void satisfies other', () => {
        test('nitro void satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro void satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro void satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro void satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'void' })).toStrictEqual(true);
        });
        test('nitro void satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro void satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro void satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro void satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro void satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro void satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'void' }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro void satisfies union', () => {
            test('nitro void satisfies union(void | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'void' }, { kind: 'union', types: [{ kind: 'void'}, { kind: 'float' }] })).toStrictEqual(false);
            });
            test('nitro void satisfies union(bool | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'void' }, { kind: 'union', types: [{ kind: 'bool'}, { kind: 'float' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro literal_int satisfies other', () => {
        test('nitro literal_int satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'int' })).toStrictEqual(true);
        });
        test('nitro literal_int satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro literal_int satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro literal_int satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'void' })).toStrictEqual(false);
        });
        describe('nitro literal_int satisfies literal_int', () => {
            test('nitro literal_int(2) satisfies literal_int(2)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'literal_int', value: 2 })).toStrictEqual(true);
            });
            test('nitro literal_int(3) satisfies literal_int(2)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_int', value: 3 }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
            });
        });
        test('nitro literal_int satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro literal_int satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro literal_int satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro literal_int satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro literal_int satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro literal_int satisfies union', () => {
            test('nitro literal_int(2) satisfies union(literal_int(2) | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_int', value: 2 }, { kind: 'union', types: [{ kind: 'literal_int', value: 2}, { kind: 'float' }] })).toStrictEqual(true);
            });
            test('nitro literal_int(3) satisfies union(literal_int(2) | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_int', value: 3 }, { kind: 'union', types: [{ kind: 'literal_int', value: 2 }, { kind: 'float' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro literal_float satisfies other', () => {
        test('nitro literal_float satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro literal_float satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'float' })).toStrictEqual(true);
        });
        test('nitro literal_float satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro literal_float satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro literal_float satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        describe('nitro literal_float satisfies literal_float', () => {
            test('nitro literal_float(2.9) satisfies literal_float(2.9)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(true);
            });
            test('nitro literal_float(3.1) satisfies literal_float(2.9)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_float', value: 3.1 }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
            });
        });
        test('nitro literal_float satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro literal_float satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro literal_float satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro literal_float satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro literal_float satisfies union', () => {
            test('nitro literal_float(2.9) satisfies union(literal_float(2.9) | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_float', value: 2.9 }, { kind: 'union', types: [{ kind: 'literal_float', value: 2.9 }, { kind: 'int' }] })).toStrictEqual(true);
            });
            test('nitro literal_float(3.1) satisfies union(literal_float(2.9) | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_float', value: 3.1 }, { kind: 'union', types: [{ kind: 'literal_float', value: 2.9 }, { kind: 'int' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro literal_bool satisfies other', () => {
        test('nitro literal_bool satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro literal_bool satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro literal_bool satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'bool' })).toStrictEqual(true);
        });
        test('nitro literal_bool satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro literal_bool satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro literal_bool satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'literal_float',  value: 2.9 })).toStrictEqual(false);
        });
        describe('nitro literal_bool satisfies literal_bool', () => {
            test('nitro literal_bool(true) satisfies literal_bool(true)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_bool', value: true }, { kind: 'literal_bool', value: true })).toStrictEqual(true);
            });
            test('nitro literal_bool(false) satisfies literal_bool(true)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_bool', value: false }, { kind: 'literal_bool', value: true })).toStrictEqual(false);
            });
        });
        test('nitro literal_bool satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro literal_bool satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro literal_bool satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'literal_bool',  value: false }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro literal_bool satisfies union', () => {
            test('nitro literal_bool(true) satisfies union(literal_bool(true) | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_bool', value: true }, { kind: 'union', types: [{ kind: 'literal_bool', value: true }, { kind: 'int' }] })).toStrictEqual(true);
            });
            test('nitro literal_bool(false) satisfies union(literal_bool(true) | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'literal_bool', value: false }, { kind: 'union', types: [{ kind: 'literal_bool', value: true }, { kind: 'int' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro pointer satisfies other', () => {
        test('nitro pointer satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro pointer satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro pointer satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro pointer satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro pointer satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro pointer satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro pointer satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        describe('nitro pointer satisfies pointer', () => {
            test('nitro pointer(int) satisfies pointer(int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int' } }, { kind: 'pointer', base: { kind: 'int' } })).toStrictEqual(true);
            });
            test('nitro pointer(float) satisfies point(int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'pointer', base: { kind: 'float' } }, { kind: 'pointer', base: { kind: 'int' } })).toStrictEqual(false);
            });
        });
        test('nitro pointer satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro pointer satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int'} }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro pointer satisfies union', () => {
            test('nitro pointer(int) satisfies union(pointer(int) | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'pointer', base: { kind: 'int' } }, { kind: 'union', types: [{ kind: 'pointer', base: { kind: 'int' } }, { kind: 'int' }] })).toStrictEqual(true);
            });
            test('nitro pointer(float) satisfies union(pointer(int) | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'pointer', base: { kind: 'float' } }, { kind: 'union', types: [{ kind: 'pointer', base: { kind: 'int' } }, { kind: 'int' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro func satisfies other', () => {
        test('nitro func satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro func satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro func satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro func satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro func satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro func satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro func satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro func satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        describe('nitro func satisfies func', () => {
            test('nitro func((int, int) => int) satisfies func((int, int) => int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies(
                    { kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'int' } }, 
                    { kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'int' } })).
                toStrictEqual(true);
            });
            test('nitro func((int, int) => float) satisfies func((int, int) => int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies(
                    { kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'float' } }, 
                    { kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'int' } })).
                toStrictEqual(false);
            });
            test('nitro func((int, float) => int) satisfies func((int, int) => int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies(
                    { kind: 'func', args: [{ kind: 'int' }, { kind: 'float' }], ret: { kind: 'int' } }, 
                    { kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'int' } })).
                toStrictEqual(false);
            });
            test('nitro func((int) => int) satisfies func((int, int) => int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies(
                    { kind: 'func', args: [{ kind: 'int' }], ret: { kind: 'int' } }, 
                    { kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'int' } })).
                toStrictEqual(false);
            });
        });
        test('nitro func satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'func', args: [], ret: { kind: 'int' } }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro func satisfies union', () => {
            test('nitro func((int) => int) satisfies union((int) => int | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'func', args: [{ kind: 'int' }], ret: { kind: 'int' } }, { kind: 'union', types: [{ kind: 'func', args: [{ kind: 'int' }], ret: { kind: 'int' } }, { kind: 'int' }] })).toStrictEqual(true);
            });
            test('nitro func((int, int) => int) satisfies union((int) => int | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'func', args: [{ kind: 'int' }, { kind: 'int' }], ret: { kind: 'int' } }, { kind: 'union', types: [{ kind: 'func', args: [{ kind: 'int' }], ret: { kind: 'int' } }, { kind: 'int' }] })).toStrictEqual(false);
            });
            test('nitro func((float) => int) satisfies union((int) => int | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'func', args: [{ kind: 'float' }], ret: { kind: 'int' } }, { kind: 'union', types: [{ kind: 'func', args: [{ kind: 'int' }], ret: { kind: 'int' } }, { kind: 'int' }] })).toStrictEqual(false);
            });
            test('nitro func((int) => float) satisfies union((int) => int | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'func', args: [{ kind: 'int' }], ret: { kind: 'float' } }, { kind: 'union', types: [{ kind: 'func', args: [{ kind: 'int' }], ret: { kind: 'int' } }, { kind: 'int' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro classname satisfies other', () => {
        test('nitro classname satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro classname satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro classname satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro classname satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro classname satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro classname satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro classname satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro classname satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro classname satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        describe('nitro classname satisfies classname', () => {
            test('nitro classname(x) satisfies classname(x)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies(
                    { kind: 'classname', name: 'x' }, 
                    { kind: 'classname', name: 'x' })).
                toStrictEqual(true);
            });
            test('nitro classname(x) satisfies classname(y)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies(
                    { kind: 'classname', name: 'x' }, 
                    { kind: 'classname', name: 'y' })).
                toStrictEqual(false);
            });
        });
        describe('nitro classname satisfies union', () => {
            test('nitro classname(x) satisfies union(x | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'classname', name: 'x' }, { kind: 'union', types: [{ kind: 'classname', name: 'x' }, { kind: 'int' }] })).toStrictEqual(true);
            });
            test('nitro classname(y) satisfies union(x | int)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies({ kind: 'classname', name: 'y' }, { kind: 'union', types: [{ kind: 'classname', name: 'x' }, { kind: 'int' }] })).toStrictEqual(false);
            });
        });
    });

    describe('nitro union satisfies other', () => {
        test('nitro union satisfies int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'int' })).toStrictEqual(false);
        });
        test('nitro union satisfies float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'float' })).toStrictEqual(false);
        });
        test('nitro union satisfies bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'bool' })).toStrictEqual(false);
        });
        test('nitro union satisfies void', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'void' })).toStrictEqual(false);
        });
        test('nitro union satisfies literal_int', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'literal_int', value: 2 })).toStrictEqual(false);
        });
        test('nitro union satisfies literal_float', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'literal_float', value: 2.9 })).toStrictEqual(false);
        });
        test('nitro union satisfies literal_bool', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'literal_bool',  value: false })).toStrictEqual(false);
        });
        test('nitro union satisfies pointer', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'pointer', base: { kind: 'int'} })).toStrictEqual(false);
        });
        test('nitro union satisfies func', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'func', args: [], ret: { kind: 'int' } })).toStrictEqual(false);
        });
        test('nitro union satisfies classname', () => {
            const tc = new type_comparer();
            expect(tc.satisfies({ kind: 'union', types: [] }, { kind: 'classname', name: 'x' })).toStrictEqual(false);
        });
        describe('nitro union satisfies union', () => {
            test('nitro union(int | float) satisfies union(int | float | bool)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies(
                    { kind: 'union', types: [{ kind: 'int' }, {  kind: 'float' }] }, 
                    { kind: 'union', types: [{ kind: 'int' }, {  kind: 'float' }, { kind: 'bool' }] })).
                toStrictEqual(true);
            });
            test('nitro union(int | float | bool) satisfies union(int | float)', () => {
                const tc = new type_comparer();
                expect(tc.satisfies(
                    { kind: 'union', types: [{ kind: 'int' }, {  kind: 'float' }, { kind: 'bool' }] },
                    { kind: 'union', types: [{ kind: 'int' }, {  kind: 'float' }] })).
                toStrictEqual(false);
            });
        });
    });

    describe('return type for', () => {
        describe('return type for func', () => {
            test('return type for func(() => int)', () => {
                const tc = new type_comparer();
                const ty = tc.return_type_for({ kind: 'func', args: [], ret: { kind: 'int' } }, []);

                expect(ty).toStrictEqual({
                    kind: 'int'
                });
            });
            test('return type for func((int, int) => int)', () => {
                const tc = new type_comparer();
                const ty = tc.return_type_for({ 
                    kind: 'func', 
                    args: [{
                        kind: 'int',
                    }, {
                        kind: 'int',
                    }], 
                    ret: { kind: 'int' } 
                }, [{
                        kind: 'int',
                    }, {
                        kind: 'int',
                    }
                ]);

                expect(ty).toStrictEqual({
                    kind: 'int'
                });
            });

            test('return type for func((int, int) => int) with [int]', () => {
                const tc = new type_comparer();
                const f = () => tc.return_type_for({ 
                    kind: 'func', 
                    args: [{
                        kind: 'int',
                    }, {
                        kind: 'int',
                    }], 
                    ret: { kind: 'int' } 
                }, [{
                        kind: 'int',
                    }
                ]);

                expect(f).toThrowError(new compile_error('expected 2 parameters but got 1'));
            });

            test('return type for func((int, int) => int) with [int, float]', () => {
                const tc = new type_comparer();
                const f = () => tc.return_type_for({ 
                    kind: 'func', 
                    args: [{
                        kind: 'int',
                    }, {
                        kind: 'int',
                    }], 
                    ret: { kind: 'int' } 
                }, [{
                        kind: 'int',
                    }, {
                        kind: 'float',
                    }
                ]);

                expect(f).toThrowError(new compile_error('expected (int, int) but got (int, float)'));
            });
        });
        describe('return type for union', () => {
            test('return type for union no funcs', () => {
                const tc = new type_comparer();
                const f = () => tc.return_type_for({ kind: 'union', types: [{
                    kind: 'int'
                }, {
                    kind: 'bool'
                }] }, []);

                expect(f).toThrowError(new compile_error('can not call non function type: int | bool'));
            });
            test('return type for union no match', () => {
                const tc = new type_comparer();
                const f = () => tc.return_type_for({ kind: 'union', types: [{
                    kind: 'func',
                    args: [{ kind: 'int' }],
                    ret: { kind: 'int' }
                }, {
                    kind: 'func',
                    args: [{ kind: 'bool' }],
                    ret: { kind: 'int' }
                }] }, []);

                expect(f).toThrowError(new compile_error('no match for () to (int) => int | (bool) => int'));
            });
            test('return type for union one match', () => {
                const tc = new type_comparer();
                const ty = tc.return_type_for({ kind: 'union', types: [{
                    kind: 'func',
                    args: [{ kind: 'int' }],
                    ret: { kind: 'int' }
                }, {
                    kind: 'func',
                    args: [{ kind: 'bool' }],
                    ret: { kind: 'int' }
                }, { kind: 'void' }] }, [{ kind: 'int' }]);

                expect(ty).toStrictEqual({
                    kind: 'int'
                });
            });
            test('return type for union two match', () => {
                const tc = new type_comparer();
                const f = () => tc.return_type_for({ kind: 'union', types: [{
                    kind: 'func',
                    args: [{ kind: 'int' }],
                    ret: { kind: 'int' }
                }, {
                    kind: 'func',
                    args: [{ kind: 'int' }],
                    ret: { kind: 'bool' }
                }] }, [{ kind: 'int' }]);

                expect(f).toThrowError(new compile_error('no unambiguous match for (int) to (int) => int | (int) => bool'));
            });
            test('return type for union two match but unambiguous lower', () => {
                const tc = new type_comparer();
                const ty = tc.return_type_for({ kind: 'union', types: [{
                    kind: 'func',
                    args: [{ kind: 'int' }],
                    ret: { kind: 'int' }
                }, {
                    kind: 'func',
                    args: [{ kind: 'literal_int', value: 2 }],
                    ret: { kind: 'bool' }
                }] }, [{ kind: 'literal_int', value: 3 }]);

                expect(ty).toStrictEqual({
                    kind: 'int'
                });
            });

            test('return type for union two match but unambiguous upper', () => {
                const tc = new type_comparer();
                const ty = tc.return_type_for({ kind: 'union', types: [{
                    kind: 'func',
                    args: [{ kind: 'int' }],
                    ret: { kind: 'int' }
                }, {
                    kind: 'func',
                    args: [{ kind: 'literal_int', value: 2 }],
                    ret: { kind: 'bool' }
                }] }, [{ kind: 'literal_int', value: 2 }]);

                expect(ty).toStrictEqual({
                    kind: 'bool'
                });
            });
        });
        test('return type for other', () => {
            const tc = new type_comparer();
            const f = () => tc.return_type_for({ kind: 'int' }, []);

            expect(f).toThrowError(new compile_error('can not call non function type: int'));
        });
    });
})