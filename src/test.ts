import { writeFileSync } from "fs";

type ComponentDefinition = {
  kind: "ComponentDefinition",
  name: string,
  parameters: string[],
  expression: Expression,
}

// type HTMLAttribute =
//   | HTMLStringAttribute
//   | HTMLCaptureAttribute

type Expression =
  | HTMLBlockExpression
  | HTMLExpression
  | StringExpression
  | IdentifierExpression
  | IntegerExpression
  | ForExpression
  | HTMLTextExpression
  | HTMLCaptureExpression
  | RawExpression


type GoDefinition =
  | GoFunctionDefinition
  | GoVariableDefinition

type GoFunctionDefinition = {
  kind: "GoFunctionDefinition",
  name: string,
  parameters: { name: string, type: string }[],
  expression: GoExpression,
  ret: string,
}

type GoVariableDefinition = {
  kind: "GoVariableDefinition",
  name: string,
  expression: GoExpression,
}

type GoExpression =
  | GoStringExpression
  | GoIntegerExpression
  | GoIdentifierExpression
  | GoAbstractionExpression
  | GoApplicationExpression
  | GoCastExpression
  | GoRawExpression
  | GoBlockExpression
  | GoForExpression
  | GoBindingIfExpression

type GoStringExpression = {
  kind: "GoStringExpression",
  value: string,
}

type GoIntegerExpression = {
  kind: "GoIntegerExpression",
  value: number,
}

type GoIdentifierExpression = {
  kind: "GoIdentifierExpression",
  name: string,
}

type GoAbstractionExpression = {
  kind: "GoAbstractionExpression",
  parameters: { name: string, type: string }[],
  expression: GoExpression,
  ret: string,
}

type GoApplicationExpression = {
  kind: "GoApplicationExpression",
  func: GoExpression,
  args: GoExpression[],
}

type GoCastExpression = {
  kind: "GoCastExpression",
  expression: GoExpression,
}

type GoRawExpression = {
  kind: "GoRawExpression",
  source: string,
}

type GoBlockExpression = {
  kind: "GoBlockExpression",
  expressions: GoExpression[],
  type: string,
}

type GoForExpression = {
  kind: "GoForExpression",
  name: string,
  iterable: GoExpression,
  expression: GoExpression,
}

type GoBindingIfExpression = {
  kind: "GoBindingIfExpression",
  name: string,
  value: GoExpression,
  condition: GoExpression,
  then: GoExpression,
}

type StringExpression = {
  kind: "StringExpression",
  value: string,
}

type IntegerExpression = {
  kind: "IntegerExpression",
  value: number,
}

type IdentifierExpression = {
  kind: "IdentifierExpression",
  name: string,
}

type ForExpression = {
  kind: "ForExpression",
  name: string,
  iterable: Expression,
  expression: Expression,
}

type HTMLBlockExpression = {
  kind: "HTMLBlockExpression",
  tag: string,
  // attributes: HTMLAttribute[],
  expressions: Expression[],
}

type HTMLExpression = {
  kind: "HTMLExpression",
  tag: string,
  // attributes: HTMLAttribute[],
}

type HTMLTextExpression = {
  kind: "HTMLTextExpression",
  value: string,
}

type HTMLCaptureExpression = {
  kind: "HTMLCaptureExpression",
  expression: Expression,
}

type RawExpression = {
  kind: "RawExpression",
  source: string,
}

type HTMLStringAttribute = {
  kind: "HTMLStringAttribute",
  value: string,
}

type HTMLCaptureAttribute = {
  kind: "HTMLCaptureAttribute",
  expression: Expression,
}

function toGoSource(e: GoExpression | GoDefinition): string {
  switch (e.kind) {
    case 'GoFunctionDefinition': return `func ${e.name}(${e.parameters.map(x => `${x.name} ${x.type}`).join(',')}) ${e.ret} {\n return ${toGoSource(e.expression)}\n}`;
    case 'GoVariableDefinition': return `var ${e.name} = ${toGoSource(e.expression)}`;

    case "GoStringExpression": return `"${e.value}"`;
    case "GoIntegerExpression": return `${e.value}`;
    case "GoIdentifierExpression": return `${e.name}`;
    case "GoAbstractionExpression": return `func (${e.parameters.map(x => `${x.name} ${x.type}`).join(',')}) ${e.ret} {\n return ${toGoSource(e.expression)}\n}`;
    case "GoApplicationExpression": return `${toGoSource(e.func)}(${e.args.map(toGoSource).join(',')})`;
    case "GoCastExpression": return `[]byte(${toGoSource(e.expression)})`;
    case 'GoRawExpression': return e.source;
    case "GoBlockExpression": return e.expressions.length === 0 ? `{}` : `(func () ${e.type} { ${e.expressions.map((x, i, arr) => i + 1 !== arr.length ? toGoSource(x) : `return ${toGoSource(x)}`).join('\n')} })()`;
    // OLD: "collects" the values of the for loop into an array
    //case 'GoForExpression': return `(func () []string { _ret := []string{}; for _, ${e.name} := range ${toGoSource(e.iterable)} { _ret = append(_ret, ${toGoSource(e.expression)}) }; return _ret })()`;
    // TODO this is now hardcoded for the case of error type
    case 'GoForExpression': return `(func () error { for _, ${e.name} := range ${toGoSource(e.iterable)} { ${toGoSource(e.expression)} }; return nil })()`;
    case 'GoBindingIfExpression': return `if ${e.name} := ${toGoSource(e.value)}; ${toGoSource(e.condition)} {\n${toGoSource(e.then)}\n}`;
  }
}

function toGo(e: Expression): GoExpression {
  switch (e.kind) {
    case "StringExpression":
      return { kind: "GoStringExpression", value: e.value };
    case "IntegerExpression":
      return { kind: "GoIntegerExpression", value: e.value };
    case "IdentifierExpression":
      return { kind: "GoIdentifierExpression", name: e.name };
    case "ForExpression":
      return { kind: "GoForExpression", name: e.name, iterable: toGo(e.iterable), expression: toGo(e.expression) };
    case "RawExpression":
      return { kind: "GoRawExpression", source: e.source };
    case "HTMLBlockExpression":
    case "HTMLExpression":
    case "HTMLTextExpression":
    case "HTMLCaptureExpression":
      // all these should be caught by a type system beforehand anyways
      throw new Error(`Cannot convert html like expression to non component based code`);
  }
}


let generatedNameCount = 0;
function nextGeneratedName() {
  return `_${generatedNameCount++}`;
}

function linearizeComponent(c: ComponentDefinition): [GoDefinition[], GoExpression] {
  const getName = (isRoot: boolean) => isRoot ? c.name : nextGeneratedName();

  function wrapIfErr(expression: GoExpression): GoExpression {
    return {
      kind: "GoBindingIfExpression",
      name: "err",
      value: expression,
      condition: {
        kind: "GoRawExpression",
        source: "err != nil",
      },
      then: {
        kind: "GoRawExpression",
        source: "return err",
      },
    };
  }

  function writeStaticBytes(name: string): GoExpression {
    return wrapIfErr({
      kind: "GoApplicationExpression",
      func: {
        kind: "GoIdentifierExpression",
        name: "WriteBytes"
      },
      args: [{
        kind: "GoIdentifierExpression",
        name: "c"
      }, {
        kind: "GoIdentifierExpression",
        name: name,
      }]
    });
  }

  function writeDynamicBytes(name: string): GoExpression {
    return wrapIfErr({
      kind: "GoApplicationExpression",
      func: {
        kind: "GoIdentifierExpression",
        name: "WriteString"
      },
      args: [{
        kind: "GoIdentifierExpression",
        name: "c"
      }, {
        kind: "GoIdentifierExpression",
        name: name,
      }]
    });
  }

  function writeStaticBytesFromValue(value: string): [GoDefinition, GoExpression] {
    const name = nextGeneratedName();
    return [{ kind: "GoVariableDefinition", name, expression: { kind: "GoCastExpression", expression: { kind: "GoStringExpression", value } } }, writeStaticBytes(name)];
  }

  function callExpr(name: string, args: GoExpression[]): GoExpression {
    return wrapIfErr({
      kind: "GoApplicationExpression",
      func: {
        kind: "GoApplicationExpression",
        func: { kind: "GoIdentifierExpression", name },
        args,
      },
      args: [{
        kind: "GoIdentifierExpression",
        name: "c"
      }]
    });
  }

  function goComponent(name: string, parameters: { name: string, type: string }[], expression: GoExpression): GoDefinition {
    return {
      kind: "GoFunctionDefinition",
      name,
      parameters,
      expression: {
        kind: "GoAbstractionExpression",
        parameters: [{
          name: "c",
          type: "echo.Context"
        }],
        expression: {
          kind: "GoBlockExpression",
          expressions: [
            expression,
            {
              kind: "GoRawExpression",
              source: "nil",
            }
          ],
          type: "error"
        },
        ret: "error",
      },
      ret: "Component"
    };
  }

  const imp = (e: Expression, isRoot: boolean = false): [GoDefinition[], { invoke: GoExpression, parameters: { name: string, type: string }[] }] => {
    const name = getName(isRoot);

    switch (e.kind) {
      case "HTMLTextExpression":
      case "StringExpression": {
        const [def, expr] = writeStaticBytesFromValue(e.value);
        return [[def, goComponent(name, [], expr)], { invoke: callExpr(name, []), parameters: [] }];
      }
      case "IntegerExpression": {
        const [def, expr] = writeStaticBytesFromValue(e.value.toString());
        return [[def, goComponent(name, [], expr)], { invoke: callExpr(name, []), parameters: [] }];
      }
      case "IdentifierExpression": {
        // TODO hardcoded type
        const parameters = [{ name: e.name, type: 'string' }];
        return [[goComponent(name, parameters, writeDynamicBytes(e.name))], { invoke: callExpr(name, [{ kind: "GoIdentifierExpression", name: e.name }]), parameters }];
      }
      case "ForExpression": {
        const [kids, { invoke, parameters }] = imp(e.expression);
        const nextParameters = parameters.filter(x => x.name !== e.name); // we also need all identifiers in "iterable"
        const next = goComponent(name, nextParameters, {
          kind: "GoForExpression",
          name: e.name,
          iterable: toGo(e.iterable),
          expression: {
            kind: "GoBlockExpression",
            expressions: [invoke, { kind: "GoIdentifierExpression", name: "nil" }],
            type: "error"
          },
        });

        return [
          [...kids, next],
          {
            invoke: callExpr(name, nextParameters.map(x => ({ kind: "GoIdentifierExpression", name: x.name }))),
            parameters: nextParameters
          },
        ];
      }
      case "HTMLCaptureExpression":
        return imp(e.expression);
      case "HTMLExpression":
        // TODO handle the case where tag is a non primitive tag
        const [def, expr] = writeStaticBytesFromValue(`<${e.tag} />`);
        return [[def, goComponent(name, [], expr)], { invoke: callExpr(name, []), parameters: [] }];
      case 'RawExpression':
        return [[], { invoke: { kind: "GoRawExpression", source: e.source }, parameters: [] }];
      case "HTMLBlockExpression": {
        const inner = e.expressions.map(x => imp(x));
        const kids = inner.flatMap(x => x[0]);
        const nextParameters = [...new Set(inner.flatMap(x => x[1].parameters))];

        const next = goComponent(name, nextParameters, {
          kind: "GoBlockExpression",
          expressions: [...inner.map(x => x[1].invoke), { kind: "GoIdentifierExpression", name: "nil" }],
          type: "error"
        });

        return [
          [...kids, next],
          {
            invoke: callExpr(name, nextParameters.map(x => ({ kind: "GoIdentifierExpression", name: x.name }))),
            parameters: nextParameters,
          },
        ];
      }
    }
  }

  const [defs, { invoke }] = imp(c.expression, true);
  return [defs, invoke];
}

const data: ComponentDefinition = {
  kind: "ComponentDefinition",
  name: "my_component",
  parameters: [],
  expression: {
    kind: "HTMLBlockExpression",
    tag: "html",
    expressions: [{
      kind: "HTMLBlockExpression",
      tag: "body",
      expressions: [{
        kind: "ForExpression",
        name: "x",
        iterable: {
          kind: "IdentifierExpression",
          name: "seq_10"
        },
        expression: {
          kind: "HTMLBlockExpression",
          tag: "h1",
          expressions: [{
            kind: "HTMLCaptureExpression",
            expression: {
              kind: "IdentifierExpression",
              name: "x"
            }
          }]
        }
      }, {
        kind: "HTMLBlockExpression",
        tag: "button",
        expressions: [{
          kind: "HTMLTextExpression",
          value: "Add Stuff"
        }]
      }]
    }],
  }
}

let logCount = 0;

function prelude(): GoExpression {
  return {
    kind: "GoRawExpression",
    source: `
package main2

import (
	"net/http"

	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
)

type Component = func(echo.Context) error

func WriteBytes(c echo.Context, bytes []byte) error {
	_, err := c.Response().Write(bytes)
	return err
}

func WriteString(c echo.Context, value string) error {
	_, err := c.Response().Write([]byte(value))
	return err
}

var seq_10 = []int{0,1,2,3,4,5,6,7,8,9}
`,
  };
}

function main() {
  const components = linearizeComponent(data);
  writeFileSync(`out/${logCount++}_${"linearizeComponent"}.json`, JSON.stringify(components, undefined, 2));
  writeFileSync(`out/${logCount++}_${"main"}.go`, [prelude(), ...components[0]].map(toGoSource).join('\n'));
}

main();







