import { describe, expect, it } from 'vitest';
import { API_ENDPOINTS } from '@/shared/lib/api/endpoints';
import { apiContractPaths } from '@/shared/types/api-contract.types';

interface EndpointTree {
  [key: string]: string | ((value: string) => string) | EndpointTree;
}

const collectEndpointPaths = (tree: EndpointTree): string[] =>
  Object.entries(tree).flatMap(([key, value]) => {
    if (typeof value === 'string') return [value];

    if (typeof value === 'function') {
      const placeholder = key.includes('CODE') ? 'code' : 'id';
      return [value(placeholder).replace(`/${placeholder}`, `/{${placeholder}}`)];
    }

    return collectEndpointPaths(value);
  });

describe('API endpoint contract', () => {
  it('keeps frontend endpoint constants aligned with backend OpenAPI paths', () => {
    const contractPaths = new Set<string>(apiContractPaths);
    const frontendPaths = collectEndpointPaths(API_ENDPOINTS);
    const missing = frontendPaths.filter((path) => !contractPaths.has(path));

    expect(missing).toEqual([]);
  });
});
