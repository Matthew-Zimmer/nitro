import { existsSync, lstatSync, readFileSync, readdir, readdirSync } from "fs";
import { parse } from "./grammar";
import { UntypedNitroModule } from "./untyped-ast";
import { Definition, NitroModule } from "./ast";
import { inferAndTypeCheck } from "./type-system";
import { Type } from "./types";
import { inspect } from "util";

class DAG {
  private outgoing = new Map<string, string[]>();

  constructor(
    private modules: Map<
      string,
      { mod: UntypedNitroModule; fileNames: Map<string, string> }
    >,
    deps: Dependency[]
  ) {
    for (const { dependent, dependsOn } of deps) {
      if (!this.outgoing.has(dependent)) {
        this.outgoing.set(dependent, []);
      }
      this.outgoing.get(dependent)!.push(dependsOn);
    }
  }

  topologicalSort(): [
    string,
    { mod: UntypedNitroModule; fileNames: Map<string, string> }
  ][] {
    const visited = new Map([...this.modules.keys()].map((x) => [x, false]));
    const stack: string[] = [];

    const imp = (id: string) => {
      visited.set(id, true);
      for (const dep of this.outgoing.get(id) ?? []) {
        if (!visited.get(dep)!) {
          imp(dep);
        }
      }
      stack.push(id);
    };

    for (const id of this.outgoing.keys()) {
      if (!visited.get(id)!) {
        imp(id);
      }
    }

    return stack.map((x) => [x, this.modules.get(x)!]);
  }
}

type Dependency = {
  dependent: string;
  dependsOn: string;
};

export class NitroProject {
  constructor(private stdPath: string, private packagePath: string) {}

  resolveModulePath(
    currentPath: string[],
    importPath: string[],
    isDirectory: boolean
  ): string[] {
    if (importPath.length === 0) throw new Error();

    const [head] = importPath;

    switch (head) {
      case "std":
        return importPath;
      case "package":
        return importPath;
      default:
        return (isDirectory ? currentPath : currentPath.slice(0, -1)).concat(
          importPath
        );
    }
  }

  fileNameForPath(path: string[]): [string, boolean] {
    if (path.length === 0) throw new Error();
    const [head, ...rest] = path;

    const fileName = (() => {
      switch (head) {
        case "std":
          return `${this.stdPath}/${path.join("/")}.nt`;
        case "package":
          return `${this.packagePath}/${rest.join("/")}.nt`;
        default:
          throw new Error(
            `Did not have package or std as module path: actual ${path.join(
              "."
            )}`
          );
      }
    })();

    if (existsSync(fileName)) {
      return [fileName, false];
    }
    const directoryName = fileName.slice(0, -3);
    if (existsSync(directoryName) && lstatSync(directoryName).isDirectory()) {
      const directoryFileName = directoryName + "/mod.nt";
      if (existsSync(directoryFileName)) {
        return [directoryFileName, true];
      }
      throw new Error(`File: ${directoryFileName} does not exist`);
    }

    throw new Error(`File: ${fileName} does not exist`);
  }

  isPrelude(path: string[]): boolean {
    return path.length === 2 && path[0] === "std" && path[1] === "prelude";
  }

  walkModule(
    path: string[]
  ): [
    Map<string, { mod: UntypedNitroModule; fileNames: Map<string, string> }>,
    Dependency[]
  ] {
    const modules = new Map<
      string,
      { mod: UntypedNitroModule; fileNames: Map<string, string> }
    >();
    const deps: Dependency[] = [];
    const seen = new Set<string>();

    const imp = (path: string[]): string => {
      const [moduleFileName, isDirectory] = this.fileNameForPath(path);

      if (seen.has(moduleFileName)) {
        return moduleFileName;
      }

      seen.add(moduleFileName);

      const fileContent = readFileSync(moduleFileName).toString();

      const module = parse(fileContent);

      const preparedModule: UntypedNitroModule = {
        ...module,
        definitions: [
          ...(this.isPrelude(path)
            ? []
            : [
                {
                  kind: "UntypedImportDefinition" as const,
                  path: ["std", "prelude"],
                  modifier: {
                    kind: "ImportSelection" as const,
                    selections: [{ name: "*" }],
                  },
                },
              ]),
          ...module.definitions,
        ],
      };

      const fileNames = new Map<string, string>();

      for (const def of preparedModule.definitions) {
        if (def.kind === "UntypedImportDefinition") {
          const modulePath = this.resolveModulePath(
            path,
            def.path,
            isDirectory
          );
          const subName = imp(modulePath);
          fileNames.set(def.path.join("."), subName);

          deps.push({
            dependent: moduleFileName,
            dependsOn: subName,
          });
        } else if (
          def.kind === "UntypedExportDefinition" &&
          def.definition.kind === "UntypedImportDefinition"
        ) {
          const modulePath = this.resolveModulePath(
            path,
            def.definition.path,
            isDirectory
          );
          const subName = imp(modulePath);
          fileNames.set(def.definition.path.join("."), subName);

          deps.push({
            dependent: moduleFileName,
            dependsOn: subName,
          });
        }
      }

      modules.set(moduleFileName, {
        mod: preparedModule,
        fileNames,
      });

      return moduleFileName;
    };

    imp(path);

    return [modules, deps];
  }

  compile(): NitroModule[] {
    const [modules, deps] = this.walkModule(["package", "main"]);

    const dag = new DAG(modules, deps);
    const orderModules = dag.topologicalSort();

    const typedModules: NitroModule[] = [];
    const moduleExports = new Map<
      string,
      Map<string, { type: Type; isType: boolean }>
    >();

    for (const [name, { mod, fileNames }] of orderModules) {
      const [typedMod, exports] = inferAndTypeCheck(
        mod,
        moduleExports,
        fileNames
      );

      moduleExports.set(name, exports);
      typedModules.push(typedMod);
    }

    return typedModules;
  }
}
