import { HTTPPath, HTTPVerb, SQLInfixOperator } from "../common";
import { Type } from "./types";

export type UntypedNitroModule = {
  kind: "UntypedNitroModule";
  definitions: UntypedDefinition[];
};

export type UntypedDefinition =
  | UntypedFunctionDefinition
  | UntypedHTTPDefinition
  | UntypedDeclareDefinition
  | UntypedTableDefinition
  | UntypedRawGoSourceDefinition
  | UntypedRawGoSourceImportDefinition
  | UntypedStructDefinition;

export type UntypedRawGoSourceDefinition = {
  kind: "UntypedRawGoSourceDefinition";
  source: string;
};

export type UntypedRawGoSourceImportDefinition = {
  kind: "UntypedRawGoSourceImportDefinition";
  source: string;
};

export type UntypedTableDefinition = {
  kind: "UntypedTableDefinition";
  name: string;
  type: Type;
};

export type UntypedStructDefinition = {
  kind: "UntypedStructDefinition";
  name: string;
  properties: { name: string; type: Type }[];
};

export type UntypedFunctionDefinition = {
  kind: "UntypedFunctionDefinition";
  name: string;
  parameters: { name: string; type: Type }[];
  expression: UntypedExpression;
  returnType: Type;
};

export type UntypedHTTPDefinition = {
  kind: "UntypedHTTPDefinition";
  endpoint: HTTPPath[];
  verb: HTTPVerb;
  parameters: { name: string; type: Type }[];
  expression: UntypedExpression;
};

export type UntypedDeclareDefinition = {
  kind: "UntypedDeclareDefinition";
  definition: UntypedDefinition;
};

export type UntypedSubHTMLExpression =
  | UntypedHTMLBlockExpression
  | UntypedHTMLExpression
  | UntypedHTMLTextExpression
  | UntypedStringExpression
  | UntypedCaptureExpression;

export type UntypedExpression =
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

export type UntypedSQLExpression =
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

export type UntypedSQLDeleteExpression = {
  kind: "UntypedSQLDeleteExpression";
  table: UntypedSQLFromExpression;
  where?: UntypedSQLWhereExpression;
};

export type UntypedSQLWhereExpression = {
  kind: "UntypedSQLWhereExpression";
  cond: UntypedSQLExpression;
};

export type UntypedSQLInfixExpression = {
  kind: "UntypedSQLInfixExpression";
  left: UntypedSQLExpression;
  op: SQLInfixOperator;
  right: UntypedSQLExpression;
};

export type UntypedBlockExpression = {
  kind: "UntypedBlockExpression";
  expressions: UntypedExpression[];
};

export type UntypedSQLIdentifierExpression = {
  kind: "UntypedSQLIdentifierExpression";
  name: string;
};

export type UntypedSQLColumnIdentifierExpression = {
  kind: "UntypedSQLColumnIdentifierExpression";
  name: string;
};

export type UntypedSQLIntegerExpression = {
  kind: "UntypedSQLIntegerExpression";
  value: number;
};

export type UntypedSQLStringExpression = {
  kind: "UntypedSQLStringExpression";
  value: string;
};

export type UntypedSQLBooleanExpression = {
  kind: "UntypedSQLStringExpression";
  value: string;
};

export type UntypedSQLColumnExpression = {
  kind: "UntypedSQLColumnExpression";
  expression: UntypedSQLExpression;
  alias?: string;
};

export type UntypedSQLFromExpression = {
  kind: "UntypedSQLFromExpression";
  table: UntypedSQLExpression;
  alias?: string;
};

export type UntypedSQLSelectExpression = {
  kind: "UntypedSQLSelectExpression";
  columns: UntypedSQLColumnExpression[];
  from?: UntypedSQLFromExpression;
  where?: UntypedSQLWhereExpression;
};

export type UntypedSQLPackExpression = {
  kind: "UntypedSQLPackExpression";
  values: UntypedSQLExpression[];
};

export type UntypedSQLInsertExpression = {
  kind: "UntypedSQLInsertExpression";
  table: UntypedSQLFromExpression;
  columns: UntypedSQLPackExpression;
  values: UntypedSQLPackExpression[];
};

export type UntypedHTMLBlockExpression = {
  kind: "UntypedHTMLBlockExpression";
  attributes: { name: string; value: UntypedSubHTMLExpression }[];
  openTag: string;
  closeTag: string;
  expressions: UntypedSubHTMLExpression[];
};

export type UntypedHTMLExpression = {
  kind: "UntypedHTMLExpression";
  attributes: { name: string; value: UntypedSubHTMLExpression }[];
  tag: string;
};

export type UntypedHTMLTextExpression = {
  kind: "UntypedHTMLTextExpression";
  value: string;
};

export type UntypedCaptureExpression = {
  kind: "UntypedCaptureExpression";
  expression: UntypedExpression;
};

export type UntypedIntegerExpression = {
  kind: "UntypedIntegerExpression";
  value: number;
};

export type UntypedStringExpression = {
  kind: "UntypedStringExpression";
  parts: (string | UntypedCaptureExpression)[];
};

export type UntypedIdentifierExpression = {
  kind: "UntypedIdentifierExpression";
  name: string;
};

export type UntypedForExpression = {
  kind: "UntypedForExpression";
  name: string;
  iterable: UntypedExpression;
  expression: UntypedExpression;
};

export type UntypedLetExpression = {
  kind: "UntypedLetExpression";
  name: string;
  expression: UntypedExpression;
  type?: Type;
};

export type UntypedAddExpression = {
  kind: "UntypedAddExpression";
  left: UntypedExpression;
  right: UntypedExpression;
};

export type UntypedCallExpression = {
  kind: "UntypedCallExpression";
  left: UntypedExpression;
  args: UntypedExpression[];
};

export type UntypedDotExpression = {
  kind: "UntypedDotExpression";
  left: UntypedExpression;
  name: string;
};
