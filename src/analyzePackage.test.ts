import { describe, it, expect } from 'vitest';
import { analyzePackage, getPathsToListedDeps, filterPaths, buildTree } from './analyzePackage';
import { TreeNode, ListedDependencies } from './types';

describe('analyzePackage', () => {
  describe('getPathsToListedDeps', () => {
    it('finds direct dependency', () => {
      const tree: TreeNode = {
        name: 'lodash',
        version: '4.17.21',
        dependents: [{ name: 'express', version: '4.18.2' }]
      };
      const listed: ListedDependencies = new Set(['express@4.18.2']);

      const paths = getPathsToListedDeps(tree, listed);

      expect(paths).toHaveLength(1);
      expect(paths[0].map(n => ({ name: n.name, version: n.version }))).toEqual([
        { name: 'lodash', version: '4.17.21' },
        { name: 'express', version: '4.18.2' }
      ]);
    });

    it('finds nested dependency', () => {
      const tree: TreeNode = {
        name: 'lodash',
        version: '4.17.21',
        dependents: [{
          name: 'express',
          version: '4.18.2',
          dependents: [{
            name: 'body-parser',
            version: '1.20.2'
          }]
        }]
      };
      const listed: ListedDependencies = new Set(['body-parser@1.20.2']);

      const paths = getPathsToListedDeps(tree, listed);

      expect(paths).toHaveLength(1);
      expect(paths[0].map(n => ({ name: n.name, version: n.version }))).toEqual([
        { name: 'lodash', version: '4.17.21' },
        { name: 'express', version: '4.18.2' },
        { name: 'body-parser', version: '1.20.2' }
      ]);
    });

    it('handles diamond dependencies', () => {
      const tree: TreeNode = {
        name: 'lodash',
        version: '4.17.21',
        dependents: [
          {
            name: 'express',
            version: '4.18.2',
            dependents: [{ name: 'debug', version: '4.3.4' }]
          },
          {
            name: 'axios',
            version: '1.6.7',
            dependents: [{ name: 'debug', version: '4.3.4' }]
          }
        ]
      };
      const listed: ListedDependencies = new Set(['debug@4.3.4']);

      const paths = getPathsToListedDeps(tree, listed);

      expect(paths.length).toBeGreaterThanOrEqual(1);
      const uniqueTargets = new Set(paths.map(p => p[p.length - 1].name));
      expect(uniqueTargets.has('debug')).toBe(true);
    });

    it('returns empty when no listed dep found', () => {
      const tree: TreeNode = {
        name: 'lodash',
        version: '4.17.21',
        dependents: [{ name: 'express', version: '4.18.2' }]
      };
      const listed: ListedDependencies = new Set(['react@18.2.0']);

      const paths = getPathsToListedDeps(tree, listed);

      expect(paths).toHaveLength(0);
    });
  });

  describe('filterPaths', () => {
    it('keeps only nodes that are in listedDependencies', () => {
      const paths = [
        [
          { name: 'lodash', version: '4.17.21' },
          { name: 'express', version: '4.18.2' },
          { name: 'debug', version: '4.3.4' }
        ],
        [
          { name: 'lodash', version: '4.17.21' },
          { name: 'axios', version: '1.6.7' },
          { name: 'debug', version: '4.3.4' }
        ]
      ];
      const listed: ListedDependencies = new Set(['express@4.18.2', 'axios@1.6.7', 'debug@4.3.4']);

      const filtered = filterPaths(paths, listed);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].map(n => n.name)).toEqual(['express', 'debug']);
      expect(filtered[1].map(n => n.name)).toEqual(['axios', 'debug']);
    });

    it('removes duplicate paths', () => {
      const paths = [
        [{ name: 'debug', version: '4.3.4' }],
        [{ name: 'debug', version: '4.3.4' }]
      ];
      const listed: ListedDependencies = new Set(['debug@4.3.4']);

      const filtered = filterPaths(paths, listed);

      expect(filtered).toHaveLength(1);
    });
  });

  describe('buildTree', () => {
    it('builds tree from paths', () => {
      const paths = [
        [
          { name: 'express', version: '4.18.2' },
          { name: 'debug', version: '4.3.4' }
        ],
        [
          { name: 'axios', version: '1.6.7' },
          { name: 'debug', version: '4.3.4' }
        ]
      ];

      const tree = buildTree(paths);

      expect(tree).toHaveLength(2);
      expect(tree.map(n => n.label).sort()).toEqual(['axios@1.6.7', 'express@4.18.2']);
    });

    it('handles nested children', () => {
      const paths = [
        [
          { name: 'express', version: '4.18.2' },
          { name: 'body-parser', version: '1.20.2' },
          { name: 'debug', version: '4.3.4' }
        ]
      ];

      const tree = buildTree(paths);

      expect(tree).toHaveLength(1);
      expect(tree[0].label).toBe('express@4.18.2');
      expect(tree[0].childrens).toHaveLength(1);
      expect(tree[0].childrens[0].label).toBe('body-parser@1.20.2');
    });

    it('avoids duplicate children', () => {
      const paths = [
        [
          { name: 'express', version: '4.18.2' },
          { name: 'debug', version: '4.3.4' }
        ],
        [
          { name: 'express', version: '4.18.2' },
          { name: 'debug', version: '4.3.4' }
        ]
      ];

      const tree = buildTree(paths);

      expect(tree).toHaveLength(1);
      expect(tree[0].childrens).toHaveLength(1);
    });
  });

  describe('complex scenario', () => {
    it('handles complex graph with 20+ dependencies', () => {
      const tree: TreeNode = {
        name: 'webpack',
        version: '5.90.0',
        dependents: [
          {
            name: 'express',
            version: '4.18.2',
            dependents: [
              {
                name: 'body-parser',
                version: '1.20.2',
                dependents: [
                  { name: 'debug', version: '4.3.4' },
                  { name: 'qs', version: '6.11.0' }
                ]
              },
              {
                name: 'cookie-parser',
                version: '1.4.6',
                dependents: [{ name: 'debug', version: '4.3.4' }]
              }
            ]
          },
          {
            name: 'axios',
            version: '1.6.7',
            dependents: [
              { name: 'follow-redirects', version: '1.15.5' },
              {
                name: 'form-data',
                version: '4.0.0',
                dependents: [{ name: 'debug', version: '4.3.4' }]
              }
            ]
          },
          {
            name: 'react',
            version: '18.2.0',
            dependents: [
              {
                name: 'react-dom',
                version: '18.2.0',
                dependents: [{ name: 'scheduler', version: '0.23.0' }]
              },
              { name: 'prop-types', version: '15.8.1' }
            ]
          },
          {
            name: 'lodash',
            version: '4.17.21',
            dependents: [
              {
                name: 'express',
                version: '4.18.2',
                dependents: [{ name: 'debug', version: '4.3.4' }]
              }
            ]
          }
        ]
      };

      const listed: ListedDependencies = new Set([
        'debug@4.3.4',
        'express@4.18.2',
        'react@18.2.0',
        'react-dom@18.2.0',
        'body-parser@1.20.2',
        'form-data@4.0.0',
        'lodash@4.17.21',
        'qs@6.11.0'
      ]);

      const result = analyzePackage({ pkg: tree, listedDependencies: listed });

      expect(result.packageLabel).toBe('webpack@5.90.0');
      expect(result.roots.length).toBeGreaterThan(0);

      const allLabels: string[] = [];
      const collectLabels = (nodes: typeof result.roots) => {
        for (const node of nodes) {
          allLabels.push(node.label);
          collectLabels(node.childrens);
        }
      };
      collectLabels(result.roots);

      expect(allLabels).toContain('express@4.18.2');
      expect(allLabels).toContain('react@18.2.0');
      expect(allLabels).toContain('lodash@4.17.21');
      expect(allLabels).toContain('debug@4.3.4');
      expect(allLabels).toContain('form-data@4.0.0');
    });

    it('handles diamond with shared intermediate nodes', () => {
      const tree: TreeNode = {
        name: 'root-pkg',
        version: '1.0.0',
        dependents: [
          {
            name: 'lib-a',
            version: '2.0.0',
            dependents: [
              {
                name: 'shared-lib',
                version: '3.0.0',
                dependents: [{ name: 'deep-dep', version: '1.0.0' }]
              }
            ]
          },
          {
            name: 'lib-b',
            version: '2.0.0',
            dependents: [
              {
                name: 'shared-lib',
                version: '3.0.0',
                dependents: [{ name: 'deep-dep', version: '1.0.0' }]
              }
            ]
          }
        ]
      };

      const listed: ListedDependencies = new Set([
        'shared-lib@3.0.0',
        'deep-dep@1.0.0',
        'lib-a@2.0.0',
        'lib-b@2.0.0'
      ]);

      const result = analyzePackage({ pkg: tree, listedDependencies: listed });

      expect(result.roots.length).toBe(2);
      expect(result.roots.map(r => r.label).sort()).toEqual(['lib-a@2.0.0', 'lib-b@2.0.0']);
    });

    it('handles deep chain with branching', () => {
      const tree: TreeNode = {
        name: 'app',
        version: '1.0.0',
        dependents: [
          {
            name: 'core',
            version: '5.0.0',
            dependents: [
              {
                name: 'utils',
                version: '2.0.0',
                dependents: [
                  { name: 'debug', version: '4.3.4' },
                  { name: 'ms', version: '2.1.3' }
                ]
              },
              {
                name: 'config',
                version: '1.0.0',
                dependents: [
                  { name: 'debug', version: '4.3.4' },
                  { name: 'deepmerge', version: '4.3.1' }
                ]
              }
            ]
          },
          {
            name: 'ui',
            version: '3.0.0',
            dependents: [
              {
                name: 'react',
                version: '18.2.0',
                dependents: [{ name: 'debug', version: '4.3.4' }]
              },
              {
                name: 'button',
                version: '1.0.0',
                dependents: [{ name: 'debug', version: '4.3.4' }]
              }
            ]
          }
        ]
      };

      const listed: ListedDependencies = new Set([
        'debug@4.3.4',
        'utils@2.0.0',
        'config@1.0.0',
        'react@18.2.0',
        'ui@3.0.0'
      ]);

      const result = analyzePackage({ pkg: tree, listedDependencies: listed });

      const allLabels: string[] = [];
      const collectLabels = (nodes: typeof result.roots) => {
        for (const node of nodes) {
          allLabels.push(node.label);
          collectLabels(node.childrens);
        }
      };
      collectLabels(result.roots);

      expect(allLabels).toContain('utils@2.0.0');
      expect(allLabels).toContain('config@1.0.0');
      expect(allLabels).toContain('react@18.2.0');
    });

    it('handles cyclic dependencies gracefully', () => {
      const nodeA: TreeNode = {
        name: 'module-a',
        version: '1.0.0',
        dependents: [{ name: 'module-b', version: '1.0.0' }]
      };
      const nodeB: TreeNode = {
        name: 'module-b',
        version: '1.0.0',
        dependents: [{ name: 'module-c', version: '1.0.0' }]
      };
      const nodeC: TreeNode = {
        name: 'module-c',
        version: '1.0.0',
        dependents: [{ name: 'module-a', version: '1.0.0' }]
      };

      nodeA.dependents![0] = nodeB;
      nodeB.dependents![0] = nodeC;
      nodeC.dependents![0] = nodeA;

      const tree: TreeNode = nodeA;
      const listed: ListedDependencies = new Set(['module-c@1.0.0']);

      const result = analyzePackage({ pkg: tree, listedDependencies: listed });

      expect(result.packageLabel).toBe('module-a@1.0.0');
    });
  });
});