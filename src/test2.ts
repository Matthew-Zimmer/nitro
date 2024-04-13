import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { generate } from "peggy";

type SQLInfixOperator =
  | "="
  | "!="
  | "is"
  | "or"
  | "and"
  | "<"
  | ">"
  | "<="
  | ">="
  | "+"
  | "-"
  | "*"
  | "/"
  | "%";

type UntypedNitroModule = {
  kind: "UntypedNitroModule";
  definitions: UntypedDefinition[];
};

type UntypedDefinition =
  | UntypedFunctionDefinition
  | UntypedHTTPDefinition
  | UntypedDeclareDefinition
  | UntypedTableDefinition
  | UntypedRawGoSourceDefinition
  | UntypedRawGoSourceImportDefinition
  | UntypedStructDefinition;

type UntypedRawGoSourceDefinition = {
  kind: "UntypedRawGoSourceDefinition";
  source: string;
};

type UntypedRawGoSourceImportDefinition = {
  kind: "UntypedRawGoSourceImportDefinition";
  source: string;
};

type UntypedTableDefinition = {
  kind: "UntypedTableDefinition";
  name: string;
  type: Type;
};

type UntypedStructDefinition = {
  kind: "UntypedStructDefinition";
  name: string;
  properties: { name: string; type: Type }[];
};

type UntypedFunctionDefinition = {
  kind: "UntypedFunctionDefinition";
  name: string;
  parameters: { name: string; type: Type }[];
  expression: UntypedExpression;
  returnType: Type;
};

type UntypedHTTPDefinition = {
  kind: "UntypedHTTPDefinition";
  endpoint: HTTPPath[];
  verb: HTTPVerb;
  parameters: { name: string; type: Type }[];
  expression: UntypedExpression;
};

type UntypedDeclareDefinition = {
  kind: "UntypedDeclareDefinition";
  definition: UntypedDefinition;
};

type UntypedSubHTMLExpression =
  | UntypedHTMLBlockExpression
  | UntypedHTMLExpression
  | UntypedHTMLTextExpression
  | UntypedStringExpression
  | UntypedCaptureExpression;

type UntypedExpression =
  | UntypedHTMLBlockExpression
  | UntypedHTMLExpression
  | UntypedIntegerExpression
  | UntypedStringExpression
  | UntypedIdentifierExpression
  | UntypedForExpression
  | UntypedLetExpression
  | UntypedSQLSelectExpression
  | UntypedSQLInsertExpression
  | UntypedSQLDeleteExpression
  | UntypedBlockExpression
  | UntypedCaptureExpression
  | UntypedAddExpression
  | UntypedDotExpression
  | UntypedCallExpression;

type UntypedSQLExpression =
  | UntypedSQLIdentifierExpression
  | UntypedSQLColumnIdentifierExpression
  | UntypedSQLIntegerExpression
  | UntypedSQLStringExpression
  | UntypedSQLColumnExpression
  | UntypedSQLBooleanExpression
  | UntypedSQLFromExpression
  | UntypedSQLPackExpression
  | UntypedSQLSelectExpression
  | UntypedSQLInsertExpression
  | UntypedSQLDeleteExpression
  | UntypedSQLWhereExpression
  | UntypedSQLInfixExpression
  | UntypedCaptureExpression;

type UntypedSQLDeleteExpression = {
  kind: "UntypedSQLDeleteExpression";
  table: UntypedSQLFromExpression;
  where?: UntypedSQLWhereExpression;
};

type UntypedSQLWhereExpression = {
  kind: "UntypedSQLWhereExpression";
  cond: UntypedSQLExpression;
};

type UntypedSQLInfixExpression = {
  kind: "UntypedSQLInfixExpression";
  left: UntypedSQLExpression;
  op: SQLInfixOperator;
  right: UntypedSQLExpression;
};

type UntypedBlockExpression = {
  kind: "UntypedBlockExpression";
  expressions: UntypedExpression[];
};

type UntypedSQLIdentifierExpression = {
  kind: "UntypedSQLIdentifierExpression";
  name: string;
};

type UntypedSQLColumnIdentifierExpression = {
  kind: "UntypedSQLColumnIdentifierExpression";
  name: string;
};

type UntypedSQLIntegerExpression = {
  kind: "UntypedSQLIntegerExpression";
  value: number;
};

type UntypedSQLStringExpression = {
  kind: "UntypedSQLStringExpression";
  value: string;
};

type UntypedSQLBooleanExpression = {
  kind: "UntypedSQLStringExpression";
  value: string;
};

type UntypedSQLColumnExpression = {
  kind: "UntypedSQLColumnExpression";
  expression: UntypedSQLExpression;
  alias?: string;
};

type UntypedSQLFromExpression = {
  kind: "UntypedSQLFromExpression";
  table: UntypedSQLExpression;
  alias?: string;
};

type UntypedSQLSelectExpression = {
  kind: "UntypedSQLSelectExpression";
  columns: UntypedSQLColumnExpression[];
  from?: UntypedSQLFromExpression;
  where?: UntypedSQLWhereExpression;
};

type UntypedSQLPackExpression = {
  kind: "UntypedSQLPackExpression";
  values: UntypedSQLExpression[];
};

type UntypedSQLInsertExpression = {
  kind: "UntypedSQLInsertExpression";
  table: UntypedSQLFromExpression;
  columns: UntypedSQLPackExpression;
  values: UntypedSQLPackExpression[];
};

type UntypedHTMLBlockExpression = {
  kind: "UntypedHTMLBlockExpression";
  attributes: { name: string; value: UntypedSubHTMLExpression }[];
  openTag: string;
  closeTag: string;
  expressions: UntypedSubHTMLExpression[];
};

type UntypedHTMLExpression = {
  kind: "UntypedHTMLExpression";
  attributes: { name: string; value: UntypedSubHTMLExpression }[];
  tag: string;
};

type UntypedHTMLTextExpression = {
  kind: "UntypedHTMLTextExpression";
  value: string;
};

type UntypedCaptureExpression = {
  kind: "UntypedCaptureExpression";
  expression: UntypedExpression;
};

type UntypedIntegerExpression = {
  kind: "UntypedIntegerExpression";
  value: number;
};

type UntypedStringExpression = {
  kind: "UntypedStringExpression";
  parts: (string | UntypedCaptureExpression)[];
};

type UntypedIdentifierExpression = {
  kind: "UntypedIdentifierExpression";
  name: string;
};

type UntypedForExpression = {
  kind: "UntypedForExpression";
  name: string;
  iterable: UntypedExpression;
  expression: UntypedExpression;
};

type UntypedLetExpression = {
  kind: "UntypedLetExpression";
  name: string;
  expression: UntypedExpression;
  type?: Type;
};

type UntypedAddExpression = {
  kind: "UntypedAddExpression";
  left: UntypedExpression;
  right: UntypedExpression;
};

type UntypedCallExpression = {
  kind: "UntypedCallExpression";
  left: UntypedExpression;
  args: UntypedExpression[];
};

type UntypedDotExpression = {
  kind: "UntypedDotExpression";
  left: UntypedExpression;
  name: string;
};

type Type =
  | StringType
  | IntegerType
  | BooleanType
  | HTMLType
  | FunctionType
  | IteratorType
  | IntrinsicType
  | IdentifierType
  | StructType
  | UnknownType;

type BooleanType = {
  kind: "BooleanType";
};

type StructType = {
  kind: "StructType";
  properties: { name: string; type: Type }[];
};

type IntrinsicType = {
  kind: "IntrinsicType";
};

type IdentifierType = {
  kind: "IdentifierType";
  name: string;
};

type StringType = {
  kind: "StringType";
};

type UnknownType = {
  kind: "UnknownType";
};

type IntegerType = {
  kind: "IntegerType";
};

type HTMLType = {
  kind: "HTMLType";
};

type IteratorType = {
  kind: "IteratorType";
  type: Type;
};

type FunctionType = {
  kind: "FunctionType";
  from: { name: string; type: Type }[];
  to: Type;
};

type NitroModule = {
  kind: "NitroModule";
  definitions: Definition[];
};

type Definition =
  | FunctionDefinition
  | HTTPDefinition
  | DeclareDefinition
  | StructDefinition
  | RawGoSourceDefinition
  | RawGoSourceImportDefinition
  | TableDefinition;

type RawGoSourceDefinition = {
  kind: "RawGoSourceDefinition";
  source: string;
};

type RawGoSourceImportDefinition = {
  kind: "RawGoSourceImportDefinition";
  source: string;
};

type StructDefinition = {
  kind: "StructDefinition";
  name: string;
  properties: { name: string; type: Type }[];
};

type TableDefinition = {
  kind: "TableDefinition";
  name: string;
  type: Type;
};

type FunctionDefinition = {
  kind: "FunctionDefinition";
  name: string;
  parameters: { name: string; type: Type }[];
  type: Type;
  expression: Expression;
};

type HTTPDefinition = {
  kind: "HTTPDefinition";
  verb: HTTPVerb;
  endpoint: HTTPPath[];
  parameters: { name: string; type: Type }[];
  expression: Expression;
};

type DeclareDefinition = {
  kind: "DeclareDefinition";
  definition: Definition;
};

type SubHTMLExpression =
  | HTMLBlockExpression
  | HTMLExpression
  | HTMLTextExpression
  | StringExpression
  | CaptureExpression;

type Expression =
  | HTMLBlockExpression
  | HTMLExpression
  | IntegerExpression
  | StringExpression
  | IdentifierExpression
  | ForExpression
  | BlockExpression
  | LetExpression
  | SQLSelectExpression
  | SQLInsertExpression
  | SQLDeleteExpression
  | CaptureExpression
  | AddExpression
  | DotExpression
  | CallExpression;

type SQLExpression =
  | SQLIdentifierExpression
  | SQLColumnIdentifierExpression
  | SQLIntegerExpression
  | SQLStringExpression
  | SQLBooleanExpression
  | SQLColumnExpression
  | SQLFromExpression
  | SQLSelectExpression
  | SQLInsertExpression
  | SQLDeleteExpression
  | SQLPackExpression
  | SQLWhereExpression
  | SQLInfixExpression
  | CaptureExpression;

type SQLDeleteExpression = {
  kind: "SQLDeleteExpression";
  table: SQLFromExpression;
  where?: SQLWhereExpression;
  type: Type;
};

type SQLWhereExpression = {
  kind: "SQLWhereExpression";
  cond: SQLExpression;
  type: Type;
};

type SQLInfixExpression = {
  kind: "SQLInfixExpression";
  left: SQLExpression;
  op: SQLInfixOperator;
  right: SQLExpression;
  type: Type;
};

type BlockExpression = {
  kind: "BlockExpression";
  expressions: Expression[];
  type: Type;
};

type SQLIdentifierExpression = {
  kind: "SQLIdentifierExpression";
  name: string;
  type: Type;
};

type SQLColumnIdentifierExpression = {
  kind: "SQLColumnIdentifierExpression";
  name: string;
  type: Type;
};

type SQLIntegerExpression = {
  kind: "SQLIntegerExpression";
  value: number;
  type: Type;
};

type SQLStringExpression = {
  kind: "SQLStringExpression";
  value: string;
  type: Type;
};

type SQLBooleanExpression = {
  kind: "SQLBooleanExpression";
  value: string;
  type: Type;
};

type SQLColumnExpression = {
  kind: "SQLColumnExpression";
  expression: SQLExpression;
  alias?: string;
  type: Type;
};

type SQLFromExpression = {
  kind: "SQLFromExpression";
  table: SQLExpression;
  alias?: string;
  type: Type;
};

type SQLSelectExpression = {
  kind: "SQLSelectExpression";
  columns: SQLColumnExpression[];
  from?: SQLFromExpression;
  where?: SQLWhereExpression;
  type: Type;
};

type SQLPackExpression = {
  kind: "SQLPackExpression";
  values: SQLExpression[];
  type: Type;
};

type SQLInsertExpression = {
  kind: "SQLInsertExpression";
  table: SQLFromExpression;
  columns: SQLPackExpression;
  values: SQLPackExpression[];
  type: Type;
};

type HTMLBlockExpression = {
  kind: "HTMLBlockExpression";
  attributes: { name: string; value: SubHTMLExpression }[];
  tag: string;
  expressions: SubHTMLExpression[];
  type: Type;
};

type HTMLExpression = {
  kind: "HTMLExpression";
  attributes: { name: string; value: SubHTMLExpression }[];
  tag: string;
  type: Type;
};

type HTMLTextExpression = {
  kind: "HTMLTextExpression";
  value: string;
  type: Type;
};

type CaptureExpression = {
  kind: "CaptureExpression";
  expression: Expression;
  type: Type;
};

type IntegerExpression = {
  kind: "IntegerExpression";
  value: number;
  type: Type;
};

type StringExpression = {
  kind: "StringExpression";
  parts: (string | CaptureExpression)[];
  type: Type;
};

type IdentifierExpression = {
  kind: "IdentifierExpression";
  name: string;
  type: Type;
};

type ForExpression = {
  kind: "ForExpression";
  name: string;
  iterable: Expression;
  expression: Expression;
  type: Type;
};

type LetExpression = {
  kind: "LetExpression";
  name: string;
  expression: Expression;
  type: Type;
};

type AddExpression = {
  kind: "AddExpression";
  left: Expression;
  right: Expression;
  type: Type;
};

type DotExpression = {
  kind: "DotExpression";
  left: Expression;
  name: string;
  type: Type;
};

type CallExpression = {
  kind: "CallExpression";
  left: Expression;
  args: Expression[];
  type: Type;
};

type GoModule = {
  kind: "GoModule";
  definitions: GoDefinition[];
};

type GoDefinition =
  | GoFunctionDefinition
  | GoHTTPDefinition
  | GoRawSourceDefinition
  | GoRawSourceImportDefinition
  | GoStructDefinition;

type GoRawSourceDefinition = {
  kind: "GoRawSourceDefinition";
  source: string;
};

type GoRawSourceImportDefinition = {
  kind: "GoRawSourceImportDefinition";
  source: string;
};

type GoStructDefinition = {
  kind: "GoStructDefinition";
  name: string;
  properties: { name: string; type: GoType }[];
};

type GoFunctionDefinition = {
  kind: "GoFunctionDefinition";
  name: string;
  parameters: { name: string; type: GoType }[];
  ret: GoType;
  expression: GoExpression;
};

type HTTPVerb = "get" | "put" | "post" | "patch" | "delete";

type HTTPPath = HTTPConstantPath | HTTPVariablePath;

type HTTPConstantPath = {
  kind: "HTTPConstantPath";
  value: string;
};

type HTTPVariablePath = {
  kind: "HTTPVariablePath";
  name: string;
};

type GoHTTPDefinition = {
  kind: "GoHTTPDefinition";
  verb: HTTPVerb;
  endpoint: HTTPPath[];
  parameters: { name: string; type: GoType }[];
  expression: GoExpression;
};

type GoExpression =
  | GoStringExpression
  | GoIntegerExpression
  | GoIdentifierExpression
  | GoAbstractionExpression
  | GoApplicationExpression
  | GoLetExpression
  | GoForExpression
  | GoSourceExpression
  | GoBlockExpression
  | GoInfixExpression;

type GoType =
  | GoStringType
  | GoComponentType
  | GoIntegerType
  | GoBooleanType
  | GoErrorType
  | GoStructType
  | GoIdentifierType
  | GoContextType
  | GoIteratorType;

type GoBooleanType = {
  kind: "GoBooleanType";
};

type GoStructType = {
  kind: "GoStructType";
  properties: { name: string; type: GoType }[];
};

type GoIdentifierType = {
  kind: "GoIdentifierType";
  name: string;
};

type GoStringType = {
  kind: "GoStringType";
};

type GoComponentType = {
  kind: "GoComponentType";
};

type GoContextType = {
  kind: "GoContextType";
};

type GoIntegerType = {
  kind: "GoIntegerType";
};

type GoErrorType = {
  kind: "GoErrorType";
};

type GoIteratorType = {
  kind: "GoIteratorType";
  type: GoType;
};

type GoStringExpression = {
  kind: "GoStringExpression";
  value: string;
};

type GoIntegerExpression = {
  kind: "GoIntegerExpression";
  value: number;
};

type GoIdentifierExpression = {
  kind: "GoIdentifierExpression";
  name: string;
};

type GoSourceExpression = {
  kind: "GoSourceExpression";
  source: string;
};

type GoAbstractionExpression = {
  kind: "GoAbstractionExpression";
  parameters: { name: string; type: GoType }[];
  expression: GoExpression;
  ret: GoType;
};

type GoApplicationExpression = {
  kind: "GoApplicationExpression";
  func: GoExpression;
  args: GoExpression[];
};

type GoLetExpression = {
  kind: "GoLetExpression";
  name: string;
  expression: GoExpression;
};

type GoForExpression = {
  kind: "GoForExpression";
  name: string;
  iterable: GoExpression;
  expression: GoExpression;
  elementType: GoType;
  iterationType: GoType;
};

type GoBlockExpression = {
  kind: "GoBlockExpression";
  expressions: GoExpression[];
  type: GoType;
};

type GoInfixExpression = {
  kind: "GoInfixExpression";
  left: GoExpression;
  op: string;
  right: GoExpression;
};

function writeStringExpr(value: string | GoExpression): GoExpression {
  return {
    kind: "GoApplicationExpression",
    func: { kind: "GoIdentifierExpression", name: "WriteString" },
    args: [
      { kind: "GoIdentifierExpression", name: "c" },
      typeof value === "string"
        ? { kind: "GoStringExpression", value: value.replace(/\n/g, "\\n") }
        : value,
    ],
  };
}

function writeIntegerExpr(value: number | GoExpression): GoExpression {
  return {
    kind: "GoApplicationExpression",
    func: { kind: "GoIdentifierExpression", name: "WriteInteger" },
    args: [
      { kind: "GoIdentifierExpression", name: "c" },
      typeof value === "number"
        ? { kind: "GoIntegerExpression", value }
        : value,
    ],
  };
}

function sqlQuery(e: SQLExpression): [string, Expression[]] {
  let parameterCount = 0;
  const captures: Expression[] = [];
  function imp(e: SQLExpression): string {
    switch (e.kind) {
      case "CaptureExpression": {
        captures.push(e.expression);
        return `$${++parameterCount}`;
      }
      case "SQLIdentifierExpression":
        return e.name;
      case "SQLColumnIdentifierExpression":
        return `"${e.name}"`;
      case "SQLIntegerExpression":
        return `${e.value}`;
      case "SQLStringExpression":
        return `'${e.value}'`;
      case "SQLBooleanExpression":
        return `${e.value}`;
      case "SQLColumnExpression":
        return e.alias === undefined
          ? imp(e.expression)
          : `${imp(e.expression)} as "${e.alias}"`;
      case "SQLFromExpression":
        return e.alias === undefined
          ? imp(e.table)
          : `${imp(e.table)} as "${e.alias}"`;
      case "SQLSelectExpression":
        return `select ${e.columns.map(imp).join(", ")}${
          e.from === undefined ? "" : ` from ${imp(e.from)}`
        }${e.where === undefined ? "" : ` ${imp(e.where)}`}`;
      case "SQLInsertExpression":
        return `insert into ${imp(e.table)} ${imp(e.columns)} values ${e.values
          .map(imp)
          .join(", ")}`;
      case "SQLPackExpression":
        return `(${e.values.map(imp).join(", ")})`;
      case "SQLDeleteExpression":
        return `delete from ${imp(e.table)}${
          e.where === undefined ? "" : ` ${imp(e.where)}`
        }`;
      case "SQLInfixExpression":
        return `(${imp(e.left)}${e.op}${imp(e.right)})`;
      case "SQLWhereExpression":
        return `where ${imp(e.cond)}`;
    }
  }
  const query = imp(e);
  return [query, captures];
}

let nextGeneratedNameCount = 0;
function nextGeneratedName() {
  return `_${nextGeneratedNameCount++}`;
}

function toGo(
  e: Expression,
  components: Set<string>
): [GoExpression, GoDefinition[]] {
  const defs: GoDefinition[] = [];

  function html(e: SubHTMLExpression, promote = true): GoExpression {
    const imp = (e: SubHTMLExpression): GoExpression => {
      switch (e.kind) {
        case "HTMLExpression":
          if (components.has(e.tag)) {
            return {
              kind: "GoApplicationExpression",
              func: {
                kind: "GoApplicationExpression",
                func: {
                  kind: "GoIdentifierExpression",
                  name: e.tag,
                },
                args: e.attributes.map((x) => html(x.value, false)),
              },
              args: [
                {
                  kind: "GoIdentifierExpression",
                  name: "c",
                },
              ],
            };
          } else {
            return {
              kind: "GoBlockExpression",
              expressions: [
                writeStringExpr(
                  `${e.tag !== "html" ? `` : `<!doctype html>`}<${e.tag}`
                ),
                ...e.attributes.flatMap((a) => [
                  writeStringExpr(` ${a.name}=\\"`),
                  imp(a.value),
                  writeStringExpr(`\\"`),
                ]),
                writeStringExpr(` />`),
                { kind: "GoIdentifierExpression", name: "nil" },
              ],
              type: {
                kind: "GoErrorType",
              },
            };
          }
        case "HTMLBlockExpression":
          // we are a component
          if (components.has(e.tag)) {
            return {
              kind: "GoApplicationExpression",
              func: {
                kind: "GoApplicationExpression",
                func: {
                  kind: "GoIdentifierExpression",
                  name: e.tag,
                },
                args: [
                  ...e.attributes.map((x) => html(x.value, false)),
                  {
                    kind: "GoAbstractionExpression",
                    expression: {
                      kind: "GoBlockExpression",
                      expressions: e.expressions.map(imp),
                      type: {
                        kind: "GoErrorType",
                      },
                    },
                    parameters: [
                      { name: "c", type: { kind: "GoContextType" } },
                    ],
                    ret: {
                      kind: "GoErrorType",
                    },
                  },
                ],
              },
              args: [
                {
                  kind: "GoIdentifierExpression",
                  name: "c",
                },
              ],
            };
          } else {
            return {
              kind: "GoBlockExpression",
              expressions: [
                writeStringExpr(
                  `${e.tag !== "html" ? `` : `<!doctype html>`}<${e.tag}`
                ),
                ...e.attributes.flatMap((a) => [
                  writeStringExpr(` ${a.name}=\\"`),
                  imp(a.value),
                  writeStringExpr(`\\"`),
                ]),
                writeStringExpr(`>`),
                ...e.expressions.map(imp),
                writeStringExpr(`</${e.tag}>`),
                { kind: "GoIdentifierExpression", name: "nil" },
              ],
              type: {
                kind: "GoErrorType",
              },
            };
          }
        case "HTMLTextExpression":
          return writeStringExpr(e.value);
        case "CaptureExpression":
          if (promote === false) {
            return expr(e.expression);
          }

          switch (e.expression.type.kind) {
            case "StringType":
              return writeStringExpr(expr(e.expression));
            case "IntegerType":
              return writeIntegerExpr(expr(e.expression));
            case "IdentifierType":
            case "StructType":
            case "BooleanType":
              throw new Error(`What should we do here`);
            // RFC: Iterators still feel a bit magic like the toGo:expr function is doing too much
            // which it may be
            // I feel like this function should be doing something more
            // but its working
            case "IteratorType": {
              const g = expr(e.expression);

              return g;
            }
            case "HTMLType":
              return {
                kind: "GoApplicationExpression",
                func: expr(e.expression),
                args: [{ kind: "GoIdentifierExpression", name: "c" }],
              };
            case "FunctionType":
            case "UnknownType":
            case "IntrinsicType":
              throw new Error(`WTF`);
          }
        case "StringExpression": {
          // return promote ? writeStringExpr(e.value) : expr(e);
          if (promote) {
            return {
              kind: "GoBlockExpression",
              expressions: e.parts.map((x) =>
                writeStringExpr(typeof x === "string" ? x : expr(x))
              ),
              type: { kind: "GoErrorType" },
            };
          } else {
            return expr(e);
          }
        }
      }
    };
    return imp(e);
  }

  function sql(
    e: SQLSelectExpression | SQLInsertExpression | SQLDeleteExpression
  ): GoExpression {
    switch (e.kind) {
      case "SQLSelectExpression": {
        const name = nextGeneratedName();
        const ty = type(e.type);
        const [query, captures] = sqlQuery(e);

        if (e.type.kind !== "IteratorType") {
          throw new Error();
        }

        if (e.type.type.kind !== "StructType") {
          throw new Error();
        }

        const innerType = toGoSource(type(e.type.type));

        defs.push({
          kind: "GoFunctionDefinition",
          name,
          parameters: captures.map((x, i) => ({
            name: `n_${i}`,
            type: type(x.type),
          })),
          ret: ty,
          expression: {
            kind: "GoSourceExpression",
            source: `\
var obj ${innerType}
rows, err := db.Query(\`${query}\`, ${captures
              .map((_, i) => `n_${i}`)
              .join(",")})
if err != nil {
  panic("bad query: " + err.Error())
}
return func(f func(${innerType}) error) (bool, error) {
  if rows.Next() {
    rows.Scan(${e.type.type.properties
      .map((x) => `&obj.${capitalize(x.name)}`)
      .join(", ")})
    return false, f(obj)
  } else {
    rows.Close()
    return true, nil
  }
}\
`,
          },
        });

        return {
          kind: "GoApplicationExpression",
          func: {
            kind: "GoIdentifierExpression",
            name,
          },
          args: captures.map(expr),
        };
      }
      case "SQLDeleteExpression":
      case "SQLInsertExpression": {
        const name = nextGeneratedName();
        const [query, captures] = sqlQuery(e);

        defs.push({
          kind: "GoFunctionDefinition",
          name,
          parameters: captures.map((x, i) => ({
            name: `n_${i}`,
            type: type(x.type),
          })),
          ret: { kind: "GoErrorType" },
          expression: {
            kind: "GoSourceExpression",
            source: `\
_, err := db.Exec(\`${query}\`, ${captures.map((_, i) => `n_${i}`).join(",")})
if err != nil {
  panic("bad query: " + err.Error())
}
return nil
\
`,
          },
        });

        return {
          kind: "GoApplicationExpression",
          func: {
            kind: "GoIdentifierExpression",
            name,
          },
          args: captures.map(expr),
        };
      }
    }
  }

  function expr(e: Expression): GoExpression {
    switch (e.kind) {
      case "HTMLBlockExpression":
      case "HTMLExpression":
        return html(e);
      case "SQLSelectExpression":
      case "SQLInsertExpression":
      case "SQLDeleteExpression":
        return sql(e);
      case "CaptureExpression":
        return expr(e.expression);
      case "IntegerExpression":
        return {
          kind: "GoIntegerExpression",
          value: e.value,
        };
      case "BlockExpression":
        return {
          kind: "GoBlockExpression",
          expressions: e.expressions.map(expr),
          type: type(e.type),
        };
      case "StringExpression": {
        const allStrings = e.parts.every((x) => typeof x === "string");
        if (allStrings) {
          return {
            kind: "GoStringExpression",
            value: e.parts.join(""),
          };
        } else {
          // this may reverse the order
          const convertToGo = (x: string | CaptureExpression): GoExpression =>
            typeof x === "string"
              ? { kind: "GoStringExpression", value: x }
              : expr(x);
          return e.parts.slice(1).reduce(
            (p, c) => ({
              kind: "GoInfixExpression" as const,
              left: p,
              op: "+",
              right: convertToGo(c),
            }),
            convertToGo(e.parts[0])
          );
        }
      }
      case "IdentifierExpression":
        return {
          kind: "GoIdentifierExpression",
          name: e.name,
        };
      case "ForExpression":
        if (e.type.kind !== "IteratorType")
          throw new Error(
            `Internal error: For expression does not have iterator type`
          );
        if (e.iterable.type.kind !== "IteratorType")
          throw new Error(
            `Internal error: For expression iterable does not have iterator type`
          );

        // TODO THINK ABOUT this feels dirty
        let ty = type(e.type.type);
        ty = ty.kind !== "GoComponentType" ? ty : { kind: "GoErrorType" };

        let inner = expr(e.expression);

        if (inner.kind === "GoBlockExpression") {
          if (inner.type.kind === "GoComponentType") {
            inner.type = { kind: "GoErrorType" };
          }
        }

        return {
          kind: "GoForExpression",
          name: e.name,
          iterable: expr(e.iterable),
          expression: inner,
          elementType: type(e.iterable.type.type),
          iterationType: ty,
        };
      case "LetExpression":
        return {
          kind: "GoLetExpression",
          name: e.name,
          expression: expr(e.expression),
        };
      case "AddExpression":
        return {
          kind: "GoInfixExpression",
          left: expr(e.left),
          op: "+",
          right: expr(e.right),
        };

      case "CallExpression":
        return {
          kind: "GoApplicationExpression",
          func: expr(e.left),
          args: e.args.map(expr),
        };
      case "DotExpression":
        return {
          kind: "GoInfixExpression",
          op: ".",
          left: expr(e.left),
          right: { kind: "GoIdentifierExpression", name: capitalize(e.name) },
        };
    }
  }

  return [expr(e), defs];
}

function expandParameters(d: GoHTTPDefinition): string {
  const parameters = d.endpoint.flatMap((x): string[] => {
    switch (x.kind) {
      case "HTTPConstantPath":
        return [];
      case "HTTPVariablePath":
        return [x.name];
    }
  });

  return (
    parameters.map((x) => `${x} := ""`).join("\n") +
    (parameters.length === 0
      ? ""
      : `
if err := echo.PathParamsBinder(c)${parameters
          .map((x) => `.String("${x}", &${x})`)
          .join("")}.BindError(); err != nil {
  return c.String(http.StatusBadRequest, "bad request")
}
`) +
    d.parameters
      .map(
        (p) => `
var ${p.name} ${toGoSource(p.type)}
if err := c.Bind(&${p.name}); err != nil {
  return c.String(http.StatusBadRequest, "bad request")
}
if err = c.Validate(${p.name}); err != nil {
  return err
}
`
      )
      .join("\n\n")
  );
}

function capitalize<S extends string>(x: S): Capitalize<S> {
  return (
    x.length === 0 ? "" : x[0].toUpperCase() + x.slice(1)
  ) as Capitalize<S>;
}

function toGoSource(e: GoExpression | GoType | GoDefinition): string {
  switch (e.kind) {
    case "GoComponentType":
      return `Component`;
    case "GoStringType":
      return `string`;
    case "GoIntegerType":
      return `int`;
    case "GoBooleanType":
      return `bool`;
    case "GoErrorType":
      return `error`;
    case "GoContextType":
      return `echo.Context`;
    case "GoIteratorType":
      return `Iterator[${toGoSource(e.type)}]`;
    case "GoIdentifierType":
      return `${e.name}`;
    case "GoStructType":
      return `struct {\n${e.properties
        .map((x) => `\t${capitalize(x.name)} ${toGoSource(x.type)}`)
        .join("\n")}\n}`;

    case "GoFunctionDefinition":
      return `func ${e.name} (${e.parameters
        .map((x) => `${x.name} ${toGoSource(x.type)}`)
        .join(",")}) ${toGoSource(e.ret)} {\n${
        e.expression.kind === "GoSourceExpression"
          ? toGoSource(e.expression)
          : `return ${toGoSource(e.expression)}`
      }\n}`;
    case "GoHTTPDefinition":
      return `e.${e.verb.toUpperCase()}("/${e.endpoint
        .map(
          (x) =>
            `${((): string => {
              switch (x.kind) {
                case "HTTPConstantPath":
                  return x.value;
                case "HTTPVariablePath":
                  return `:${x.name}`;
              }
            })()}/`
        )
        .join("")}", func (c echo.Context) error {\n ${expandParameters(
        e
      )}\nreturn ${toGoSource(e.expression)} \n})`;
    case "GoStructDefinition":
      return `type ${e.name} ${toGoSource({
        kind: "GoStructType",
        properties: e.properties,
      })}`;
    case "GoRawSourceDefinition":
      return e.source;
    case "GoRawSourceImportDefinition":
      return e.source;

    case "GoSourceExpression":
      return e.source;
    case "GoStringExpression":
      return `"${e.value}"`;
    case "GoIntegerExpression":
      return `${e.value}`;
    case "GoIdentifierExpression":
      return e.name;
    case "GoAbstractionExpression":
      return `func (${e.parameters.map(
        (x) => `${x.name} ${toGoSource(x.type)}`
      )}) ${toGoSource(e.ret)} {\nreturn ${toGoSource(e.expression)}\n}`;
    case "GoApplicationExpression":
      return `${toGoSource(e.func)}(${e.args.map(toGoSource).join(",")})`;
    case "GoLetExpression":
      return `${e.name} := ${toGoSource(e.expression)}`;
    case "GoForExpression":
      return `exhaust(${toGoSource(e.iterable)}, ${toGoSource({
        kind: "GoAbstractionExpression",
        parameters: [{ name: e.name, type: e.elementType }],
        expression: e.expression,
        ret: e.iterationType,
      })})`;
    case "GoBlockExpression":
      return `(func () ${toGoSource(e.type)} {\n${e.expressions
        .map((x, i, a) =>
          i + 1 !== a.length ? toGoSource(x) : `return ${toGoSource(x)}`
        )
        .join("\n")}\n})()`;
    case "GoInfixExpression":
      return `(${toGoSource(e.left)}${e.op}${toGoSource(e.right)})`;
  }
}

function splitGoDefinitions(defs: GoDefinition[]): {
  http: GoDefinition[];
  nonHttp: GoDefinition[];
  rawImports: GoDefinition[];
  rawSources: GoDefinition[];
} {
  const nonHttp: GoDefinition[] = [];
  const http: GoDefinition[] = [];
  const rawImports: GoDefinition[] = [];
  const rawSources: GoDefinition[] = [];

  for (const def of defs) {
    ((): true => {
      switch (def.kind) {
        case "GoFunctionDefinition":
        case "GoStructDefinition":
          nonHttp.push(def);
          return true;
        case "GoHTTPDefinition":
          http.push(def);
          return true;
        case "GoRawSourceDefinition":
          rawSources.push(def);
          return true;
        case "GoRawSourceImportDefinition":
          rawImports.push(def);
          return true;
      }
    })();
  }

  return {
    nonHttp,
    http,
    rawImports,
    rawSources,
  };
}

function toGoMainModule(mod: GoModule): string {
  const { http, nonHttp, rawImports, rawSources } = splitGoDefinitions(
    mod.definitions
  );

  return `\
package main

import (
  "strconv"
  "net/http"
  "database/sql"
  "github.com/go-playground/validator"

	"github.com/labstack/echo/v4"
  _ "github.com/lib/pq"
)

// raw imports

${rawImports.map(toGoSource).join("\n")}

// raw sources

${rawSources.map(toGoSource).join("\n")}

// start standard prelude

type Validator struct {
	validator *validator.Validate
}

func (cv *Validator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

var (
  db *sql.DB = nil
)

type Component func(echo.Context) error
type Iterator[T any] func(func(T) error) (bool, error)

func WriteBytes(c echo.Context, bytes []byte) error {
	_, err := c.Response().Write(bytes)
	return err
}

func WriteString(c echo.Context, value string) error {
	return WriteBytes(c, []byte(value))
}

func WriteInteger(c echo.Context, value int) error {
	return WriteString(c, strconv.Itoa(value))
}

func empty[T any]() Iterator[T] {
	return func(f func(T) error) (bool, error) {
		return false, nil
	}
}

func seq(n int) Iterator[int] {
	c := 0
	return func(f func(int) error) (bool, error) {
		if c >= n {
			return true, nil
		} else {
			err := f(c)
			c++
			return c >= n, err
		}
	}
}

func iter_map[A any, B any](iter Iterator[A], f func(A) B) Iterator[B] {
	var a A
	extractor := func(x A) error {
		a = x
		return nil
	}
	return func(g func(B) error) (bool, error) {
		done, err := iter(extractor)
		if done || err != nil {
			return true, err
		}
		return false, g(f(a))
	}
}

func iter_filter[T any](iter Iterator[T], f func(T) bool) Iterator[T] {
	var a T
	extractor := func(x T) error {
		a = x
		return nil
	}
	return func(g func(T) error) (bool, error) {
		for {
			done, err := iter(extractor)
			if done || err != nil {
				return true, err
			}
			if f(a) {
				break
			}
		}
		return false, g(a)
	}
}

func exhaust[T any](iter Iterator[T], f func(T) error) error {
	for {
		done, err := iter(f)
		if err != nil {
			return err
		}
		if done {
			return nil
		}
	}
}

func collect[T any](iter Iterator[T]) ([]T, error) {
	l := []T{}
	err := exhaust(iter, func(x T) error {
		l = append(l, x)
		return nil
	})
	return l, err
}

// end standard prelude

// start non http definitions

${nonHttp.map(toGoSource).join("\n\n")}

// end non http definitions

func main() {
	connStr := "postgresql://root:password@localhost:5432?sslmode=disable"
  conn, err := sql.Open("postgres", connStr)
	if err != nil {
		panic("Could not connect to the database at " + connStr)
	}
  db = conn
	defer db.Close()

	e := echo.New()
  e.Validator = &Validator{validator: validator.New()}

  e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			path := c.Request().URL.Path
			if path[len(path)-1] != '/' {
				c.Request().URL.Path += "/"
			}
			return next(c)
		}
	})

// start http definitions

${http.map(toGoSource).join("\n\n")}	

// end http definitions

	e.Logger.Fatal(e.Start(":4000"))
}



`;
}

function toGoSum() {
  return `\
github.com/davecgh/go-spew v1.1.1 h1:vj9j/u1bqnvCEfJOwUhtlOARqs3+rkHYY13jYWTU97c=
github.com/davecgh/go-spew v1.1.1/go.mod h1:J7Y8YcW2NihsgmVo/mv3lAwl/skON4iLHjSsI+c5H38=
github.com/go-playground/locales v0.14.1 h1:EWaQ/wswjilfKLTECiXz7Rh+3BjFhfDFKv/oXslEjJA=
github.com/go-playground/locales v0.14.1/go.mod h1:hxrqLVvrK65+Rwrd5Fc6F2O76J/NuW9t0sjnWqG1slY=
github.com/go-playground/universal-translator v0.18.1 h1:Bcnm0ZwsGyWbCzImXv+pAJnYK9S473LQFuzCbDbfSFY=
github.com/go-playground/universal-translator v0.18.1/go.mod h1:xekY+UJKNuX9WP91TpwSH2VMlDf28Uj24BCp08ZFTUY=
github.com/go-playground/validator v9.31.0+incompatible h1:UA72EPEogEnq76ehGdEDp4Mit+3FDh548oRqwVgNsHA=
github.com/go-playground/validator v9.31.0+incompatible/go.mod h1:yrEkQXlcI+PugkyDjY2bRrL/UBU4f3rvrgkN3V8JEig=
github.com/labstack/echo/v4 v4.11.4 h1:vDZmA+qNeh1pd/cCkEicDMrjtrnMGQ1QFI9gWN1zGq8=
github.com/labstack/echo/v4 v4.11.4/go.mod h1:noh7EvLwqDsmh/X/HWKPUl1AjzJrhyptRyEbQJfxen8=
github.com/labstack/gommon v0.4.2 h1:F8qTUNXgG1+6WQmqoUWnz8WiEU60mXVVw0P4ht1WRA0=
github.com/labstack/gommon v0.4.2/go.mod h1:QlUFxVM+SNXhDL/Z7YhocGIBYOiwB0mXm1+1bAPHPyU=
github.com/leodido/go-urn v1.4.0 h1:WT9HwE9SGECu3lg4d/dIA+jxlljEa1/ffXKmRjqdmIQ=
github.com/leodido/go-urn v1.4.0/go.mod h1:bvxc+MVxLKB4z00jd1z+Dvzr47oO32F/QSNjSBOlFxI=
github.com/lib/pq v1.10.9 h1:YXG7RB+JIjhP29X+OtkiDnYaXQwpS4JEWq7dtCCRUEw=
github.com/lib/pq v1.10.9/go.mod h1:AlVN5x4E4T544tWzH6hKfbfQvm3HdbOxrmggDNAPY9o=
github.com/mattn/go-colorable v0.1.13 h1:fFA4WZxdEF4tXPZVKMLwD8oUnCTTo08duU7wxecdEvA=
github.com/mattn/go-colorable v0.1.13/go.mod h1:7S9/ev0klgBDR4GtXTXX8a3vIGJpMovkB8vQcUbaXHg=
github.com/mattn/go-isatty v0.0.16/go.mod h1:kYGgaQfpe5nmfYZH+SKPsOc2e4SrIfOl2e/yFXSvRLM=
github.com/mattn/go-isatty v0.0.20 h1:xfD0iDuEKnDkl03q4limB+vH+GxLEtL/jb4xVJSWWEY=
github.com/mattn/go-isatty v0.0.20/go.mod h1:W+V8PltTTMOvKvAeJH7IuucS94S2C6jfK/D7dTCTo3Y=
github.com/pmezard/go-difflib v1.0.0 h1:4DBwDE0NGyQoBHbLQYPwSUPoCMWR5BEzIk/f1lZbAQM=
github.com/pmezard/go-difflib v1.0.0/go.mod h1:iKH77koFhYxTK1pcRnkKkqfTogsbg7gZNVY4sRDYZ/4=
github.com/stretchr/testify v1.8.4 h1:CcVxjf3Q8PM0mHUKJCdn+eZZtm5yQwehR5yeSVQQcUk=
github.com/stretchr/testify v1.8.4/go.mod h1:sz/lmYIOXD/1dqDmKjjqLyZ2RngseejIcXlSw2iwfAo=
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
gopkg.in/go-playground/assert.v1 v1.2.1 h1:xoYuJVE7KT85PYWrN730RguIQO0ePzVRfFMXadIrXTM=
gopkg.in/go-playground/assert.v1 v1.2.1/go.mod h1:9RXL0bg/zibRAgZUYszZSwO/z8Y/a8bDuhia5mkpMnE=
gopkg.in/yaml.v3 v3.0.1 h1:fxVm/GzAzEWqLHuvctI91KS9hhNmmWOoWu0XTYJS7CA=
gopkg.in/yaml.v3 v3.0.1/go.mod h1:K4uyk7z7BCEPqu6E+C64Yfv1cQ7kz7rIZviUmN+EgEM=  
`;
}

function toGoMod() {
  return `\
module main

go 1.22.1

require (
  github.com/go-playground/validator v9.31.0+incompatible
  github.com/labstack/echo/v4 v4.11.4
  github.com/lib/pq v1.10.9
)

require (
  github.com/go-playground/locales v0.14.1 // indirect
  github.com/go-playground/universal-translator v0.18.1 // indirect
  github.com/labstack/gommon v0.4.2 // indirect
  github.com/leodido/go-urn v1.4.0 // indirect
  github.com/mattn/go-colorable v0.1.13 // indirect
  github.com/mattn/go-isatty v0.0.20 // indirect
  github.com/valyala/bytebufferpool v1.0.0 // indirect
  github.com/valyala/fasttemplate v1.2.2 // indirect
  golang.org/x/crypto v0.17.0 // indirect
  golang.org/x/net v0.19.0 // indirect
  golang.org/x/sys v0.15.0 // indirect
  golang.org/x/text v0.14.0 // indirect
  gopkg.in/go-playground/assert.v1 v1.2.1 // indirect
)   
`;
}

function type(t: Type): GoType {
  switch (t.kind) {
    case "StringType":
      return { kind: "GoStringType" };
    case "IntegerType":
      return { kind: "GoIntegerType" };
    case "BooleanType":
      return { kind: "GoBooleanType" };
    case "HTMLType":
      return { kind: "GoComponentType" };
    case "IteratorType":
      return { kind: "GoIteratorType", type: type(t.type) };
    case "IdentifierType":
      return { kind: "GoIdentifierType", name: t.name };
    case "StructType":
      return {
        kind: "GoStructType",
        properties: t.properties.map((x) => ({
          name: x.name,
          type: type(x.type),
        })),
      };
    case "FunctionType":
    case "UnknownType":
    case "IntrinsicType":
      throw new Error(``);
  }
}

function def(d: Definition, components: Set<string>): GoDefinition[] {
  switch (d.kind) {
    case "FunctionDefinition":
      if (d.type.kind !== "FunctionType") throw new Error(``);
      if (d.type.to.kind === "HTMLType") {
        const [e, defs] = toGo(d.expression, components);
        return [
          ...defs,
          {
            kind: "GoFunctionDefinition",
            name: d.name,
            parameters: d.parameters.map((x) => ({
              name: x.name,
              type: type(x.type),
            })),
            expression: {
              kind: "GoAbstractionExpression",
              expression: e,
              ret: { kind: "GoErrorType" },
              parameters: [
                {
                  name: "c",
                  type: { kind: "GoContextType" },
                },
              ],
            },
            ret: type(d.type.to),
          },
        ];
      } else {
        const [e, defs] = toGo(d.expression, components);
        return [
          ...defs,
          {
            kind: "GoFunctionDefinition",
            name: d.name,
            parameters: d.parameters.map((x) => ({
              name: x.name,
              type: type(x.type),
            })),
            expression: e,
            ret: type(d.type.to),
          },
        ];
      }
    case "HTTPDefinition": {
      const [e, defs] = toGo(d.expression, components);
      return [
        ...defs,
        {
          kind: "GoHTTPDefinition",
          verb: d.verb,
          endpoint: d.endpoint,
          parameters: d.parameters.map((x) => ({
            name: x.name,
            type: type(x.type),
          })),
          expression: e,
        },
      ];
    }
    case "DeclareDefinition":
    case "TableDefinition":
      return [];
    case "RawGoSourceDefinition":
      return [{ kind: "GoRawSourceDefinition", source: d.source }];
    case "RawGoSourceImportDefinition":
      return [{ kind: "GoRawSourceImportDefinition", source: d.source }];
    case "StructDefinition":
      return [
        {
          kind: "GoStructDefinition",
          name: d.name,
          properties: d.properties.map((x) => ({
            name: x.name,
            type: type(x.type),
          })),
        },
      ];
  }
}

function rewriteToGo(mod: NitroModule): GoModule {
  const components = new Set(
    mod.definitions
      .filter(
        (x): x is FunctionDefinition =>
          x.kind === "FunctionDefinition" &&
          x.type.kind === "FunctionType" &&
          x.type.to.kind === "HTMLType"
      )
      .map((x) => x.name)
  );

  return {
    kind: "GoModule",
    definitions: mod.definitions.flatMap((x) => def(x, components)),
  };
}

class Context {
  private scopes: Map<string, Type>[] = [];

  constructor(initial?: Map<string, Type>) {
    this.scopes.push(initial ?? new Map());
  }

  private current() {
    return this.scopes[this.scopes.length - 1];
  }

  get(name: string): Type | null {
    for (let i = this.scopes.length; i-- > 0; ) {
      if (this.scopes[i].has(name)) {
        return this.scopes[i].get(name)!;
      }
    }
    return null;
  }

  set(name: string, type: Type): boolean {
    if (this.current().has(name)) return false;
    this.current().set(name, type);
    return true;
  }

  push(...maps: Map<string, Type>[]) {
    this.scopes.push(...(maps.length === 0 ? [new Map()] : maps));
  }

  pop(n = 1) {
    return Array.from({ length: n }).map(() => this.scopes.pop()!);
  }

  load(...maps: Map<string, Type>[]) {
    const old = this.scopes;
    this.scopes = maps;
    return () => {
      this.load(...old);
    };
  }

  under<T>(f: () => T, ...maps: Map<string, Type>[]) {
    const reset = this.load(...maps);
    const res = f();
    reset();
    return res;
  }

  pushPop<T>(f: () => T, ...maps: Map<string, Type>[]) {
    this.push(...maps);
    const res = f();
    this.pop(maps.length);
    return res;
  }

  private matchPrefix(prefix: string): Map<string, Type>[] {
    const maps: Map<string, Type>[] = [];

    for (const map of this.scopes) {
      const m = new Map<string, Type>();
      for (const [n, t] of map.entries()) {
        if (n.startsWith(prefix)) {
          m.set(n, t);
        }
      }
      if (m.size > 0) {
        maps.push(m);
      }
    }

    return maps;
  }

  onlySql() {
    return this.load(...this.matchPrefix("sql_"));
  }
}

function bidiffByName<T extends { name: string }, V extends { name: string }>(
  truth: T[],
  real: V[]
) {
  const lNames = new Set(truth.map((x) => x.name));
  const rNames = new Set(real.map((x) => x.name));

  return {
    extra: real.filter((x) => !lNames.has(x.name)),
    missing: truth.filter((x) => !rNames.has(x.name)),
    same: real
      .filter((x) => lNames.has(x.name))
      .map((x) => ({ ...x, ...truth.find((y) => y.name === x.name)! })),
  };
}

function sqlExprName(e: SQLExpression, i: number): string {
  switch (e.kind) {
    case "SQLColumnIdentifierExpression":
    case "SQLIdentifierExpression":
      return e.name;
    case "SQLIntegerExpression":
    case "SQLStringExpression":
    case "SQLSelectExpression":
    case "SQLBooleanExpression":
    case "CaptureExpression":
    case "SQLInfixExpression":
      return `column${i + 1}`;
    case "SQLColumnExpression":
    case "SQLFromExpression":
    case "SQLInsertExpression":
    case "SQLDeleteExpression":
    case "SQLPackExpression":
    case "SQLWhereExpression":
      throw new Error(`wtf`);
  }
}

function typeEquals(l: Type, r: Type): boolean {
  switch (l.kind) {
    case "StringType":
      return r.kind === "StringType";
    case "IntegerType":
      return r.kind === "IntegerType";
    case "BooleanType":
      return r.kind === "BooleanType";
    case "HTMLType":
      return r.kind === "HTMLType";
    case "FunctionType":
      return (
        r.kind === "FunctionType" &&
        typeEquals(
          { kind: "StructType", properties: l.from },
          { kind: "StructType", properties: r.from }
        ) &&
        typeEquals(l.to, r.to)
      );
    case "IteratorType":
      return r.kind === "IteratorType" && typeEquals(l.type, r.type);
    case "IntrinsicType":
      return r.kind === "IntrinsicType";
    case "IdentifierType":
      return r.kind === "IdentifierType" && l.name === r.name;
    case "StructType": {
      if (
        !(
          r.kind === "StructType" && l.properties.length === r.properties.length
        )
      )
        return false;
      return l.properties.every((p) => {
        const rp = r.properties.find((x) => x.name === p.name)?.type;
        return rp === undefined ? false : typeEquals(p.type, rp);
      });
    }
    case "UnknownType":
      return false;
  }
}

function inferAndTypeCheck(mod: UntypedNitroModule): NitroModule {
  const errors: string[] = [];

  function extractNamedTypes(d: UntypedDefinition): [string, Type][] {
    switch (d.kind) {
      case "UntypedDeclareDefinition":
        return extractNamedTypes(d.definition);
      case "UntypedStructDefinition":
        return [[d.name, { kind: "StructType", properties: d.properties }]];
      case "UntypedFunctionDefinition":
      case "UntypedHTTPDefinition":
      case "UntypedTableDefinition":
      case "UntypedRawGoSourceDefinition":
      case "UntypedRawGoSourceImportDefinition":
        return [];
    }
  }

  const _namedTypes = mod.definitions.flatMap(extractNamedTypes);
  const namedTypes = new Map<string, Type>();
  for (const [name, ty] of _namedTypes) {
    if (namedTypes.has(name)) {
      errors.push(`type ${name} is already defined`);
    }
    namedTypes.set(name, ty);
  }

  function resolveType(t: Type): Type {
    switch (t.kind) {
      case "StringType":
      case "IntegerType":
      case "BooleanType":
      case "HTMLType":
      case "IntrinsicType":
      case "UnknownType":
        return t;
      case "FunctionType":
        return {
          kind: "FunctionType",
          from: t.from.map((x) => ({
            name: x.name,
            type: resolveType(x.type),
          })),
          to: resolveType(t.to),
        };
      case "IteratorType":
        return { kind: "IteratorType", type: resolveType(t.type) };
      case "IdentifierType":
        if (namedTypes.has(t.name)) return namedTypes.get(t.name)!;
        errors.push(`Unknown type ${t.name}`);
        return t;
      case "StructType":
        return {
          kind: "StructType",
          properties: t.properties.map((x) => ({
            name: x.name,
            type: resolveType(x.type),
          })),
        };
    }
  }

  function extractTables(d: UntypedDefinition): [string, Type][] {
    switch (d.kind) {
      case "UntypedFunctionDefinition":
      case "UntypedHTTPDefinition":
      case "UntypedDeclareDefinition":
      case "UntypedStructDefinition":
      case "UntypedRawGoSourceDefinition":
      case "UntypedRawGoSourceImportDefinition":
        return [];
      case "UntypedTableDefinition":
        return [[d.name, d.type]];
    }
  }

  const _tables = mod.definitions.flatMap(extractTables);
  const tables = new Map<string, StructType>();
  for (const [name, ty] of _tables) {
    if (tables.has(name)) {
      errors.push(`table ${name} is already defined`);
    }
    const resolvedType = resolveType(ty);
    if (resolvedType.kind !== "StructType") {
      errors.push(
        `table ${name} needs to be a struct type is ${resolvedType.kind}`
      );
    }
    tables.set(name, resolvedType as StructType);
  }

  function extractFunctionInfo(d: UntypedDefinition): [string, Type][] {
    switch (d.kind) {
      case "UntypedFunctionDefinition":
        return [
          [
            d.name,
            {
              kind: "FunctionType",
              from: d.parameters,
              to: d.returnType,
            },
          ],
        ];
      case "UntypedDeclareDefinition":
        return extractFunctionInfo(d.definition);
      case "UntypedHTTPDefinition":
      case "UntypedStructDefinition":
      case "UntypedTableDefinition":
      case "UntypedRawGoSourceDefinition":
      case "UntypedRawGoSourceImportDefinition":
        return [];
    }
  }

  const functions = new Map(mod.definitions.flatMap(extractFunctionInfo));

  const ctx = new Context(functions);

  let inDeclare = false;

  function attrs(
    tag: string,
    a: { name: string; value: UntypedSubHTMLExpression }[]
  ): { name: string; value: SubHTMLExpression }[] {
    const componentType = functions.get(tag);

    const attributes = a.map((x) => ({
      name: x.name,
      value: htmlExpr(x.value),
    }));

    if (componentType === undefined || componentType.kind !== "FunctionType") {
      errors.push(
        `unknown html element ${tag}, are you missing a component or do you need to declare a web component?`
      );
    } else {
      if (componentType.to.kind !== "HTMLType") {
        errors.push(
          `Cannot use a non component function as an html element, there is a function with the name of ${tag} but it is not an component since it returns ${componentType.to.kind} instead of HTML`
        );
      }

      const parameters = componentType.from.filter(
        (x) => x.name !== "children"
      );

      const params: { name: string; type: Type }[] = [];

      const { extra, missing, same } = bidiffByName(parameters, attributes);
      const wildcardParameter = parameters.find((x) => x.name === "_");
      if (extra.length !== 0) {
        for (const x of extra) {
          if (wildcardParameter !== undefined) {
            if (x.value.type.kind !== wildcardParameter.type.kind) {
              errors.push(
                `in html element ${tag}, attribute ${x.name} expected ${x.value.type.kind} but got ${x.value.type.kind}`
              );
            } else {
              params.push({ name: x.name, type: wildcardParameter.type });
            }
          } else {
            errors.push(`unknown attribute ${x.name} for html element ${tag}`);
          }
        }
      }
      if (missing.length !== 0) {
        for (const x of missing) {
          if (x.name !== "_" || wildcardParameter === undefined) {
            errors.push(`missing attribute ${x.name} for html element ${tag}`);
          }
        }
      }
      for (const x of same) {
        if (x.value.type.kind !== x.type.kind) {
          errors.push(
            `in html element ${tag}, attribute ${x.name} expected ${x.type.kind} but got ${x.value.type.kind}`
          );
        } else {
          params.push(x);
        }
      }

      // sort the attributes
      const next = [];
      for (const x of params) {
        next.push(attributes[attributes.findIndex((y) => y.name === x.name)!]);
      }
      return next;
    }

    return [];
  }

  function htmlExpr(e: UntypedSubHTMLExpression): SubHTMLExpression {
    switch (e.kind) {
      case "UntypedHTMLBlockExpression":
        if (e.openTag !== e.closeTag) {
          errors.push(
            `html block opening tag does not match close tag, ${e.openTag} != ${e.closeTag}`
          );
        }

        return {
          kind: "HTMLBlockExpression",
          tag: e.openTag,
          attributes: attrs(e.openTag, e.attributes),
          expressions: e.expressions.map(htmlExpr),
          type: {
            kind: "HTMLType",
          },
        };
      case "UntypedHTMLExpression": {
        return {
          kind: "HTMLExpression",
          attributes: attrs(e.tag, e.attributes),
          tag: e.tag,
          type: {
            kind: "HTMLType",
          },
        };
      }
      case "UntypedHTMLTextExpression":
        return {
          kind: "HTMLTextExpression",
          type: { kind: "HTMLType" },
          value: e.value,
        }; // lets try this as html type aka static string
      case "UntypedStringExpression":
        return expr(e) as StringExpression;
      case "UntypedCaptureExpression": {
        const expression = expr(e.expression);
        return {
          kind: "CaptureExpression",
          expression,
          type: expression.type,
        };
      }
    }
  }

  function applicationType(func: Type, args: Type[]): Type {
    let type: Type = { kind: "UnknownType" };
    if (func.kind === "FunctionType") {
      if (args.length === func.from.length) {
        type = func.to;
        for (const [i, arg] of args.entries()) {
          if (!typeEquals(func.from[i].type, arg)) {
            type = { kind: "UnknownType" };
            errors.push(
              `argument ${i} expected ${func.from[i].type.kind} received ${arg.kind}`
            );
          }
        }
      } else {
        errors.push(
          `Cannot call function expected ${func.from.length} arguments received ${args.length} arguments`
        );
      }
    } else {
      errors.push(
        `Cannot call an expression which does not have a function type`
      );
    }

    return type;
  }

  function sqlInfixFuncName(op: SQLInfixOperator): string {
    switch (op) {
      case "=":
        return `sql_op_eq`;
      case "!=":
        return `sql_op_neq`;
      case "is":
        return `sql_op_is`;
      case "<":
        return `sql_op_lt`;
      case ">":
        return `sql_op_gt`;
      case "<=":
        return `sql_op_lteq`;
      case ">=":
        return `sql_op_gteq`;
      case "+":
        return `sql_op_add`;
      case "-":
        return `sql_op_sub`;
      case "*":
        return `sql_op_mul`;
      case "/":
        return `sql_op_div`;
      case "%":
        return `sql_op_mod`;
      case "and":
        return `sql_op_and`;
      case "or":
        return `sql_op_or`;
    }
  }

  function sqlExpr(e: UntypedSQLExpression): SQLExpression {
    switch (e.kind) {
      case "UntypedSQLDeleteExpression": {
        const restore = ctx.onlySql();

        let table = sqlExpr(e.table) as SQLFromExpression;
        const rt = resolveType(table.type);
        if (rt.kind === "StructType") {
          ctx.push(new Map(rt.properties.map((x) => [x.name, x.type])));
        } else {
          errors.push(`SQL from needs to be a struct type`);
        }

        const where: SQLWhereExpression | undefined =
          e.where === undefined
            ? undefined
            : (sqlExpr(e.where) as SQLWhereExpression);

        restore();

        return {
          kind: "SQLDeleteExpression",
          table,
          where,
          type: { kind: "IdentifierType", name: "error" },
        };
      }
      case "UntypedSQLInfixExpression": {
        const left = sqlExpr(e.left);
        const right = sqlExpr(e.right);
        const type = applicationType(
          expr({
            kind: "UntypedIdentifierExpression",
            name: sqlInfixFuncName(e.op),
          }).type,
          [left.type, right.type]
        );

        return {
          kind: "SQLInfixExpression",
          left,
          op: e.op,
          right,
          type,
        };
      }
      case "UntypedSQLWhereExpression": {
        const cond = sqlExpr(e.cond);
        if (cond.type.kind !== "BooleanType") {
          errors.push(
            `where condition needs to have type bool found: ${cond.type.kind}`
          );
        }

        return {
          kind: "SQLWhereExpression",
          cond,
          type: cond.type,
        };
      }
      case "UntypedCaptureExpression": {
        const expression = expr(e.expression);
        return {
          kind: "CaptureExpression",
          expression,
          type: expression.type,
        };
      }
      case "UntypedSQLSelectExpression": {
        const restore = ctx.onlySql();

        let from: SQLFromExpression | undefined = undefined;
        if (e.from !== undefined) {
          from = sqlExpr(e.from) as SQLFromExpression;
          const rt = resolveType(from.type);
          if (rt.kind === "StructType") {
            ctx.push(new Map(rt.properties.map((x) => [x.name, x.type])));
          } else {
            errors.push(`SQL from needs to be a struct type`);
          }
        }

        const columns = e.columns.map((x) => sqlExpr(x) as SQLColumnExpression);

        const type: IteratorType = {
          kind: "IteratorType",
          type: {
            kind: "StructType",
            properties: columns.map((x, i) => ({
              name: x.alias ?? sqlExprName(x.expression, i),
              type: x.type,
            })),
          },
        };

        const where: SQLWhereExpression | undefined =
          e.where === undefined
            ? undefined
            : (sqlExpr(e.where) as SQLWhereExpression);

        restore();

        return {
          kind: "SQLSelectExpression",
          from,
          columns,
          where,
          type,
        };
      }
      case "UntypedSQLInsertExpression": {
        const restore = ctx.onlySql();

        let table = sqlExpr(e.table) as SQLFromExpression;
        const rt = resolveType(table.type);
        if (rt.kind === "StructType") {
          ctx.push(new Map(rt.properties.map((x) => [x.name, x.type])));
        } else {
          errors.push(`SQL from needs to be a struct type`);
        }

        const columns = e.columns.values.map((x) => {
          const val = sqlExpr(x);
          switch (x.kind) {
            case "UntypedSQLIdentifierExpression":
            case "UntypedSQLColumnIdentifierExpression":
              return val;
            default:
              errors.push(`invalid sql expression in insert columns`);
              return val;
          }
        });

        restore();

        const values = e.values.map(sqlExpr) as SQLPackExpression[];

        for (const [i, pack] of values.entries()) {
          if (pack.values.length === columns.length) {
            for (const [j, v] of pack.values.entries()) {
              if (!typeEquals(v.type, columns[j].type)) {
                errors.push(
                  `insert values pack ${i} entry ${j} expected type ${columns[j].type.kind} found ${v.type.kind}`
                );
              }
            }
          } else {
            errors.push(
              `insert values pack ${i} expected ${columns.length} values received ${pack.values.length}`
            );
          }
        }

        return {
          kind: "SQLInsertExpression",
          table,
          columns: {
            kind: "SQLPackExpression",
            type: { kind: "IntrinsicType" },
            values: columns,
          },
          values,
          type: { kind: "IdentifierType", name: "error" },
        };
      }
      case "UntypedSQLIdentifierExpression": {
        let type = ctx.get(e.name);
        if (type === null) {
          errors.push(`Unknown sql identifier ${e.name}`);
          type = { kind: "UnknownType" };
        }

        return {
          kind: "SQLIdentifierExpression",
          name: e.name,
          type,
        };
      }
      case "UntypedSQLColumnIdentifierExpression": {
        let type = ctx.get(e.name);
        if (type === null) {
          errors.push(`Unknown sql column ${e.name}`);
          type = { kind: "UnknownType" };
        }

        return {
          kind: "SQLColumnIdentifierExpression",
          name: e.name,
          type,
        };
      }
      case "UntypedSQLIntegerExpression":
        return {
          kind: "SQLIntegerExpression",
          value: e.value,
          type: { kind: "IntegerType" },
        };
      case "UntypedSQLStringExpression":
        return {
          kind: "SQLStringExpression",
          value: e.value,
          type: { kind: "StringType" },
        };
      case "UntypedSQLColumnExpression": {
        const expression = sqlExpr(e.expression);
        return {
          kind: "SQLColumnExpression",
          expression,
          alias: e.alias,
          type: expression.type,
        };
      }
      case "UntypedSQLFromExpression": {
        const table = ctx.under(() => sqlExpr(e.table), tables);

        return {
          kind: "SQLFromExpression",
          table,
          type: table.type,
          alias: e.alias,
        };
      }
      case "UntypedSQLPackExpression": {
        const values = e.values.map(sqlExpr);
        return {
          kind: "SQLPackExpression",
          type: {
            kind: "StructType",
            properties: values.map((x) => ({ name: "", type: x.type })),
          },
          values,
        };
      }
    }
  }

  function expr(e: UntypedExpression): Expression {
    switch (e.kind) {
      case "UntypedHTMLBlockExpression":
      case "UntypedHTMLExpression":
        return htmlExpr(e) as HTMLBlockExpression | HTMLExpression;
      case "UntypedSQLSelectExpression":
      case "UntypedSQLInsertExpression":
      case "UntypedSQLDeleteExpression":
        return sqlExpr(e) as Expression;
      case "UntypedCaptureExpression": {
        const expression = expr(e.expression);
        return {
          kind: "CaptureExpression",
          expression,
          type: expression.type,
        };
      }
      case "UntypedIntegerExpression":
        return {
          kind: "IntegerExpression",
          value: e.value,
          type: { kind: "IntegerType" },
        };
      case "UntypedStringExpression": {
        const parts = e.parts.map((x) =>
          typeof x === "string" ? x : (expr(x) as CaptureExpression)
        );

        let type: Type = { kind: "StringType" };

        for (const [i, p] of parts.entries()) {
          if (typeof p !== "string" && p.type.kind !== "StringType") {
            errors.push(
              `part ${i} of string is not a string type found ${p.type.kind}`
            );
            type = { kind: "UnknownType" };
          }
        }

        return {
          kind: "StringExpression",
          parts,
          type,
        };
      }
      case "UntypedIdentifierExpression": {
        if (inDeclare && ["intrinsic"].includes(e.name)) {
          return {
            kind: "IdentifierExpression",
            name: e.name,
            type: {
              kind: "IntrinsicType",
            },
          };
        }

        const ty = ctx.get(e.name);
        if (ty === null) {
          errors.push(`unknown variable: ${e.name}`);
          return {
            kind: "IdentifierExpression",
            name: e.name,
            type: { kind: "UnknownType" },
          };
        }
        return { kind: "IdentifierExpression", name: e.name, type: ty };
      }
      case "UntypedForExpression": {
        const iter = expr(e.iterable);
        if (iter.type.kind !== "IteratorType") {
          errors.push(`for loop expected an iterator, got ${iter.type.kind}`);
        }

        const expression = ctx.pushPop(
          () => expr(e.expression),
          new Map([
            [
              e.name,
              iter.type.kind === "IteratorType"
                ? iter.type.type
                : { kind: "UnknownType" },
            ],
          ])
        );

        return {
          kind: "ForExpression",
          name: e.name,
          iterable: iter,
          expression,
          type: {
            kind: "IteratorType",
            type: expression.type,
          },
        };
      }
      case "UntypedLetExpression": {
        const next = expr(e.expression);
        if (!ctx.set(e.name, next.type)) {
          errors.push(`Variable ${e.name} already is defined`);
          return {
            kind: "LetExpression",
            expression: next,
            name: e.name,
            type: { kind: "UnknownType" },
          };
        }
        if (e.type !== undefined && e.type.kind !== next.type.kind) {
          errors.push(
            `Type kind ${next.type.kind} is not assignable to type kind ${e.type.kind}`
          );
          return {
            kind: "LetExpression",
            expression: next,
            name: e.name,
            type: { kind: "UnknownType" },
          };
        }
        return {
          kind: "LetExpression",
          expression: next,
          name: e.name,
          type: next.type,
        };
      }
      case "UntypedAddExpression": {
        const left = expr(e.left);
        const right = expr(e.right);

        if (
          left.type.kind === "IntegerType" &&
          right.type.kind === "IntegerType"
        ) {
          return {
            kind: "AddExpression",
            left,
            right,
            type: { kind: "IntegerType" },
          };
        } else if (
          left.type.kind === "StringType" &&
          right.type.kind === "StringType"
        ) {
          return {
            kind: "AddExpression",
            left,
            right,
            type: { kind: "IntegerType" },
          };
        } else {
          errors.push(
            `Cannot add Type kind ${left.type.kind} with type kind ${right.type.kind}`
          );
          return {
            kind: "AddExpression",
            left,
            right,
            type: { kind: "UnknownType" },
          };
        }
      }
      case "UntypedBlockExpression": {
        if (e.expressions.length === 0) {
          return {
            kind: "BlockExpression",
            expressions: [
              {
                kind: "IdentifierExpression",
                name: "nil",
                type: { kind: "IdentifierType", name: "error" },
              },
            ],
            type: { kind: "IdentifierType", name: "error" },
          };
        }

        const expressions = ctx.pushPop(() => e.expressions.map(expr));
        const type = expressions[expressions.length - 1].type;

        return {
          kind: "BlockExpression",
          expressions,
          type,
        };
      }
      case "UntypedCallExpression": {
        const left = expr(e.left);
        const ty = resolveType(left.type);
        const args = e.args.map(expr);
        let type = applicationType(
          ty,
          args.map((x) => x.type)
        );

        return {
          kind: "CallExpression",
          args,
          left,
          type,
        };
      }
      case "UntypedDotExpression": {
        const l = expr(e.left);
        const ty = resolveType(l.type);
        let type: Type = { kind: "UnknownType" };

        if (ty.kind === "StructType") {
          const prop = ty.properties.find((x) => x.name === e.name);
          if (prop !== undefined) {
            type = prop.type;
          } else {
            errors.push(
              `property ${e.name} does not exist on type: ${JSON.stringify(
                ty.properties
              )}`
            );
          }
        } else {
          errors.push("Cannot dot a non struct like expression");
        }

        return {
          kind: "DotExpression",
          left: l,
          name: e.name,
          type,
        };
      }
    }
  }

  function def(d: UntypedDefinition): Definition {
    switch (d.kind) {
      case "UntypedFunctionDefinition": {
        const expression = ctx.pushPop(
          () => expr(d.expression),
          new Map(d.parameters.map((x) => [x.name, x.type]))
        );

        if (
          !(inDeclare && expression.type.kind === "IntrinsicType") &&
          d.returnType.kind !== expression.type.kind
        ) {
          errors.push(
            `function ${d.name} declared with return type ${d.returnType.kind} but function really returns ${expression.type.kind}`
          );
        }

        return {
          kind: "FunctionDefinition",
          expression,
          name: d.name,
          parameters: d.parameters,
          type: {
            kind: "FunctionType",
            from: d.parameters,
            to: expression.type,
          },
        };
      }
      case "UntypedHTTPDefinition": {
        const expression = ctx.pushPop(
          () => expr(d.expression),
          new Map(
            d.endpoint
              .filter(
                (x): x is HTTPVariablePath => x.kind === "HTTPVariablePath"
              )
              // by default all variables are strings
              .map((x) => [x.name, { kind: "StringType" }])
          ),
          new Map(d.parameters.map((x) => [x.name, x.type]))
        );
        return {
          kind: "HTTPDefinition",
          verb: d.verb,
          endpoint: d.endpoint,
          parameters: d.parameters,
          expression,
        };
      }
      case "UntypedDeclareDefinition": {
        inDeclare = true;
        const definition = def(d.definition);
        inDeclare = false;
        return {
          kind: "DeclareDefinition",
          definition,
        };
      }
      case "UntypedRawGoSourceDefinition":
        return {
          kind: "RawGoSourceDefinition",
          source: d.source,
        };
      case "UntypedRawGoSourceImportDefinition":
        return {
          kind: "RawGoSourceImportDefinition",
          source: d.source,
        };
      case "UntypedTableDefinition":
        return {
          ...d,
          kind: "TableDefinition",
        };
      case "UntypedStructDefinition":
        return {
          ...d,
          kind: "StructDefinition",
        };
    }
  }

  const definitions = mod.definitions.map(def);

  if (errors.length !== 0) {
    throw errors.join("\n\n");
  }

  return {
    kind: "NitroModule",
    definitions,
  };
}

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
    = function_definition
    / http_definition
    / declare_definition
    / struct_definition
    / table_definition
    / raw_go_import_definition
    / raw_go_definition

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
    = "declare" __ definition: definition
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

function parse(content: string): UntypedNitroModule {
  return parser.parse(content);
}

async function main(args: string[]) {
  try {
    await rm("out", { recursive: true });
  } catch {}
  await mkdir("out");
  await mkdir("out/log");

  const nitroSource = (await readFile(args[0])).toString();

  const untypedMod = parse(nitroSource);
  const typedMod = inferAndTypeCheck(untypedMod);
  const goMod = rewriteToGo(typedMod);

  // await writeFile("out/input.json", JSON.stringify(mod, undefined, 2));
  // await writeFile("out/go.json", JSON.stringify(goMod, undefined, 2));
  await writeFile("out/main.go", toGoMainModule(goMod));
  await writeFile("out/go.mod", toGoMod());
  await writeFile("out/go.sum", toGoSum());
}

main(process.argv.slice(2)).catch((e) => console.error(e));
