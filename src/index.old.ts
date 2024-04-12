import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { generate } from 'peggy';

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

  type 
    = string_type
    / pk_type

  string_type
    = "str"
    { return { kind: "StringType" } }

  pk_type
    = "pk" __ type: type
    { return { kind: "PrimaryKeyType", type } }

  definition
    = table_definition
    / http_definition
    / function_definition

  table_definition
    = "table" __ name: identifier _ "{" _ columns: (h: column_definition t: (_ "," _ @column_definition)* (_ ",")? { return [h, ...t] })? _ "}"
    { return { kind: "TableDefinition", name, columns: columns ?? [] } }

  column_definition
    = name: identifier _ ":" _ type: type
    { return { kind: "ColumnDefinition", name, type } }

  http_definition
    = verb: http_verb __ endpoint: http_endpoint _ "(" _ ")" _ ":" _ ret: type _ expression: block_expression
    { return { kind: "HTTPDefinition", verb, endpoint, expression } }

  function_definition
    = "func" __ name: identifier _ "(" _ parameters: (h: parameter t: (_ "," _ @parameter)* (_ ",")? { return [h, ...t] })? _ ")" _ ":" _ ret: type _ expression: block_expression
    { return { kind: "FunctionDefinition", name, parameters: parameters ?? [], expression, ret } }

  parameter
    = name: identifier _ ":" _ type: type
    { return { name, type } }

  http_verb
    = "get" / "put" / "post" / "patch" / "delete"

  http_endpoint
    = "/" paths: (@http_path "/")* last: (@http_path "/"?)?
    { return { paths: last === null ? paths : [...paths, last] }}

  http_path
    = simple_http_path
    / wildcard_http_path
  
  simple_http_path
    = path: url_identifier
    { return { kind: "SimpleHTTPPath", path } }

  wildcard_http_path
    = "{" _ name: identifier _ "}"
    { return { kind: "WildcardHTTPPath", name } }

  expression
    = html_expression
    / closing_html_expression
    / sql_expression
    / block_expression
    / let_expression
    / string_expression
    / raw_go_expression
    / identifier_expression

  html_sub_expression
    = html_expression
    / closing_html_expression
    / escape_expression
    / html_string_expression

  html_expression
    = "<" _ element: url_identifier _ attributes: (@html_attributes _)?  ">" expressions: (_ @html_sub_expression)* _ "</" _ close_element: url_identifier _ ">"
    { return { kind: "HTMLExpression", element, closeElement: close_element, expressions, attributes: attributes ?? [] } }

  closing_html_expression
    = "<" _ element: url_identifier _ attributes: (@html_attributes _)? "/>"
    { return { kind: "ClosingHTMLExpression", element, attributes: attributes ?? [] } }

  html_attributes
    = h: html_attribute t: (__ @html_attribute)*
    { return [h, ...t] }

  html_attribute
    = html_constant_attribute
    / html_capture_attribute
    / html_identifier_attribute
 
  html_constant_attribute    
    = name: url_identifier "=" value: string_expression
    { return { kind: "HTMLConstantAttribute", name, value: value.value } }

  html_capture_attribute
    = name: url_identifier "=" "{" _ expression: expression _ "}"
    { return { kind: "HTMLCaptureAttribute", name, expression } }

  html_identifier_attribute
    = name: url_identifier
    { return { kind: "HTMLCaptureAttribute", name, expression: { kind: "IdentifierExpression", name } } }

  string_expression
    = "\\"" chars: [^\\"]* "\\""
    { return { kind: "StringExpression", value: chars.join('') } }

  html_string_expression
    = chars: [^<{]+
    { return { kind: "HTMLStringExpression", value: chars.join('') } }

  sql_expression
    = sql_select_expression

  sql_expression_node
    = sql_string
    / sql_capture_node
    / sql_column

  sql_select_expression
    = "select" __ columns: (h: sql_selection t: (_ "," _ @sql_selection)* { return [h, ...t] }) from: (__  @sql_from_expression)? where: (__ @sql_where_node)?
    { return { kind: "SQLSelectExpression", columns, from: from ?? undefined, where: where ?? undefined } }  

  sql_selection
    = node: sql_expression_node alias: (__ "as" __ @sql_identifier)?
    { return { kind: "SQLSelectionNode", node, alias: alias ?? undefined } }

  sql_string
    = "'" chars: [^']* "'"
    { return { kind: "SQLStringNode", value: chars.join('') } }
 
  sql_column
    = table: (@sql_identifier _ "." _)? name: sql_identifier
    { return { kind: "SQLColumnNode", table: table ?? undefined, name } }

  sql_from_expression
    = "from" __ table: sql_identifier alias: ((__ "as")? __ @sql_identifier)?
    { return { kind: "SQLFromNode", table, alias: alias ?? undefined } }

  sql_where_node
    = "where" __ col: sql_column _ "=" _ value: sql_expression_node
    { return { kind: "SQLWhereNode", col, value } }

  sql_capture_node
    = "{" _ expression: expression  _ "}"
    { return { kind: "SQLCaptureNode", expression } }

  block_expression
    = "{" _ expressions: (@expression _)*  _ "}"
    { return { kind: "BlockExpression", expressions } }

  let_expression
    = "let" __ name: identifier _ "=" _ value: expression
    { return { kind: "LetExpression", name, value } }

  escape_expression
    = "{" _ expression: expression _ "}"
    { return { kind: "EscapeExpression", expression } }
  
  identifier_expression
    = name: identifier
    { return { kind: "IdentifierExpression", name } }

  raw_go_expression
    = "__go__" [ \t]+ chars: [^\\n]* _
    { return { kind: "RawExpression", source: chars.join("") } }
`);

type NitroModule = {
  kind: "NitroModule",
  definitions: Definition[],

  nodeId?: number,
}

type Type =
  | StringType
  | PrimaryKeyType

type StringType = {
  kind: "StringType"
  nodeId?: number,
}

type PrimaryKeyType = {
  kind: "PrimaryKeyType",
  type: Type,
  nodeId?: number,
}

type Definition =
  | TableDefinition
  | HTTPDefinition
  | FunctionDefinition
  | StructDefinition

type TableDefinition = {
  kind: "TableDefinition",
  name: string,
  columns: ColumnDefinition[],
  nodeId?: number,
}

type ColumnDefinition = {
  kind: "ColumnDefinition",
  name: string,
  type: Type,
  nodeId?: number,
}

type HTTPDefinition = {
  kind: "HTTPDefinition",
  verb: HTTPVerb,
  endpoint: HTTPEndpoint,
  ret: Type,
  expression: BlockExpression,
  nodeId?: number,
}

type HTTPVerb
  = "get"
  | "put"
  | "post"
  | "patch"
  | "delete"

type HTTPEndpoint = {
  paths: HTTPPath[]
}

type HTTPPath =
  | SimpleHTTPPath
  | WildcardHTTPPath

type SimpleHTTPPath = {
  kind: "SimpleHTTPPath",
  path: string,
}

type WildcardHTTPPath = {
  kind: "WildcardHTTPPath",
  name: string,
}

type FunctionDefinition = {
  kind: "FunctionDefinition",
  name: string,
  parameters: Parameter[],
  ret: Type,
  expression: BlockExpression,
  __ret?: string,
  nodeId?: number,
}

type Parameter = {
  name: string,
  type: Type,
}

type StructDefinition = {
  kind: "StructDefinition",
  name: string,
  types: { name: string, type: Type }[],
  nodeId?: number,
}

type Expression
  = HTMLExpression
  | ClosingHTMLExpression
  | StringExpression
  | RawExpression
  | HTMLStringExpression
  | SQLSelectExpression
  | BlockExpression
  | LetExpression
  | EscapeExpression
  | IdentifierExpression

type HTMLExpression = {
  kind: "HTMLExpression",
  element: string,
  closeElement: string,
  expressions: Expression[],
  attributes: HTMLAttribute[],

  templateName?: string,
  componentName?: string,
  dataExpression?: RawExpression,

  nodeId?: number,
}

type ClosingHTMLExpression = {
  kind: "ClosingHTMLExpression",
  element: string,
  attributes: HTMLAttribute[],

  templateName?: string,
  componentName?: string,
  dataExpression?: RawExpression,

  nodeId?: number,
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

type StringExpression = {
  kind: "StringExpression",
  value: string,

  nodeId?: number,
}

type HTMLStringExpression = {
  kind: "HTMLStringExpression",
  value: string,

  nodeId?: number,
}

type RawExpression = {
  kind: "RawExpression",
  source: string,

  nodeId?: number,
}

type SQLNode =
  | SQLSelectExpression
  | SQLColumnNode
  | SQLStringNode
  | SQLSelectionNode
  | SQLFromNode
  | SQLWhereNode
  | SQLCaptureNode

type SQLExpressionNode =
  | SQLColumnNode
  | SQLStringNode
  | SQLCaptureNode

type SQLSelectExpression = {
  kind: "SQLSelectExpression",
  columns: SQLSelectionNode[],
  from?: SQLFromNode,
  where?: SQLWhereNode,

  queryName?: string,
  bindings?: Expression[],

  nodeId?: number,
}

type SQLSelectionNode = {
  kind: "SQLSelectionNode",
  node: SQLExpressionNode,
  alias?: string,

  nodeId?: number,
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

type SQLFromNode = {
  kind: "SQLFromNode",
  table: string,
  alias?: string,
}

type SQLWhereNode = {
  kind: "SQLWhereNode",
  col: SQLColumnNode,
  value: SQLStringNode,
}

type SQLCaptureNode = {
  kind: "SQLCaptureNode",
  expression: Expression,
}

type BlockExpression = {
  kind: "BlockExpression",
  expressions: Expression[],

  nodeId?: number,
}

type LetExpression = {
  kind: "LetExpression",
  name: string,
  value: Expression,

  nodeId?: number,
}

type EscapeExpression = {
  kind: "EscapeExpression",
  expression: Expression,

  variableName?: string,

  nodeId?: number,
}

type IdentifierExpression = {
  kind: "IdentifierExpression",
  name: string,

  nodeId?: number,
}

function isDefinition<K extends Definition['kind']>(kind: K) {
  return (d: Definition): d is Definition & { kind: K } => d.kind === kind;
}

function isExpression<K extends Expression['kind'][]>(...kinds: K) {
  return (e: Expression): e is Expression & { kind: K[number] } => kinds.includes(e.kind);
}

function toSchema_Type(ty: Type): string {
  switch (ty.kind) {
    case 'StringType': return `String`;
    case 'PrimaryKeyType': return `${toSchema_Type(ty.type)} @id`;
  }
}

function toSchema_Column(col: ColumnDefinition): string {
  return `${col.name} ${toSchema_Type(col.type)}`;
}

function toSchema_Table(table: TableDefinition): string {
  return `model ${table.name} {\n${table.columns.map(toSchema_Column).map(x => `\t${x}\n`).join('')}}`;
}

function toSchema(mod: NitroModule): string {
  const models = mod.definitions.filter(isDefinition('TableDefinition')).map(toSchema_Table).join('\n\n');
  return `\
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

${models}\
`;
}

function toEcho_Verb(verb: HTTPVerb): string {
  switch (verb) {
    case 'get': return 'GET';
    case 'put': return 'PUT';
    case 'post': return 'POST';
    case 'patch': return 'PATCH';
    case 'delete': return 'DELETE';
  }
}

function toEcho_Endpoint(endpoint: HTTPEndpoint): string {
  return "/" + endpoint.paths.map(toEcho_Path).join('/');
}

function toEcho_Path(path: HTTPPath): string {
  switch (path.kind) {
    case 'SimpleHTTPPath': return path.path;
    case 'WildcardHTTPPath': return `:${path.name}`;
  }
}

function toEcho_Expression(e: Expression, isRoot: boolean): string {
  const imp = (e: Expression, isRoot = false): string => {
    switch (e.kind) {
      case 'HTMLExpression':
      case 'ClosingHTMLExpression':
        if (e.templateName === undefined) panic(`while generate echo handler html expression didn't have a named template`);
        if (!isRoot) todo(`Nested HTML like nodes are not supported yet`);
        const data = e.dataExpression === undefined ? "0" : e.dataExpression.source;
        return `return c.Render(http.StatusOK, "${e.templateName}", ${data})`;
      case 'HTMLStringExpression':
        if (!isRoot) todo(`Nested HTML like nodes are not supported yet`);
        return `return c.String(http.StatusOK, "${e.value}")`;
      case 'StringExpression':
        if (isRoot) return `return c.String(http.StatusOK, "${e.value}")`;
        return `"${e.value}"`;
      case 'RawExpression':
        return e.source;
      case 'SQLSelectExpression':
        panic(`All sql select expressions should have been resolved by this point`);
      case 'BlockExpression':
        return `{ ${e.expressions.map(x => imp(x)).join('\n')} }`;
      case 'LetExpression':
        return `${e.name} := ${imp(e.value)}`;
      case 'EscapeExpression':
        todo(`TODO figure out how to what this means, toEcho_Expression::EscapeExpression`);
      case 'IdentifierExpression':
        return e.name;
    }
  }
  return imp(e, isRoot);
}

function toGo_Type(ty: Type): string {
  switch (ty.kind) {
    case 'StringType': return 'string';
    case 'PrimaryKeyType': return toGo_Type(ty.type);
  }
}

function toEcho_HTTP(http: HTTPDefinition): string {
  const pathParams = http.endpoint.paths.filter((x): x is WildcardHTTPPath => x.kind === 'WildcardHTTPPath');

  const prelude: RawExpression[] = [];
  for (const param of pathParams) {
    prelude.push({
      kind: "RawExpression",
      source: `${param.name} := ""`,
    });
  }
  if (pathParams.length > 0) {
    prelude.push({
      kind: "RawExpression",
      source: `if err := echo.PathParamsBinder(c)${pathParams.map(p => `.String("${p.name}", &${p.name})`)}.BindError(); err != nil {
        return c.String(http.StatusBadRequest, "bad request")
      }`
    });
  }

  const expressions = http.expression.expressions;

  return `\
  e.${toEcho_Verb(http.verb)}("${toEcho_Endpoint(http.endpoint)}", func(c echo.Context) error {
    ${prelude.map(x => toEcho_Expression(x, false)).join('\n')}${prelude.length > 0 ? '\n' : ''}\
    ${expressions.map(x => toEcho_Expression(x, true)).join('\n')}
  })
`;
}

function toGo_Struct(s: StructDefinition): string {
  return `\
type ${s.name} struct {
${s.types.map(x => `\t${x.name} ${toGo_Type(x.type)}\n`).join('')}\
}`;
}

// TODO FIX
// hardcoded removed parameters named children
// to support templates
function toGo_Func(f: FunctionDefinition): string {
  return `\
func ${f.name}(${f.parameters.filter(x => x.name !== 'children').map(x => `${x.name} ${toGo_Type(x.type)}`).join(',')})${f.__ret === undefined ? ` ${toGo_Type(f.ret)}` : ` ${f.__ret}`} {
${f.expression.expressions.map(x => `\t${toEcho_Expression(x, false)}\n`).join('')}${f.expression.expressions.length > 0 ? '\n' : ''}\
}
`;
}

function toEcho(mod: NitroModule): string {
  const endpoints = mod.definitions.filter(isDefinition('HTTPDefinition')).map(toEcho_HTTP).join('\n');
  const types = mod.definitions.filter(isDefinition('StructDefinition')).map(toGo_Struct).join('\n\n');
  const functions = mod.definitions.filter(isDefinition('FunctionDefinition')).filter(x => !isFunctionalComponent(x)).map(toGo_Func).join('\n');

  return `\
package main

import (
  "bytes"
	"database/sql"
	"encoding/binary"
	"math"
	"net/http"
	"os"

  "github.com/labstack/echo/v4"
  _ "github.com/lib/pq"
)

type Database struct {
	conn *sql.DB
}

/*
instruction type is instruction & 110...0 >> 30

0: copy snippet   instruction ; copy snippets[Arg] to the response
1: copy data      instruction ; copy bytes[Arg] to the response
2: exec component instruction ; pop stack -> id, stream components[id] to response ; Arg is unused
3: push component instruction ; push Arg to stack
*/
var (
	snippets            = [][]byte{}
	instructions        = []uint32{}
	components          = [][]uint32{}
	stack               = []uint32{}
	arg_mask     uint32 = math.MaxUint32 >> 2
	kind_mask    uint32 = math.MaxUint32 ^ arg_mask
)

func stream_component(c echo.Context, component_id uint32, bytes [][]byte) error {
	c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextHTMLCharsetUTF8)
	c.Response().WriteHeader(http.StatusOK)
	component := components[component_id]
	start := component[0]
	end := component[1]
	for i := start; i < end; i++ {
		ins := instructions[i]
		kind := (ins & kind_mask) >> 30
		arg := ins & arg_mask
		switch kind {
		case 0:
			c.Response().Write(snippets[arg])
		case 1:
			c.Response().Write(bytes[arg])
		case 2:
			var id uint32
			id, stack = stack[len(stack)-1], stack[:len(stack)-1]
			stream_component(c, id, bytes)
		case 3:
			stack = append(stack, arg)
		}
	}
	return nil
}

func load_components() {
	f, err := os.Open("main.tmpl.txt")
	if err != nil {
		panic(err)
	}
	defer f.Close()
	buf := new(bytes.Buffer)
	buf.ReadFrom(f)
	data := buf.Bytes()
	start := 0
	for i, b := range data {
		if b == 0 {
			snippet := make([]byte, i-start)
			copy(snippet, data[start:i])
			snippets = append(snippets, snippet)
			start = i + 1
		}
	}
	ins_file, err := os.Open("main.tmpl.ins")
	if err != nil {
		panic(err)
	}
	defer ins_file.Close()

	buf.Reset()
	buf.ReadFrom(ins_file)
	data = buf.Bytes()

	size := binary.LittleEndian.Uint32(data[0:4])
	components = make([][]uint32, size)
	var offset uint32 = 0
	for i := range size {
		start := i*4 + 4
		end := start + 4
		components[i] = make([]uint32, 2)
		len := binary.LittleEndian.Uint32(data[start:end])
		components[i][0] = offset
		components[i][1] = offset + len
		offset += len
	}

	n := uint32(len(data))
	instructions = make([]uint32, n/4-size-1)
	j := 0
	for i := (size + 1) * 4; i < n; i += 4 {
		instructions[j] = binary.LittleEndian.Uint32(data[i : i+4])
		j++
	}
}

${types}
${functions}

func main() {
  connStr := "postgresql://root:password@localhost:5432?sslmode=disable"

  e := echo.New()
  
  conn, err := sql.Open("postgres", connStr)
	if err != nil {
		panic("Could not connect to the database at " + connStr)
	}
	db := Database{conn}
  defer db.conn.Close()

  load_components()

${endpoints}
  e.Logger.Fatal(e.Start(":4000"))
}
`;
}

function panic(msg: string): never {
  throw new Error(msg);
}

function todo(msg: string): never {
  throw new Error(msg);
}

function prefix(s: string) {
  return (x: string): string => s + x;
}

function parse(source: string): NitroModule {
  return parser.parse(source);
}

function _functionalComponentExpressions(d: FunctionDefinition): (HTMLExpression | ClosingHTMLExpression)[] {
  return d.expression.expressions.filter(isExpression('HTMLExpression', 'ClosingHTMLExpression'));
}

function isFunctionalComponent(d: FunctionDefinition) {
  return _functionalComponentExpressions(d).length !== 0;
}

let sqlQueryNameCount = 0;

function nextSQLQueryName() {
  return `SQ${sqlQueryNameCount++}`;
}

function nameSQLQueries_Expression<E extends Expression>(e: E): E {
  switch (e.kind) {
    case 'ClosingHTMLExpression':
    case 'StringExpression':
    case 'RawExpression':
    case 'HTMLStringExpression':
    case 'IdentifierExpression':
      return e;
    case 'LetExpression':
      return { ...e, value: nameSQLQueries_Expression(e.value) };
    case 'EscapeExpression':
      return { ...e, expression: nameSQLQueries_Expression(e.expression) };
    case 'HTMLExpression':
    case 'BlockExpression':
      return { ...e, expressions: e.expressions.map(nameSQLQueries_Expression) };
    case 'SQLSelectExpression':
      return { ...e, queryName: nextSQLQueryName(), bindings: [] };
  }
}

function nameSQLQueries_Definition(d: Definition): Definition {
  switch (d.kind) {
    case 'TableDefinition':
    case 'StructDefinition':
      return d;
    case 'FunctionDefinition':
    case 'HTTPDefinition':
      return { ...d, expression: nameSQLQueries_Expression(d.expression) };
  }
}

function nameSQLQueries(mod: NitroModule): NitroModule {
  return {
    ...mod,
    definitions: mod.definitions.map(nameSQLQueries_Definition),
  };
}

type SQLQuery = {
  queryName: string,
  queryStructName: string,
  queryFunctionName: string,
  columns: SQLColumn[],
  query: string, // the underlying parameterized sql query
  bindings: string[],
}

type SQLColumn = {
  name: string,
  type: Type,
}

function emptyUnlessDefined<T>(x: T | undefined, f: (x: T) => string): string {
  return x === undefined ? "" : f(x);
}

function quote(x: string): string {
  return `"${x}"`;
}

function toSQL(s: SQLNode): [string, string[]] {
  const bindings: string[] = [];
  const imp = (s: SQLNode): string => {
    switch (s.kind) {
      case 'SQLSelectExpression': return `select ${s.columns.map(imp).join(', ')}${emptyUnlessDefined(s.from, imp)}${emptyUnlessDefined(s.where, imp)}`;
      case 'SQLSelectionNode': return `${imp(s.node)}${emptyUnlessDefined(s.alias, x => ` as ${quote(x)}`)}`;
      case 'SQLFromNode': return `from ${quote(s.table)}${emptyUnlessDefined(s.alias, pipe(prefix(" "), quote))}`;
      case 'SQLColumnNode': return `${emptyUnlessDefined(s.table, quote)}${quote(s.name)}`;
      case 'SQLStringNode': return `'${s.value}'`;
      case 'SQLWhereNode': return `where ${imp(s.col)} = ${imp(s.value)}`;
      case 'SQLCaptureNode': {
        const source = toGo_Expression(s.expression);
        bindings.push(source);
        return `$${bindings.length}`;
      }
    }
  }
  const res = imp(s);
  return [res, bindings]
}

function sqlColumnName(s: SQLSelectionNode, idx: number): string {
  if (s.alias !== undefined) return s.alias;
  switch (s.node.kind) {
    case 'SQLColumnNode': return s.node.name;
    case 'SQLStringNode': return `column${idx}`; // todo look how postgres handles simple expressions
    case 'SQLCaptureNode': panic(`Cannot have captures in column positions`);
  }
}

function makeSQLQuery_Select(e: SQLSelectExpression): SQLQuery {
  if (e.queryName === undefined) panic(`extractSQLQueries_Expression::SQLSelectExpression does not have queryName set`);

  const queryName = e.queryName;
  const queryFunctionName = `Query${queryName}`;
  const queryStructName = `${queryName}Cols`;

  const [query, bindings] = toSQL(e);

  return {
    queryName,
    queryFunctionName,
    queryStructName,
    columns: e.columns.map((x, i) => ({ name: sqlColumnName(x, i), type: { kind: "StringType" } })), // todo string type needs to be inferred from sql logic + table definitions!!
    query,
    bindings,
  };
}


function extractSQLQueries_Expression(e: Expression): SQLQuery[] {
  switch (e.kind) {
    case 'ClosingHTMLExpression':
    case 'StringExpression':
    case 'RawExpression':
    case 'HTMLStringExpression':
    case 'IdentifierExpression':
      return [];
    case 'BlockExpression':
    case 'HTMLExpression':
      return e.expressions.flatMap(extractSQLQueries_Expression);
    case 'EscapeExpression':
      return extractSQLQueries_Expression(e.expression);
    case 'LetExpression':
      return extractSQLQueries_Expression(e.value);
    case 'SQLSelectExpression':
      return [makeSQLQuery_Select(e)];
  }
}

function extractSQLQueries_Definition(d: Definition): SQLQuery[] {
  switch (d.kind) {
    case 'TableDefinition':
    case 'StructDefinition':
      return [];
    case 'HTTPDefinition':
    case 'FunctionDefinition':
      return extractSQLQueries_Expression(d.expression);
  }
}

function extractSQLQueries(mod: NitroModule): SQLQuery[] {
  return mod.definitions.flatMap(extractSQLQueries_Definition);
}

function addSQLQueries_Expression<E extends Expression>(e: E, queries: SQLQuery[]): E {
  const imp = <E extends Expression>(e: E): E => {
    switch (e.kind) {
      case 'ClosingHTMLExpression':
      case 'StringExpression':
      case 'RawExpression':
      case 'HTMLStringExpression':
      case 'IdentifierExpression':
        return e;
      case 'SQLSelectExpression': {
        const query = queries.find(q => e.queryName === q.queryName);
        if (query === undefined) panic(`addSQLQueries_Expression::SQLSelectExpression select expression did not have a query name assigned to it`);
        if (e.queryName === undefined || e.bindings === undefined) panic(`addSQLQueries_Expression::SQLSelectExpression queryName or bindings was not set`);
        return { kind: "RawExpression", source: `db.Query${query.queryName}(${query.bindings.join(',')})` } as any;
      }
      case 'HTMLExpression':
      case 'BlockExpression':
        return { ...e, expressions: e.expressions.map(imp) };
      case 'LetExpression':
        return { ...e, value: imp(e.value) };
      case 'EscapeExpression':
        return { ...e, expression: imp(e.expression) };
    }
  }
  return imp(e);
}

function addSQLQueries_Definition(d: Definition, queries: SQLQuery[]): Definition {
  switch (d.kind) {
    case 'TableDefinition':
    case 'StructDefinition':
      return d;
    case 'HTTPDefinition':
    case 'FunctionDefinition':
      return { ...d, expression: addSQLQueries_Expression(d.expression, queries) };
  }
}

function makeSQLQueryStruct(q: SQLQuery): StructDefinition {
  return {
    kind: "StructDefinition",
    name: q.queryStructName,
    types: q.columns.map(x => ({
      name: x.name,
      type: x.type
    })),
  };
}

function makeSQLQueryFunction(q: SQLQuery): FunctionDefinition {
  return {
    kind: "FunctionDefinition",
    name: `(db *Database) ${q.queryFunctionName}`,
    ret: { kind: "StringType" },
    parameters: q.bindings.map(x => ({ name: x, type: { kind: "StringType" } })), // TODO figure out how to make this better it is kinda hardcoded
    __ret: `[]${q.queryStructName}`,
    expression: {
      kind: "BlockExpression",
      expressions: [{
        kind: "RawExpression",
        source: `\
  var obj ${q.queryStructName}
  var objects []${q.queryStructName}

  rows, err := db.conn.Query(\`${q.query}\`, ${q.bindings.join(',')})
  if err != nil {
    panic("bad query: " + err.Error())
  }
  defer rows.Close()
  
  for rows.Next() {
    rows.Scan(${q.columns.map(c => `&obj.${c.name}`)})
    objects = append(objects, obj)
  }
  
  return objects
`
      }]
    }
  }
}

function addSQLQueries(mod: NitroModule): NitroModule {
  const next = nameSQLQueries(mod);
  const queries = extractSQLQueries(next);

  const newTypeDefs = queries.map(makeSQLQueryStruct);
  const newFunctionDefs = queries.map(makeSQLQueryFunction);

  return {
    ...next,
    definitions: [...newTypeDefs, ...newFunctionDefs, ...next.definitions.map(x => addSQLQueries_Definition(x, queries))],
  };
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

let nodeIdCount = 0;

function nextNodeId() {
  return nodeIdCount++;
}

function identify_Expression<E extends Expression>(e: E): E {
  switch (e.kind) {
    case 'HTMLExpression':
    case 'BlockExpression':
      return { ...e, nodeId: nextNodeId(), expressions: e.expressions.flatMap(identify_Expression) };
    case 'LetExpression':
      return { ...e, nodeId: nextNodeId(), value: identify_Expression(e.value) };
    case 'EscapeExpression':
      return { ...e, nodeId: nextNodeId(), expression: identify_Expression(e.expression) };
    case 'ClosingHTMLExpression':
    case 'StringExpression':
    case 'RawExpression':
    case 'HTMLStringExpression':
    case 'SQLSelectExpression':
    case 'IdentifierExpression':
      return { ...e, nodeId: nextNodeId() };
  }
}

function identify_Definition(d: Definition): Definition {
  switch (d.kind) {
    case 'TableDefinition':
    case 'StructDefinition':
      return { ...d, nodeId: nextNodeId() };
    case 'HTTPDefinition':
    case 'FunctionDefinition':
      return { ...d, nodeId: nextNodeId(), expression: identify_Expression(d.expression) };
  }
}

function identify(mod: NitroModule): NitroModule {
  return {
    ...mod,
    definitions: mod.definitions.map(identify_Definition),
    nodeId: nextNodeId(),
  }
}

type Template = {
  // the ast node which generated this template
  originId: number,
  ctx: string,
  snippets: string[],
  // using local offsets relative to a template object
  instructions: TemplateInstruction[],
}

type TemplateInstruction
  = CopySnippetInstruction
  | CopyDataInstruction
  | ExecuteComponentInstruction
  | PushComponentInstruction

type CopySnippetInstruction = {
  kind: "CopySnippetInstruction",
  snippet: number,
}

type CopyDataInstruction = {
  kind: "CopyDataInstruction",
  offset: number,
}

type ExecuteComponentInstruction = {
  kind: "ExecuteComponentInstruction",
}

type PushComponentInstruction = {
  kind: "PushComponentInstruction",
  componentName: string,
}

function emptyTemplate(originId: number, ctx: string): Template {
  return { originId, instructions: [], snippets: [], ctx, };
}

function templateInstructionSize(t: Template): { snippet: number, data: number } {
  let s = 0;
  let d = 0;
  for (const ins of t.instructions) {
    switch (ins.kind) {
      case 'CopySnippetInstruction': s++; break;
      case 'CopyDataInstruction': d++; break;
    }
  }
  return {
    snippet: s,
    data: d,
  };
}

// TODO THIS A HACK
function isSameTemplate(t: Template): boolean {
  return !t.ctx.startsWith('_c');
}

function flattenToSameTemplate(templates: Template[], originId: number, ctx: string): [Template, Template[]] {
  const others: Template[] = [];
  const t = emptyTemplate(originId, ctx);

  let offset = { snippet: 0, data: 0 };
  for (const template of templates) {
    if (isSameTemplate(template)) {
      const size = templateInstructionSize(template);
      const shifted = shiftTemplate(template, offset);
      offset.data += size.data;
      offset.snippet += size.snippet;
      t.instructions.push(...shifted.instructions);
      t.snippets.push(...shifted.snippets);
    }
    else {
      others.push(template);
    }
  }
  return [t, others];
}

function shiftTemplate_Instruction(i: TemplateInstruction, offset: { snippet: number, data: number }): TemplateInstruction {
  switch (i.kind) {
    case 'CopySnippetInstruction': return { ...i, snippet: i.snippet + offset.snippet };
    case 'CopyDataInstruction': return { ...i, offset: i.offset + offset.data };
    case 'PushComponentInstruction': return i;
    case 'ExecuteComponentInstruction': return i;
  }
}

function shiftTemplate(t: Template, offset: { snippet: number, data: number }): Template {
  return {
    ...t,
    instructions: t.instructions.map(x => shiftTemplate_Instruction(x, offset)),
  }
}

const htmlElements = new Set(['html', 'head', 'body', 'div', 'title', 'script', 'h1', 'h2', 'button']);

function isHTMLElement(x: string) {
  return htmlElements.has(x);
}

let componentNameCount = 0;

function nextComponentName() {
  return `_c${componentNameCount++}`;
}

function extractTemplates_Expression(e: Expression, ctx: string): Template[] {
  const imp = (e: Expression): Template[] => {
    switch (e.kind) {
      case 'HTMLExpression': {
        if (e.nodeId === undefined) panic(`extractTemplates_Expression::HTMLExpression node id was not set for expression`);
        const isHTML = isHTMLElement(e.element);
        const nested = e.expressions.flatMap(imp);
        const [flattened, others] = flattenToSameTemplate(nested, e.nodeId, ctx);

        if (isHTML) {
          const shifted = shiftTemplate(flattened, { snippet: 2 + e.attributes.length, data: 0 });
          const prefix = `${e.element !== 'html' ? "" : "<!doctype html>"}<${e.element}`;
          const attributeSnippets = e.attributes.flatMap(x => {
            switch (x.kind) {
              case 'HTMLCaptureAttribute': return ` ${x.name}=`;
              case 'HTMLConstantAttribute': return ` ${x.name}="${x.value}"`
            }
          });
          const prefix2 = '>';
          const suffix = `</${e.closeElement}>`;

          const pi: TemplateInstruction = { kind: "CopySnippetInstruction", snippet: 0 };
          const pi2: TemplateInstruction = { kind: "CopySnippetInstruction", snippet: attributeSnippets.length + 1 };
          let j = 0;
          const ais = e.attributes.map((x, i): TemplateInstruction => {
            switch (x.kind) {
              case 'HTMLConstantAttribute': return { kind: "CopySnippetInstruction", snippet: i + 1 };
              case 'HTMLCaptureAttribute': return { kind: "CopyDataInstruction", offset: j++ };
            }
          });
          const si: TemplateInstruction = { kind: "CopySnippetInstruction", snippet: attributeSnippets.length + 2 + shifted.snippets.length };

          return [{ originId: e.nodeId, snippets: [prefix, ...attributeSnippets, prefix2, ...shifted.snippets, suffix], instructions: [pi, ...ais, pi2, ...shifted.instructions, si], ctx }, ...others];
        }
        else {
          if (flattened.instructions.length === 0) {
            return [{
              originId: e.nodeId, instructions: [
                { kind: "PushComponentInstruction", componentName: e.element },
                { kind: "ExecuteComponentInstruction" },
              ], snippets: [], ctx
            }, ...others];
          }
          else {
            const childName = nextComponentName();
            return [{
              originId: e.nodeId, instructions: [
                { kind: "PushComponentInstruction", componentName: childName },
                { kind: "PushComponentInstruction", componentName: e.element },
                { kind: "ExecuteComponentInstruction" },
              ], snippets: [], ctx
            }, { originId: e.nodeId, ctx: childName, instructions: flattened.instructions, snippets: flattened.snippets }, ...others];
          }
        }
      }
      case 'ClosingHTMLExpression': {
        if (e.nodeId === undefined) panic(`extractTemplates_Expression::ClosingHTMLExpression node id was not set for expression`);
        if (isHTMLElement(e.element)) {
          const prefix = `<${e.element}`;
          const attributeSnippets = e.attributes.flatMap(x => {
            switch (x.kind) {
              case 'HTMLCaptureAttribute': return ` ${x.name}=`;
              case 'HTMLConstantAttribute': return ` ${x.name}="${x.value}"`
            }
          });
          const suffix = ` />`;

          const pi: TemplateInstruction = { kind: "CopySnippetInstruction", snippet: 0 };
          let j = 0;
          const ais = e.attributes.map((x, i): TemplateInstruction => {
            switch (x.kind) {
              case 'HTMLConstantAttribute': return { kind: "CopySnippetInstruction", snippet: i + 1 };
              case 'HTMLCaptureAttribute': return { kind: "CopyDataInstruction", offset: j++ };
            }
          });
          const si: TemplateInstruction = { kind: "CopySnippetInstruction", snippet: 1 + attributeSnippets.length };

          return [{ originId: e.nodeId, snippets: [prefix, ...attributeSnippets, suffix], instructions: [pi, ...ais, si], ctx }];
        }
        else {
          return [{
            originId: e.nodeId, instructions: [
              { kind: "PushComponentInstruction", componentName: e.element },
              { kind: "ExecuteComponentInstruction" }
            ], snippets: [], ctx
          }];
        }
      }
      case 'HTMLStringExpression': {
        if (e.nodeId === undefined) panic(`extractTemplates_Expression::HTMLStringExpression node id was not set for expression`);
        const snippet = `${e.value}`;
        const ins: TemplateInstruction = { kind: "CopySnippetInstruction", snippet: 0 };
        return [{ originId: e.nodeId, snippets: [snippet], instructions: [ins], ctx }];
      }
      case 'EscapeExpression': {
        if (e.nodeId === undefined) panic(`extractTemplates_Expression::EscapeExpression node id was not set for expression`);
        // TODO
        // hardcode children case for now
        // should leverage the type system
        // to determine if we should add a 
        // data or component instruction
        // for now just checking expression is an identifier and name is children

        if (e.expression.kind === 'IdentifierExpression' && e.expression.name === 'children') {
          return [{ originId: e.nodeId, snippets: [], instructions: [{ kind: "ExecuteComponentInstruction" }], ctx }];
        }

        return [{ originId: e.nodeId, snippets: [], instructions: [{ kind: "CopyDataInstruction", offset: 0 }], ctx }];
      }
      case 'StringExpression':
      case 'RawExpression':
      case 'SQLSelectExpression':
      case 'IdentifierExpression':
        return [];
      case 'BlockExpression':
        return e.expressions.flatMap(imp);
      case 'LetExpression':
        return imp(e.value);
    }
  };
  return imp(e);
}

function extractTemplates_Definition(d: Definition): Template[] {
  switch (d.kind) {
    case 'TableDefinition':
    case 'StructDefinition':
      return [];
    case 'HTTPDefinition':
      return extractTemplates_Expression(d.expression, 'http');
    case 'FunctionDefinition':
      return extractTemplates_Expression(d.expression, d.name);
  }
}

function extractTemplates(mod: NitroModule): Template[] {
  return mod.definitions.flatMap(extractTemplates_Definition);
}

function assert<T>(x: T | undefined, msg?: string): asserts x is T {
  if (x === undefined) panic(msg ?? ``);
}

function toComponent_Expression(e: Expression): string {
  switch (e.kind) {
    case 'HTMLExpression':
    case 'BlockExpression':
      return e.expressions.map(toComponent_Expression).join('\n');
    case 'ClosingHTMLExpression':
      return ``;
    case 'StringExpression':
      return quote(e.value);
    case 'RawExpression':
      return e.source;
    case 'HTMLStringExpression':
      return ``;
    case 'SQLSelectExpression':
      return ''; //todo
    case 'LetExpression':
      return `${e.name} := ${toComponent_Expression(e.value)}`;
    case 'IdentifierExpression':
      return e.name;
    case 'EscapeExpression':
      // TODO FIX HARDCODE
      // do not add any html typed variables to "ret"
      // for now just remove children

      if (e.expression.kind === 'IdentifierExpression' && e.expression.name === 'children') return '';

      return `ret = append(ret, []byte(${toComponent_Expression(e.expression)}))`;
  }
}

function toComponent(e: Expression[]): string {
  return `\
ret := [][]byte{}
${e.map(toComponent_Expression).join('')}
return ret;
`;
}

function toGo_Expression(e: Expression): string {
  switch (e.kind) {
    case 'HTMLExpression':
    case 'ClosingHTMLExpression':
    case 'HTMLStringExpression':
      todo(`Cannot convert html like expressions to go yet`);
    case 'SQLSelectExpression':
      todo(`Cannot convert sql like expressions to go yet`);
    case 'StringExpression':
      return `"${e.value}"`;
    case 'RawExpression':
      return e.source;
    case 'BlockExpression':
      return `{ ${e.expressions.map(toGo_Expression).join('\n')} }`;
    case 'LetExpression':
      return `${e.name} := ${toGo_Expression(e.value)}`;
    case 'EscapeExpression':
      todo(`Cannot convert escape expression to go yet`);
    case 'IdentifierExpression':
      return e.name;
  }
}

function toAttributeString(a: HTMLAttribute[]): string {
  return a.map((x): string => {
    switch (x.kind) {
      case 'HTMLConstantAttribute': return `"${x.value}"`;
      case 'HTMLCaptureAttribute': return `${toGo_Expression(x.expression)}`;
    }
  }).join(',');
}

function rewriteToTemplateMachine_Expression<E extends Expression>(e: E, templates: Template[]): E {
  switch (e.kind) {
    case 'HTMLExpression': {
      assert(e.nodeId);
      const templateIdx = templates.findIndex(x => x.originId === e.nodeId);
      const template = templates[templateIdx];
      assert(template, `rewriteToTemplateMachine_Expression::HTMLExpression {${e.nodeId}} did not have a template generated for it`);

      if (template.ctx !== 'http') {
        return { kind: "RawExpression", nodeId: e.nodeId, source: toComponent(e.expressions) } as any;
      }

      // this may be a hack idk?
      const childrenCaptures = e.expressions.filter(isExpression('EscapeExpression'));

      return {
        kind: "RawExpression",
        nodeId: e.nodeId,
        source: `data := [][]byte{}; ${isHTMLElement(e.element) ? "" : `data = append(data, ${e.element}(${toAttributeString(e.attributes)})...); `}${childrenCaptures.length === 0 ? "" : childrenCaptures.map(x => `data = append(data, []byte(${toGo_Expression(x.expression)}));`).join('')}return stream_component(c, ${templateIdx}, data)`
      } as any as E;
    }
    case 'ClosingHTMLExpression': {
      assert(e.nodeId);
      const templateIdx = templates.findIndex(x => x.originId === e.nodeId);
      const template = templates[templateIdx];
      assert(template, `rewriteToTemplateMachine_Expression::ClosingHTMLExpression {${e.nodeId}} did not have a template generated for it`);

      if (template.ctx !== 'http') {
        return { kind: "RawExpression", nodeId: e.nodeId, source: `return []byte{}` } as any;
      }

      return {
        kind: "RawExpression",
        nodeId: e.nodeId,
        source: `data := [][]byte{}; ${isHTMLElement(e.element) ? "" : `data = append(data, ${e.element}(${toAttributeString(e.attributes)})...); `}return stream_component(c, ${templateIdx}, data)`
      } as any as E;
    }
    case 'HTMLStringExpression':
      panic(`rewriteToTemplateMachine_Expression::HTMLStringExpression should never happen since it should be wrapped by a html element`);
    case 'StringExpression':
    case 'RawExpression':
    case 'SQLSelectExpression':
    case 'IdentifierExpression':
      return e;
    case 'BlockExpression':
      return { ...e, expressions: e.expressions.map(x => rewriteToTemplateMachine_Expression(x, templates)) };
    case 'LetExpression':
      return { ...e, value: rewriteToTemplateMachine_Expression(e.value, templates) };
    case 'EscapeExpression':
      todo(`rewriteToTemplateMachine_Expression::EscapeExpression`);
  }
}

function rewriteToTemplateMachine_Definition(d: Definition, templates: Template[]): Definition {
  switch (d.kind) {
    case 'TableDefinition':
    case 'StructDefinition':
      return d;
    case 'HTTPDefinition':
      return { ...d, expression: rewriteToTemplateMachine_Expression(d.expression, templates) };
    case 'FunctionDefinition':
      return { ...d, expression: rewriteToTemplateMachine_Expression(d.expression, templates), __ret: isFunctionalComponent(d) ? '[][]byte' : undefined };
  }
}

function rewriteToTemplateMachine(mod: NitroModule): [NitroModule, Template[]] {
  const templates = extractTemplates(mod);

  return [{
    ...mod,
    definitions: mod.definitions.map(x => rewriteToTemplateMachine_Definition(x, templates)),
  }, templates];
}

function toTemplateText(compiledTemplate: CompiledTemplate): string {
  let text = '';
  for (const snippet of compiledTemplate.snippets) {
    text += snippet + '\0';
  }
  return text;
}

function toTemplateInstructions(compiledTemplate: CompiledTemplate): Buffer {
  const buffer = Buffer.alloc((compiledTemplate.instructions.length + compiledTemplate.components.length + 1) * 4);
  let off = 0;
  off = buffer.writeUInt32LE(compiledTemplate.components.length, off);
  for (const t of compiledTemplate.components) {
    off = buffer.writeUInt32LE(t, off);
  }
  const highTag = 1 << 31 >>> 0;
  const lowTag = 1 << 30 >>> 0;
  for (const ins of compiledTemplate.instructions) {
    off = ((): number => {
      switch (ins.kind) {
        case 'CompiledCopySnippetInstruction': return buffer.writeUInt32LE(ins.snippet, off);
        case 'CompiledCopyDataInstruction': return buffer.writeUInt32LE((lowTag | ins.offset) >>> 0, off);
        case 'CompiledExecuteComponentInstruction': return buffer.writeUInt32LE(highTag, off);
        case 'CompiledPushComponentInstruction': return buffer.writeUInt32LE((highTag | lowTag | ins.component) >>> 0, off);
      }
    })();
  }
  return buffer;
}

function toTemplateJson(compiledTemplate: CompiledTemplate): string {
  return JSON.stringify(compiledTemplate, undefined, 2);
}

type CompiledTemplate = {
  snippets: string[],
  instructions: CompiledTemplateInstruction[],
  components: number[],
}

type CompiledTemplateInstruction
  = CompiledCopySnippetInstruction
  | CompiledCopyDataInstruction
  | CompiledExecuteComponentInstruction
  | CompiledPushComponentInstruction

type CompiledCopySnippetInstruction = {
  kind: "CompiledCopySnippetInstruction",
  snippet: number,
}

type CompiledCopyDataInstruction = {
  kind: "CompiledCopyDataInstruction",
  offset: number,
}

type CompiledExecuteComponentInstruction = {
  kind: "CompiledExecuteComponentInstruction",
}

type CompiledPushComponentInstruction = {
  kind: "CompiledPushComponentInstruction",
  component: number,
}

function resolveComponentIdx(templates: Template[], name: string): number {
  const idx = templates.findIndex(x => x.ctx === name);
  if (idx === -1) panic(`Could not resolve component template ${name}`);
  return idx;
}

function carefulTrim(s: string): string {
  const needsPrefixSpace = s.length >= 2 && s[0] === ' ' && s[1] !== ' ';
  const t = s.trim();
  return needsPrefixSpace ? ` ${t}` : t;
}

function compileTemplates(templates: Template[]): CompiledTemplate {
  const snippets: string[] = [];
  const instructions: CompiledTemplateInstruction[] = [];
  const components: number[] = [];
  let childrenCount = 0;

  for (const [i, template] of templates.entries()) {
    let lastInsKind: TemplateInstruction['kind'] | undefined = undefined;
    let insCount = 0;
    let relSnipOff = 0;
    for (const ins of template.instructions) {
      if (lastInsKind && lastInsKind === 'CopySnippetInstruction' && ins.kind === 'CopySnippetInstruction') {
        snippets[snippets.length - 1] += carefulTrim(template.snippets[ins.snippet]);
        relSnipOff = relSnipOff === 0 ? 2 : relSnipOff + 1;
      }
      else {
        ((): true => {
          switch (ins.kind) {
            case 'CopySnippetInstruction':
              instructions.push({ kind: "CompiledCopySnippetInstruction", snippet: ins.snippet + snippets.length - relSnipOff });
              insCount++;
              snippets.push(carefulTrim(template.snippets[ins.snippet]));
              return true;
            case 'CopyDataInstruction':
              instructions.push({ kind: "CompiledCopyDataInstruction", offset: ins.offset });
              insCount++;
              return true;
            case 'PushComponentInstruction':
              instructions.push({
                kind: "CompiledPushComponentInstruction", component: (() => {
                  if (ins.componentName === 'CHILDREN') {
                    return i + ++childrenCount;
                  }
                  else {
                    return resolveComponentIdx(templates, ins.componentName);
                  }
                })()
              });
              insCount++;
              return true;
            case 'ExecuteComponentInstruction':
              instructions.push({ kind: "CompiledExecuteComponentInstruction" });
              insCount++;
              return true;
          }
        })();
      }
      lastInsKind = ins.kind;
    }
    components.push(insCount);
  }

  return {
    snippets,
    components,
    instructions,
  };
}

function spinLock(n = 5000000) {
  for (let i = 0; i < n; i++) { }
}

function postLog<T>(prefix: string, f: (x: T) => T): (x: T) => T {
  return x => {
    const next = f(x);
    writeFileSync(`${prefix}${Date.now().toString().slice(-5)}_${f.name}.json`, JSON.stringify(next, undefined, 2));
    spinLock();
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
  let templates: Template[] = [];
  const parseAst = () => parse(fileContent);
  const rewriteComponentsToTemplates = (mod: NitroModule) => { const [next, t] = rewriteToTemplateMachine(mod); templates = t; return next };
  const ast = pipe(
    postLog(prefix, parseAst),
    postLog(prefix, identify),
    postLog(prefix, rewriteComponentsToTemplates),
    postLog(prefix, addSQLQueries),
  )({ kind: "NitroModule", definitions: [] });

  await writeFile("out/main.tmpls.json", JSON.stringify(templates, undefined, 2));
  const compiledTemplate = compileTemplates(templates);
  await writeFile("out/main.tmpl.json", toTemplateJson(compiledTemplate));

  await writeFile("out/schema.prisma", toSchema(ast));
  await writeFile("out/main.tmpl.txt", toTemplateText(compiledTemplate));
  await writeFile("out/main.tmpl.ins", toTemplateInstructions(compiledTemplate));
  await writeFile("out/main.go", toEcho(ast));
  await writeFile("out/go.mod", goMod());
  await writeFile("out/go.sum", goSum());

  const server = spawn("go", ["run", "."], { cwd: "out", stdio: "pipe" });
  server.stdout.pipe(process.stdout);
  server.stderr.pipe(process.stderr);
}

main(process.argv.slice(2)).catch(e => {
  console.error(e);
});

