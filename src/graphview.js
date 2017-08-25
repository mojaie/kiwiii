
import d3 from 'd3';

import {fetchJSON} from './helper/file.js';
import {getGlobalConfig} from './store/StoreConnection.js';
import {setForce, tick, end} from './graph/GraphForce.js';
import {updateNodeImage} from './graph/GraphControlBox.js';
import {graphNodes, graphEdges} from './graph/GraphComponent.js';
import {zoom, stickNodes} from './graph/GraphInteraction.js';


function resume(snapshot) {
  if (snapshot.hasOwnProperty('fieldTransform')) {
    const tf = snapshot.fieldTransform;
    const transform = d3.zoomIdentity.translate(tf.x, tf.y).scale(tf.k);
    d3.select('#graph-contents').attr('transform', transform);
    d3.select('#graph-field').call(zoom.transform, transform);
  }
  if (snapshot.hasOwnProperty('nodePositions')) {
    d3.selectAll('.node').each((d, i) => {
      d.x = snapshot.nodePositions[i].x;
      d.y = snapshot.nodePositions[i].y;
    });
  }
  updateNodeImage(snapshot);
}


function render(g) {
  g.nodes.records.forEach(e => { delete e._mol; });
  const edgesToDraw = g.edges.records
    .filter(e => e.weight >= g.edges.networkThreshold);
  graphEdges(d3.select('#graph-contents'), edgesToDraw);
  graphNodes(d3.select('#graph-contents'), g.nodes.records);
  setForce(g.nodes.records, edgesToDraw, tick, end);
  resume(g.edges.snapshot);
  stickNodes();
  d3.select('#graph-contents').style('opacity', 1e-6)
    .transition()
    .duration(1000)
    .style('opacity', 1);
}


d3.select('#graph-field')
  .attr('viewBox', `0 0 800 600`)
  .call(zoom);



function run() {
  const url = getGlobalConfig('urlQuery').location;
  return fetchJSON(url).then(render);
}
run();
