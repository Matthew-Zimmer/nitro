export type SQLInfixOperator =
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

export type HTTPVerb = "get" | "put" | "post" | "patch" | "delete";

export type HTTPPath = HTTPConstantPath | HTTPVariablePath;

export type HTTPConstantPath = {
  kind: "HTTPConstantPath";
  value: string;
};

export type HTTPVariablePath = {
  kind: "HTTPVariablePath";
  name: string;
};

let nextGeneratedNameCount = 0;
export function nextGeneratedName() {
  return `_${nextGeneratedNameCount++}`;
}
