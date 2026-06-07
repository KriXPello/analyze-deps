export type TreeNode = {
  name: string;
  version: string;
  dependents?: TreeNode[];
};

export type ListedDependencies = Set<string>;

export type AnalyzeResultNode = {
  label: string;
  childrens: AnalyzeResultNode[];
}

export type AnalyzeResult = {
  /** `name@version` */
  packageLabel: string;
  roots: AnalyzeResultNode[];
}