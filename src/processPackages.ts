import { analyzePackage } from "./analyzePackage";
import { printAnalyzeResult, printWarn } from "./helpers/output";
import { getListedDependencies, getPackageTree } from "./helpers/cli";
import { TreeNode } from "./types";

export function processPackages(options: { labels: string[]; cwd: string }) {
  const { labels, cwd } = options;

  const listedDependencies = getListedDependencies({ cwd });

  const packages: TreeNode[] = [];

  for (const label of labels) {
    const versions = getPackageTree({ spec: label, cwd });
    if (versions.length == 0) {
      printWarn(`Dependents for "${label}" not found`);
      continue;
    }
    packages.push(...versions);
  }

  for (const pkg of packages) {
    const result = analyzePackage({ pkg, listedDependencies });
    printAnalyzeResult(result);
  }
}
