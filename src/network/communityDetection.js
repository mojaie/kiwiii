
/** @module network/communityDetection */

import jLouvain from 'jLouvain';


export function communityDetection(nodes, edges, option) {
  const nodeField = option.nodeField || 'index';
  const weightField = option.weightField || 'weight';
  if (!edges.length) {
    const community = {};
    nodes.forEach(e => { community[e] = option.nulliso ? null : e; });
    return community;
  }
  const ns = nodes.map(e => e[nodeField]);
  const es = edges.map(e => ({
    source: e.source[nodeField], target: e.target[nodeField],
    weight: e[weightField]
  }));
  const clusters = {};
  const community = jLouvain().nodes(ns).edges(es)();
  Object.entries(community).forEach(e => {
    if (!clusters.hasOwnProperty(e[1])) {
      clusters[e[1]] = [];
    }
    clusters[e[1]].push(e[0]);
  });
  // Sort by cluster size
  Object.entries(clusters)
    .sort((a, b) => a[1].length < b[1].length)
    .forEach((cluster, i) => {
      if (cluster[1].length === 1) {
        community[cluster[1][0]] = option.nulliso ? null : i;
      } else {
        cluster[1].forEach(e => {
          community[e] = i;
        });
      }
    });
  return community;
}


export default {
  communityDetection
};
