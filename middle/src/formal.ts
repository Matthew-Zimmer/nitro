export namespace nitro {

    export type type = types.int | types.literal_int | types.void_t | types.float | types.literal_float | types.pointer | types.classname | types.func | types.bool | types.literal_bool | types.union;
    export type compile_type = type;

    export namespace types {
        export interface int {
            kind: 'int';
        }

        export interface literal_int {
            value: number;
            kind: 'literal_int';
        }

        export interface bool {
            kind: 'bool';
        }

        export interface literal_bool {
            value: boolean;
            kind: 'literal_bool';
        }

        export interface void_t {
            kind: 'void';
        }

        export interface float {
            kind: 'float';
        }

        export interface literal_float {
            value: number;
            kind: 'literal_float';
        }

        export interface pointer<T=type> {
            base: T;
            kind: 'pointer';
        }

        export interface classname {
            name: string;
            kind: 'classname';
        }

        export interface func {
            ret: type;
            args: type[];
            kind: 'func';
        }

        export interface class_func extends func {
            args: [pointer<classname>, ...type[]];
        }

        export interface union<T extends type[] = type[]> {
            types: [...T];
            kind: 'union';
        }
    }

    export namespace ast {
        export type definition = variable_definition | function_definition | class_definition;
        export type statement = group_statement | if_statement;
        export type expression = integer | floating_point | boolean_t | identifier | function_call | add_expression | mul_expression | cmp_expression | and_expression | or_expression | assign_expression | pre_unary_expression | post_unary_expression;
        export type root = definition[];

        export interface variable_definition {
            name: string;
            value?: expression;
            type?: type;
            kind: 'variable_definition';
        }

        export interface function_definition {
            name: string;
            //compile_parameter_packs: compile_parameter[];
            parameters: parameter[];
            block: group_statement;
            kind: 'function_definition';
        }

        export interface parameter {
            name: string;
            type: type;
            kind: 'parameter';
        }

        export interface class_definition {
            name: string;
            variables: variable_definition[];
            functions: function_definition[];
            kind: 'class_definition';
        }

        export interface group_statement {
            block: statement[];
            kind: 'group_statement';
        }

        export interface if_statement {
            cond: expression;
            block: group_statement;
            next?: else_if_statement | else_statement;
            kind: 'if_statement';
        }

        export interface else_if_statement {
            cond: expression;
            block: group_statement;
            next?: else_if_statement | else_statement;
            kind: 'else_if_statement';
        }

        export interface else_statement {
            block: group_statement;
            kind: 'else_statement';
        }

        export interface integer {
            value: number;
            kind: 'integer';
        }

        export interface floating_point {
            value: number;
            kind: 'floating_point';
        }

        export interface boolean_t {
            value: boolean;
            kind: 'boolean';
        }

        export interface identifier {
            value: string;
            next?: identifier;
            kind: 'identifier';
        }

        export interface function_call {
            func: expression;
            parameters:  expression[];
            kind: 'function_call';
        }

        export interface add_expression {
            left: expression;
            right: expression;
            op: '+' | '-';
            kind: 'add_expression';
        }

        export interface mul_expression {
            left: expression;
            right: expression;
            op: '*' | '/' | '%';
            kind: 'mul_expression';
        }

        export interface cmp_expression {
            left: expression;
            right: expression;
            op: '==' | '!=' | '<=' | '>=' | '<' | '>';
            kind: 'cmp_expression';
        }

        export interface and_expression {
            left: expression;
            right: expression;
            op: 'and';
            kind: 'and_expression';
        }

        export interface or_expression {
            left: expression;
            right: expression;
            op: 'or';
            kind: 'or_expression';
        }

        export interface assign_expression {
            left: expression;
            right: expression;
            kind: 'assign_expression';
        }

        export interface pre_unary_expression {
            value: expression;
            op: '-' | '++' | '--' | '*' | '&' | 'not';
            kind: 'pre_unary_expression';
        }

        export interface post_unary_expression {
            value: expression;
            op: '++' | '--' | '!' | '?';
            kind: 'post_unary_expression';
        }
    }

    export namespace tast {
        export type root = definition[];

        export type definition = variable_definition | function_definition | class_definition;
        export type statement = group_statement | if_statement;
        export type expression = integer | identifier | floating_point | function_call | add_expression | mul_expression | pre_unary_expression | post_unary_expression | cmp_expression | and_expression | or_expression | assign_expression | boolean_t;

        export interface variable_definition {
            name: string;
            type: type;
            value?: expression;
            kind: 'variable_definition';
        }

        export interface function_definition {
            name: string;
            //compile_parameter_packs: compile_parameter[];
            parameters: parameter[];
            type: types.func;
            block: group_statement;
            kind: 'function_definition';
        }

        export interface class_function_definition extends function_definition {
            type: types.class_func;
            parameters: [this_parameter, ...parameter[]];
        }

        export interface class_definition {
            name: string;
            variables: variable_definition[];
            functions: class_function_definition[];
            type: types.classname;
            kind: 'class_definition';
        }

        export interface this_parameter {
            name: 'this';
            type: types.pointer<types.classname>;
            kind: 'parameter';
        }

        export interface parameter {
            name: string;
            type: type;
            kind: 'parameter';
        }

        export interface compile_parameter {
            name: string;
            type: compile_type;
            kind: 'parameter';
        }

        export interface group_statement {
            block: statement[];
            kind: 'group_statement';
        }

        export interface if_statement {
            cond: expression;
            block: group_statement;
            next?: else_if_statement | else_statement;
            kind: 'if_statement';
        }

        export interface else_if_statement {
            cond: expression;
            block: group_statement;
            next?: else_if_statement | else_statement;
            kind: 'else_if_statement';
        }

        export interface else_statement {
            block: group_statement;
            kind: 'else_statement';
        }

        export interface integer {
            value: number;
            type: types.int;
            kind: 'integer';
        }

        export interface identifier {
            value: string;
            type: type;
            next?: identifier;
            kind: 'identifier';
        }

        export interface floating_point {
            value: number;
            type: types.float;
            kind: 'floating_point';
        }

        export interface boolean_t {
            value: boolean;
            type: types.bool;
            kind: 'boolean';
        }

        export interface function_call {
            func: expression;
            parameters: expression[];
            type: type;
            kind: 'function_call';
        }

        export interface assign_expression {
            left: expression;
            right: expression;
            type: type;
            kind: 'assign_expression';
        }

        export interface or_expression {
            left: expression;
            right: expression;
            op: 'or';
            type: type;
            kind: 'or_expression';
        }

        export interface and_expression {
            left: expression;
            right: expression;
            op: 'and';
            type: type;
            kind: 'and_expression';
        }

        export interface cmp_expression {
            left: expression;
            right: expression;
            op: '==' | '!=' | '<=' | '>=' | '<' | '>';
            type: type;
            kind: 'cmp_expression';
        }

        export interface add_expression {
            left: expression;
            right: expression;
            op: '+' | '-';
            type: type;
            kind: 'add_expression';
        }

        export interface mul_expression {
            left: expression;
            right: expression;
            op: '*' | '/' | '%';
            type: type;
            kind: 'mul_expression';
        }

        export interface pre_unary_expression {
            value: expression;
            op: '-' | '--' | '++' | '*' | '&' | 'not';
            type: type;
            kind: 'pre_unary_expression';
        }

        export interface post_unary_expression {
            value: expression;
            op: '--' | '++' | '!' | '?';
            type: type;
            kind: 'post_unary_expression';
        }
    }
}

export namespace c {    
    export type type = types.int | types.float | types.func | types.void_t | types.classname | types.pointer;
    
    export namespace types {
        export interface int {
            kind: 'int';
        }

        export interface float {
            kind: 'float';
        }

        export interface func {
            ret: type;
            args: type[];
            kind: 'func';
        }

        export interface void_t {
            kind: 'void';
        }

        export interface classname {
            name: string;
            kind: 'classname';
        }

        export interface pointer {
            base: type;
            kind: 'pointer';
        }
    }

    export namespace ast {

        export type root = definition[];

        export type definition = variable_definition | function_definition | struct_definition | type_definition;
        export type statement = if_statement | for_statement | while_statement | group_statement | begin;
        export type expression = integer | floating_point | function_call | identifier | address_of | dereference | assign;

        export interface variable_definition {
            name: string;
            type: type;
            value?: expression;
            kind: 'variable_definition';
        }

        export interface function_definition {
            name: string;
            ret_type: type;
            parameters: parameter[];
            block: group_statement;
            kind: 'function_definition';
        }

        export interface struct_definition {
            name: string;
            properties: variable_definition[];
            kind: 'struct_definition';
        }

        export interface type_definition {
            name: string;
            type: type;
            kind: 'type_definition';
        }

        export interface parameter {
            name: string;
            type: type;
            kind: 'parameter';
        }

        export interface begin {
            kind: 'begin';
        }

        export interface if_statement {
            cond: expression;
            block: group_statement;
            next?: else_if_statement | else_statement;
            kind: 'if_statement';
        }

        export interface else_if_statement {
            cond: expression;
            block: group_statement;
            next?: else_if_statement | else_statement;
            kind: 'else_if_statement';
        }

        export interface else_statement {
            block: group_statement;
            kind: 'else_statement';
        }

        export interface group_statement {
            block: statement[];
            kind: 'group_statement';
        }

        export interface for_statement {
            init?: variable_definition;
            cond?: expression;
            post?: expression;
            block: group_statement;
            kind: 'for_statement';
        }

        export interface while_statement {
            cond: expression;
            block: group_statement;
            kind: 'while_statement';
        }

        export interface integer {
            value: number;
            kind: 'integer';
        }

        export interface floating_point {
            value: number;
            kind: 'floating_point';
        }

        export interface function_call {
            func: expression;
            parameters: expression[];
            kind: 'function_call';
        }

        export interface identifier {
            value: string;
            next?: identifier;
            is_pointer: boolean;
            kind: 'identifier';
        }

        export interface address_of {
            base: expression;
            kind: 'address_of';
        }

        export interface dereference {
            base: expression;
            kind: 'dereference';
        }

        export interface assign {
            left: expression;
            right: expression;
            kind: 'assign';
        }
    }
}