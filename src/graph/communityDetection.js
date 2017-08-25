
import jLouvain from 'jLouvain';


export function communityDetection(nodes, edges, option) {
  // TODO: partition resolution setting
  // TODO: Error at edges.length 0
  const community = jLouvain().nodes(nodes).edges(edges)();
  // assign null to singletons
  if (option.nulliso) {
    const clusters = {};
    Object.entries(community).forEach(e => {
      if (!clusters.hasOwnProperty(e[1])) {
        clusters[e[1]] = [];
      }
      clusters[e[1]].push(e[0]);
    });
    Object.entries(clusters).forEach(e => {
      if (e[1].length === 1) {
        community[e[1][0]] = null;
      }
    });
  }
  return community;
}


export default {
  communityDetection
};
