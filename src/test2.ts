import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { generate } from "peggy";

type UntypedNitroModule = {
  kind: "UntypedNitroModule";
  definitions: UntypedDefinition[];
};

type UntypedDefinition =
  | UntypedFunctionDefinition
  | UntypedHTTPDefinition
  | UntypedDeclareDefinition
  | UntypedTableDefinition
  | UntypedStructDefinition;

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
  | UntypedHTMLCaptureExpression;

type UntypedExpression =
  | UntypedHTMLBlockExpression
  | UntypedHTMLExpression
  | UntypedIntegerExpression
  | UntypedStringExpression
  | UntypedIdentifierExpression
  | UntypedForExpression
  | UntypedLetExpression
  | UntypedSQLSelectExpression
  | UntypedBlockExpression
  | UntypedAddExpression;

type UntypedSQLExpression =
  | UntypedSQLIdentifierExpression
  | UntypedSQLColumnIdentifierExpression
  | UntypedSQLIntegerExpression
  | UntypedSQLStringExpression
  | UntypedSQLColumnExpression
  | UntypedSQLBooleanExpression
  | UntypedSQLFromExpression
  | UntypedSQLSelectExpression;

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

type UntypedHTMLCaptureExpression = {
  kind: "UntypedHTMLCaptureExpression";
  expression: UntypedExpression;
};

type UntypedIntegerExpression = {
  kind: "UntypedIntegerExpression";
  value: number;
};

type UntypedStringExpression = {
  kind: "UntypedStringExpression";
  value: string;
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

type Type =
  | StringType
  | IntegerType
  | HTMLType
  | FunctionType
  | IteratorType
  | IntrinsicType
  | IdentifierType
  | StructType
  | UnknownType;

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
  | TableDefinition;

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
  endpoint: HTTPPath[];
  verb: HTTPVerb;
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
  | HTMLCaptureExpression;

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
  | AddExpression;

type SQLExpression =
  | SQLIdentifierExpression
  | SQLColumnIdentifierExpression
  | SQLIntegerExpression
  | SQLStringExpression
  | SQLBooleanExpression
  | SQLColumnExpression
  | SQLFromExpression
  | SQLSelectExpression;

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

type HTMLCaptureExpression = {
  kind: "HTMLCaptureExpression";
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
  value: string;
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

type GoModule = {
  kind: "GoModule";
  definitions: GoDefinition[];
};

type GoDefinition =
  | GoFunctionDefinition
  | GoHTTPDefinition
  | GoStructDefinition;

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
  endpoint: HTTPPath[];
  verb: HTTPVerb;
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
  | GoAddExpression;

type GoType =
  | GoStringType
  | GoComponentType
  | GoIntegerType
  | GoErrorType
  | GoStructType
  | GoIdentifierType
  | GoContextType
  | GoIteratorType;

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

type GoAddExpression = {
  kind: "GoAddExpression";
  left: GoExpression;
  right: GoExpression;
};

function writeStringExpr(value: string): GoExpression;
function writeStringExpr(value: GoExpression): GoExpression;
function writeStringExpr(value: string | GoExpression): GoExpression {
  return {
    kind: "GoApplicationExpression",
    func: { kind: "GoIdentifierExpression", name: "WriteString" },
    args: [
      { kind: "GoIdentifierExpression", name: "c" },
      typeof value === "string" ? { kind: "GoStringExpression", value } : value,
    ],
  };
}

function writeIntegerExpr(value: number): GoExpression;
function writeIntegerExpr(value: GoExpression): GoExpression;
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

function sqlQuery(e: SQLExpression): string {
  switch (e.kind) {
    case "SQLIdentifierExpression":
      return e.name;
    case "SQLColumnIdentifierExpression":
      return `"${e.name}"`;
    case "SQLIntegerExpression":
      return `${e.value}`;
    case "SQLStringExpression":
      return e.value;
    case "SQLBooleanExpression":
      return `${e.value}`;
    case "SQLColumnExpression":
      return e.alias === undefined
        ? sqlQuery(e.expression)
        : `${sqlQuery(e.expression)} as "${e.alias}"`;
    case "SQLFromExpression":
      return e.alias === undefined
        ? sqlQuery(e.table)
        : `${sqlQuery(e.table)} as "${e.alias}"`;
    case "SQLSelectExpression":
      return `select ${e.columns.map(sqlQuery).join(", ")}${
        e.from === undefined ? "" : ` from ${sqlQuery(e.from)}`
      }`;
  }
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
        case "HTMLCaptureExpression":
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
        case "StringExpression":
          return promote ? writeStringExpr(e.value) : expr(e);
      }
    };
    return imp(e);
  }

  function sql(e: SQLSelectExpression): GoExpression {
    switch (e.kind) {
      case "SQLSelectExpression": {
        const name = nextGeneratedName();
        const ty = type(e.type);
        const query = sqlQuery(e);

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
          parameters: [], // should match the capture args,
          ret: ty,
          expression: {
            kind: "GoSourceExpression",
            source: `\
var obj ${innerType}
rows, err = db.Query(${query}, )
if err != nil {
  panic("bad query: " + err.Error())
}
return func(f func(${innerType}) error) (bool, error) {
  if rows.Next() {
    rows.scan(${e.type.type.properties.map((x) => `&obj.${x.name}`).join(", ")})
    return false, f(obj)
  }
  else {
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
          args: [], // todo these should be the capture args
        };
      }
    }
  }

  function expr(e: Expression): GoExpression {
    switch (e.kind) {
      case "HTMLBlockExpression":
      case "HTMLExpression":
        return html(e);
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
      case "StringExpression":
        return { kind: "GoStringExpression", value: e.value };
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

        return {
          kind: "GoForExpression",
          name: e.name,
          iterable: expr(e.iterable),
          expression: expr(e.expression),
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
          kind: "GoAddExpression",
          left: expr(e.left),
          right: expr(e.right),
        };
      case "SQLSelectExpression":
        return sql(e);
    }
  }

  return [expr(e), defs];
}

function expandPathParameters(paths: HTTPPath[]): string {
  const parameters = paths.flatMap((x): string[] => {
    switch (x.kind) {
      case "HTTPConstantPath":
        return [];
      case "HTTPVariablePath":
        return [x.name];
    }
  });

  return (
    parameters.map((x) => `${x} := ""`).join("\n") +
    `
if err := echo.PathParamsBinder(c)${parameters
      .map((x) => `.String("${x}", &${x})`)
      .join("")}.BindError(); err != nil {
  return c.String(http.StatusBadRequest, "bad request")
}
`
  );
}

function toGoSource(e: GoExpression | GoType | GoDefinition): string {
  switch (e.kind) {
    case "GoComponentType":
      return `Component`;
    case "GoStringType":
      return `string`;
    case "GoIntegerType":
      return `int`;
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
        .map((x) => `\t${x.name} ${toGoSource(x.type)}`)
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
        .join("")}", func (c echo.Context) error {\n ${expandPathParameters(
        e.endpoint
      )}\nreturn ${toGoSource(e.expression)} \n})`;
    case "GoStructDefinition":
      return `type ${e.name} ${toGoSource({
        kind: "GoStructType",
        properties: e.properties,
      })}`;

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
    case "GoAddExpression":
      return `(${toGoSource(e.left)}+${toGoSource(e.right)})`;
  }
}

function splitGoDefinitions(defs: GoDefinition[]): {
  http: GoDefinition[];
  nonHttp: GoDefinition[];
} {
  const nonHttp: GoDefinition[] = [];
  const http: GoDefinition[] = [];

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
      }
    })();
  }

  return {
    nonHttp,
    http,
  };
}

function toGoMainModule(mod: GoModule): string {
  const { http, nonHttp } = splitGoDefinitions(mod.definitions);

  return `\
package main

import (
  "strconv"
  "net/http"
  "database/sql"

	"github.com/labstack/echo/v4"
  _ "github.com/lib/pq"
)


// start standard prelude

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

function toGoMod() {
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

function type(t: Type): GoType {
  switch (t.kind) {
    case "StringType":
      return { kind: "GoStringType" };
    case "IntegerType":
      return { kind: "GoIntegerType" };
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
          endpoint: d.endpoint,
          verb: d.verb,
          expression: e,
        },
      ];
    }
    case "DeclareDefinition":
    case "TableDefinition":
      return [];
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
      return e.name;
    case "SQLIdentifierExpression":
    case "SQLIntegerExpression":
    case "SQLStringExpression":
    case "SQLSelectExpression":
    case "SQLBooleanExpression":
      return `column_${i + 1}`;
    case "SQLColumnExpression":
    case "SQLFromExpression":
      throw new Error(`wtf`);
  }
}

function inferAndTypeCheck(mod: UntypedNitroModule): NitroModule {
  const errors: string[] = [];

  function extractNamedTypes(d: UntypedDefinition): [string, Type][] {
    switch (d.kind) {
      case "UntypedFunctionDefinition":
      case "UntypedHTTPDefinition":
      case "UntypedDeclareDefinition":
      case "UntypedTableDefinition":
        return [];
      case "UntypedStructDefinition":
        return [[d.name, { kind: "StructType", properties: d.properties }]];
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

  function extractComponentInfo(d: UntypedDefinition): [string, Type][] {
    switch (d.kind) {
      case "UntypedFunctionDefinition":
        if (d.returnType.kind === "HTMLType") {
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
        } else return [];
      case "UntypedDeclareDefinition":
        return extractComponentInfo(d.definition);
      case "UntypedHTTPDefinition":
      case "UntypedStructDefinition":
      case "UntypedTableDefinition":
        return [];
    }
  }

  const components = new Map(mod.definitions.flatMap(extractComponentInfo));

  const ctx = new Context(components);

  let inDeclare = false;

  function attrs(
    tag: string,
    a: { name: string; value: UntypedSubHTMLExpression }[]
  ): { name: string; value: SubHTMLExpression }[] {
    const componentType = components.get(tag);

    const attributes = a.map((x) => ({
      name: x.name,
      value: htmlExpr(x.value),
    }));

    if (componentType === undefined || componentType.kind !== "FunctionType") {
      errors.push(
        `unknown html element ${tag}, are you missing a component or do you need to declare a web component?`
      );
    } else {
      const parameters = componentType.from.filter(
        (x) => x.name !== "children"
      );

      const { extra, missing, same } = bidiffByName(parameters, attributes);
      if (extra.length !== 0) {
        for (const x of extra) {
          errors.push(`unknown attribute ${x.name} for html element ${tag}`);
        }
      }
      if (missing.length !== 0) {
        for (const x of missing) {
          errors.push(`missing attribute ${x.name} for html element ${tag}`);
        }
      }
      for (const x of same) {
        if (x.value.type.kind !== x.type.kind) {
          errors.push(
            `in html element ${tag}, attribute ${x.name} expected ${x.type.kind} but got ${x.value.type.kind}`
          );
        }
      }

      // sort the attributes
      if (extra.length === 0 && missing.length === 0) {
        const next = [];
        for (const x of parameters) {
          next.push(
            attributes[attributes.findIndex((y) => y.name === x.name)!]
          );
        }
        return next;
      }
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
      case "UntypedHTMLCaptureExpression": {
        const expression = expr(e.expression);
        return {
          kind: "HTMLCaptureExpression",
          expression,
          type: expression.type,
        };
      }
    }
  }

  function sqlExpr(e: UntypedSQLExpression): SQLExpression {
    switch (e.kind) {
      case "UntypedSQLIdentifierExpression":
        throw new Error(`TODO typecheck UntypedSQLIdentifierExpression`);
      // return { kind: "SQLIdentifierExpression", name: e.name, type: {} };
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
      case "UntypedSQLSelectExpression": {
        const restore = ctx.load();

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

        restore();

        return {
          kind: "SQLSelectExpression",
          from,
          columns,
          type,
        };
      }
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
    }
  }

  function expr(e: UntypedExpression): Expression {
    switch (e.kind) {
      case "UntypedHTMLBlockExpression":
      case "UntypedHTMLExpression":
        return htmlExpr(e) as HTMLBlockExpression | HTMLExpression;
      case "UntypedSQLSelectExpression":
        return sqlExpr(e) as SQLSelectExpression;
      case "UntypedIntegerExpression":
        return {
          kind: "IntegerExpression",
          value: e.value,
          type: { kind: "IntegerType" },
        };
      case "UntypedStringExpression":
        return {
          kind: "StringExpression",
          value: e.value,
          type: { kind: "StringType" },
        };
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
          )
        );
        return {
          kind: "HTTPDefinition",
          expression,
          endpoint: d.endpoint,
          verb: d.verb,
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
    / integer_type
    / html_type
    / identifier_type

  string_type
    = "str"
    { return { kind: "StringType" } }

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
    = "func" __ name: identifier _ "(" _  parameters: (h: parameter t: (_ "," _ @parameter)* (_ ",")? { return [h, ...t] })? _")" _ ":" _ ret: type _ expression: block_expression
    { return { kind: "UntypedFunctionDefinition", name, parameters: parameters ?? [], expression, returnType: ret } }

  http_definition
    = verb: http_verb __ endpoint: http_endpoint _ "(" _ ")" _ expression: block_expression
    { return { kind: "UntypedHTTPDefinition", verb, endpoint, expression } }

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
    / literal  

  literal
    = string_expression
    / integer_expression
    / html_block_expression
    / html_expression
    / sql_select_expression
    / for_expression
    / identifier_expression
    
  sub_html_expression
    = html_block_expression
    / html_expression
    / capture_expression
    / string_expression
    / html_text_expression

  sql_select_expression
    = "select" __ columns: (h: sql_column_expression t: (_ "," _ @sql_column_expression)* { return [h, ...t] }) from: (__ @sql_from_expression)?
    { return { kind: "UntypedSQLSelectExpression", columns, from: from ?? undefined } }

  sql_column_expression
    = expression: sql_expression alias: (__ "as" __ @identifier)?
    { return { kind: "UntypedSQLColumnExpression", expression, alias: alias ?? undefined } }

  sql_from_expression
    = "from" __ table: sql_expression alias: (__ "as" __ @identifier)?
    { return { kind: "UntypedSQLFromExpression", table, alias: alias ?? undefined } }

  sql_expression
    = sql_column_identifier_expression
    / sql_string_expression
    / sql_integer_expression
    / sql_boolean_expression
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
    { return { kind: "UntypedSQLIntegerExpression", name } }

  html_block_expression
    = "<" prefix: (_ openTag: identifier attributes: html_attributes { return { openTag, attributes }})? _ ">" expressions: (_ @sub_html_expression)* _ "</" _ closeTag: (@identifier _)? ">"
    { return { kind: "UntypedHTMLBlockExpression", expressions, closeTag: closeTag ?? undefined, ...(prefix !== null ? prefix : { openTag: undefined, attributes: [] }) } }

  html_expression
    = "<" _ tag: identifier attributes: html_attributes _ "/>"
    { return { kind: "UntypedHTMLExpression", tag, attributes } }

  html_attributes
    = (__ @html_attribute)*

  html_attribute
    = name: identifier _ "=" _ value: sub_html_expression
    { return { name, value } }

  html_text_expression
    = chars: [^<{]+
    { return { kind: "UntypedHTMLTextExpression", value: chars.join('').trim() } }

  capture_expression
    = "\${" _  expression: expression _ "}"
    { return { kind: "UntypedHTMLCaptureExpression", expression } }

  string_expression
    = "\\"" chars: [^\\"]* "\\""
    { return { kind: "UntypedStringExpression", value: chars.join('') } }

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
