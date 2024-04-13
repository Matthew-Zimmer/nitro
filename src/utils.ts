export function capitalize<S extends string>(x: S): Capitalize<S> {
  return (
    x.length === 0 ? "" : x[0].toUpperCase() + x.slice(1)
  ) as Capitalize<S>;
}

export function bidiffByName<
  T extends { name: string },
  V extends { name: string }
>(truth: T[], real: V[]) {
  const lNames = new Set(truth.map((x) => x.name));
  const rNames = new Set(real.map((x) => x.name));

  return {
    extra: real.filter((x) => !lNames.has(x.name)),
    missing: truth.filter((x) => !rNames.has(x.name)),
    same: real
      .filter((x) => lNames.has(x.name))
      .map((x) => ({ ...x, ...truth.find((y) => y.name === x.name)! })),
  };
}
