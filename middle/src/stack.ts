interface stack_map {
    [x: string]: { kind: string };
}

type stack_element_kinds<T extends stack_map> = (keyof T) & string;
type stack_element<T extends stack_map> = T[stack_element_kinds<T>];
type internal_stack_element<T extends stack_map> = { kind: stack_element_kinds<T>, value: stack_element<T> };

export class stack<T extends stack_map> {

    private working_stack: internal_stack_element<T>[] = [];

    protected push<K extends stack_element_kinds<T>>(k: K, node: T[K]) {
        this.working_stack.push({ kind: k, value: node });
    }

    protected pop<K extends stack_element_kinds<T>>(kd: K): T[K] | undefined {
        const buff: internal_stack_element<T>[] = [];
        for (let i = this.working_stack.length; i --> 0;) {
            const node = this.working_stack.pop()!;
            if (node.kind === kd) {
                for (let j = buff.length; j --> 0;)
                    this.working_stack.push(buff[j]);

                return node.value as any;
            }
            else {
                buff.push(node);
            }
        }

        for (let i = buff.length; i --> 0;)
            this.working_stack.push(buff[i]);

        return undefined;
    }

    // should pop till include the searched element in the returned array
    // or should pop till simply remove the searched for element
    // or leave the searched element in the working stack?

    // right now option 2 is implemented

    protected pop_till<K extends stack_element_kinds<T>>(kd: K, node_kind: T[K]['kind']): T[K][] {
        const buff: internal_stack_element<T>[] = [];
        let res: internal_stack_element<T>[] = [];
        for (let i = this.working_stack.length; i --> 0;) {
            const node = this.working_stack.pop()!;
            if (node.kind === kd) {
                if (node.value.kind === node_kind) {
                    
                    for (let j = buff.length; j --> 0;)
                        this.working_stack.push(buff[j]);

                    return res.map(x => x.value  as any);
                }
                else {
                    res =  [node, ...res];
                }
            }
            else {
                buff.push(node);
            }
        }

        if (res.length !== 0)
            throw Error(`internal error: pop_till had no closing marker: ${node_kind}`);

        for (let j = buff.length; j --> 0;)
            this.working_stack.push(buff[j]);

        return [];
    }

    protected pop_all<K extends stack_element_kinds<T>>(kd: K): T[K][] {
        const buff: internal_stack_element<T>[] = [];
        let res: internal_stack_element<T>[] = [];
        for (let i = this.working_stack.length; i --> 0;) {
            const node = this.working_stack.pop()!;
            if (node.kind === kd)
                res =  [node, ...res];
            else
                buff.push(node);
        }

        for (let j = buff.length; j --> 0;)
            this.working_stack.push(buff[j]);

        return res.map(x => x.value) as any;
    }

    protected consumer<U>() {
        return <K extends stack_element_kinds<T>>(kd: K) => ({
            pop: () => this.pop(kd)! as any as U,
        });
    }
}

export interface test_stack<T extends stack_map> {
    
    working_stack: internal_stack_element<T>[];
    push<K extends stack_element_kinds<T>>(k: K, node: T[K]): void;
    pop<K extends stack_element_kinds<T>>(kd: K): T[K] | undefined;
    pop_till<K extends stack_element_kinds<T>>(kd: K, node_kind: T[K]['kind']): T[K][] | undefined;
    pop_all<K extends stack_element_kinds<T>>(kd: K): T[K][];
    consumer<U>(): <K extends stack_element_kinds<T>>(kd: K) => { pop: () => U };
}

type test_child_stack<T extends stack_map, Child extends stack<T>> = Omit<Child, keyof test_stack<T>> & test_stack<T>;

export function test_stack_for<T extends stack<any>>(st: new () => T) {
    return new st() as any as T extends stack<infer U> ? test_child_stack<U, T> : never;
}