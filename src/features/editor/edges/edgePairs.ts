import { createContext, useContext } from 'react';
import type { Edge } from '@xyflow/react';

export interface EdgePairInfo {
  index: number;
  total: number;
}

export type EdgePairMap = ReadonlyMap<string, EdgePairInfo>;

const EMPTY_MAP: EdgePairMap = new Map();

const EdgePairContext = createContext<EdgePairMap>(EMPTY_MAP);

export const EdgePairProvider = EdgePairContext.Provider;

export const useEdgePairInfo = (edgeId: string): EdgePairInfo => {
  const map = useContext(EdgePairContext);
  return map.get(edgeId) ?? { index: 0, total: 1 };
};

// Groups edges by undirected (source,target) pair and assigns each edge its
// index within the bucket plus the bucket size. Sort within a bucket is by
// edge id for a stable order.
export function buildEdgePairMap(edges: Edge[]): EdgePairMap {
  const buckets = new Map<string, Edge[]>();
  for (const edge of edges) {
    const a = edge.source < edge.target ? edge.source : edge.target;
    const b = edge.source < edge.target ? edge.target : edge.source;
    const key = `${a}|${b}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(edge);
    else buckets.set(key, [edge]);
  }

  const result = new Map<string, EdgePairInfo>();
  for (const bucket of buckets.values()) {
    if (bucket.length > 1) bucket.sort((x, y) => x.id.localeCompare(y.id));
    for (let i = 0; i < bucket.length; i++) {
      result.set(bucket[i].id, { index: i, total: bucket.length });
    }
  }
  return result;
}
