
/** @module network/communityDetection */

import jLouvain from 'jLouvain';


export function communityDetection(nodes, edges, option) {
  // TODO: partition resolution setting
  // TODO: Error at edges.length 0
  if (!edges.length) {
    const community = {};
    nodes.forEach(e => { community[e] = option.nulliso ? null : e; });
    return community;
  }
  const clusters = {};
  const community = jLouvain().nodes(nodes).edges(edges)();
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
