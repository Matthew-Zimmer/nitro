import { HTTPVerb, HTTPPath, SQLInfixOperator } from "../common";
import { Type } from "./types";

export type NitroModule = {
  kind: "NitroModule";
  definitions: Definition[];
};

export type Definition =
  | FunctionDefinition
  | HTTPDefinition
  | DeclareDefinition
  | StructDefinition
  | RawGoSourceDefinition
  | RawGoSourceImportDefinition
  | TableDefinition;

export type RawGoSourceDefinition = {
  kind: "RawGoSourceDefinition";
  source: string;
};

export type RawGoSourceImportDefinition = {
  kind: "RawGoSourceImportDefinition";
  source: string;
};

export type StructDefinition = {
  kind: "StructDefinition";
  name: string;
  properties: { name: string; type: Type }[];
};

export type TableDefinition = {
  kind: "TableDefinition";
  name: string;
  type: Type;
};

export type FunctionDefinition = {
  kind: "FunctionDefinition";
  name: string;
  parameters: { name: string; type: Type }[];
  type: Type;
  expression: Expression;
};

export type HTTPDefinition = {
  kind: "HTTPDefinition";
  verb: HTTPVerb;
  endpoint: HTTPPath[];
  parameters: { name: string; type: Type }[];
  expression: Expression;
};

export type DeclareDefinition = {
  kind: "DeclareDefinition";
  definition: Definition;
};

export type SubHTMLExpression =
  | HTMLBlockExpression
  | HTMLExpression
  | HTMLTextExpression
  | StringExpression
  | CaptureExpression;

export type Expression =
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

export type SQLExpression =
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

export type SQLDeleteExpression = {
  kind: "SQLDeleteExpression";
  table: SQLFromExpression;
  where?: SQLWhereExpression;
  type: Type;
};

export type SQLWhereExpression = {
  kind: "SQLWhereExpression";
  cond: SQLExpression;
  type: Type;
};

export type SQLInfixExpression = {
  kind: "SQLInfixExpression";
  left: SQLExpression;
  op: SQLInfixOperator;
  right: SQLExpression;
  type: Type;
};

export type BlockExpression = {
  kind: "BlockExpression";
  expressions: Expression[];
  type: Type;
};

export type SQLIdentifierExpression = {
  kind: "SQLIdentifierExpression";
  name: string;
  type: Type;
};

export type SQLColumnIdentifierExpression = {
  kind: "SQLColumnIdentifierExpression";
  name: string;
  type: Type;
};

export type SQLIntegerExpression = {
  kind: "SQLIntegerExpression";
  value: number;
  type: Type;
};

export type SQLStringExpression = {
  kind: "SQLStringExpression";
  value: string;
  type: Type;
};

export type SQLBooleanExpression = {
  kind: "SQLBooleanExpression";
  value: string;
  type: Type;
};

export type SQLColumnExpression = {
  kind: "SQLColumnExpression";
  expression: SQLExpression;
  alias?: string;
  type: Type;
};

export type SQLFromExpression = {
  kind: "SQLFromExpression";
  table: SQLExpression;
  alias?: string;
  type: Type;
};

export type SQLSelectExpression = {
  kind: "SQLSelectExpression";
  columns: SQLColumnExpression[];
  from?: SQLFromExpression;
  where?: SQLWhereExpression;
  type: Type;
};

export type SQLPackExpression = {
  kind: "SQLPackExpression";
  values: SQLExpression[];
  type: Type;
};

export type SQLInsertExpression = {
  kind: "SQLInsertExpression";
  table: SQLFromExpression;
  columns: SQLPackExpression;
  values: SQLPackExpression[];
  type: Type;
};

export type HTMLBlockExpression = {
  kind: "HTMLBlockExpression";
  attributes: { name: string; value: SubHTMLExpression }[];
  tag: string;
  expressions: SubHTMLExpression[];
  type: Type;
};

export type HTMLExpression = {
  kind: "HTMLExpression";
  attributes: { name: string; value: SubHTMLExpression }[];
  tag: string;
  type: Type;
};

export type HTMLTextExpression = {
  kind: "HTMLTextExpression";
  value: string;
  type: Type;
};

export type CaptureExpression = {
  kind: "CaptureExpression";
  expression: Expression;
  type: Type;
};

export type IntegerExpression = {
  kind: "IntegerExpression";
  value: number;
  type: Type;
};

export type StringExpression = {
  kind: "StringExpression";
  parts: (string | CaptureExpression)[];
  type: Type;
};

export type IdentifierExpression = {
  kind: "IdentifierExpression";
  name: string;
  type: Type;
};

export type ForExpression = {
  kind: "ForExpression";
  name: string;
  iterable: Expression;
  expression: Expression;
  type: Type;
};

export type LetExpression = {
  kind: "LetExpression";
  name: string;
  expression: Expression;
  type: Type;
};

export type AddExpression = {
  kind: "AddExpression";
  left: Expression;
  right: Expression;
  type: Type;
};

export type DotExpression = {
  kind: "DotExpression";
  left: Expression;
  name: string;
  type: Type;
};

export type CallExpression = {
  kind: "CallExpression";
  left: Expression;
  args: Expression[];
  type: Type;
};
