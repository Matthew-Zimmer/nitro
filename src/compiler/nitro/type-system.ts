import { SQLInfixOperator, HTTPVariablePath } from "../common";
import { bidiffByName } from "../../utils";
import {
  NitroModule,
  SubHTMLExpression,
  StringExpression,
  SQLExpression,
  SQLFromExpression,
  SQLWhereExpression,
  SQLColumnExpression,
  SQLPackExpression,
  Expression,
  HTMLBlockExpression,
  HTMLExpression,
  CaptureExpression,
  Definition,
} from "./ast";
import { sqlExprName } from "./sql";
import { Type, StructType, typeEquals, IteratorType } from "./types";
import {
  UntypedNitroModule,
  UntypedDefinition,
  UntypedSubHTMLExpression,
  UntypedSQLExpression,
  UntypedExpression,
} from "./untyped-ast";

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

export function inferAndTypeCheck(mod: UntypedNitroModule): NitroModule {
  const errors: string[] = [];

  // build a type lookup table

  const _namedTypes = mod.definitions.flatMap(extractNamedTypes);
  const namedTypes = new Map<string, Type>();
  for (const [name, ty] of _namedTypes) {
    if (namedTypes.has(name)) {
      errors.push(`type ${name} is already defined`);
    }
    namedTypes.set(name, ty);
  }

  // build a sql table lookup table
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

  // helper functions

  // function for resolving named types
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

  // variables

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
