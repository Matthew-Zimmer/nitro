import { nextGeneratedName } from "../common";
import { GoExpression, GoDefinition, GoType, GoModule } from "../go/ast";
import { writeStringExpr, writeIntegerExpr, toGoSource } from "../go/lowering";
import { capitalize } from "../../utils";
import {
  Expression,
  SubHTMLExpression,
  SQLSelectExpression,
  SQLInsertExpression,
  SQLDeleteExpression,
  CaptureExpression,
  Definition,
  NitroModule,
  FunctionDefinition,
} from "./ast";
import { sqlQuery } from "./sql";
import { Type } from "./types";

export function toGo(
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

export function type(t: Type): GoType {
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

export function def(d: Definition, components: Set<string>): GoDefinition[] {
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
    case "ExportDefinition":
    case "ImportDefinition":
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

export function rewriteToGo(mod: NitroModule): GoModule {
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
