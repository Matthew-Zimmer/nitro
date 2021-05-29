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