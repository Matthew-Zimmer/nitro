import { nitro } from "./formal";
import { compile_error } from './error';

export class pretty_typename {

    int = (node: nitro.types.int) => {
        return 'int';
    }

    float = (node: nitro.types.float) => {
        return 'float';
    }

    bool = (node: nitro.types.bool) => {
        return 'bool';
    }

    void = (node: nitro.types.void_t) => {
        return 'void';
    }

    literal_int = (node: nitro.types.literal_int) => {
        return `${node.value}`;
    }

    literal_float = (node: nitro.types.literal_float) => {
        return `${node.value}`;
    }

    literal_bool = (node: nitro.types.literal_bool) => {
        return `${node.value}`;
    }

    pointer = (node: nitro.types.pointer) => {
        return `${this.type(node.base)}*`;
    }

    func = (node: nitro.types.func) => {
        return `(${node.args.map(this.type).join(', ')}) => ${this.type(node.ret)}`;
    }

    classname = (node: nitro.types.classname) => {
        return `${node.name}`;
    }

    union = (node: nitro.types.union) => {
        return node.types.map(this.type).join(' | ');
    }

    type = (node: nitro.type): string => {
        return this[node.kind](node as any);
    }
}

export class type_comparer {

    private int__int = (u: nitro.types.int, v: nitro.types.int) => {
        return 2;
    }

    private int__union = (u: nitro.types.int, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private float__float = (u: nitro.types.float, v: nitro.types.float) => {
        return 2;
    }

    private float__union = (u: nitro.types.float, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private bool__bool = (u: nitro.types.bool, v: nitro.types.bool) => {
        return 2;
    }

    private bool__union = (u: nitro.types.bool, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private void__void = (u: nitro.types.bool, v: nitro.types.bool) => {
        return 2;
    }

    private literal_int__literal_int = (u: nitro.types.literal_int, v: nitro.types.literal_int) => {
        return u.value === v.value ? 3 : 0;
    }

    private literal_int__int = (u: nitro.types.literal_int, v: nitro.types.int) => {
        return 2;
    }

    private literal_int__union = (u: nitro.types.literal_int, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private literal_float__literal_float = (u: nitro.types.literal_float, v: nitro.types.literal_float) => {
        return u.value === v.value ? 3 : 0;
    }

    private literal_float__float = (u: nitro.types.literal_float, v: nitro.types.float) => {
        return 2;
    }

    private literal_float__union = (u: nitro.types.literal_float, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private literal_bool__literal_bool = (u: nitro.types.literal_bool, v: nitro.types.literal_bool) => {
        return u.value === v.value ? 3 : 0;
    }

    private literal_bool__bool = (u: nitro.types.literal_bool, v: nitro.types.bool) => {
        return 2;
    }

    private literal_bool__union = (u: nitro.types.literal_bool, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private pointer__pointer = (u: nitro.types.pointer, v: nitro.types.pointer) => {
        return this.score(u.base, v.base) ? 2 : 0;
    }

    private pointer__union = (u: nitro.types.pointer, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private func__func = (u: nitro.types.func, v: nitro.types.func) => {
        if (u.args.length != v.args.length)
            return 0;
        for (let i = 0; i < u.args.length; i++)
            if (!this.score(u.args[i], v.args[i]))
                return 0;
        return this.score(u.ret, v.ret) ? 2 : 0;
    }

    private func__union = (u: nitro.types.func, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private classname__classname = (u: nitro.types.classname, v: nitro.types.classname) => {
        return u.name === v.name ? 2 : 0;
    }

    private classname__union = (u: nitro.types.classname, v: nitro.types.union) => {
        return v.types.some(x => this.score(u, x)) ? 1 : 0;
    }

    private union__union = (u: nitro.types.union, v: nitro.types.union) => {
        return u.types.every(x => v.types.some(y => this.score(x, y))) ? 1 : 0;
    }

    satisfies = (u: nitro.type, v: nitro.type): boolean => {
        const kind = `${u.kind}__${v.kind}` as const;
        return kind in this ? (this as any)[kind](u, v) !== 0 : false;
    }

    score = (u: nitro.type, v: nitro.type): number => {
        const kind = `${u.kind}__${v.kind}` as const;
        return kind in this ? (this as any)[kind](u, v) : 0;
    }

    private score_overload = (f: nitro.types.func, params: nitro.type[]) => {
        let sum = 0;
        for (let i = 0; i < params.length; i++)
            sum += this.score(params[i], f.args[i]);
        return sum;
    }

    private return_type_for_func = (f: nitro.types.func, params: nitro.type[]) => {
        if (params.length !== f.args.length) {
            throw new compile_error(`expected ${f.args.length} parameters but got ${params.length}`);
        }

        for (let i = 0; i < params.length; i++)
            if (!this.satisfies(params[i], f.args[i])) {
                const pt = new pretty_typename();
                throw new compile_error(`expected (${f.args.map(pt.type).join(', ')}) but got (${params.map(pt.type).join(', ')})`);
            }
        
        return f.ret;
    }

    private return_type_for_union = (f: nitro.types.union, params: nitro.type[]) => {
        const overloads: Map<number, nitro.type[]> = new Map();
        let best = 0;
        for (const ty of f.types) {
            if (ty.kind === 'func') {
                try {
                    const ret = this.return_type_for_func(ty, params);
                    const score = this.score_overload(ty, params);
                    overloads.set(score, overloads.has(score) ? [...overloads.get(score)!, ret] : [ret]);
                    best = Math.max(best, score);
                } catch (e) {}
            }
        }
        const rets = overloads.get(best);
        if (rets === undefined) {
            const pt = new pretty_typename();
            throw new compile_error(`no match for (${params.map(pt.type).join(', ')}) to ${pt.type(f)}`);
        }
        else if (rets.length === 1)
            return rets[0];
        else {
            const pt = new pretty_typename();
            throw new compile_error(`no unambiguous match for (${params.map(pt.type).join(', ')}) to ${pt.type(f)}`);
        }
    }

    return_type_for = (f: nitro.type, params: nitro.type[]) => {
        if (f.kind === 'func')
            return this.return_type_for_func(f, params);
        else if (f.kind === 'union' && f.types.some(x => x.kind === 'func'))
            return this.return_type_for_union(f, params);
        else {
            const pt = new pretty_typename();
            throw new compile_error(`can not call non function type: ${pt.type(f)}`);
        }
    }
}