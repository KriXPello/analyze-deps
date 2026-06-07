import { describe, it, expect } from 'vitest';
import { getDependencyLabel } from './utils';

describe('getDependencyLabel', () => {
  it('combines name and version', () => {
    expect(getDependencyLabel('lodash', '4.17.21')).toBe('lodash@4.17.21');
  });

  it('handles scoped packages', () => {
    expect(getDependencyLabel('@types/node', '20.11.0')).toBe('@types/node@20.11.0');
  });

  it('handles complex versions', () => {
    expect(getDependencyLabel('react', '18.2.0-alpha.0')).toBe('react@18.2.0-alpha.0');
  });
});