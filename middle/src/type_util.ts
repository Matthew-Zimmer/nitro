import { nitro } from "./formal";

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

    type = (node: nitro.type): string => {
        return this[node.kind](node as any);
    }
}

export class type_comparer {

    private int__int = (u: nitro.types.int, v: nitro.types.int) => {
        return true;
    }

    private float__float = (u: nitro.types.float, v: nitro.types.float) => {
        return true;
    }

    private bool__bool = (u: nitro.types.bool, v: nitro.types.bool) => {
        return true;
    }

    private void__void = (u: nitro.types.bool, v: nitro.types.bool) => {
        return true;
    }

    private literal_int__literal_int = (u: nitro.types.literal_int, v: nitro.types.literal_int) => {
        return u.value === v.value;
    }

    private literal_int__int = (u: nitro.types.literal_int, v: nitro.types.int) => {
        return true;
    }

    private literal_float__literal_float = (u: nitro.types.literal_float, v: nitro.types.literal_float) => {
        return u.value === v.value;
    }

    private literal_float__float = (u: nitro.types.literal_float, v: nitro.types.float) => {
        return true;
    }

    private literal_bool__literal_bool = (u: nitro.types.literal_bool, v: nitro.types.literal_bool) => {
        return u.value === v.value;
    }

    private literal_bool__bool = (u: nitro.types.literal_bool, v: nitro.types.bool) => {
        return true;
    }

    private pointer__pointer = (u: nitro.types.pointer, v: nitro.types.pointer) => {
        return this.satisfies(u.base, v.base);
    }

    private func__func = (u: nitro.types.func, v: nitro.types.func) => {
        if (u.args.length != v.args.length)
            return false;
        for (let i = 0; i < u.args.length; i++)
            if (!this.satisfies(u.args[i], v.args[i]))
                return false;
        return this.satisfies(u.ret, v.ret);
    }

    private classname__classname = (u: nitro.types.classname, v: nitro.types.classname) => {
        return u.name === v.name;
    }

    satisfies(u: nitro.type, v: nitro.type): boolean {
        const kind = `${u.kind}__${v.kind}` as const;
        return kind in this ? (this as any)[kind](u, v) : false;
    }
}