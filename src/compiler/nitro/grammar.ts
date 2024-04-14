import { generate } from "peggy";
import { UntypedNitroModule } from "./untyped-ast";

const parser = generate(`
  start
    = _ definitions: (@definition _)*
    { return { kind: 'UntypedNitroModule', definitions } }

  _  = [ \\t\\r\\n]*
  __ = [ \\t\\r\\n]+

  identifier 
    = chars: ([a-zA-Z_][a-zA-Z0-9_]*)
    { return chars[0] + chars[1].join('') }

  html_identifier
    = chars: ([a-zA-Z_][a-zA-Z0-9_-]*)
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
    / integer_type
    / boolean_type
    / html_type
    / identifier_type

  string_type
    = "str"
    { return { kind: "StringType" } }

  boolean_type
    = "bool"
    { return { kind: "BooleanType" } }

  integer_type
    = "i32"
    { return { kind: "IntegerType" } }

  html_type
    = "html"
    { return { kind: "HTMLType" } }

  identifier_type
    = name: identifier
    { return { kind: "IdentifierType", name } }

  definition
    = export_definition
    / exportable_definition

  exportable_definition
    = function_definition
    / http_definition
    / declare_definition
    / struct_definition
    / table_definition
    / raw_go_import_definition
    / raw_go_definition
    / import_definition

  export_definition
    = "export" __ definition: exportable_definition
    { return { kind: "UntypedExportDefinition", definition } }

  import_definition
    = "import" __ path: import_path modifier: ((__ "as" __ name: identifier { return { kind: "ImportAlias", name } }) / (__ "using" __ h: import_item t: (_ "," _ @import_item)* { return { kind: "ImportSelection", selections: [h, ...t] }}))?
    { return { kind: "UntypedImportDefinition", path, modifier: modifier ?? undefined } }

  import_path
    = h: identifier t: (_ "." _ @identifier)*
    { return [h, ...t] }

  import_item
    = name: identifier alias: (__ "as" __ @identifier)?
    { return { name, alias: alias ?? undefined } }

  raw_go_definition
    = "#go" _ source: (c: [^#]* { return c.join('') }) _ "#end"
    { return { kind: "UntypedRawGoSourceDefinition", source } }

  raw_go_import_definition
    = "#go_import" _ source: (c: [^#]* { return c.join('') }) _ "#end"
    { return { kind: "UntypedRawGoSourceImportDefinition", source } }

  struct_definition
    = "struct" __ name: identifier _ "{" _ properties: (h: struct_property t: (_ "," _ @struct_property)* (_ ",")? { return [h, ...t] })? _ "}"
    { return { kind: "UntypedStructDefinition", name, properties: properties ?? [] } }

  struct_property
    = name: identifier _ ":" _ type: type
    { return { name, type } }

  table_definition
    = "table" __ name: identifier _ "=" _ type: type
    { return { kind: "UntypedTableDefinition", name, type } }

  declare_definition
    = "declare" __ definition: exportable_definition
    { return { kind: "UntypedDeclareDefinition", definition } }

  function_definition
    = "func" __ name: identifier _ "(" _  parameters: (h: parameter t: (_ "," _ @parameter)* (_ ",")? _ { return [h, ...t] })? ")" _ ":" _ ret: type _ expression: block_expression
    { return { kind: "UntypedFunctionDefinition", name, parameters: parameters ?? [], expression, returnType: ret } }

  http_definition
    = verb: http_verb __ endpoint: http_endpoint _ "(" _ parameters: (h: parameter (_ ",")? _ { return [h] })? ")" _ expression: block_expression
    { return { kind: "UntypedHTTPDefinition", verb, endpoint, parameters: parameters ?? [], expression } }

  http_verb
    = "get" / "put" / "post" / "patch" / "delete"

  http_endpoint
    = "/" paths: (@http_path "/")* last: (@http_path "/"?)?
    { return last === null ? paths : [...paths, last] }

  http_path
    = http_constant_path
    / http_variable_path
  
  http_constant_path
    = value: url_identifier
    { return { kind: "HTTPConstantPath", value } }

  http_variable_path
    = "\${" _ name: identifier _ "}"
    { return { kind: "HTTPVariablePath", name } }

  parameter
    = name: identifier _ ":" _ type: type
    { return { name, type } }

  expression
    = let_expression

  let_expression
    = tail: ("let" __ name: identifier _ "=" _ { return { kind: "UntypedLetExpression", name } })* expression: block_expression
    { return tail.reduceRight((t, h) => ({ ...h, expression: t }), expression) }

  block_expression
    = "{" expressions: (_ @expression)* _ "}"
    { return { kind: "UntypedBlockExpression", expressions } }
    / postfix_expression
  
  postfix_expression
    = head: literal tail:(
      (_ "." _ name: identifier { return { kind: 'UntypedDotExpression', name }})
      / (_ "(" _ args: (h: expression t: (_ "," _ @expression)* (_ ",")? _ { return [h, ...t] })? ")" { return { kind: 'UntypedCallExpression', args: args ?? [] }})
    )*
      { return tail.reduce((t, h) => ({ ...h, left: t }), head) }

  literal
    = string_expression
    / integer_expression
    / html_block_expression
    / html_expression
    / sql_select_expression
    / sql_insert_expression
    / sql_delete_expression
    / for_expression
    / identifier_expression
    
  sub_html_expression
    = html_block_expression
    / html_expression
    / capture_expression
    / string_expression
    / html_text_expression

  sql_select_expression
    = "select" __ columns: (h: sql_column_expression t: (_ "," _ @sql_column_expression)* { return [h, ...t] }) from: (__ "from" __ @sql_from_expression)? where: (__ @sql_where_expression)?
    { return { kind: "UntypedSQLSelectExpression", columns, from: from ?? undefined, where: where ?? undefined } }

  sql_insert_expression
    = "insert" __ "into" __ table: sql_from_expression _ columns: sql_pack_expression __ "values" __ values: (h: sql_pack_expression q: (_ "," _ @sql_pack_expression)* { return [h, ...q] })
    { return { kind: "UntypedSQLInsertExpression", table, columns, values } }

  sql_delete_expression
    = "delete" __ "from" __ table: sql_from_expression where: (__ @sql_where_expression)?
    { return { kind: "UntypedSQLDeleteExpression", table, where: where ?? undefined } }

  sql_where_expression
    = "where" __ cond: sql_expression
    { return { kind: "UntypedSQLWhereExpression", cond } }

  sql_or_expression
    = head: sql_and_expression tail:(
      (_ op: "or" _ right: sql_and_expression { return { kind: 'UntypedSQLInfixExpression', op, right }})
    )*
      { return tail.reduce((t, h) => ({ ...h, left: t }), head) }

  sql_and_expression
    = head: sql_cmp_expression tail:(
      (_ op: "and" _ right: sql_cmp_expression { return { kind: 'UntypedSQLInfixExpression', op, right }})
    )*
      { return tail.reduce((t, h) => ({ ...h, left: t }), head) }

  sql_cmp_expression
    = head: sql_mul_expression tail:(
      (_ op: ("=" / "!=" / "<=" / ">=" / "<" / ">") _ right: sql_mul_expression { return { kind: 'UntypedSQLInfixExpression', op, right }})
    )*
      { return tail.reduce((t, h) => ({ ...h, left: t }), head) }

  sql_mul_expression
    = head: sql_add_expression tail:(
      (_ op: ("*" / "/" / "%") _ right: sql_add_expression { return { kind: 'UntypedSQLInfixExpression', op, right }})
    )*
      { return tail.reduce((t, h) => ({ ...h, left: t }), head) }

  sql_add_expression
    = head: sql_literal_expression tail:(
      (_ op: ("+" / "-") _ right: sql_literal_expression { return { kind: 'UntypedSQLInfixExpression', op, right }})
    )*
      { return tail.reduce((t, h) => ({ ...h, left: t }), head) }

  sql_column_expression
    = expression: sql_expression alias: (__ "as" __ @identifier)?
    { return { kind: "UntypedSQLColumnExpression", expression, alias: alias ?? undefined } }

  sql_from_expression
    = table: sql_expression alias: (__ "as" __ @identifier)?
    { return { kind: "UntypedSQLFromExpression", table, alias: alias ?? undefined } }

  sql_pack_expression
    = "(" _ values: (h: sql_expression w: (_ "," _ @sql_expression)* { return [h, ...w] }) _ ")"
    { return { kind: "UntypedSQLPackExpression", values } }

  sql_expression
    = sql_or_expression

  sql_literal_expression
    = sql_column_identifier_expression
    / sql_string_expression
    / sql_integer_expression
    / sql_boolean_expression
    / sql_pack_expression
    / capture_expression
    / sql_identifier_expression

  sql_column_identifier_expression
    = "\\"" name: identifier "\\""
    { return { kind: "UntypedSQLColumnIdentifierExpression", name } }

  sql_string_expression
    = "'" value: (x: [^']* { return x.join('') }) "'"
    { return { kind: "UntypedSQLStringExpression", value } }

  sql_integer_expression
    = value: (x: [0-9]+ { return Number(x.join('')) })
    { return { kind: "UntypedSQLIntegerExpression", value } }

  sql_boolean_expression
    = value: (x: ("true" / "false") { return x === "true" })
    { return { kind: "UntypedSQLBooleanExpression", value } }

  sql_identifier_expression
    = name: identifier
    { return { kind: "UntypedSQLIdentifierExpression", name } }

  html_block_expression
    = "<" prefix: (_ openTag: identifier attributes: html_attributes { return { openTag, attributes }})? _ ">" expressions: (_ @sub_html_expression)* _ "</" _ closeTag: (@identifier _)? ">"
    { return { kind: "UntypedHTMLBlockExpression", expressions, closeTag: closeTag ?? undefined, ...(prefix !== null ? prefix : { openTag: undefined, attributes: [] }) } }

  html_expression
    = "<" _ tag: identifier attributes: html_attributes _ "/>"
    { return { kind: "UntypedHTMLExpression", tag, attributes } }

  html_attributes
    = (__ @html_attribute)*

  html_attribute
    = name: html_identifier _ "=" _ value: sub_html_expression
    { return { name, value } }

  html_text_expression
    = chars: [^<$]+
    { return { kind: "UntypedHTMLTextExpression", value: chars.join('').trim() } }

  capture_expression
    = "\${" _  expression: expression _ "}"
    { return { kind: "UntypedCaptureExpression", expression } }

  string_expression
    = "\\"" parts: ((chars: [^\\"$]+ { return chars.join('') }) / capture_expression)* "\\""
    { return { kind: "UntypedStringExpression", parts } }

  identifier_expression
    = name: identifier
    { return { kind: "UntypedIdentifierExpression", name } }

  integer_expression
    = chars: [0-9]+
    { return { kind: "UntypedIntegerExpression", value: Number(chars.join('')) } }

  for_expression
    = "for" __ name: identifier __ "in" __ iterable: expression _ expression: block_expression
    { return { kind: "UntypedForExpression", name, iterable, expression } }
`);

export function parse(content: string): UntypedNitroModule {
  return parser.parse(content);
}
