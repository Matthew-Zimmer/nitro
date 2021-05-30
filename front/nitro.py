from typing import Any, List
import lark, json, sys

@lark.v_args(inline=True)
class cst_to_ast(lark.Transformer):

    # always arrays rules
    def nitro(self, *kids: Any):
        return list(kids)
    def parameters(self, *kids: Any):
        return list(kids)
    def block(self, *kids: Any):
        return list(kids)
    def properties(self, *kids: Any):
        return list(kids)
    
    # always inline rules
    def definition(self, kid: Any):
        return kid
    def statement(self, kid: Any):
        return kid
    def expression(self, kid: Any):
        return kid
    def type(self, kid: Any):
        return kid
    def literal(self, kid: Any):
        return kid
    def primitive(self, kid: Any):
        return kid
    def group_expression(self, kid: Any):
        return kid

    # literals
    def integer(self, t: Any):
        return {
            'kind': 'integer',
            'value': t
        }
    def floating_point(self, t: Any):
        return {
            'kind': 'floating_point',
            'value': t
        }
    def boolean(self, t: Any):
        return {
            'kind': 'boolean',
            'value': t
        }
    def identifier(self, *kids: Any):
        if len(kids) == 1:
            return {
                'kind': 'identifier',
                'value': kids[0],
            }
        else:
            return {
                'kind': 'identifier',
                'value': kids[0],
                'next': kids[1]
            }

    # expressions
    def post_unary_expression(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'post_unary_expression',
                'value': kids[0],
                'op': kids[1]
            }

    def pre_unary_expression(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'pre_unary_expression',
                'value': kids[0],
                'op': kids[1]
            }

    def function_call(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'function_call',
                'func': kids[0],
                'parameters': kids[2:-1:2]
            }

    def mul_expression(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'mul_expression',
                'left': kids[0],
                'op': kids[1],
                'right': kids[2],
            }

    def add_expression(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'add_expression',
                'left': kids[0],
                'op': kids[1],
                'right': kids[2],
            }

    def cmp_expression(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'cmp_expression',
                'left': kids[0],
                'op': kids[1],
                'right': kids[2],
            }

    def and_expression(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'and_expression',
                'left': kids[0],
                'op': kids[1],
                'right': kids[2],
            }

    def or_expression(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'or_expression',
                'left': kids[0],
                'op': kids[1],
                'right': kids[2],
            }

    def assign_expression(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'assign_expression',
                'left': kids[0],
                'right': kids[1],
            }

    # statements
    def if_statement(self, *kids: Any):
        if len(kids) == 2:
            return {
                'kind': 'if_statement',
                'cond': kids[0],
                'block': kids[1]
            }
        else:
            return {
                'kind': 'if_statement',
                'cond': kids[0],
                'block': kids[1],
                'next': kids[2]
            }

    def else_if_statement(self, *kids: Any):
        if len(kids) == 2:
            return {
                'kind': 'else_if_statement',
                'cond': kids[0],
                'block': kids[1]
            }
        else:
            return {
                'kind': 'else_if_statement',
                'cond': kids[0],
                'block': kids[1],
                'next': kids[2]
            }

    def else_statement(self, *kids: Any):
        return {
            'kind': 'else_statement',
            'block': kids[0]
        }

    def group_statement(self, kid: Any):
        return {
            'kind': 'group_statement',
            'block': kid
        }

    # definitions
    def class_definition(self, n: Any, props: Any):
        return {
            'kind': 'class_definition',
            'name': n,
            'variables': [p for p in props if p['kind'] == 'variable_definition'],
            'functions': [p for p in props if p['kind'] == 'function_definition'],
        }

    def parameter(self, name: Any, type: Any):
        return {
            'kind': 'parameter',
            'name': name,
            'type': type
        }

    def function_definition(self, n: Any, pars: Any, block: Any):
        return {
            'kind': 'function_definition',
            'name': n,
            'parameters': pars,
            'block': block
        }

    def initial_value(self, exp: Any):
        return {
            'kind': 'initial_value',
            'value': exp 
        }

    def variable_definition(self, n: Any, *rest: Any):
        if len(rest) == 2:
            return {
                'kind': 'variable_definition',
                'name': n,
                'type': rest[0],
                'value': rest[1]['value']
            }
        elif rest[0]['kind'] == 'initial_value':
            return {
                'kind': 'variable_definition',
                'name': n,
                'value': rest[0]['value']
            }
        else:
            return {
                'kind': 'variable_definition',
                'name': n,
                'type': rest[0]
            }

    # types
    def func(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'func',
                'args': kids[1:-3:2],
                'ret': kids[-1]
            }
    
    def pointer(self, *kids: Any):
        if len(kids) == 1:
            return kids[0]
        else:
            return {
                'kind': 'pointer',
                'base': kids[0]
            }

    def int(self, *kids: Any):
        return {
            'kind': 'int'
        }

    def float(self, *kids: Any):
        return {
            'kind': 'float'
        }

    def bool(self, *kids: Any):
        return {
            'kind': 'bool'
        }

    def void(self, *kids: Any):
        return {
            'kind': 'void'
        }

    def classname(self, *kids: Any):
        return {
            'kind': 'classname',
            'name': kids[0]
        }

    def literal_int(self, *kids: Any):
        return {
            'kind': 'literal_int',
            'value': kids[0]
        }

    def literal_float(self, *kids: Any):
        return {
            'kind': 'literal_float',
            'value': kids[0]
        }

    def literal_bool(self, *kids: Any):
        return {
            'kind': 'literal_bool',
            'value': kids[0]
        }

    # base TOKENS
    def NAME(self, t: lark.Token):
        return t.value
    def IDENTIFIER(self, t: lark.Token):
        return t.value
    def INTEGER(self, t: lark.Token):
        return int(t.value)
    def FLOATING_POINT(self, t: lark.Token):
        return float(t.value)
    def BOOLEAN(self, t: lark.Token):
        return t.value == 'true'
    
def read(filename: str):
    with open(filename) as file:
        return file.read()

def parser():
    with open('front/nitro.lark') as file:
        return lark.Lark(file.read(), start='nitro')

def parse(source: str):
    p = parser()
    return p.parse(source)    

def convert_to_ast(tr: lark.Tree) -> Any:
    converter = cst_to_ast()
    ast: Any = converter.transform(tr)
    return ast

def write(filename: str, data: Any):
    with open(filename, 'w') as file:
        json.dump(data, file)

def main(args: List[str]):
    if len(args) == 1:
        input_file = args[0]
        output_file = f'{input_file}.json'
        nitro_source = read(input_file)
        tr = parse(nitro_source)
        ast = convert_to_ast(tr)
        write(output_file, ast)
    else:
        print('missing input file', file=sys.stderr)


if __name__ == '__main__':
    main(sys.argv[1:])