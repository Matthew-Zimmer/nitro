import { pretty_typename } from "../typename";


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
});