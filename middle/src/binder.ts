import { nitro } from "./formal";
import { stack } from "./stack";
import { pretty_typename, type_comparer } from "./type_util";
import { compile_error } from './error';

type binder_map = {
    definition: nitro.tast.definition,
    statement: nitro.tast.statement,
    expression: nitro.tast.expression,
    type: nitro.type,
}

export class environment {

    private env: Map<string, nitro.type>[] = [new Map()];

    private back() {
        return this.env[this.env.length - 1];
    }

    push() {
        this.env.push(new Map());
    }

    pop() {
        this.env.pop();
    }

    set(name: string, type: nitro.type) {
        if (this.in_current_scope(name)) {
            const ty = this.back().get(name)!;
            if (ty.kind === 'union') {
                const types = type.kind === 'union' ? [...ty.types, ...type.types] : [...ty.types, type];
                // TODO: this needs to be ensured that it is unique
                // ie. tc.satisfies(x, y) && tc.satisfies(y, x) |=> x = y
                this.back().set(name, {
                    kind: 'union',
                    types
                });
            }
            else
                throw new compile_error(`${name} is already defined`);
        }
        else {
            this.back().set(name, type);
        }
    }

    get(name: string): nitro.type {
        for (let i = this.env.length; i --> 0;)
            if (this.env[i].has(name))
                return this.env[i].get(name)!;
        throw new compile_error(`${name} is not defined`);
    }

    // has(name: string): boolean {
    //     for (let i = this.env.length; i --> 0;)
    //         if (this.env[i].has(name))
    //             return true;
    //     return false;
    // }

    in_current_scope(name: string): boolean {
        return this.back().has(name);
    }

    scope<T>(types: [string, nitro.type][], cb: () => T) {
        this.push();
        types.forEach(([n, t]) => this.set(n, t));
        const r = cb();
        this.pop();
        return r;
    }
}

export class class_environment {

    private env: Map<string, [string, nitro.type][]> = new Map();

    set(type: nitro.types.classname, props: [string, nitro.type][]) {
        if (this.has(type))
            throw new compile_error(`${type.name} is already defined`);
        this.env.set(type.name, props);
    }

    get(type: nitro.types.classname): [string, nitro.type][] {
        if (this.has(type))
            return this.env.get(type.name)!;
        throw new compile_error(`${type.name} is not defined`);
    }

    has(type: nitro.types.classname): boolean {
        return this.env.has(type.name);
    }

    append(type: nitro.types.classname, props: [string, nitro.type][]) {
        if (!this.has(type))
            throw new compile_error(`${type.name} is not defined`);
        this.env.set(type.name, [...this.env.get(type.name)!, ...props]);
    }
}

export class binder extends stack<binder_map> {

    private name_env = new environment();
    private type_env = new class_environment();
    private tc = new type_comparer();
    private pt = new pretty_typename();

    private inner_type = (node: nitro.tast.expression): nitro.type => {
        switch (node.kind) {
            case 'identifier':
                return node.next ? this.inner_type(node.next) : node.type;
            default:
                return node.type;
        }
    }

    integer = (node: nitro.ast.integer) => {
        const value = node.value;
        const type = { kind: 'int' as const };
        this.push('expression', { kind: 'integer', value, type });
        return this.consumer<nitro.tast.integer>()('expression');
    }

    floating_point = (node: nitro.ast.floating_point) => {
        const value = node.value;
        const type = { kind: 'float' as const };
        this.push('expression', { kind: 'floating_point', value, type });
        return this.consumer<nitro.tast.floating_point>()('expression');
    }

    boolean = (node: nitro.ast.boolean_t) => {
        const value = node.value;
        const type = { kind: 'bool' as const };
        this.push('expression', { kind: 'boolean', value, type });
        return this.consumer<nitro.tast.boolean_t>()('expression');
    }

    identifier = (node: nitro.ast.identifier) => {
        const value = node.value;
        const type = this.name_env.get(value);
        const next = !node.next ? undefined : (() => {
            let ty: nitro.types.classname;
            switch (type.kind) {
                case 'classname':
                    ty = type;
                    break;
                // @ts-ignore
                case 'pointer': 
                    if (type.base.kind === 'classname') {
                        ty = type.base;
                        break;
                    }
                default:
                    throw new compile_error(`${this.pt.type(type)} is not a class`);
            }              
            return this.name_env.scope(this.type_env.get(ty), () => {
                return this.identifier(node.next!).pop();
            });
        })();

        this.push('expression', { kind: 'identifier', value, type, next });
        return this.consumer<nitro.tast.identifier>()('expression');
    }

    function_call = (node: nitro.ast.function_call) => {
        const func = this.expression(node.func).pop();
        const parameters = node.parameters.map(x => this.expression(x).pop());
        const type = this.tc.return_type_for(this.inner_type(func), parameters.map(this.inner_type));

        this.push('expression', { kind: 'function_call', func, parameters, type });
        return this.consumer<nitro.tast.function_call>()('expression');
    }

    add_expression = (node: nitro.ast.add_expression) => {
        const op = node.op;
        const left = this.expression(node.left).pop();
        const right = this.expression(node.right).pop();

        const type = this.tc.return_type_for(this.name_env.get(`_op_${op}`), [this.inner_type(left), this.inner_type(right)]);


        this.push('expression', { kind: 'add_expression', op, left, right, type });
        return this.consumer<nitro.tast.add_expression>()('expression');
    }

    mul_expression = (node: nitro.ast.mul_expression) => {
        const op = node.op;
        const left = this.expression(node.left).pop();
        const right = this.expression(node.right).pop();

        const type = this.tc.return_type_for(this.name_env.get(`_op_${op}`), [this.inner_type(left), this.inner_type(right)]);


        this.push('expression', { kind: 'mul_expression', op, left, right, type });
        return this.consumer<nitro.tast.mul_expression>()('expression');
    }

    cmp_expression = (node: nitro.ast.cmp_expression) => {
        const op = node.op;
        const left = this.expression(node.left).pop();
        const right = this.expression(node.right).pop();

        const type = this.tc.return_type_for(this.name_env.get(`_op_${op}`), [this.inner_type(left), this.inner_type(right)]);


        this.push('expression', { kind: 'cmp_expression', op, left, right, type });
        return this.consumer<nitro.tast.cmp_expression>()('expression');
    }

    and_expression = (node: nitro.ast.and_expression) => {
        const op = node.op;
        const left = this.expression(node.left).pop();
        const right = this.expression(node.right).pop();

        const type = this.tc.return_type_for(this.name_env.get(`_op_${op}`), [this.inner_type(left), this.inner_type(right)]);

        this.push('expression', { kind: 'and_expression', op, left, right, type });
        return this.consumer<nitro.tast.add_expression>()('expression');
    }

    or_expression = (node: nitro.ast.or_expression) => {
        const op = node.op;
        const left = this.expression(node.left).pop();
        const right = this.expression(node.right).pop();

        const type = this.tc.return_type_for(this.name_env.get(`_op_${op}`), [this.inner_type(left), this.inner_type(right)]);

        this.push('expression', { kind: 'or_expression', op, left, right, type });
        return this.consumer<nitro.tast.or_expression>()('expression');
    }

    assign_expression = (node: nitro.ast.assign_expression) => {
        const left = this.expression(node.left).pop();
        const right = this.expression(node.right).pop();

        this.push('expression', { kind: 'assign_expression', left, right, type: this.inner_type(left) });
        return this.consumer<nitro.tast.assign_expression>()('expression');
    }

    pre_unary_expression = (node: nitro.ast.pre_unary_expression) => {
        const op = node.op;
        const value = this.expression(node.value).pop();

        const type = this.tc.return_type_for(this.name_env.get(`_op_pre_${op}`), [this.inner_type(value)]);

        this.push('expression', { kind: 'pre_unary_expression', op, value, type });
        return this.consumer<nitro.tast.pre_unary_expression>()('expression');
    }

    post_unary_expression = (node: nitro.ast.post_unary_expression) => {
        const op = node.op;
        const value = this.expression(node.value).pop();

        const type = this.tc.return_type_for(this.name_env.get(`_op_post_${op}`), [this.inner_type(value)]);


        this.push('expression', { kind: 'post_unary_expression', op, value, type });
        return this.consumer<nitro.tast.post_unary_expression>()('expression');
    }

    expression = (node: nitro.ast.expression) => {
        return this[node.kind](node as any);
    }

    group_statement = (node: nitro.ast.group_statement) => {
        const block = node.block.map(x => this.statement(x).pop());

        this.push('statement', { kind: 'group_statement', block });
        return this.consumer<nitro.tast.group_statement>()('statement');
    }

    private else_statement = (node: nitro.ast.else_statement): nitro.tast.else_statement => {
        const block = this.group_statement(node.block).pop();
        return { kind: 'else_statement', block };
    }

    private else_if_statement = (node: nitro.ast.else_if_statement): nitro.tast.else_if_statement => {
        const cond = this.expression(node.cond).pop();
        const block = this.group_statement(node.block).pop();
        const next = node.next ? this[node.next.kind](node.next as any) : undefined;
        return { kind: 'else_if_statement', cond, block, next };
    }

    if_statement = (node: nitro.ast.if_statement) => {
        const cond = this.expression(node.cond).pop();
        const block = this.group_statement(node.block).pop();
        const next = node.next ? this[node.next.kind](node.next as any) : undefined;
        
        this.push('statement', { kind: 'if_statement', cond, block, next });
        return this.consumer<nitro.tast.if_statement>()('statement');
    }

    statement = (node: nitro.ast.statement) => {
        return this[node.kind](node as any);
    }

    variable_definition = (node: nitro.ast.variable_definition) => {
        const name = node.name;
        if (node.type === undefined && node.value === undefined)
            throw new compile_error(`variable definition ${name} needs a type or a value`);
        
        const value = node.value ? this.expression(node.value).pop() : undefined;
        const type = node.type ? node.type : this.inner_type(value!);

        this.push('definition', { kind: 'variable_definition', name, type, value });
        this.name_env.set(name, type);
        return this.consumer<nitro.tast.variable_definition>()('definition');
    }

    // there are only void ret type functions
    // since there are no return statements yet
    function_definition = (node: nitro.ast.function_definition) => {
        const name = node.name;
        const parameters = node.parameters;
        const block = this.name_env.scope(
            parameters.map(x => [x.name, x.type]), 
            () => this.group_statement(node.block).pop()
        );
        const type = {
            kind: 'func' as const,
            args: parameters.map(x => x.type),
            ret: { kind: 'void' as const }
        };

        this.push('definition', { kind: 'function_definition', name, parameters, block, type });
        this.name_env.set(name, { kind: 'union', types: [type] });
        return this.consumer<nitro.tast.function_definition>()('definition');
    }


    // this is gross
    // this just retries and hopes it makes progress
    
    // TODO
    // a cycle detection algorithm should be ran over the functions
    // to reorder them in a non cyclic way
    // if there is a cycle then that is an error
    class_definition = (node: nitro.ast.class_definition) => {
        const name = node.name;
        const type = {
            kind: 'classname' as const,
            name
        };
        const variables = node.variables.map(x => this.variable_definition(x).pop());
        this.type_env.set(type, variables.map(x => [x.name, x.type]));

        let invalid_functions: nitro.ast.function_definition[] = node.functions;
        let valid_functions: nitro.tast.class_function_definition[] = [];
        let functions_to_try: nitro.ast.function_definition[] = [];
        const functions: nitro.tast.class_function_definition[] = [];
        const errors: compile_error[] = [];
        let retries = 0;
        const max_retries = 10;
        while (invalid_functions.length > 0 && retries < max_retries) 
        {
            functions_to_try = invalid_functions;
            invalid_functions = [];
            valid_functions = [];
            for (const f of functions_to_try) {
                try {
                    valid_functions.push(this.function_definition({
                        ...f,
                        parameters: [{ kind: 'parameter', name: 'this', type: { kind: 'pointer', base: type } }, ...f.parameters]
                    }).pop() as nitro.tast.class_function_definition);
                } 
                catch (e) {
                    errors.push(e);
                    invalid_functions.push(f);
                }
            }

            this.type_env.append(type, valid_functions.map(x => [x.name, x.type]));
            functions.push(...valid_functions);

            retries++;
        }

        if (retries === max_retries)
            throw errors;

        this.push('definition', { kind: 'class_definition', name, variables, functions, type });
        return this.consumer<nitro.tast.class_definition>()('definition');
    }

    definition = (node: nitro.ast.definition) => {
        return this[node.kind](node as any);
    }
}