
/** @module network/force */

import d3 from 'd3';

import {default as component} from './component.js';
import {default as interaction} from './interaction.js';


const forcePresets = {
  aggregate: d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.index).distance(60).strength(1))
    .force('charge',
      d3.forceManyBody().strength(-600).distanceMin(15).distanceMax(720))
    .force('collide', d3.forceCollide().radius(90))
    .force('x', d3.forceX().strength(0.002))
    .force('y', d3.forceY().strength(0.002)),
  tree: d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.index).distance(60).strength(2))
    .force('charge',
      d3.forceManyBody().strength(-6000).distanceMin(15).distanceMax(720))
    .force('collide', d3.forceCollide().radius(90))
    .force('x', d3.forceX().strength(0.0002))
    .force('y', d3.forceY().strength(0.0002))
};


function forceSimulation(preset, width, height) {
  return forcePresets[preset]
    .force('center', d3.forceCenter(width / 2, height / 2))
    .stop();
}


function forceDragListener(selection, simulation, state) {
  return d3.drag()
    .on('start', () => {
      if (!d3.event.active) state.relaxNotifier();
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


function stick(selection, simulation, state) {
  simulation.alpha(0).stop();
  selection.select('.node-layer').selectAll('.node')
    .each(d => {
      d.fx = d.x;
      d.fy = d.y;
    });
  state.dragListener = interaction.dragListener(selection, state);
  state.forceActive = false;
}


function unstick(selection, simulation, state) {
  selection.select('.node-layer').selectAll('.node')
    .each(d => {
      d.fx = null;
      d.fy = null;
    });
  state.dragListener = forceDragListener(selection, simulation, state);
  state.forceActive = true;
}


function activate(selection, simulation, state) {
  simulation
    .on('tick', () => {
      const coords = state.ns.map(e => ({x: e.x, y: e.y}));
      state.setAllCoords(coords);
      selection.select('.node-layer').selectAll(".node")
        .call(component.updateNodeCoords);
      selection.select('.edge-layer').selectAll(".link")
        .call(component.updateEdgeCoords);
      state.tickCallback(simulation);
    })
    .on('end', () => {
      state.updateComponentNotifier();
      state.tickCallback(simulation);
    });
  state.setForceNotifier = () => {
    simulation.nodes(state.ns)
      .force('link').links(state.currentEdges());
    if (state.forceActive) {
      state.coords ? state.relaxNotifier() : state.restartNotifier();
    } else {
      state.stickNotifier();
    }
  };
  state.stickNotifier = () => {
    selection.call(stick, simulation, state);
  };
  state.relaxNotifier = () => {
    selection.call(unstick, simulation, state);
    simulation.alpha(0.1).restart();
  };
  state.restartNotifier = () => {
    selection.call(unstick, simulation, state);
    simulation.alpha(1).restart();
  };
}


export default {
  forceSimulation, activate
};
