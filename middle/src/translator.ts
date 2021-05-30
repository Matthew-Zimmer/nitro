import { c, nitro } from "./formal";
import { stack } from "./stack";

type translator_map = {
    definition: c.ast.definition;
    statement: c.ast.statement;
    expression: c.ast.expression;
    type: c.type;
};

export class translator extends stack<translator_map> {

    integer = (node: nitro.tast.integer) => {
        const value = node.value;
        this.push('expression', { kind: 'integer', value });
        return this.consumer<c.ast.integer>()('expression');
    }

    boolean = (node: nitro.tast.boolean_t) => {
        const value = node.value ? 1 : 0;
        this.push('expression', { kind: 'integer', value });
        return this.consumer<c.ast.integer>()('expression');
    }

    floating_point = (node: nitro.tast.floating_point) => {
        const value = node.value;
        this.push('expression', { kind: 'floating_point', value });
        return this.consumer<c.ast.floating_point>()('expression');
    }

    identifier = (node: nitro.tast.identifier) => {
        const value = node.value;
        const is_pointer = node.type.kind === 'pointer' || value === 'this';
        const next = node.next ? this.identifier(node.next).pop() : undefined;

        this.push('expression', { kind: 'identifier', value, is_pointer, next });
        return this.consumer<c.ast.identifier>()('expression');
    }

    function_call = (node: nitro.tast.function_call) => {
        const func = this.expression(node.func).pop();
        const parameters = node.parameters.map(x => this.expression(x).pop());
        this.push('expression', { kind: 'function_call', func, parameters });
        return this.consumer<c.ast.function_call>()('expression');
    }

    assign_expression = (node: nitro.tast.assign_expression) => {
        const left = this.expression(node.left).pop();
        const right = this.expression(node.right).pop();
        this.push('expression', { kind: 'assign', left, right });
        return this.consumer<c.ast.assign>()('expression');
    }

    or_expression = (node: nitro.tast.or_expression) => {
        const op_names = {
            'or': 'or',
        };
        const func = { 
            kind: 'identifier' as const,
            value: `_op_${op_names[node.op]}`,
            is_pointer: false,
            next: undefined
        };
        const parameters = [node.left, node.right].map(x => this.expression(x).pop());
        this.push('expression', { kind: 'function_call', func, parameters });
        return this.consumer<c.ast.function_call>()('expression');
    }

    and_expression = (node: nitro.tast.and_expression) => {
        const op_names = {
            'and': 'and',
        };
        const func = { 
            kind: 'identifier' as const,
            value: `_op_${op_names[node.op]}`,
            is_pointer: false,
            next: undefined
        };
        const parameters = [node.left, node.right].map(x => this.expression(x).pop());
        this.push('expression', { kind: 'function_call', func, parameters });
        return this.consumer<c.ast.function_call>()('expression');
    }

    cmp_expression = (node: nitro.tast.cmp_expression) => {
        const op_names = {
            '==': 'eq',
            '!=': 'neq',
            '<=': 'lteq',
            '>=': 'gteq',
            '<': 'lt',
            '>': 'gt',
        };
        const func = { 
            kind: 'identifier' as const,
            value: `_op_${op_names[node.op]}`,
            is_pointer: false,
            next: undefined
        };
        const parameters = [node.left, node.right].map(x => this.expression(x).pop());
        this.push('expression', { kind: 'function_call', func, parameters });
        return this.consumer<c.ast.function_call>()('expression');
    }

    add_expression = (node: nitro.tast.add_expression) => {
        const op_names = {
            '+': 'add',
            '-': 'sub',
        };
        const func = { 
            kind: 'identifier' as const,
            value: `_op_${op_names[node.op]}`,
            is_pointer: false,
            next: undefined
        };
        const parameters = [node.left, node.right].map(x => this.expression(x).pop());
        this.push('expression', { kind: 'function_call', func, parameters });
        return this.consumer<c.ast.function_call>()('expression');
    }

    mul_expression = (node: nitro.tast.mul_expression) => {
        const op_names = {
            '*': 'mul',
            '/': 'div',
            '%': 'mod',
        };
        const func = { 
            kind: 'identifier' as const,
            value: `_op_${op_names[node.op]}`,
            is_pointer: false,
            next: undefined
        };
        const parameters = [node.left, node.right].map(x => this.expression(x).pop());
        this.push('expression', { kind: 'function_call', func, parameters });
        return this.consumer<c.ast.function_call>()('expression');
    }

    pre_unary_expression = (node: nitro.tast.pre_unary_expression) => {
        switch (node.op) {
            case '*':
                const base1 = this.expression(node.value).pop();
                this.push('expression', { kind: 'dereference', base: base1 });
                return this.consumer<c.ast.dereference>()('expression');
            case '&':
                const base2 = this.expression(node.value).pop();
                this.push('expression', { kind: 'address_of', base: base2 });
                return this.consumer<c.ast.address_of>()('expression');
            default:
                const op_names = {
                    '-': 'sub',
                    '--': 'dec',
                    '++': 'inc',
                    'not': 'not'
                };
                const func = { 
                    kind: 'identifier' as const,
                    value: `_op_pre_${op_names[node.op]}`,
                    is_pointer: false,
                    next: undefined
                };
                const parameters = [node.value].map(x => this.expression(x).pop());
                this.push('expression', { kind: 'function_call', func, parameters });
                return this.consumer<c.ast.function_call>()('expression');
        }
    }

    post_unary_expression = (node: nitro.tast.post_unary_expression) => {
        const op_names = {
            '--': 'dec',
            '++': 'inc',
            '!': 'imp',
            '?': 'opt'
        };
        const func = { 
            kind: 'identifier' as const,
            value: `_op_post_${op_names[node.op]}`,
            is_pointer: false,
            next: undefined
        };
        const parameters = [node.value].map(x => this.expression(x).pop());
        this.push('expression', { kind: 'function_call', func, parameters });
        return this.consumer<c.ast.function_call>()('expression');
    }

    expression = (node: nitro.tast.expression) => {
        return this[node.kind](node as any); 
    }

    group_statement = (node: nitro.tast.group_statement) => {
        this.push('statement', { kind: 'begin' });
        node.block.forEach(x => this.statement(x));
        const block = this.pop_till('statement', 'begin');
        this.push('statement', { kind: 'group_statement', block });
        return this.consumer<c.ast.group_statement>()('statement');
    }
    
    if_statement = (node: nitro.tast.if_statement) => {
        const cond = this.expression(node.cond).pop();
        const block = this.group_statement(node.block).pop();
        const next = node.next ? this[node.next.kind](node.next as any) : undefined;
        this.push('statement', { kind: 'if_statement', cond, block, next });
        return this.consumer<c.ast.if_statement>()('statement');
    }

    private else_if_statement = (node: nitro.tast.else_if_statement): c.ast.else_if_statement => {
        const cond = this.expression(node.cond).pop();
        const block = this.group_statement(node.block).pop();
        const next = node.next ? this[node.next.kind](node.next as any) : undefined;
        return { kind: 'else_if_statement', cond, block, next };
    }

    private else_statement = (node: nitro.tast.else_statement): c.ast.else_statement => {
        const block = this.group_statement(node.block).pop();
        return { kind: 'else_statement', block };
    }

    statement = (node: nitro.tast.statement) => {
        return this[node.kind](node as any);
    }

    variable_definition = (node: nitro.tast.variable_definition) => {
        const name = node.name;
        const type = this.type(node.type).pop();
        const value = node.value ? this.expression(node.value).pop() : undefined;

        this.push('definition', { kind: 'variable_definition', name, type, value });
        return this.consumer<c.ast.variable_definition>()('definition');
    }

    // the name needs to be mangled to support overloading
    function_definition = (node: nitro.tast.function_definition) => {
        const name = node.name;
        const parameters = node.parameters.map(x => ({ kind: 'parameter' as const, name: x.name, type: this.type(x.type).pop() }));
        const ret_type = this.type(node.type.ret).pop();
        const block = this.group_statement(node.block).pop();

        this.push('definition', { kind: 'function_definition', name, parameters, ret_type, block });
        return this.consumer<c.ast.function_definition>()('definition');
    }

    class_definition = (node: nitro.tast.class_definition) => {
        const name = node.name;
        this.push('definition', { kind: 'type_definition', name, type: { kind: 'classname', name: `struct _${name}` } });
        const properties = node.variables.map(x => this.variable_definition(x).pop());
        node.functions.forEach(this.function_definition);
        this.push('definition', { kind: 'struct_definition', name: `_${name}`, properties });
        return this.consumer<c.ast.struct_definition>()('definition');
    }

    definition = (node: nitro.tast.definition) => {
        return this[node.kind](node as any);
    }

    int = (node: nitro.types.int) => {
        this.push('type', { kind: 'int' });
        return this.consumer<c.types.int>()('type');
    }

    bool = (node: nitro.types.bool) => {
        this.push('type', { kind: 'int' });
        return this.consumer<c.types.int>()('type');
    }

    float = (node: nitro.types.float) => {
        this.push('type', { kind: 'float' });
        return this.consumer<c.types.int>()('type');
    }

    void = (node: nitro.types.void_t) => {
        this.push('type', { kind: 'void' });
        return this.consumer<c.types.int>()('type');
    }

    literal_int = (node: nitro.types.literal_int) => {
        this.push('type', { kind: 'int' });
        return this.consumer<c.types.int>()('type');
    }

    literal_bool = (node: nitro.types.literal_bool) => {
        this.push('type', { kind: 'int' });
        return this.consumer<c.types.int>()('type');
    }

    literal_float = (node: nitro.types.literal_float) => {
        this.push('type', { kind: 'float' });
        return this.consumer<c.types.int>()('type');
    }

    func = (node: nitro.types.func) => {
        return this.consumer<c.types.int>()('type');
    }

    pointer = (node: nitro.types.pointer) => {
        const base = this.type(node.base).pop();
        this.push('type', { kind: 'pointer', base });
        return this.consumer<c.types.int>()('type');
    }

    classname = (node: nitro.types.classname) => {
        const name = node.name;
        this.push('type', { kind: 'classname', name });
        return this.consumer<c.types.int>()('type');
    }

    union = (node: nitro.types.union) => {
        throw 'todo';
    }

    type = (node: nitro.type) => {
        return this[node.kind](node as any);
    }

    root = (node: nitro.tast.root): c.ast.root => {
        node.forEach(this.definition);
        return this.pop_all('definition');
    }
}
