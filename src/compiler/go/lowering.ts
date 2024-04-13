import { capitalize } from "../../utils";
import {
  GoExpression,
  GoHTTPDefinition,
  GoDefinition,
  GoType,
  GoModule,
} from "./ast";

export function writeStringExpr(value: string | GoExpression): GoExpression {
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

export function writeIntegerExpr(value: number | GoExpression): GoExpression {
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

export function expandParameters(d: GoHTTPDefinition): string {
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

export function splitGoDefinitions(defs: GoDefinition[]): {
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

export function toGoSource(e: GoExpression | GoType | GoDefinition): string {
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

export function toGoMainModule(mod: GoModule): string {
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

export function toGoSum() {
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

export function toGoMod() {
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
