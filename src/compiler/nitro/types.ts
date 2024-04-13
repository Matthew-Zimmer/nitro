export type Type =
  | StringType
  | IntegerType
  | BooleanType
  | HTMLType
  | FunctionType
  | IteratorType
  | IntrinsicType
  | IdentifierType
  | StructType
  | UnknownType;

export type BooleanType = {
  kind: "BooleanType";
};

export type StructType = {
  kind: "StructType";
  properties: { name: string; type: Type }[];
};

export type IntrinsicType = {
  kind: "IntrinsicType";
};

export type IdentifierType = {
  kind: "IdentifierType";
  name: string;
};

export type StringType = {
  kind: "StringType";
};

export type UnknownType = {
  kind: "UnknownType";
};

export type IntegerType = {
  kind: "IntegerType";
};

export type HTMLType = {
  kind: "HTMLType";
};

export type IteratorType = {
  kind: "IteratorType";
  type: Type;
};

export type FunctionType = {
  kind: "FunctionType";
  from: { name: string; type: Type }[];
  to: Type;
};

export function typeEquals(l: Type, r: Type): boolean {
  switch (l.kind) {
    case "StringType":
      return r.kind === "StringType";
    case "IntegerType":
      return r.kind === "IntegerType";
    case "BooleanType":
      return r.kind === "BooleanType";
    case "HTMLType":
      return r.kind === "HTMLType";
    case "FunctionType":
      return (
        r.kind === "FunctionType" &&
        typeEquals(
          { kind: "StructType", properties: l.from },
          { kind: "StructType", properties: r.from }
        ) &&
        typeEquals(l.to, r.to)
      );
    case "IteratorType":
      return r.kind === "IteratorType" && typeEquals(l.type, r.type);
    case "IntrinsicType":
      return r.kind === "IntrinsicType";
    case "IdentifierType":
      return r.kind === "IdentifierType" && l.name === r.name;
    case "StructType": {
      if (
        !(
          r.kind === "StructType" && l.properties.length === r.properties.length
        )
      )
        return false;
      return l.properties.every((p) => {
        const rp = r.properties.find((x) => x.name === p.name)?.type;
        return rp === undefined ? false : typeEquals(p.type, rp);
      });
    }
    case "UnknownType":
      return false;
  }
}
