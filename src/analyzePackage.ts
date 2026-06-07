import { getDependencyLabel } from "./helpers/utils";
import { AnalyzeResult, AnalyzeResultNode, ListedDependencies, TreeNode } from "./types";

export type TraverseItem = {
  key: string;
  node: TreeNode;
  path: TreeNode[];
};

export type Path = TreeNode[];

export function getPathsToListedDeps(
  startNode: TreeNode,
  listedDependencies: ListedDependencies,
): Path[] {
  const pathsToListedDeps: Path[] = [];
  const visited = new Set<string>();

  const stack: TraverseItem[] = [
    {
      key: getDependencyLabel(startNode.name, startNode.version),
      node: startNode,
      path: [startNode],
    },
  ];

  while (true) {
    const item = stack.pop();
    if (item == undefined) {
      break;
    }
    if (visited.has(item.key)) {
      continue;
    }
    visited.add(item.key);
    if (listedDependencies.has(item.key)) {
      pathsToListedDeps.push(item.path);
    }
    if (item.node.dependents == undefined) {
      continue;
    }
    for (const dep of item.node.dependents) {
      stack.push({
        key: getDependencyLabel(dep.name, dep.version),
        node: dep,
        path: [...item.path, dep],
      });
    }
  }

  return pathsToListedDeps;
}

function getPathKey(path: Path): string {
  return path
    .map((node) => getDependencyLabel(node.name, node.version))
    .join(",");
}

export function filterPaths(pathsToListedDeps: Path[], listedDependencies: ListedDependencies): Path[] {
  const existingPaths = new Set<string>();
  const paths: Path[] = [];
  for (const pathToListedDep of pathsToListedDeps) {
    const filteredPath = pathToListedDep.filter((node) =>
      listedDependencies.has(getDependencyLabel(node.name, node.version)),
    );
    const pathKey = getPathKey(filteredPath);
    if (existingPaths.has(pathKey)) {
      continue;
    }
    existingPaths.add(pathKey);
    paths.push(filteredPath);
  }
  return paths;
}

export function buildTree(filteredPaths: Path[]): AnalyzeResultNode[] {
  const allNodes = new Map<string, AnalyzeResultNode>();
  const rootLabels = new Set<string>();

  for (const path of filteredPaths) {
    if (path.length == 0) {
      continue;
    }
    for (const node of path) {
      const label = getDependencyLabel(node.name, node.version);
      if (!allNodes.has(label)) {
        allNodes.set(label, { label, childrens: [] });
      }
    }
    const [rootNode] = path;
    rootLabels.add(getDependencyLabel(rootNode.name, rootNode.version));
  }

  for (const path of filteredPaths) {
    for (let i = 0; i < path.length - 1; i++) {
      const parentLabel = getDependencyLabel(path[i].name, path[i].version);
      const childLabel = getDependencyLabel(path[i + 1].name, path[i + 1].version);
      const parent = allNodes.get(parentLabel);
      const child = allNodes.get(childLabel);
      if (parent === undefined || child === undefined) {
        continue;
      }
      const isChildAlreadyThere = parent.childrens.some(x => x.label == child.label)
      if (isChildAlreadyThere) {
        continue;
      }
      parent.childrens.push(child);
    }
  }

  const roots = Array.from(allNodes.values()).filter(node => rootLabels.has(node.label));

  return roots;
}

export function analyzePackage(options: {
  pkg: TreeNode;
  listedDependencies: ListedDependencies;
}): AnalyzeResult {
  const { pkg, listedDependencies } = options;

  const pathsToListedDeps = getPathsToListedDeps(pkg, listedDependencies);

  const filteredPaths = filterPaths(pathsToListedDeps, listedDependencies);

  const roots = buildTree(filteredPaths);

  return {
    packageLabel: getDependencyLabel(pkg.name, pkg.version),
    roots,
  };
}
