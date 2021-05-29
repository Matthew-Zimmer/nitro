import { c } from './formal';

export class generator {

    private tab_level = 0;

    private indent() {
        this.tab_level++;
    }

    private unindent() {
        this.tab_level--;
    }

    private tab() {
        let x = '';
        for (let i = 0; i < this.tab_level; i++)
            x += '\t';
        return x;
    }

    int = (ty: c.types.int): string => {
        return 'int';
    }

    float = (ty: c.types.float): string => {
        return 'double';
    }

    void = (ty: c.types.void_t): string => {
        return 'void';
    }

    func = (ty: c.types.func): string => {
        throw 'TODO';
    }

    classname = (ty: c.types.classname): string => {
        return `${ty.name}`;
    }

    pointer = (ty: c.types.pointer): string => {
        return `${this.type(ty.base)}*`;
    }

    type = (type: c.type): string => {
        return this[type.kind](type as any);
    }

    integer = (node: c.ast.integer): string => {
        return `${node.value}`;
    }

    floating_point = (node: c.ast.floating_point): string => {
        return node.value.toPrecision(2);
    }

    identifier = (node: c.ast.identifier): string => {
        const val = node.value;
        if (node.next) {
            const sep = node.is_pointer ? '->' : '.';
            const nxt = this.identifier(node.next);
            return `${val}${sep}${nxt}`
        } 
        else {
            return val;
        }
    }

    function_call = (node: c.ast.function_call): string => {
        return `${this.expression(node.func)}(${node.parameters.map(this.expression).join(', ')})`;
    }

    address_of = (node: c.ast.address_of): string => {
        return `(&(${this.expression(node.base)}))`;
    }

    dereference = (node: c.ast.dereference): string => {
        return `(*(${this.expression(node.base)}))`;
    }

    assign = (node: c.ast.assign): string => {
        return `(${this.expression(node.left)} = ${this.expression(node.right)})`;
    }

    expression = (node: c.ast.expression): string => {
        return this[node.kind](node as any);
    }

    variable_definition = (node: c.ast.variable_definition): string => {
        if (node.value)
            return `${this.type(node.type)} ${node.name} = ${this.expression(node.value)};`;
        else
            return `${this.type(node.type)} ${node.name};`;
    }

    begin = (node: c.ast.begin): string => {
        throw new Error('begin node tried to be generated for');
    }

    statement = (node: c.ast.statement): string => {
        return this[node.kind](node as any);
    }

    group_statement = (node: c.ast.group_statement): string => {
        let s = `${this.tab()}{`;
        this.indent();
        for (const stmt of node.block)
            s += `\n${this.statement(stmt)}`;
        this.unindent();
        s += `\n${this.tab()}}`;
        return s;
    }

    if_statement = (node: c.ast.if_statement): string => {
        const prefix = `${this.tab()}if (${this.expression(node.cond)})\n${this.group_statement(node.block)}`;
        if (node.next)
            return `${prefix}\n${this[node.next.kind](node.next as any)}`;
        else
            return prefix;
    }

    else_if_statement = (node: c.ast.else_if_statement): string => {
        const prefix = `${this.tab()}else if (${this.expression(node.cond)})\n${this.group_statement(node.block)}`;
        if (node.next)
            return `${prefix}\n${this[node.next.kind](node.next as any)}`;
        else
            return prefix;
    }

    else_statement = (node: c.ast.else_statement): string => {
        return `${this.tab()}else\n${this.group_statement(node.block)}`;
    }

    for_statement = (node: c.ast.for_statement): string => {

        const init = node.init ? this.definition(node.init) : ';';
        const cond = node.cond ? `${this.expression(node.cond)};` : ';';
        const post = node.post ? this.expression(node.post) : '';

        return `${this.tab()}for (${init}${cond}${post})\n${this.group_statement(node.block)}`;
    }

    while_statement = (node: c.ast.while_statement): string => {
        const cond = this.expression(node.cond);
        const block = this.group_statement(node.block);
        return `while (${cond})\n${block}`
    }

    function_definition = (node: c.ast.function_definition): string => {
        const ret_type = this.type(node.ret_type);
        const parameters = node.parameters.map(x => `${this.type(x.type)} ${x.name}`).join(', ');
        const block = this.group_statement(node.block);
        return `${ret_type} ${node.name}(${parameters})\n${block}`;
    }

    struct_definition = (node: c.ast.struct_definition): string => {
        this.indent();
        const props = node.properties.map(x => `\n${this.tab()}${this.variable_definition(x)}`).join('');
        this.unindent();
        return `struct ${node.name}\n{${props}\n};`;
    }

    type_definition = (node: c.ast.type_definition): string => {
        const ty = this.type(node.type);
        return `typedef ${ty} ${node.name};`;
    }

    definition = (node: c.ast.definition): string => {
        return `${this.tab()}${this[node.kind](node as any)}`;
    }

    root = (node: c.ast.root): string => {
        return node.map(this.definition).join('\n');
    }
}

export function generate_c_code(node: c.ast.root): string {
    return new generator().root(node);
}