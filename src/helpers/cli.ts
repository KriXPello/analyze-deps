import { execSync } from "node:child_process";
import type { ListedDependencies, TreeNode } from "../types";
import { getDependencyLabel } from "./utils";

export function getPackageTree(options: { spec: string; cwd: string }): TreeNode[] {
  const { spec, cwd } = options;

  const stdout = execSync(`pnpm why ${spec} --json --depth Infinity -r`, {
    cwd,
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

  const value = JSON.parse(stdout);
  if (Array.isArray(value)) {
    return value as TreeNode[];
  }

  return [];
}

type PnpmListItemSection = Record<string, { version: string }>;

type PnpmListItem = {
  dependencies: PnpmListItemSection;
  devDependencies: PnpmListItemSection;
};

export function getListedDependencies(options: { cwd: string }): ListedDependencies {
  const { cwd } = options;

  const stdout = execSync(`pnpm list --json --depth Infinity -r`, {
    cwd,
    encoding: "utf8",
    maxBuffer: 100 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

  const value = JSON.parse(stdout);
  if (!Array.isArray(value)) {
    return new Set<string>();
  }

  const transformSection = (section: PnpmListItemSection) => {
    return Object.entries(section).map(([name, data]) => ({
      name,
      version: data.version,
    }))
  }

  const listedPackages = (value as PnpmListItem[]).flatMap(item => {
    return transformSection(item.dependencies).concat(transformSection(item.devDependencies));
  });

  const keys = new Set<string>(listedPackages.map(pkg => getDependencyLabel(pkg.name, pkg.version)));

  return keys;
}
