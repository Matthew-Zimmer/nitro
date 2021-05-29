import { nitro } from "./formal";
import { stack } from "./stack";
import { pretty_typename, type_comparer } from "./type_util";

type binder_map = {
    definition: nitro.tast.definition,
    statement: nitro.tast.statement,
    expression: nitro.tast.expression,
    type: nitro.type,
}

export class compile_error extends Error {
    constructor(msg: string) {
        super(msg);
    }
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
        if (this.in_current_scope(name))
            throw new compile_error(`${name} is already defined`);
        this.back().set(name, type);
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
}

export class binder extends stack<binder_map> {

    private name_env = new environment();
    private type_env = new class_environment();

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
            if (type.kind !== 'classname') {
                const pt = new pretty_typename();
                throw new compile_error(`${pt.type(type)} is not a class`);
            }
            return this.name_env.scope(this.type_env.get(type), () => {
                return this.identifier(node.next!).pop();
            });
        })();
        this.push('expression', { kind: 'identifier', value, type, next });
        return this.consumer<nitro.tast.identifier>()('expression');
    }

    function_call = (node: nitro.ast.function_call) => {
        const func = this.expression(node.func).pop();
        const type = func.type;
        if (type.kind !== 'func') {
            const pt = new pretty_typename();
            throw new compile_error(`can not call non function type: ${pt.type(type)}`);
        }

        const parameters = node.parameters.map(x => this.expression(x).pop());

        if (parameters.length !== type.args.length) {
            const name = func.kind === 'identifier' ? func.value : 'unnamed';
            throw new compile_error(`${name} expected ${type.args.length} parameters but got ${parameters.length}`);
        }

        const tc = new type_comparer();
        for (let i = 0; i < parameters.length; i++)
            if (!tc.satisfies(parameters[i].type, type.args[i])) {
                const pt = new pretty_typename();
                const name = func.kind === 'identifier' ? func.value : 'unnamed';
                throw new compile_error(`${name} expected (${type.args.map(pt.type).join(', ')}) but got (${parameters.map(x => pt.type(x.type)).join(', ')})`);
            }
        
        this.push('expression', { kind: 'function_call', func, parameters, type: type.ret });
        return this.consumer<nitro.tast.function_call>()('expression');
    }

    add_expression = (node: nitro.ast.add_expression) => {
        return this.consumer<nitro.tast.add_expression>()('expression');
    }

    expression = (node: nitro.ast.expression) => {
        return this[node.kind](node as any);
    }
}