import { log, warn } from "node:console";
import { AnalyzeResult, AnalyzeResultNode } from "../types";

export function printRow(...args: unknown[]): void {
  log(...args);
}

export function printWarn(...args: unknown[]): void {
  warn(...args);
}

export function printAnalyzeResult(result: AnalyzeResult): void {
  printRow(`Package: ${result.packageLabel}`);

  for (const root of result.roots) {
    printRow(root.label);
    printChildren(root.childrens, "");
  }
}

function printChildren(nodes: AnalyzeResultNode[], prefix: string): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const connector = isLast ? "└──" : "├──";

    printRow(`${prefix}${connector}${node.label}`);

    const childPrefix = prefix + (isLast ? "   " : "│  ");
    printChildren(node.childrens, childPrefix);
  }
}