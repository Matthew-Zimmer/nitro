import { HTTPVerb, HTTPPath } from "../common";

export type GoType =
  | GoStringType
  | GoComponentType
  | GoIntegerType
  | GoBooleanType
  | GoErrorType
  | GoStructType
  | GoIdentifierType
  | GoContextType
  | GoIteratorType;

export type GoBooleanType = {
  kind: "GoBooleanType";
};

export type GoStructType = {
  kind: "GoStructType";
  properties: { name: string; type: GoType }[];
};

export type GoIdentifierType = {
  kind: "GoIdentifierType";
  name: string;
};

export type GoStringType = {
  kind: "GoStringType";
};

export type GoComponentType = {
  kind: "GoComponentType";
};

export type GoContextType = {
  kind: "GoContextType";
};

export type GoIntegerType = {
  kind: "GoIntegerType";
};

export type GoErrorType = {
  kind: "GoErrorType";
};

export type GoIteratorType = {
  kind: "GoIteratorType";
  type: GoType;
};

export type GoModule = {
  kind: "GoModule";
  definitions: GoDefinition[];
};

export type GoDefinition =
  | GoFunctionDefinition
  | GoHTTPDefinition
  | GoRawSourceDefinition
  | GoRawSourceImportDefinition
  | GoStructDefinition;

export type GoRawSourceDefinition = {
  kind: "GoRawSourceDefinition";
  source: string;
};

export type GoRawSourceImportDefinition = {
  kind: "GoRawSourceImportDefinition";
  source: string;
};

export type GoStructDefinition = {
  kind: "GoStructDefinition";
  name: string;
  properties: { name: string; type: GoType }[];
};

export type GoFunctionDefinition = {
  kind: "GoFunctionDefinition";
  name: string;
  parameters: { name: string; type: GoType }[];
  ret: GoType;
  expression: GoExpression;
};

export type GoHTTPDefinition = {
  kind: "GoHTTPDefinition";
  verb: HTTPVerb;
  endpoint: HTTPPath[];
  parameters: { name: string; type: GoType }[];
  expression: GoExpression;
};

export type GoExpression =
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

export type GoStringExpression = {
  kind: "GoStringExpression";
  value: string;
};

export type GoIntegerExpression = {
  kind: "GoIntegerExpression";
  value: number;
};

export type GoIdentifierExpression = {
  kind: "GoIdentifierExpression";
  name: string;
};

export type GoSourceExpression = {
  kind: "GoSourceExpression";
  source: string;
};

export type GoAbstractionExpression = {
  kind: "GoAbstractionExpression";
  parameters: { name: string; type: GoType }[];
  expression: GoExpression;
  ret: GoType;
};

export type GoApplicationExpression = {
  kind: "GoApplicationExpression";
  func: GoExpression;
  args: GoExpression[];
};

export type GoLetExpression = {
  kind: "GoLetExpression";
  name: string;
  expression: GoExpression;
};

export type GoForExpression = {
  kind: "GoForExpression";
  name: string;
  iterable: GoExpression;
  expression: GoExpression;
  elementType: GoType;
  iterationType: GoType;
};

export type GoBlockExpression = {
  kind: "GoBlockExpression";
  expressions: GoExpression[];
  type: GoType;
};

export type GoInfixExpression = {
  kind: "GoInfixExpression";
  left: GoExpression;
  op: string;
  right: GoExpression;
};
