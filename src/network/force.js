
/** @module graph/GraphForce */

import d3 from 'd3';

import {default as component} from './GraphComponent.js';
import {default as interaction} from './GraphInteraction.js';


function forceSimulation(width, height) {
  // width, height = 1200;
  return d3.forceSimulation()
    .force('link',
      d3.forceLink().id(d => d.index)
        .distance(60)
        .strength(1))
    .force('charge',
      d3.forceManyBody()
        .strength(-600)
        .distanceMin(15)
        .distanceMax(720))
    .force('collide',
      d3.forceCollide()
        .radius(90))
    .force('center',
      d3.forceCenter(width / 2, height / 2))
    .force('x',
      d3.forceX()
        .strength(0.002))
    .force('y',
      d3.forceY()
        .strength(0.002))
    .stop();
}


function forceTickListener(selection, simulation) {
  return () => {
    selection.select('.nw-nodes').selectAll('.node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
    // show temperature
    const alpha = simulation.alpha();
    const isStopped = alpha <= simulation.alphaMin();
    d3.select('#temperature')
      .classed('progress-success', isStopped)
      .classed('progress-warning', !isStopped)
      .attr('value', isStopped ? 1 : 1 - alpha)
      .text(isStopped ? 1 : 1 - alpha);
  };
}


function forceEndListener(selection) {
  return () => {
    selection.select('.nw-edges').selectAll('.link')
      .attr('transform', d => `translate(${d.source.x}, ${d.source.y})`)
      .attr('visibility', 'visible');
    selection.select('.nw-edges').selectAll('.edge-line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', d => d.target.x - d.source.x)
      .attr('y2', d => d.target.y - d.source.y);
    selection.select('.nw-edges').selectAll('.edge-label')
      .attr('x', d => (d.target.x - d.source.x) / 2)
      .attr('y', d => (d.target.y - d.source.y) / 2);
  };
}


function forceDragListener(selection, simulation) {
  return d3.drag()
    .on('start', () => {
      d3.select('#graph-components').selectAll('.link')
        .attr('visibility', 'hidden');
      if (!d3.event.active) simulation.alphaTarget(0.1).restart();
    })
    .on('drag', d => {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    })
    .on('end', d => {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}


function activate(selection, simulation, data) {
  simulation.nodes(data.nodes)
    .force('link').links(data.edges);
  simulation
    .on('tick', forceTickListener(selection, simulation))
    .on('end', forceEndListener(selection));
  simulation.alpha(1).restart();
}


function stick(selection, simulation, data) {
  simulation.alpha(0).stop();
  selection.selectAll('.node').each(d => {
    d.fx = d.x;
    d.fy = d.y;
  });
  simulation.dispatch('tick');
  simulation.dispatch('end');
  d3.select('#graph-components').selectAll('.node')
    .call(interaction.setDragListener(selection, data));
  // d3.select('#stick-nodes').property('checked', true);
  selection.select('.nw-edges').selectAll('.link')
    .attr('visibility', 'visible');
  // debug
  component.showBoundary(d3.select('#graph-components'));
}


function unstick(selection, simulation) {
  d3.selectAll('.node').each(d => {
    d.fx = null;
    d.fy = null;
  });
  d3.select('#stick-nodes').property('checked', false);
  d3.select('#graph-components').selectAll('.link')
    .attr('visibility', 'hidden');
  d3.select('#graph-components').selectAll('.node')
    .call(forceDragListener(selection, simulation));
}


function relax(selection, simulation) {
  unstick(selection, simulation);
  simulation.alpha(0.1).restart();
}


function restart(selection, simulation) {
  unstick(selection, simulation);
  simulation.alpha(1).restart();
}


export default {
  forceSimulation, forceTickListener, forceEndListener, forceDragListener,
  activate, stick, unstick, relax, restart
};
