
/** @module network/force */

import d3 from 'd3';

import {default as component} from './component.js';
import {default as interaction} from './interaction.js';


const forceType = [
  {
    key: 'aggregate',
    name: 'Aggregate',
    force: d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.index).distance(60).strength(1))
      .force('charge',
        d3.forceManyBody().strength(-600).distanceMin(15).distanceMax(720))
      .force('collide', d3.forceCollide().radius(90))
      .force('x', d3.forceX().strength(0.002))
      .force('y', d3.forceY().strength(0.002))
  },
  {
    key: 'tree',
    name: 'Tree',
    force: d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.index).distance(60).strength(2))
      .force('charge',
        d3.forceManyBody().strength(-6000).distanceMin(15).distanceMax(720))
      .force('collide', d3.forceCollide().radius(90))
      .force('x', d3.forceX().strength(0.0002))
      .force('y', d3.forceY().strength(0.0002))
  },
  {
    key: 'sparse',
    name: 'Sparse',
    force: d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.index).distance(60).strength(2))
      .force('charge',
        d3.forceManyBody().strength(-6000).distanceMin(15).distanceMax(3600))
      .force('collide', d3.forceCollide().radius(90))
      .force('x', d3.forceX().strength(0.0002))
      .force('y', d3.forceY().strength(0.0002))
  }
];


function forceSimulation(type, width, height) {
  return forceType.find(e => e.key === type).force
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
  selection.selectAll('.node')
    .each(d => {
      d.fx = d.x;
      d.fy = d.y;
    });
  state.dragListener = interaction.dragListener(selection, state);
  state.forceActive = false;
}


function unstick(selection, simulation, state) {
  selection.selectAll('.node')
    .each(d => {
      d.fx = null;
      d.fy = null;
    });
  state.dragListener = forceDragListener(selection, simulation, state);
  state.forceActive = true;
}


function activate(selection, state) {
  state.setForceNotifier = () => {
    const simulation = forceSimulation(
        state.forceType, state.fieldWidth, state.fieldHeight);
    simulation.nodes(state.ns)
      .force('link').links(state.currentEdges());
    simulation
      .on('tick', () => {
        const coords = state.ns.map(e => ({x: e.x, y: e.y}));
        state.setAllCoords(coords);
        selection.selectAll(".node")
          .call(component.updateNodeCoords);
        selection.selectAll(".link")
          .call(component.updateEdgeCoords);
        state.tickCallback(simulation);
      })
      .on('end', () => {
        state.updateComponentNotifier();
        state.tickCallback(simulation);
      });
    if (state.forceActive) {
      state.coords ? state.relaxNotifier() : state.restartNotifier();
    } else {
      state.stickNotifier();
    }

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
  };
}


export default {
  forceType, forceSimulation, activate
};
