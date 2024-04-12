import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { generate } from 'peggy';

type NitroModule = {
  kind: "NitroModule",
  definitions: Definition[],
}

type Definition =
  | FunctionDefinition
  | ComponentDefinition
  | HTTPDefinition
  | StructDefinition

/**
 * Functions do not contain ANY html like expressions in them
 */
type FunctionDefinition = {
  kind: "FunctionDefinition",
  name: string,
  parameters: Parameter[],
  expression: Expression,

  // haxs
  __method?: string,
  __ret?: string,
}

type Parameter = {
  name: string,
}
/**
 * Components can contain SOME html like expressions in them
 */
type ComponentDefinition = {
  kind: "ComponentDefinition",
  name: string,
  parameters: Parameter[],

  expressions: Expression[],
  componentExpressions: ComponentExpression[],
}

type HTTPDefinition = {
  kind: "HTTPDefinition",
  verb: HTTPVerb,
  endpoint: HTTPPath[],
  expression: Expression,

  expressions?: Expression[],
  componentExpressions?: ComponentExpression[],
}

type HTTPVerb =
  | 'get'
  | 'put'
  | 'patch'
  | 'post'
  | 'delete'

type HTTPPath =
  | SimpleHTTPPath
  | WildcardHTTPPath

type SimpleHTTPPath = {
  kind: "SimpleHTTPPath",
  value: string,
}

type WildcardHTTPPath = {
  kind: "WildcardHTTPPath",
  name: string,
}

type StructDefinition = {
  kind: "StructDefinition",
  name: string,
  properties: { name: string, type: string }[],
}

type Expression =
  | HTMLBlockExpression
  | HTMLExpression
  | BlockExpression
  | StringExpression
  | IdentifierExpression
  | LetExpression
  | SQLExpression
  | RawExpression
  | GroupExpression
  | IndexExpression
  | IntegerExpression
  | DotExpression

type SubHTMLExpression =
  | HTMLBlockExpression
  | HTMLExpression
  | HTMLTextExpression
  | StringExpression
  | CaptureExpression

type ComponentExpression =
  | CopyBlobComponentExpression
  | CopyStringComponentExpression
  | NestedComponentExpression
  | BindComponentExpression

type SQLExpression =
  | SQLSelectExpression

type SQLNode =
  | SQLSelectExpression
  | SQLSelectionNode
  | SQLFromNode
  | SQLWhereNode
  | SQLCaptureNode
  | SQLStringNode
  | SQLColumnNode


type SQLExpressionNode =
  | SQLStringNode
  | SQLColumnNode
  | SQLCaptureNode

type SQLSelectExpression = {
  kind: "SQLSelectExpression",
  columns: SQLSelectionNode[],
  from?: SQLFromNode,
  where?: SQLWhereNode,
}

type SQLSelectionNode = {
  kind: "SQLSelectionNode",
  node: SQLExpressionNode,
  alias?: string,
}

type SQLFromNode = {
  kind: "SQLFromNode",
  table: string,
  alias?: string,
}

type SQLWhereNode = {
  kind: "SQLWhereNode",
  column: SQLColumnNode,
  value: SQLExpressionNode,
}

type SQLCaptureNode = {
  kind: "SQLCaptureNode",
  expression: Expression,
}

type SQLStringNode = {
  kind: "SQLStringNode",
  value: string,
}

type SQLColumnNode = {
  kind: "SQLColumnNode",
  table?: string,
  name: string,
}

type NestedComponentExpression = {
  kind: "NestedComponentExpression",
  name: string,
}

type CopyStringComponentExpression = {
  kind: "CopyStringComponentExpression",
  name: string,
}

type CopyBlobComponentExpression = {
  kind: "CopyBlobComponentExpression",
  name: string,
}

type BindComponentExpression = {
  kind: "BindComponentExpression",
  name: string,
  args: Expression[],
}

type HTMLBlockExpression = {
  kind: "HTMLBlockExpression",
  openElement?: string,
  closeElement?: string,
  expressions: SubHTMLExpression[],
  attributes: HTMLAttribute[],
}

type HTMLExpression = {
  kind: "HTMLExpression",
  element?: string,
  attributes: HTMLAttribute[],
}

type HTMLAttribute =
  | HTMLConstantAttribute
  | HTMLCaptureAttribute

type HTMLConstantAttribute = {
  kind: "HTMLConstantAttribute",
  name: string,
  value: string,
}

type HTMLCaptureAttribute = {
  kind: "HTMLCaptureAttribute",
  name: string,
  expression: Expression,
}

type HTMLTextExpression = {
  kind: "HTMLTextExpression",
  value: string,
}

type BlockExpression = {
  kind: "BlockExpression",
  expressions: Expression[],
}

type CaptureExpression = {
  kind: "CaptureExpression",
  expression: Expression,
}

type StringExpression = {
  kind: "StringExpression",
  value: string,
}

type IdentifierExpression = {
  kind: "IdentifierExpression",
  name: string,
}

type LetExpression = {
  kind: "LetExpression",
  name: string,
  expression: Expression,
}

type RawExpression = {
  kind: "RawExpression",
  source: string,
}

type GroupExpression = {
  kind: "GroupExpression",
  expression: Expression,
}

type IndexExpression = {
  kind: "IndexExpression",
  expression: Expression,
  index: Expression,
}

type IntegerExpression = {
  kind: "IntegerExpression",
  value: number,
}

type DotExpression = {
  kind: "DotExpression",
  left: Expression,
  right: Expression,
}

const parser = generate(`
  start
    = _ definitions: (@definition _)*
    { return { kind: 'NitroModule', definitions } }

  _  = [ \\t\\r\\n]*
  __ = [ \\t\\r\\n]+

  identifier 
    = chars: ([a-zA-Z][a-zA-Z0-9_]*)
    { return chars[0] + chars[1].join('') }

  sql_identifier 
    = value: (h: [a-zA-Z] t:[a-zA-Z0-9_]* { return h + t.join('') })
    ! { return ["where", "select", "from", "as"].includes(value) }
    { return value }

  url_identifier 
    = chars: ([a-zA-Z][a-zA-Z0-9_\\-~]*)
    { return chars[0] + chars[1].join('') }

  definition
    = function_definition
    / http_definition

  function_definition
    = "func" __ name: identifier _ "(" _  parameters: (h: parameter t: (_ "," _ @parameter)* (_ ",")? { return [h, ...t] })? _")" _ expression: block_expression
    { return { kind: "FunctionDefinition", name, parameters: parameters ?? [], expression } }

  http_definition
    = verb: http_verb __ endpoint: http_endpoint _ "(" _ ")" _ expression: block_expression
    { return { kind: "HTTPDefinition", verb, endpoint, expression } }

  http_verb
    = "get" / "put" / "post" / "patch" / "delete"

  http_endpoint
    = "/" paths: (@http_path "/")* last: (@http_path "/"?)?
    { return last === null ? paths : [...paths, last] }

  http_path
    = simple_http_path
    / wildcard_http_path
  
  simple_http_path
    = value: url_identifier
    { return { kind: "SimpleHTTPPath", value } }

  wildcard_http_path
    = "{" _ name: identifier _ "}"
    { return { kind: "WildcardHTTPPath", name } }

  parameter
    = name: identifier
    { return { name } }

  expression
    = let_expression

  let_expression
    = tail: ("let" __ name: identifier _ "=" _ { return { kind: "LetExpression", name } })* expression: block_expression
    { return tail.reduceRight((t, h) => ({ ...h, expression: t }), expression) }

  block_expression
    = "{" expressions: (_ @expression)* _ "}"
    { return { kind: "BlockExpression", expressions } }
    / dot_expression

  dot_expression
    = head: index_expression tail: (
      _ "." _ right: expression { return { kind: "DotExpression", right } }
    )*
    { return tail.reduce((t, h) => ({ ...h, left: t }), head) }    
    
  index_expression
    = head: literal tail:(_ "[" _ index: expression _ "]" { return {
      kind: 'IndexExpression',
      index,
    }})*
    { return tail.reduce((t, h) => ({ ...h, expression: t }), head) }

  // dot_expression
  //   = head: literal tail: (
  //     _ "." _ right: expression { return { kind: "DotExpression", right } }
  //   )*
  //   { return tail.reduce((t, h) => ({ ...h, left: t }), head) }    

  literal
    = string_expression
    / integer_expression
    / raw_expression
    / group_expression
    / html_block_expression
    / html_expression
    / sql_expression
    / identifier_expression
    
  sub_html_expression
    = html_block_expression
    / html_expression
    / capture_expression
    / string_expression
    / html_text_expression

  sql_expression
    = sql_select_expression

  sql_expression_node
    = sql_string_node
    / sql_capture_node
    / sql_column_node

  sql_select_expression
    = "select" __ columns: (h: sql_selection_node t: (_ "," _ @sql_selection_node)* { return [h, ...t] }) from: (__  @sql_from_node)? where: (__ @sql_where_node)?
    { return { kind: "SQLSelectExpression", columns, from: from ?? undefined, where: where ?? undefined } }  

  sql_selection_node
    = node: sql_expression_node alias: (__ "as" __ @sql_identifier)?
    { return { kind: "SQLSelectionNode", node, alias: alias ?? undefined } }

  sql_string_node
    = "'" chars: [^']* "'"
    { return { kind: "SQLStringNode", value: chars.join('') } }
 
  sql_column_node
    = table: (@sql_identifier _ "." _)? name: sql_identifier
    { return { kind: "SQLColumnNode", table: table ?? undefined, name } }

  sql_from_node
    = "from" __ table: sql_identifier alias: ((__ "as")? __ @sql_identifier)?
    { return { kind: "SQLFromNode", table, alias: alias ?? undefined } }

  sql_where_node
    = "where" __ col: sql_column_node _ "=" _ value: sql_expression_node
    { return { kind: "SQLWhereNode", col, value } }

  sql_capture_node
    = "{" _ expression: expression  _ "}"
    { return { kind: "SQLCaptureNode", expression } }

  html_block_expression
    = "<" prefix: (_ openElement: identifier attributes: html_attributes { return { openElement, attributes }})? _ ">" expressions: (_ @sub_html_expression)* _ "</" _ closeElement: (@identifier _)? ">"
    { return { kind: "HTMLBlockExpression", expressions, closeElement: closeElement ?? undefined, ...(prefix !== null ? prefix : { openElement: undefined, attributes: [] }) } }

  html_expression
    = "<" _ element: identifier attributes: html_attributes _ "/>"
    { return { kind: "HTMLExpression", element, attributes } }

  html_attributes
    = (__ @html_attribute)*

  html_attribute
    = html_constant_attribute
    / html_capture_attribute

  html_constant_attribute
    = name: url_identifier "=" value: string_expression
    { return { kind: "HTMLConstantAttribute", name, value: value.value } }

  html_capture_attribute
    = name: url_identifier "=" cap: capture_expression
    { return { kind: "HTMLCaptureAttribute", name, expression: cap.expression }  }

  html_text_expression
    = chars: [^<{]+
    { return { kind: "HTMLTextExpression", value: chars.join('') } }

  capture_expression
    = "{" _  expression: expression _ "}"
    { return { kind: "CaptureExpression", expression } }

  string_expression
    = "\\"" chars: [^\\"]* "\\""
    { return { kind: "StringExpression", value: chars.join('') } }

  identifier_expression
    = name: identifier
    { return { kind: "IdentifierExpression", name } }

  raw_expression
    = "__go__" [ \t]+ chars: [^\\n]* _
    { return { kind: "RawExpression", source: chars.join("") } }
  
  group_expression
    = "(" _ expression: expression _ ")"
    { return { kind: "GroupExpression", expression } }

  integer_expression
    = chars: [0-9]+
    { return { kind: "IntegerExpression", value: Number(chars.join('')) } }
`);

function parse(content: string): NitroModule {
  return parser.parse(content);
}

function panic(): never {
  throw new Error();
}

function todo(reason: string): never {
  throw new Error(reason);
}

function toGo_Expression(e: Expression): string {
  switch (e.kind) {
    case 'HTMLBlockExpression':
    case 'HTMLExpression':
    case 'SQLSelectExpression':
      panic();
    case 'BlockExpression': return `{\n${e.expressions.map(toGo_Expression).join('\n')}\n}`;
    case 'StringExpression': return `"${e.value}"`;
    case 'IdentifierExpression': return e.name;
    case 'LetExpression': return `${e.name} := ${toGo_Expression(e.expression)}`;
    case 'RawExpression': return e.source;
    case 'GroupExpression': return `(${toGo_Expression(e.expression)})`;
    case 'IndexExpression': return `${toGo_Expression(e.expression)}[${toGo_Expression(e.index)}]`;
    case 'IntegerExpression': return `${e.value}`;
    case 'DotExpression': return `${toGo_Expression(e.left)}.${toGo_Expression(e.right)}`;
  }
}

function toGo_SubHTMLExpression(s: SubHTMLExpression): string {
  switch (s.kind) {
    case 'HTMLBlockExpression':
    case 'HTMLExpression':
    case 'HTMLTextExpression':
    case 'StringExpression':
    case 'CaptureExpression':
      panic();
  }
}

function buildEndpoint(paths: HTTPPath[]): string {
  return `/${paths.map(x => {
    switch (x.kind) {
      case 'SimpleHTTPPath': return `${x.value}/`;
      case 'WildcardHTTPPath': return `:${x.name}/`;
    }
  }).join('')}`;
}

function expandPathParameters(paths: HTTPPath[]): string {
  const parameters = paths.flatMap((x): string[] => {
    switch (x.kind) {
      case 'SimpleHTTPPath': return [];
      case 'WildcardHTTPPath': return [x.name];
    }
  });

  return parameters.map(x => `${x} := ""`).join('\n') + `
if err := echo.PathParamsBinder(c)${parameters.map(x => `.String("${x}", &${x})`).join('')}.BindError(); err != nil {
  return c.String(http.StatusBadRequest, "bad request")
}
`;
}

function toGo_Definition(d: Definition): string {
  switch (d.kind) {
    case 'FunctionDefinition':
      return `func ${d.__method === undefined ? "" : ` ${d.__method} `}${d.name}(${d.parameters.map(x => `${x.name} any`).join(',')}) ${d.__ret === undefined ? "any" : d.__ret} ${toGo_Expression(d.expression)}`;
    case 'ComponentDefinition':
      // TODO parameter types are 
      // deduced from name
      // should be using a type system
      return `func ${d.name}(${d.parameters.map(x => `${x.name} ${x.name === 'children' ? 'Component' : 'string'}`).join(',')}) Component {
        ${d.expressions.map(toGo_Expression).join('\n')}
        return func(c echo.Context) error {
          ${d.componentExpressions.map((x): string => {
        switch (x.kind) {
          case 'CopyBlobComponentExpression': return `if err := WriteBytes(c, ${x.name}); err != nil { return err }`;
          case 'NestedComponentExpression': return `if err := ${x.name}(c); err != nil { return err }`;
          case 'CopyStringComponentExpression': return `if err := WriteBytes(c, []byte(${x.name})); err != nil { return err }`;
          case 'BindComponentExpression': return `if err := ${x.name}(${x.args.map(toGo_Expression).join(',')})(c); err != nil { return err }`
        }
      }).join('\n')}
          return nil
        }
      }`;
    case 'HTTPDefinition':
      if (d.componentExpressions === undefined) panic();
      if (d.expressions === undefined) panic();
      return `e.${d.verb.toUpperCase()}("${buildEndpoint(d.endpoint)}", func(c echo.Context) error {
        ${expandPathParameters(d.endpoint)}
        ${d.expressions.map(toGo_Expression).join('\n')}
        ${d.componentExpressions.map((x): string => {
        switch (x.kind) {
          case 'CopyBlobComponentExpression': return `if err := WriteBytes(c, ${x.name}); err != nil { return err }`;
          case 'NestedComponentExpression': return `if err := ${x.name}(c); err != nil { return err }`;
          case 'CopyStringComponentExpression': return `if err := WriteBytes(c, []byte(${x.name})); err != nil { return err }`;
          case 'BindComponentExpression': return `if err := ${x.name}(${x.args.map(toGo_Expression).join(',')})(c); err != nil { return err }`
        }
      }).join('\n')}
        return nil
      })`;
    case 'StructDefinition':
      return `type ${d.name} struct {
        ${d.properties.map(x => `${x.name} ${x.type}`).join('\n')}
      }`;
  }
}

let blobNameCount = 0;
function nextBlobName() {
  return `_b${blobNameCount++}`;
}

let componentNameCount = 0;
function nextComponentName() {
  return `_c${componentNameCount++}`;
}

type Blob = {
  name: string,
  value: string,
}

function extractCapturedIdentifiers(e: Expression): IdentifierExpression[] {
  const html = (e: SubHTMLExpression): IdentifierExpression[] => {
    switch (e.kind) {
      case 'HTMLBlockExpression':
        return [e.attributes.flatMap(attr), e.expressions.flatMap(html)].flat();
      case 'HTMLExpression':
        return [e.attributes.flatMap(attr)].flat();
      case 'HTMLTextExpression':
      case 'StringExpression':
        return [];
      case 'CaptureExpression':
        if (e.expression.kind !== "IdentifierExpression") panic();
        return [e.expression];
    }
  };

  const attr = (a: HTMLAttribute): IdentifierExpression[] => {
    switch (a.kind) {
      case 'HTMLConstantAttribute':
        return [];
      case 'HTMLCaptureAttribute':
        if (a.expression.kind !== "IdentifierExpression") panic();
        return [a.expression];
    }
  };

  const expr = (e: Expression): IdentifierExpression[] => {
    switch (e.kind) {
      case 'HTMLBlockExpression':
      case 'HTMLExpression':
        return html(e);
      case 'BlockExpression':
        return e.expressions.flatMap(expr);
      case 'StringExpression':
      case 'IdentifierExpression':
      case 'RawExpression':
      case 'IntegerExpression':
        return [];
      case 'LetExpression':
      case 'GroupExpression':
        return expr(e.expression);
      case 'SQLSelectExpression':
        return []; // maybe????
      case 'IndexExpression':
        return [expr(e.expression), expr(e.index)].flat();
      case 'DotExpression':
        return [expr(e.left), expr(e.right)].flat();
    }
  }

  return expr(e);
}

function reduceToComponentExpressions(e: Expression, components: string[]): [ComponentExpression[], Blob[], ComponentDefinition[]] {
  const stack: string[] = [];
  const blobs: { name: string, value: string }[] = [];
  const generatedComponents: ComponentDefinition[] = [];

  const consume = (): [ComponentExpression] | [] => {
    const value = stack.pop();
    if (value === undefined) return [];
    const name = nextBlobName();
    blobs.push({ name, value });
    return [{ kind: "CopyBlobComponentExpression", name }];
  }

  const produce = (x: string) => {
    if (stack.length === 0) {
      stack.push('');
    }
    stack[stack.length - 1] += x;
  }

  const isComponent = (element: string): boolean => {
    return components.find(x => x === element) !== undefined;
  }

  const attrToExpression = (a: HTMLAttribute): Expression => {
    switch (a.kind) {
      case 'HTMLConstantAttribute':
        return { kind: "StringExpression", value: a.value };
      case 'HTMLCaptureAttribute':
        return a.expression;
    }
  }

  const attrToComponentExpression = (a: HTMLAttribute): ComponentExpression[] => {
    switch (a.kind) {
      case 'HTMLConstantAttribute':
        produce(` ${a.name}="${a.value}"`);
        return [];
      case 'HTMLCaptureAttribute': {
        if (a.expression.kind !== 'IdentifierExpression') panic();
        return [...consume(), { kind: "CopyStringComponentExpression", name: a.expression.name }];
      }
    }
  }

  const sub = (e: SubHTMLExpression): ComponentExpression[] => {
    switch (e.kind) {
      case 'HTMLBlockExpression': {
        if (e.openElement && isComponent(e.openElement)) {
          // attributes will be parameters + implicit children parameter
          const res = [...e.expressions.flatMap(sub), ...consume()];

          const captures = extractCapturedIdentifiers({ kind: "HTMLBlockExpression", attributes: [], expressions: e.expressions });

          const ins: Expression[] = [];
          if (e.expressions.length > 0) {
            const name = nextComponentName();
            const childComponent: ComponentDefinition = {
              kind: "ComponentDefinition",
              parameters: captures,
              expressions: [], // maybe????????
              componentExpressions: res,
              name,
            };
            generatedComponents.push(childComponent);
            ins.push({ kind: "IdentifierExpression", name: name + `(${captures.map(x => x.name).join(',')})` }) // todo fix checky hax
          }

          return [{ kind: "BindComponentExpression", name: e.openElement, args: [...e.attributes.map(attrToExpression), ...ins] }];
        }
        else {
          produce(`<${e.openElement}`);
          const attrs = e.attributes.flatMap(attrToComponentExpression);
          produce('>');
          const res = e.expressions.flatMap(sub);
          produce(`</${e.closeElement}>`);
          return [...attrs, ...res];
        }
      }
      case 'HTMLExpression':
        produce(`<${e.element}`);
        const attrs = e.attributes.flatMap(attrToComponentExpression);
        produce(' />');
        return attrs;
      // RULE
      // AT THIS POINT CaptureExpression
      // SHOULD ONLY BE
      // - IDENTIFIER
      case 'CaptureExpression': {
        switch (e.expression.kind) {
          case 'IdentifierExpression':
            // for now only check names should use type system to guide this
            // but as a rule children = nested otherwise data
            if (e.expression.name === "children") {
              return [...consume(), { kind: "NestedComponentExpression", name: e.expression.name }];
            }
            else {
              return [...consume(), { kind: "CopyStringComponentExpression", name: e.expression.name }];
            }
          case 'HTMLBlockExpression':
          case 'HTMLExpression':
          case 'StringExpression':
          case 'BlockExpression':
          case 'LetExpression':
          case 'SQLSelectExpression':
          case 'RawExpression':
          case 'GroupExpression':
          case 'IndexExpression':
          case 'IntegerExpression':
          case 'DotExpression':
            panic();
        }
      }
      case 'HTMLTextExpression':
        stack[stack.length - 1] += e.value.trim();
        return [];
      case 'StringExpression':
        stack[stack.length - 1] += e.value.trim();
        return [];
    }
  };

  const imp = (e: Expression, withinHTML: boolean): ComponentExpression[] => {
    switch (e.kind) {
      case 'HTMLBlockExpression':
      case 'HTMLExpression':
        return [...sub(e), ...consume()];
      case 'BlockExpression':
        return e.expressions.flatMap(x => imp(x, withinHTML));
      case 'StringExpression':
      case 'IntegerExpression':
      case 'IdentifierExpression':
      case 'SQLSelectExpression':
      case 'RawExpression':
        return [];
      case 'LetExpression':
      case 'GroupExpression':
        return imp(e.expression, withinHTML);
      case 'IndexExpression':
        return [imp(e.expression, withinHTML), imp(e.index, withinHTML)].flat();
      case 'DotExpression':
        return [imp(e.left, withinHTML), imp(e.right, withinHTML)].flat();
    }
  }

  return [imp(e, false), blobs, generatedComponents];
}

/**
 * 
 * Since components and functions have the same syntax they parse the same aka all components and function
 * are "FunctionDefinition" so we need to split them apart.
 * 
 * @param mod
 * 
 * @returns the nitro module with functions and components separated
 */
function rewriteToComponentsAndFunctionSplit(mod: NitroModule): [NitroModule, Blob[], ComponentDefinition[]] {
  const blobs: Blob[] = [];
  const generatedComponents: ComponentDefinition[] = [];

  const components = mod.definitions.flatMap((x): string[] => {
    switch (x.kind) {
      case 'FunctionDefinition': return hasHTML(x.expression) ? [x.name] : [];
      case 'ComponentDefinition': return [x.name];
      case 'HTTPDefinition': return [];
      case 'StructDefinition': return [];
    }
  });

  function hasHTML(e: Expression): boolean {
    switch (e.kind) {
      case 'HTMLBlockExpression':
      case 'HTMLExpression':
        return true;
      case 'BlockExpression':
        return e.expressions.some(hasHTML);
      case 'StringExpression':
      case 'IdentifierExpression':
      case 'SQLSelectExpression':
      case 'RawExpression':
      case 'IntegerExpression':
        return false;
      case 'LetExpression':
      case 'GroupExpression':
        return hasHTML(e.expression);
      case 'IndexExpression':
        return hasHTML(e.expression) || hasHTML(e.index);
      case 'DotExpression':
        return hasHTML(e.left) || hasHTML(e.right);
    }
  }

  function removeHTML(e: Expression): Expression[] {
    switch (e.kind) {
      case 'HTMLBlockExpression':
      case 'HTMLExpression':
        return [];
      case 'BlockExpression':
        return e.expressions.flatMap(removeHTML);
      case 'RawExpression':
      case 'StringExpression':
      case 'IdentifierExpression':
      case 'SQLSelectExpression':
      case 'IntegerExpression':
        return [e];
      case 'LetExpression':
      case 'GroupExpression':
      case 'IndexExpression':
      case 'DotExpression':
        return hasHTML(e) ? [] : [e];
    }
  }

  function definition(d: Definition): Definition {
    switch (d.kind) {
      case 'FunctionDefinition': {
        if (!hasHTML(d.expression)) return d;

        const [componentExpressions, b, g] = reduceToComponentExpressions(d.expression, components);
        blobs.push(...b);
        generatedComponents.push(...g);
        components.push(...g.map(x => x.name));

        const expressions = removeHTML(d.expression);

        return {
          ...d,
          kind: "ComponentDefinition",
          componentExpressions,
          expressions,
        };
      }
      case 'ComponentDefinition': return d;
      case 'HTTPDefinition': {
        if (!hasHTML(d.expression)) return d;

        const [componentExpressions, b, g] = reduceToComponentExpressions(d.expression, components);
        blobs.push(...b);
        generatedComponents.push(...g);
        components.push(...g.map(x => x.name));

        const expressions = removeHTML(d.expression);

        return {
          ...d,
          componentExpressions,
          expressions,
        };
      }
      case 'StructDefinition':
        return d;
    }
  }

  return [{
    ...mod,
    definitions: mod.definitions.map(definition),
  }, blobs, generatedComponents];
}

let generatedNameCount = 0;
function nextGeneratedName() {
  return `_${generatedNameCount++}`;
}


type SQLQueryData = {
  name: string,
  functionName: string,
  resultStructName: string,
  query: string,
  bindings: { name: string, expression: Expression }[],
  columns: { name: string }[],
}

function extractSQLQuery(s: SQLNode): SQLQueryData {
  const name = nextGeneratedName();
  const functionName = nextGeneratedName();
  const resultStructName = nextGeneratedName();

  const bindings: { name: string, expression: Expression }[] = [];
  const columns: { name: string }[] = [];

  const bind = (e: Expression) => {
    const name = nextGeneratedName();
    bindings.push({ name, expression: e });
  };

  const columnName = (s: SQLExpressionNode) => {
    switch (s.kind) {
      case 'SQLColumnNode':
        return s.name;
      case 'SQLStringNode':
        return `column${columns.length}`;
      case 'SQLCaptureNode':
        panic();
    }
  }

  const imp = (s: SQLNode): string => {
    switch (s.kind) {
      case 'SQLSelectExpression':
        return `select ${s.columns.map(imp).join(',')}${s.from === undefined ? '' : ` ${imp(s.from)}`}${s.where === undefined ? '' : ` ${imp(s.where)}`}`;
      case 'SQLSelectionNode':
        columns.push({ name: s.alias ?? columnName(s.node) });
        return `${imp(s.node)}${s.alias === undefined ? '' : ` as ${s.alias}`}`;
      case 'SQLFromNode':
        return `${s.table}${s.alias === undefined ? '' : ` ${s.alias}`}`;
      case 'SQLWhereNode':
        return `${imp(s.column)} = ${imp(s.value)}`;
      case 'SQLCaptureNode':
        bind(s.expression);
        return `$${bindings.length}`;
      case 'SQLStringNode':
        return `'${s.value}'`;
      case 'SQLColumnNode':
        return `${s.table === undefined ? '' : `${s.table}.`}${s.name}`;
    }
  }

  const query = imp(s);

  return {
    name,
    bindings,
    columns,
    functionName,
    query,
    resultStructName,
  };
}

function rewriteSQLQueriesToFunctionsAndStructs(mod: NitroModule): NitroModule {
  const generatedDefinitions: Definition[] = [];

  const expr = (e: Expression): Expression => {
    switch (e.kind) {
      case 'BlockExpression':
        return { ...e, expressions: e.expressions.map(expr) };
      case 'HTMLBlockExpression':
      case 'HTMLExpression':
      case 'StringExpression':
      case 'IdentifierExpression':
      case 'RawExpression':
      case 'IntegerExpression':
        return e;
      case 'LetExpression':
      case 'GroupExpression':
        return { ...e, expression: expr(e.expression) };
      case 'IndexExpression':
        return { ...e, expression: expr(e.expression), index: expr(e.index) };
      case 'DotExpression':
        return { ...e, left: expr(e.left), right: expr(e.right) };
      case 'SQLSelectExpression': {
        const qd = extractSQLQuery(e);

        generatedDefinitions.push({
          kind: "StructDefinition",
          name: qd.resultStructName,
          properties: qd.columns.map(x => ({ name: x.name, type: 'string' })),
        }, {
          kind: "FunctionDefinition",
          expression: {
            kind: "BlockExpression", expressions: [{
              kind: "RawExpression", source: `
              var obj ${qd.resultStructName}
              var objects []${qd.resultStructName}
            
              rows, err := db.conn.Query(\`${qd.query}\`, ${qd.bindings.map(x => x.name).join(',')})
              if err != nil {
                panic("bad query: " + err.Error())
              }
              defer rows.Close()
            
              for rows.Next() {
                rows.Scan(${qd.columns.map(x => `&obj.${x.name}`).join(',')})
                objects = append(objects, obj)
              }
            
              return objects
          ` }]
          },
          __method: `(db *Database)`,
          __ret: '[]' + qd.resultStructName,
          name: qd.functionName,
          parameters: qd.bindings.map(x => ({ name: x.name })),
        });

        return { kind: "RawExpression", source: `db.${qd.functionName}(${qd.bindings.map(x => toGo_Expression(x.expression)).join(',')})` };
      }
    }
  };

  const def = (d: Definition): Definition => {
    switch (d.kind) {
      case 'FunctionDefinition': return { ...d, expression: expr(d.expression) };
      case 'ComponentDefinition': panic();
      case 'HTTPDefinition': return { ...d, expression: expr(d.expression) };
      case 'StructDefinition': return d;
    }
  };

  const defs = mod.definitions.map(def);

  return {
    ...mod,
    definitions: [...generatedDefinitions, ...defs],
  };
}

function nonHTTPDefinitions(x: Definition[]): { non: Definition[], http: Definition[] } {
  const non: Definition[] = [];
  const http: Definition[] = [];

  for (const d of x) {
    ((): true => {
      switch (d.kind) {
        case 'FunctionDefinition':
        case 'ComponentDefinition':
        case 'StructDefinition':
          non.push(d)
          return true;
        case 'HTTPDefinition':
          http.push(d)
          return true;
      }
    })();
  }

  return { non, http };
}

function mainGoModule(mod: NitroModule, blobs: Blob[], generatedComponents: ComponentDefinition[]): string {
  const { non, http } = nonHTTPDefinitions([...generatedComponents, ...mod.definitions]);
  const defs = non.map(toGo_Definition).join('\n\n');

  return `\
package main

import (
	"database/sql"
  "net/http"

	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
)

var (
${blobs.map(x => `\t${x.name} = []byte(\`${x.value}\`)\n`).join('')}
)

type Database struct {
	conn *sql.DB
}

type Component = func(echo.Context) error

func WriteBytes(c echo.Context, bytes []byte) error {
	_, err := c.Response().Write(bytes)
	return err
}

${defs}
func main() {
	connStr := "postgresql://root:password@localhost:5432?sslmode=disable"

	e := echo.New()

	conn, err := sql.Open("postgres", connStr)
	if err != nil {
		panic("Could not connect to the database at " + connStr)
	}
	db := Database{conn}
	defer db.conn.Close()

  e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			path := c.Request().URL.Path
			if path[len(path)-1] != '/' {
				c.Request().URL.Path += "/"
			}
			return next(c)
		}
	})

${http.map(toGo_Definition).join('\n')}

	e.Logger.Fatal(e.Start(":4000"))
}
`;
}

function goMod() {
  return `\
module main

go 1.22.1

require (
  github.com/labstack/echo/v4 v4.11.4 // indirect
  github.com/labstack/gommon v0.4.2 // indirect
  github.com/lib/pq v1.10.9 // indirect
  github.com/mattn/go-colorable v0.1.13 // indirect
  github.com/mattn/go-isatty v0.0.20 // indirect
  github.com/valyala/bytebufferpool v1.0.0 // indirect
  github.com/valyala/fasttemplate v1.2.2 // indirect
  golang.org/x/crypto v0.17.0 // indirect
  golang.org/x/net v0.19.0 // indirect
  golang.org/x/sys v0.15.0 // indirect
  golang.org/x/text v0.14.0 // indirect
)
`;
}

function goSum() {
  return `\
github.com/labstack/echo/v4 v4.11.4 h1:vDZmA+qNeh1pd/cCkEicDMrjtrnMGQ1QFI9gWN1zGq8=
github.com/labstack/echo/v4 v4.11.4/go.mod h1:noh7EvLwqDsmh/X/HWKPUl1AjzJrhyptRyEbQJfxen8=
github.com/labstack/gommon v0.4.2 h1:F8qTUNXgG1+6WQmqoUWnz8WiEU60mXVVw0P4ht1WRA0=
github.com/labstack/gommon v0.4.2/go.mod h1:QlUFxVM+SNXhDL/Z7YhocGIBYOiwB0mXm1+1bAPHPyU=
github.com/lib/pq v1.10.9 h1:YXG7RB+JIjhP29X+OtkiDnYaXQwpS4JEWq7dtCCRUEw=
github.com/lib/pq v1.10.9/go.mod h1:AlVN5x4E4T544tWzH6hKfbfQvm3HdbOxrmggDNAPY9o=
github.com/mattn/go-colorable v0.1.13 h1:fFA4WZxdEF4tXPZVKMLwD8oUnCTTo08duU7wxecdEvA=
github.com/mattn/go-colorable v0.1.13/go.mod h1:7S9/ev0klgBDR4GtXTXX8a3vIGJpMovkB8vQcUbaXHg=
github.com/mattn/go-isatty v0.0.16/go.mod h1:kYGgaQfpe5nmfYZH+SKPsOc2e4SrIfOl2e/yFXSvRLM=
github.com/mattn/go-isatty v0.0.20 h1:xfD0iDuEKnDkl03q4limB+vH+GxLEtL/jb4xVJSWWEY=
github.com/mattn/go-isatty v0.0.20/go.mod h1:W+V8PltTTMOvKvAeJH7IuucS94S2C6jfK/D7dTCTo3Y=
github.com/valyala/bytebufferpool v1.0.0 h1:GqA5TC/0021Y/b9FG4Oi9Mr3q7XYx6KllzawFIhcdPw=
github.com/valyala/bytebufferpool v1.0.0/go.mod h1:6bBcMArwyJ5K/AmCkWv1jt77kVWyCJ6HpOuEn7z0Csc=
github.com/valyala/fasttemplate v1.2.2 h1:lxLXG0uE3Qnshl9QyaK6XJxMXlQZELvChBOCmQD0Loo=
github.com/valyala/fasttemplate v1.2.2/go.mod h1:KHLXt3tVN2HBp8eijSv/kGJopbvo7S+qRAEEKiv+SiQ=
golang.org/x/crypto v0.17.0 h1:r8bRNjWL3GshPW3gkd+RpvzWrZAwPS49OmTGZ/uhM4k=
golang.org/x/crypto v0.17.0/go.mod h1:gCAAfMLgwOJRpTjQ2zCCt2OcSfYMTeZVSRtQlPC7Nq4=
golang.org/x/net v0.19.0 h1:zTwKpTd2XuCqf8huc7Fo2iSy+4RHPd10s4KzeTnVr1c=
golang.org/x/net v0.19.0/go.mod h1:CfAk/cbD4CthTvqiEl8NpboMuiuOYsAr/7NOjZJtv1U=
golang.org/x/sys v0.0.0-20220811171246-fbc7d0a398ab/go.mod h1:oPkhp1MJrh7nUepCBck5+mAzfO9JrbApNNgaTdGDITg=
golang.org/x/sys v0.6.0/go.mod h1:oPkhp1MJrh7nUepCBck5+mAzfO9JrbApNNgaTdGDITg=
golang.org/x/sys v0.15.0 h1:h48lPFYpsTvQJZF4EKyI4aLHaev3CxivZmv7yZig9pc=
golang.org/x/sys v0.15.0/go.mod h1:/VUhepiaJMQUp4+oa/7Zr1D23ma6VTLIYjOOTFZPUcA=
golang.org/x/text v0.14.0 h1:ScX5w1eTa3QqT8oi6+ziP7dTV1S2+ALU0bI+0zXKWiQ=
golang.org/x/text v0.14.0/go.mod h1:18ZOQIKpY8NJVqYksKHtTdi31H5itFRjB5/qKTNYzSU=  
`;
}

let logCount = 0;
function postLog<T>(prefix: string, f: (x: T) => T): (x: T) => T {
  return x => {
    const next = f(x);
    writeFileSync(`${prefix}${logCount++}_${f.name}.json`, JSON.stringify(next, undefined, 2));
    return next;
  };
}

function pipe<T>(...fs: ((x: T) => T)[]): (x: T) => T {
  return (x) => fs.reduce((p, c) => c(p), x);
}

async function main(args: string[]) {
  const [filename] = args;
  const prefix = "out/log/";

  try {
    await rm("out", { recursive: true });
  }
  catch { }
  await mkdir("out");
  await mkdir("out/log");

  const fileContent = (await readFile(filename)).toString();
  let blobs: Blob[] = [];
  let generatedComponents: ComponentDefinition[] = [];

  const parseAst = () => parse(fileContent);
  const rewriteToComponentsAndFunctionSplitHandlingBlobs = (mod: NitroModule) => {
    const [next, b, g] = rewriteToComponentsAndFunctionSplit(mod);
    blobs.push(...b);
    generatedComponents.push(...g);
    return next;
  }
  const ast = pipe(
    postLog(prefix, parseAst),
    postLog(prefix, rewriteSQLQueriesToFunctionsAndStructs),
    postLog(prefix, rewriteToComponentsAndFunctionSplitHandlingBlobs),
  )({ kind: "NitroModule", definitions: [] });

  await writeFile("out/main.go", mainGoModule(ast, blobs, generatedComponents));
  await writeFile("out/go.mod", goMod());
  await writeFile("out/go.sum", goSum());

  const server = spawn("go", ["run", "."], { cwd: "out", stdio: "pipe" });
  server.stdout.pipe(process.stdout);
  server.stderr.pipe(process.stderr);
}

main(process.argv.slice(2)).catch(e => console.error(e));
