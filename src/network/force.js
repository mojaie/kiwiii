
/** @module network/force */

import d3 from 'd3';

import {default as component} from './component.js';
import {default as interaction} from './interaction.js';


function forceSimulation(width, height) {
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


function showTemperature(simulation) {
  const alpha = simulation.alpha();
  const isStopped = alpha <= simulation.alphaMin();
  // TODO: select temperature indicator
  d3.select('#temperature')
    .classed('progress-success', isStopped)
    .classed('progress-warning', !isStopped)
    .attr('value', isStopped ? 1 : 1 - alpha)
    .text(isStopped ? 1 : 1 - alpha);
}


function forceDragListener(selection, simulation, state) {
  return d3.drag()
    .on('start', () => {
      if (!d3.event.active) selection.call(relax, simulation, state);
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


function forceZoomListener(selection, simulation, state) {
  return d3.zoom()
    .on('zoom', function() {
      selection.call(
        component.transform,
        d3.event.transform.x, d3.event.transform.y, d3.event.transform.k
      );
    })
    .on('end', function() {
      const alpha = simulation.alpha();
      const isStopped = alpha <= simulation.alphaMin();
      if (isStopped) {
        state.setTransform(
          d3.event.transform.x, d3.event.transform.y, d3.event.transform.k
        );
        selection
          .call(component.updateComponents, state);
      }
    });
}


function end(selection, simulation, state) {
  const coords = state.nodes.map(e => ({x: e.x, y: e.y}));
  state.setAllCoords(coords);
  selection
    .call(component.updateComponents, state);
  showTemperature(simulation);
}


function stick(selection, simulation, state) {
  simulation.alpha(0).stop();
  selection.select('.nw-nodes').selectAll('.node')
    .each(d => {
      d.fx = d.x;
      d.fy = d.y;
    });
  state.zoomListener = interaction.zoomListener(selection, state);
  state.dragListener = interaction.dragListener(selection, state);
  selection.call(end, simulation, state);
}


function unstick(selection, simulation, state) {
  selection.select('.nw-nodes').selectAll('.node')
    .each(d => {
      d.fx = null;
      d.fy = null;
    });
  state.zoomListener = forceZoomListener(selection, simulation, state);
  state.dragListener = forceDragListener(selection, simulation, state);
  // Render all nodes and do not render edges
  // TODO: edge rendering behavior should be changed by data size or setting
  selection.select('.nw-nodes')
    .call(component.updateNodes, state.nodes);
  selection.select('.nw-edges')
    .call(component.updateEdges, []);
  selection.call(component.updateAttrs, state);
  selection.call(state.zoomListener);
  selection.select('.nw-nodes').selectAll('.node')
    .call(state.dragListener);
}


function relax(selection, simulation, state) {
  selection.call(unstick, simulation, state);
  simulation.alphaTarget(0.1).restart();
}


function restart(selection, simulation, state) {
  selection.call(unstick, simulation, state);
  simulation.alpha(1).restart();
}


function activate(selection, simulation, state) {
  simulation.nodes(state.nodes)
    .force('link').links(state.edges);
  simulation
    .on('tick', () => {
      selection.select('.nw-nodes').selectAll(".node")
        .call(component.updateNodeCoords);
      showTemperature(simulation);
    })
    .on('end', () => selection.call(end, simulation, state));
  if (state.simulationOnLoad) {
    selection.call(restart, simulation, state);
  } else {
    selection.call(stick, simulation, state);
  }
}


export default {
  forceSimulation, activate, stick, relax, restart
};
