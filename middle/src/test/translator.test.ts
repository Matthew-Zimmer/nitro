import { test_stack_for } from "../stack";
import { translator } from "../translator";


describe('translate expressions', () => {
    test('translate integer expression', () => {

        const t = test_stack_for(translator);

        t.integer({ kind: 'integer', value: 0, type: { kind: 'int' } });

        expect(t.working_stack).toStrictEqual([
            { kind: 'expression', value: { kind: 'integer', value: 0 } }
        ]);
    });


    test('translate boolean expression', () => {

        const t = test_stack_for(translator);

        t.boolean({ kind: 'boolean', value: true, type: { kind: 'bool' } });
        t.boolean({ kind: 'boolean', value: false, type: { kind: 'bool' } });

        expect(t.working_stack).toStrictEqual([
            { kind: 'expression', value: { kind: 'integer', value: 1 } },
            { kind: 'expression', value: { kind: 'integer', value: 0 } },
        ]);
    });

    test('translate floating point expression', () => {

        const t = test_stack_for(translator);

        t.floating_point({ kind: 'floating_point', value: 0.2, type: { kind: 'float' } });

        expect(t.working_stack).toStrictEqual([
            { kind: 'expression', value: { kind: 'floating_point', value: 0.2 } }
        ]);
    });

    test('translate function_call expressions', () => {

        const t = test_stack_for(translator);

        t.function_call({ kind: 'function_call', func: { kind: 'identifier', value: 'f', type: { kind: 'func', args: [], ret: { kind: 'int' } } }, parameters: [], type: { kind: 'int' } });

        expect(t.working_stack).toStrictEqual([
            { kind: 'expression', value: { kind: 'function_call', func: { kind: 'identifier', value: 'f', is_pointer: false, next: undefined }, parameters: [] } }
        ]);
    });

    describe('translate add expressions', () => {
        test('translate add(+) expression', () => {
            const t = test_stack_for(translator);

            t.add_expression({ 
                kind: 'add_expression', 
                op: '+', 
                left: { 
                    kind: 'integer', 
                    value: 3,
                    type: { kind: 'int' }
                },
                right: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_add', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 3
                    }, {
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate add(-) expression', () => {
            const t = test_stack_for(translator);

            t.add_expression({ 
                kind: 'add_expression', 
                op: '-', 
                left: { 
                    kind: 'integer', 
                    value: 3,
                    type: { kind: 'int' }
                },
                right: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_sub', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 3
                    }, {
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });
    });

    describe('translate mul expressions', () => {
        test('translate mul(*) expression', () => {
            const t = test_stack_for(translator);

            t.mul_expression({ 
                kind: 'mul_expression', 
                op: '*', 
                left: { 
                    kind: 'integer', 
                    value: 3,
                    type: { kind: 'int' }
                },
                right: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_mul', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 3
                    }, {
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate mul(/) expression', () => {
            const t = test_stack_for(translator);

            t.mul_expression({ 
                kind: 'mul_expression', 
                op: '/', 
                left: { 
                    kind: 'integer', 
                    value: 3,
                    type: { kind: 'int' }
                },
                right: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_div', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 3
                    }, {
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate mul(%) expression', () => {
            const t = test_stack_for(translator);

            t.mul_expression({ 
                kind: 'mul_expression', 
                op: '%', 
                left: { 
                    kind: 'integer', 
                    value: 3,
                    type: { kind: 'int' }
                },
                right: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_mod', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 3
                    }, {
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });
    });

    describe('translate pre unary expressions', () => {
        test('translate pre unary(-) expression', () => {
            const t = test_stack_for(translator);

            t.pre_unary_expression({ 
                kind: 'pre_unary_expression', 
                op: '-', 
                value: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_pre_sub', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate pre unary(--) expression', () => {
            const t = test_stack_for(translator);

            t.pre_unary_expression({ 
                kind: 'pre_unary_expression', 
                op: '--', 
                value: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_pre_dec', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate pre unary(++) expression', () => {
            const t = test_stack_for(translator);

            t.pre_unary_expression({ 
                kind: 'pre_unary_expression', 
                op: '++', 
                value: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_pre_inc', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate pre unary(not) expression', () => {
            const t = test_stack_for(translator);

            t.pre_unary_expression({ 
                kind: 'pre_unary_expression', 
                op: 'not', 
                value: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_pre_not', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate pre unary(&) expression', () => {

            const t = test_stack_for(translator);

            t.pre_unary_expression({ 
                kind: 'pre_unary_expression', 
                op: '&', 
                value: { 
                    kind: 'identifier', 
                    value: 'x', 
                    type: { kind: 'int' } 
                },
                type: { kind: 'pointer', base: { kind: 'int' } }
            });

            expect(t.working_stack).toStrictEqual([
                { kind: 'expression', value: { kind: 'address_of', base: { kind: 'identifier', value: 'x', is_pointer: false, next: undefined } } }
            ]);
        });

        test('translate pre unary(*) expression', () => {

            const t = test_stack_for(translator);

            t.pre_unary_expression({ 
                kind: 'pre_unary_expression', 
                op: '*', 
                value: { 
                    kind: 'identifier', 
                    value: 'x', 
                    type: { 
                        kind: 'pointer', 
                        base: { kind: 'int' } 
                    } 
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([
                { kind: 'expression', value: { kind: 'dereference', base: { kind: 'identifier', value: 'x', is_pointer: true, next: undefined } } }
            ]);
        });
    });

    describe('translate post unary expressions', () => {
        test('translate post unary(--) expression', () => {
            const t = test_stack_for(translator);

            t.post_unary_expression({ 
                kind: 'post_unary_expression', 
                op: '--', 
                value: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_post_dec', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate post unary(++) expression', () => {
            const t = test_stack_for(translator);

            t.post_unary_expression({ 
                kind: 'post_unary_expression', 
                op: '++', 
                value: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_post_inc', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate post unary(!) expression', () => {
            const t = test_stack_for(translator);

            t.post_unary_expression({ 
                kind: 'post_unary_expression', 
                op: '!', 
                value: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_post_imp', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });

        test('translate post unary(?) expression', () => {
            const t = test_stack_for(translator);

            t.post_unary_expression({ 
                kind: 'post_unary_expression', 
                op: '?', 
                value: { 
                    kind: 'integer', 
                    value: 1,
                    type: { kind: 'int' }
                },
                type: { kind: 'int' }
            });

            expect(t.working_stack).toStrictEqual([{ 
                kind: 'expression', 
                value: { 
                    kind: 'function_call', 
                    func: { 
                        kind: 'identifier', 
                        value: '_op_post_opt', 
                        is_pointer: false, 
                        next: undefined 
                    }, 
                    parameters: [{
                        kind: 'integer',
                        value: 1
                    }] 
                } 
            }]);
        });
    });

    describe('translate identifier expressions', () => {
        test('translate non compound non pointer identifier', () => {

            const t = test_stack_for(translator);
    
            t.identifier({ kind: 'identifier', value: 'x', type: { kind: 'int' } });
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'expression', value: { kind: 'identifier', value: 'x', is_pointer: false, next: undefined } }
            ]);
        });
        
        test('translate non compound pointer identifier', () => {

            const t = test_stack_for(translator);
    
            t.identifier({ kind: 'identifier', value: 'x', type: { kind: 'pointer', base: { kind: 'int' } } });
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'expression', value: { kind: 'identifier', value: 'x', is_pointer: true, next: undefined } }
            ]);
        });

        test('translate non compound this pointer identifier', () => {

            const t = test_stack_for(translator);
    
            t.identifier({ kind: 'identifier', value: 'this', type: { kind: 'classname', name: 'a' } });
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'expression', value: { kind: 'identifier', value: 'this', is_pointer: true, next: undefined } }
            ]);
        });

        test('translate compound non pointer identifier', () => {

            const t = test_stack_for(translator);
    
            t.identifier({ kind: 'identifier', value: 'x', type: { kind: 'classname', name: 'a' }, next: { kind: 'identifier', value: 'y', type: { kind: 'int' } } });
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'expression', value: { kind: 'identifier', value: 'x', is_pointer: false, next: { kind: 'identifier', value: 'y', is_pointer: false, next: undefined } } }
            ]);
        });
    });

    describe('translate cmp expressions', () => {
        test('translate cmp(==) expression', () => {
            const t = test_stack_for(translator);

            t.cmp_expression({ 
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
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: {
                        kind: 'identifier',
                        value: '_op_eq',
                        is_pointer: false,
                        next: undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 2
                    }, {
                        kind: 'integer',
                        value: 2
                    }]
                }
            }]);
        });

        test('translate cmp(!=) expression', () => {
            const t = test_stack_for(translator);

            t.cmp_expression({ 
                kind: 'cmp_expression',
                op: '!=',
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
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: {
                        kind: 'identifier',
                        value: '_op_neq',
                        is_pointer: false,
                        next: undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 2
                    }, {
                        kind: 'integer',
                        value: 2
                    }]
                }
            }]);
        });

        test('translate cmp(<=) expression', () => {
            const t = test_stack_for(translator);

            t.cmp_expression({ 
                kind: 'cmp_expression',
                op: '<=',
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
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: {
                        kind: 'identifier',
                        value: '_op_lteq',
                        is_pointer: false,
                        next: undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 2
                    }, {
                        kind: 'integer',
                        value: 2
                    }]
                }
            }]);
        });

        test('translate cmp(>=) expression', () => {
            const t = test_stack_for(translator);

            t.cmp_expression({ 
                kind: 'cmp_expression',
                op: '>=',
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
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: {
                        kind: 'identifier',
                        value: '_op_gteq',
                        is_pointer: false,
                        next: undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 2
                    }, {
                        kind: 'integer',
                        value: 2
                    }]
                }
            }]);
        });

        test('translate cmp(<) expression', () => {
            const t = test_stack_for(translator);

            t.cmp_expression({ 
                kind: 'cmp_expression',
                op: '<',
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
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: {
                        kind: 'identifier',
                        value: '_op_lt',
                        is_pointer: false,
                        next: undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 2
                    }, {
                        kind: 'integer',
                        value: 2
                    }]
                }
            }]);
        });

        test('translate cmp(>) expression', () => {
            const t = test_stack_for(translator);

            t.cmp_expression({ 
                kind: 'cmp_expression',
                op: '>',
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
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: {
                        kind: 'identifier',
                        value: '_op_gt',
                        is_pointer: false,
                        next: undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 2
                    }, {
                        kind: 'integer',
                        value: 2
                    }]
                }
            }]);
        });
    });

    describe('translate and expressions', () => {
        test('translate and(and) expression', () => {
            const t = test_stack_for(translator);

            t.and_expression({ 
                kind: 'and_expression',
                op: 'and',
                left: { 
                    kind: 'boolean',
                    value: false,
                    type: { kind: 'bool' }
                },
                right: { 
                    kind: 'boolean',
                    value: true,
                    type: { kind: 'bool' }
                },
                type: { kind: 'bool' }
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: {
                        kind: 'identifier',
                        value: '_op_and',
                        is_pointer: false,
                        next: undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 0
                    }, {
                        kind: 'integer',
                        value: 1
                    }]
                }
            }]);
        });
    });

    describe('translate or expressions', () => {
        test('translate or(or) expression', () => {
            const t = test_stack_for(translator);

            t.or_expression({ 
                kind: 'or_expression',
                op: 'or',
                left: { 
                    kind: 'boolean',
                    value: false,
                    type: { kind: 'bool' }
                },
                right: { 
                    kind: 'boolean',
                    value: true,
                    type: { kind: 'bool' }
                },
                type: { kind: 'bool' }
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'expression',
                value: {
                    kind: 'function_call',
                    func: {
                        kind: 'identifier',
                        value: '_op_or',
                        is_pointer: false,
                        next: undefined
                    },
                    parameters: [{
                        kind: 'integer',
                        value: 0
                    }, {
                        kind: 'integer',
                        value: 1
                    }]
                }
            }]);
        });
    });

    test('translate assign expression', () => {
        const t = test_stack_for(translator);

        t.assign_expression({
            kind: 'assign_expression',
            left: {
                kind: 'identifier',
                value: 'x',
                type: { kind: 'int' }
            },
            right: {
                kind: 'integer',
                value: 2,
                type: { kind: 'int' }
            },
            type: { kind: 'int' }
        });

        expect(t.working_stack).toStrictEqual([{
            kind: 'expression',
            value: {
                kind: 'assign',
                left: {
                    kind: 'identifier',
                    value: 'x',
                    is_pointer: false,
                    next: undefined
                },
                right: {
                    kind: 'integer',
                    value: 2,
                },
            }
        }]);
    });
});

describe('translate statements', () => {
    describe('translate group statement', () => {
        test('translate empty group', () => {
            const t = test_stack_for(translator);
    
            t.group_statement({ kind: 'group_statement', block: [] });
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'statement', value: { kind: 'group_statement', block: [] } }
            ]);
        });

        test('translate non empty group', () => {
            const t = test_stack_for(translator);
    
            t.group_statement({ kind: 'group_statement', block: [{ kind: 'group_statement', block: [] }] });
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'statement', value: { kind: 'group_statement', block: [{ kind: 'group_statement', block: [] }] } }
            ]);
        });
    });

    describe('translate if statements', () => {
        test('translate only if statement', () => {
            const t = test_stack_for(translator);

            t.if_statement({
                kind: 'if_statement',
                cond: { kind: 'integer', value: 1, type: { kind: 'int' } },
                block: { kind: 'group_statement', block: [] },
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: { kind: 'integer', value: 1 },
                    block: { kind: 'group_statement', block: [] },
                    next: undefined
                }
            }]);
        });

        test('translate only if else statement', () => {
            const t = test_stack_for(translator);

            t.if_statement({
                kind: 'if_statement',
                cond: { kind: 'integer', value: 1, type: { kind: 'int' } },
                block: { kind: 'group_statement', block: [] },
                next: {
                    kind: 'else_statement',
                    block: { kind: 'group_statement', block: [] }
                }
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: { kind: 'integer', value: 1 },
                    block: { kind: 'group_statement', block: [] },
                    next: {
                        kind: 'else_statement',
                        block: { kind: 'group_statement', block: [] },
                    }
                }
            }]);
        });

        test('translate only if elseif statement', () => {
            const t = test_stack_for(translator);

            t.if_statement({
                kind: 'if_statement',
                cond: { kind: 'integer', value: 0, type: { kind: 'int' } },
                block: { kind: 'group_statement', block: [] },
                next: {
                    kind: 'else_if_statement',
                    cond: { kind: 'integer', value: 1, type: { kind: 'int' } },
                    block: { kind: 'group_statement', block: [] }
                }
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: { kind: 'integer', value: 0 },
                    block: { kind: 'group_statement', block: [] },
                    next: {
                        kind: 'else_if_statement',
                        cond: { kind: 'integer', value: 1 },
                        block: { kind: 'group_statement', block: [] },
                        next: undefined
                    }
                }
            }]);
        });

        test('translate only if elseif elseif statement', () => {
            const t = test_stack_for(translator);

            t.if_statement({
                kind: 'if_statement',
                cond: { kind: 'integer', value: 0, type: { kind: 'int' } },
                block: { kind: 'group_statement', block: [] },
                next: {
                    kind: 'else_if_statement',
                    cond: { kind: 'integer', value: 0, type: { kind: 'int' } },
                    block: { kind: 'group_statement', block: [] },
                    next: {
                        kind: 'else_if_statement',
                        cond: { kind: 'integer', value: 1, type: { kind: 'int' } },
                        block: { kind: 'group_statement', block: [] }
                    }
                }
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: { kind: 'integer', value: 0 },
                    block: { kind: 'group_statement', block: [] },
                    next: {
                        kind: 'else_if_statement',
                        cond: { kind: 'integer', value: 0 },
                        block: { kind: 'group_statement', block: [] },
                        next: {
                            kind: 'else_if_statement',
                            cond: { kind: 'integer', value: 1 },
                            block: { kind: 'group_statement', block: [] },
                            next:  undefined
                        }
                    }
                }
            }]);
        });

        test('translate only if elseif else statement', () => {
            const t = test_stack_for(translator);

            t.if_statement({
                kind: 'if_statement',
                cond: { kind: 'integer', value: 0, type: { kind: 'int' } },
                block: { kind: 'group_statement', block: [] },
                next: {
                    kind: 'else_if_statement',
                    cond: { kind: 'integer', value: 0, type: { kind: 'int' } },
                    block: { kind: 'group_statement', block: [] },
                    next: {
                        kind: 'else_statement',
                        block: { kind: 'group_statement', block: [] }
                    }
                }
            });

            expect(t.working_stack).toStrictEqual([{
                kind: 'statement',
                value: {
                    kind: 'if_statement',
                    cond: { kind: 'integer', value: 0 },
                    block: { kind: 'group_statement', block: [] },
                    next: {
                        kind: 'else_if_statement',
                        cond: { kind: 'integer', value: 0 },
                        block: { kind: 'group_statement', block: [] },
                        next: {
                            kind: 'else_statement',
                            block: { kind: 'group_statement', block: [] },
                        }
                    }
                }
            }]);
        });
    });
});

describe('translate definitions', () => {
    describe('translate variable definition', () => {
        test('translate variable definition with value', () => {
            const t = test_stack_for(translator);
    
            t.variable_definition({ kind: 'variable_definition', name: 'x', type: { kind: 'int' }, value: { kind: 'integer', value: 5, type: { kind: 'int' } } })
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'definition', value: { kind: 'variable_definition', name: 'x', type: { kind: 'int' }, value: { kind: 'integer', value: 5 } } }
            ]);
        });

        test('translate variable definition without value', () => {
            const t = test_stack_for(translator);
    
            t.variable_definition({ kind: 'variable_definition', name: 'x', type: { kind: 'int' } })
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'definition', value: { kind: 'variable_definition', name: 'x', type: { kind: 'int' }, value: undefined } }
            ]);
        });
    });

    describe('translate function definition', () => {
        test('translate variable definition with no params', () => {
            const t = test_stack_for(translator);
    
            t.function_definition({ kind: 'function_definition', name: 'f', parameters: [], type: { kind: 'func', args: [], ret: { kind: 'void' } }, block: { kind: 'group_statement', block: [] } })
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'definition', value: { kind: 'function_definition', name: 'f', ret_type: { kind: 'void' }, parameters: [], block: { kind: 'group_statement', block: [] } } }
            ]);
        });

        test('translate variable definition with params', () => {
            const t = test_stack_for(translator);
    
            t.function_definition({ kind: 'function_definition', name: 'f', parameters: [{ kind: 'parameter', name: 'x', type: {kind: 'int'}}, { kind: 'parameter', name: 'y', type: { kind: 'float' } }], type: { kind: 'func', args: [{ kind: 'int' }, { kind: 'float'}], ret: { kind: 'void' } }, block: { kind: 'group_statement', block: [] } })
    
            expect(t.working_stack).toStrictEqual([
                { kind: 'definition', value: { kind: 'function_definition', name: 'f', ret_type: { kind: 'void' }, parameters: [{ kind: 'parameter', name: 'x', type: {kind: 'int'}}, { kind: 'parameter', name: 'y', type: { kind: 'float' } }], block: { kind: 'group_statement', block: [] } } }
            ]);
        });
    });

    describe('translate class definition', () => {
        test('translate class definition', () => {
            const t = test_stack_for(translator);
    
            t.class_definition({ 
                kind: 'class_definition',
                name: 'a',
                variables: [{
                        kind: 'variable_definition',
                        name: 'x',
                        type: { kind: 'int' },
                        value: { kind: 'integer', value: 2, type: { kind: 'int' } }
                    }, {
                        kind: 'variable_definition',
                        name: 'y',
                        type: { kind: 'int' },
                    }],
                functions: [{
                        kind: 'function_definition',
                        name: 'f',
                        parameters: [{ kind: 'parameter', name: 'this', type: { kind: 'pointer', base: { kind: 'classname', name: 'a' } } }],
                        type: { kind: 'func', args: [{ kind: 'pointer', base: { kind: 'classname', name: 'a' }}], ret: { kind: 'void' } },
                        block: { kind: 'group_statement', block: [] }
                    }, {
                        kind: 'function_definition',
                        name: 'g',
                        parameters: [{ kind: 'parameter', name: 'this', type: { kind: 'pointer', base: { kind: 'classname', name: 'a' } } }, { kind: 'parameter', name: 'u', type: { kind: 'int' } }, { kind: 'parameter', name: 'v', type: { kind: 'float' } }],
                        type: { kind: 'func', args: [{ kind: 'pointer', base: { kind: 'classname', name: 'a' }}, { kind: 'int' }, { kind: 'float' }], ret: { kind: 'void' } },
                        block: { kind: 'group_statement', block: [] }
                    },
                ],
                type: {
                    kind: 'classname',
                    name: 'a'
                }
            });
    
            expect(t.working_stack).toStrictEqual([{
                    kind: 'definition',
                    value: {
                        kind: 'type_definition',
                        name: 'a',
                        type: { kind: 'classname', name: 'struct _a' }
                    }
                }, {
                    kind: 'definition',
                    value: {
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
                        }],
                        ret_type: { kind: 'void' },
                        block: { kind: 'group_statement', block: [] }
                    }
                }, {
                    kind: 'definition',
                    value: {
                        kind: 'function_definition',
                        name: 'g',
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
                            name: 'u', 
                            type: { kind: 'int' } 
                        }, {
                            kind: 'parameter', 
                            name: 'v', 
                            type: { kind: 'float' } 
                        }],
                        ret_type: { kind: 'void' },
                        block: { kind: 'group_statement', block: [] }
                    }
                }, {
                    kind: 'definition',
                    value: {
                        kind: 'struct_definition',
                        name: '_a',
                        properties: [
                            {
                                kind: 'variable_definition',
                                name: 'x',
                                type: { kind: 'int' },
                                value: { kind: 'integer', value: 2 }
                            }, {
                                kind: 'variable_definition',
                                name: 'y',
                                type: { kind: 'int' },
                                value: undefined
                            }
                        ]
                    }
                }
            ]);
        });
    });
});

describe('translate types', () => {
    test('translate int type', () => {
        const t = test_stack_for(translator);

        t.int({ kind: 'int' });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'int' } }
        ]);
    });

    test('translate float type', () => {
        const t = test_stack_for(translator);

        t.float({ kind: 'float' });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'float' } }
        ]);
    });

    test('translate bool type', () => {
        const t = test_stack_for(translator);

        t.bool({ kind: 'bool' });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'int' } }
        ]);
    });

    test('translate literal int type', () => {
        const t = test_stack_for(translator);

        t.literal_int({ kind: 'literal_int', value: 5 });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'int' } }
        ]);
    });

    test('translate literal float type', () => {
        const t = test_stack_for(translator);

        t.literal_float({ kind: 'literal_float', value: 5.9 });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'float' } }
        ]);
    });

    test('translate literal bool type', () => {
        const t = test_stack_for(translator);

        t.literal_bool({ kind: 'literal_bool', value: false });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'int' } }
        ]);
    });

    test('translate void type', () => {
        const t = test_stack_for(translator);

        t.void({ kind: 'void' });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'void' } }
        ]);
    });

    describe('translate func types', () => {
        test.todo('translate func with args');
        test.todo('translate func without args');
    });

    test('translate pointer type', () => {
        const t = test_stack_for(translator);

        t.pointer({ kind: 'pointer', base: { kind: 'int' } });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'pointer', base: { kind: 'int' } } }
        ]);
    });

    test('translate classname type', () => {
        const t = test_stack_for(translator);

        t.classname({ kind: 'classname', name: 'x' });

        expect(t.working_stack).toStrictEqual([
            { kind: 'type', value: { kind: 'classname', name: 'x' } }
        ]);
    });
});

test('translate empty root', () => {
    const t = test_stack_for(translator);

    expect(t.root([])).toStrictEqual([]);
});

test('translate non empty root', () => {
    const t = test_stack_for(translator);

    expect(t.root([{
        kind: 'variable_definition',
        name: 'x',
        type: {  kind: 'int' }
    }, {
        kind: 'variable_definition',
        name: 'y',
        type: {  kind: 'int' }
    }])).toStrictEqual([{
        kind: 'variable_definition',
        name: 'x',
        type: {  kind: 'int' },
        value: undefined
    }, {
        kind: 'variable_definition',
        name: 'y',
        type: {  kind: 'int' },
        value: undefined
    }]);
});