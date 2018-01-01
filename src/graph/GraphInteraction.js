
import d3 from 'd3';

import {default as force} from './GraphForce.js';

const zoom = d3.zoom()
  .on('zoom', () => {
    d3.select('#graph-field').attr('transform', d3.event.transform);
    // debug
    d3.select('#debug-transform').text(d3.event.transform);
    const box = d3.select('#graph-components').node().getBBox();
    d3.select('#debug-viewport-left').text(box.x);
    d3.select('#debug-viewport-top').text(box.y);
    d3.select('#debug-viewport-width').text(box.width);
    d3.select('#debug-viewport-height').text(box.height);
  });

const dragWithForce = d3.drag()
  .on('start', () => {
    d3.select('#graph-components').selectAll('.link')
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
      .attr('transform', `translate(${d3.event.x}, ${d3.event.y})`);
    d.x = d3.event.x;
    d.y = d3.event.y;
    const connected = d3.select('#graph-components').selectAll('.link')
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
    // debug
    const box = d3.select('#graph-components').node().getBBox();
    d3.select('#debug-viewport-left').text(box.x);
    d3.select('#debug-viewport-top').text(box.y);
    d3.select('#debug-viewport-width').text(box.width);
    d3.select('#debug-viewport-height').text(box.height);
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
  d3.select('#graph-components').selectAll('.link')
    .attr('visibility', 'visible');
  d3.select('#graph-components').selectAll('.node')
    .call(dragNoForce);
  // debug
  const box = d3.select('#graph-components').node().getBBox();
  d3.select('#debug-viewport-left').text(box.x);
  d3.select('#debug-viewport-top').text(box.y);
  d3.select('#debug-viewport-width').text(box.width);
  d3.select('#debug-viewport-height').text(box.height);
}


function unstickNodes() {
  d3.selectAll('.node').each(d => {
    d.fx = null;
    d.fy = null;
  });
  d3.select('#stick-nodes').property('checked', false);
  d3.select('#graph-components').selectAll('.link')
    .attr('visibility', 'hidden');
  d3.select('#graph-components').selectAll('.node')
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
  const viewBox = d3.select('#graph-view-boundary').node().getBBox();
  const viewBoxRatio = viewBox.width / viewBox.height;
  const field = d3.select('#graph-components').node().getBBox();
  const fieldRatio = field.width / field.height;
  const scale = viewBoxRatio >= fieldRatio
    ? viewBox.height / field.height
    : viewBox.width / field.width;
  const tx = -field.x * scale;
  const ty = -field.y * scale;
  d3.select('#graph-field')
      .attr('transform', `translate(${tx}, ${ty}) scale(${scale})`);
  d3.select('#graph-view')
      .call(
        zoom.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
}


export default {
  zoom, dragWithForce, dragNoForce,
  stickNodes, unstickNodes,
  relax, restart, fitToScreen
};
