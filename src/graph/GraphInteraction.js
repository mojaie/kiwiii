
import d3 from 'd3';

import {default as force} from './GraphForce.js';

const zoom = d3.zoom()
  .on('zoom', () => {
    d3.select('#graph-contents').attr('transform', d3.event.transform);
  });

const dragWithForce = d3.drag()
  .on('start', () => {
    d3.select('#graph-contents').selectAll('.link')
      .attr('visibility', 'hidden');
    if (!d3.event.active) force.simulation.alphaTarget(0.1).restart();
  })
  .on('drag', d => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on('end', d => {
    if (!d3.event.active) force.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  });

const dragNoForce = d3.drag()
  .on('drag', function (d) {
    d3.select(this)
      .attr('transform', () => `translate(${d3.event.x}, ${d3.event.y})`);
    d.x = d3.event.x;
    d.y = d3.event.y;
    const connected = d3.select('#graph-contents').selectAll('.link')
      .filter(d => [d.source.index, d.target.index].includes(this.__data__.index));
    connected.attr('transform', d => `translate(${d.source.x}, ${d.source.y})`)
      .attr('visibility', 'visible');
    connected.select('.edge-line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', d => d.target.x - d.source.x)
      .attr('y2', d => d.target.y - d.source.y);
    connected.select('.edge-label')
      .attr('x', d => (d.target.x - d.source.x) / 2)
      .attr('y', d => (d.target.y - d.source.y) / 2);
  })
  .on('end', () => {
    force.end();
  });


function stickNodes() {
  force.simulation.alpha(0).stop();
  d3.selectAll('.node').each(d => {
    d.fx = d.x;
    d.fy = d.y;
  });
  force.tick();
  force.end();
  d3.select('#stick-nodes').property('checked', true);
  d3.select('#graph-contents').selectAll('.link')
    .attr('visibility', 'visible');
  d3.select('#graph-contents').selectAll('.node')
    .call(dragNoForce);
}


function unstickNodes() {
  d3.selectAll('.node').each(d => {
    d.fx = null;
    d.fy = null;
  });
  d3.select('#stick-nodes').property('checked', false);
  d3.select('#graph-contents').selectAll('.link')
    .attr('visibility', 'hidden');
  d3.select('#graph-contents').selectAll('.node')
    .call(dragWithForce);
}


function relax() {
  unstickNodes();
  force.simulation.alpha(0.1).restart();
}


function restart() {
  unstickNodes();
  force.simulation.alpha(1).restart();
}


function fitToScreen() {
  d3.select('#graph-field').call(zoom.transform, d3.zoomIdentity);
  // TODO
  /*
  const p = 0.9;  // padding factor
  const x = extent(selectAll('.node').data(), d => d.x);
  const y = extent(selectAll('.node').data(), d => d.y);
  const w = x[1] - x[0];
  const h = y[1] - y[0];
  const vb = select('#graph-field').attr('viewBox').split(' ');
  const xScaleF = vb[2] / w * p;
  const yScaleF = vb[3] / h * p;
  const scaleF = Math.max(xScaleF, yScaleF);
  const center = [(w * (1 - p) / 2 - x[0]) * xScaleF,
                  (h * (1 - p) / 2 - y[0]) * yScaleF];
  // Reset zoom point
  zoom.scale(scaleF);
  zoom.translate(center);
  updateViewportTransform(center, scaleF);
  */
}


export default {
  zoom, dragWithForce, dragNoForce,
  stickNodes, unstickNodes,
  relax, restart, fitToScreen
};
