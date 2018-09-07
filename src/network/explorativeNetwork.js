
/** @module network/similarity */

import _ from 'lodash';


function explorativeNetwork(nodes, edges) {
  let baseFactor = 0;
  let adjField = 'adjacency';
  let sourceField = 'source';
  let targetField = 'target';
  let weightField = 'weight';

  function expnet() {
    const elevations = {};
    nodes.forEach((n, i) => {
      if (!n.adjacency.length) return 0;
      elevations[i] = _.max(n.adjacency.map(e => edges[e[1]].weight));
    });
    const pathWeights = {};
    edges.forEach((e, i) => {
      const mn = _.min([elevations[e.source], elevations[e.target]]);
      pathWeights[i] = (e.weight - baseFactor) / (mn - baseFactor);
    });
    return {
      elevations: elevations, pathWeights: pathWeights
    };
  }

  expnet.baseFactor = function (bf) {
    baseFactor = bf;
    return expnet;
  };

  return expnet;
}


export default {
  explorativeNetwork
};
