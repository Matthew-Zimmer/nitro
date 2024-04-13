import { SQLExpression, Expression } from "./ast";

export function sqlQuery(e: SQLExpression): [string, Expression[]] {
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

export function sqlExprName(e: SQLExpression, i: number): string {
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
