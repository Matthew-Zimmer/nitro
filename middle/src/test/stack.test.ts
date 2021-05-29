import { stack, test_stack } from '../index';
import { test_stack_for } from '../stack';

type test_map = {
    ty1: { kind: 'ty1', val: number } | { kind: 'ty1_open' };
    ty2: { kind: 'ty2', val: number };
};

describe('general stack tests', () => {
    test('empty stack', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;
        expect(s.working_stack).toStrictEqual([]);
    });

});

describe('push stack tests', () => {
    test('push 1 element', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;
        s.push('ty1', { kind: 'ty1', val: 0 });
        expect(s.working_stack).toStrictEqual([{ kind: 'ty1', value: { kind: 'ty1', val: 0 } }]);
    });

    test('push 3 element', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;
        s.push('ty1', { kind: 'ty1', val: 0 });
        s.push('ty2', { kind: 'ty2', val: 0 });
        s.push('ty1', { kind: 'ty1', val: 1 });
        expect(s.working_stack).
        toStrictEqual([
            { kind: 'ty1', value: { kind: 'ty1', val: 0 } },
            { kind: 'ty2', value: { kind: 'ty2', val: 0 } },
            { kind: 'ty1', value: { kind: 'ty1', val: 1 } },
        ]);
    });
});

describe('pop stack tests', () => {
    test('pop empty', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;
        
        expect(s.pop('ty1')).
        toStrictEqual(undefined);

        expect(s.working_stack).
        toStrictEqual([]);
    });

    test('pop 1', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;
        s.push('ty1', { kind: 'ty1', val: 0 });
        
        expect(s.pop('ty1')).
        toStrictEqual({ kind: 'ty1', val: 0 });

        expect(s.working_stack).
        toStrictEqual([]);
    });

    test('pop 1 from 3', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;
        s.push('ty1', { kind: 'ty1', val: 0 });
        s.push('ty2', { kind: 'ty2', val: 0 });
        s.push('ty1', { kind: 'ty1', val: 1 });
        
        expect(s.pop('ty1')).
        toStrictEqual({ kind: 'ty1', val: 1 });

        expect(s.working_stack).
        toStrictEqual([
            { kind: 'ty1', value: { kind: 'ty1', val: 0 } },
            { kind: 'ty2', value: { kind: 'ty2', val: 0 } },
        ]);
    });

    test('pop but no type', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;
        s.push('ty1', { kind: 'ty1', val: 0 });
        s.push('ty1', { kind: 'ty1', val: 1 });
        s.push('ty1', { kind: 'ty1', val: 2 });
        
        expect(s.pop('ty2')).
        toStrictEqual(undefined);

        expect(s.working_stack).
        toStrictEqual([
            { kind: 'ty1', value: { kind: 'ty1', val: 0 } },
            { kind: 'ty1', value: { kind: 'ty1', val: 1 } },
            { kind: 'ty1', value: { kind: 'ty1', val: 2 } },
        ]);
    });

    test('pop middle', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;
        s.push('ty1', { kind: 'ty1', val: 0 });
        s.push('ty2', { kind: 'ty2', val: 0 });
        s.push('ty1', { kind: 'ty1', val: 1 });
        s.push('ty1', { kind: 'ty1', val: 2 });
        
        expect(s.pop('ty2')).
        toStrictEqual({ kind: 'ty2', val: 0 });

        expect(s.working_stack).
        toStrictEqual([
            { kind: 'ty1', value: { kind: 'ty1', val: 0 } },
            { kind: 'ty1', value: { kind: 'ty1', val: 1 } },
            { kind: 'ty1', value: { kind: 'ty1', val: 2 } },
        ]);
    });
});

describe('pop_till stack tests', () => {
    test('pop_till empty', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        expect(s.pop_till('ty1', 'ty1_open')).
        toStrictEqual([]);
    });

    test('pop_till no open but no type either', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        s.push('ty2', { kind: 'ty2', val: 0 });

        expect(s.pop_till('ty1', 'ty1_open')).
        toStrictEqual([]);

        expect(s.working_stack).
        toStrictEqual([
            { kind: 'ty2', value: { kind: 'ty2', val: 0 } }
        ]);
    });

    test('pop_till no open but 1 type', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        s.push('ty1', { kind: 'ty1', val: 0 });

        expect(() => s.pop_till('ty1', 'ty1_open')).
        toThrowError(Error(`internal error: pop_till had no closing marker: ty1_open`));
    });


    test('pop_till has open and 0 res', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        s.push('ty1', { kind: 'ty1_open' });
        s.push('ty2', { kind: 'ty2', val: 0 });

        expect(s.pop_till('ty1', 'ty1_open')).
        toStrictEqual([]);

        expect(s.working_stack).
        toStrictEqual([
            { kind: 'ty2', value: { kind: 'ty2', val: 0 } }
        ]);
    });


    test('pop_till has open and 2 res', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        s.push('ty1', { kind: 'ty1_open' });
        s.push('ty2', { kind: 'ty2', val: 0 });
        s.push('ty1', { kind: 'ty1', val: 0 });
        s.push('ty2', { kind: 'ty2', val: 1 });
        s.push('ty1', { kind: 'ty1', val: 1 });

        expect(s.pop_till('ty1', 'ty1_open')).
        toStrictEqual([
            { kind: 'ty1', val: 0 },
            { kind: 'ty1', val: 1 },
        ]);

        expect(s.working_stack).
        toStrictEqual([
            { kind: 'ty2', value: { kind: 'ty2', val: 0 } },
            { kind: 'ty2', value: { kind: 'ty2', val: 1 } }
        ]);
    });
});


describe('pop_all stack tests', () => {
    test('empty pop_all', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        expect(s.pop_all('ty1')).
        toStrictEqual([]);
    });

    test('empty pop_all one type', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        s.push('ty1', { kind: 'ty1', val: 0 });
        s.push('ty1', { kind: 'ty1', val: 1 });
        s.push('ty1', { kind: 'ty1', val: 2 });

        expect(s.pop_all('ty1')).
        toStrictEqual([
            { kind: 'ty1', val: 0 }, 
            { kind: 'ty1', val: 1 }, 
            { kind: 'ty1', val: 2 }, 
        ]);

        expect(s.working_stack).
        toStrictEqual([]);
    });

    test('empty pop_all mixed types', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        s.push('ty1', { kind: 'ty1', val: 0 });
        s.push('ty2', { kind: 'ty2', val: 0 });
        s.push('ty1', { kind: 'ty1', val: 1 });
        s.push('ty2', { kind: 'ty2', val: 1 });
        s.push('ty1', { kind: 'ty1', val: 2 });

        expect(s.pop_all('ty1')).
        toStrictEqual([
            { kind: 'ty1', val: 0 }, 
            { kind: 'ty1', val: 1 }, 
            { kind: 'ty1', val: 2 }, 
        ]);

        expect(s.working_stack).
        toStrictEqual([
            { kind: 'ty2', value: { kind: 'ty2', val: 0 } },
            { kind: 'ty2', value: { kind: 'ty2', val: 1 } }, 
        ]);
    });
});

describe('helper stack tests', () => {
    test('pop util', () => {
        const s: test_stack<test_map> = new stack<test_map>() as any;

        s.push('ty1', { kind: 'ty1', val: 0 });

        expect(s.consumer<{ kind: 'ty1', val: number }>()('ty1').pop()).
        toStrictEqual({ kind: 'ty1', val: 0 });

        expect(s.working_stack).
        toStrictEqual([]);
    });
});

test('test testing util', () => {
    class x extends stack<test_map> {
        f() {}
    }

    const s = test_stack_for(x);

    expect('f' in s).toStrictEqual(true);
    expect('pop' in s).toStrictEqual(true);
})