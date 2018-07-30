
/** @module network/component */

import d3 from 'd3';

import {default as scale} from '../common/scale.js';
import {default as misc} from '../common/misc.js';

import {default as transform} from '../component/transform.js';


const svgWidth = 180;  //TODO
const svgHeight = 180;  //TODO


function updateNodes(selection, records, showStruct) {
  const nodes = selection.selectAll('.node')
    .data(records, d => d.index);
  nodes.exit().remove();
  const entered = nodes.enter()
    .append('g')
      .attr('class', 'node')
      .call(updateNodeCoords);
  entered.append('circle')
      .attr('class', 'node-symbol');
  entered.append('g')
      .attr('class', 'node-content')
      .attr('transform', `translate(${-svgWidth / 2},${-svgHeight / 2})`);
  entered.append('text')
      .attr('class', 'node-label')
      .attr('x', 0)
      .attr('text-anchor', 'middle');
  const merged = entered.merge(nodes);
  if (showStruct) {
    merged.select('.node-content').html(d => d.structure);
  } else {
    merged.select('.node-content').select('svg').remove();
  }
}


function updateEdges(selection, records) {
  const edges = selection.selectAll('.link')
    .data(records, d => `${d.source}_${d.target}`);
  edges.exit().remove();
  const entered = edges.enter()
    .append('g')
      .attr('class', 'link');
  entered.append('line')
      .attr('class', 'edge-line')
      .style('stroke-opacity', 0.6);
  entered.append('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle');
  // draw all components and then
  entered.call(updateEdgeCoords);
}


function updateNodeAttrs(selection, state) {
  selection.selectAll('.node')
    .each(function (d) {
      const color = scale.scaleFunction(state.nodeColor)(d[state.nodeColor.field]);
      const size = scale.scaleFunction(state.nodeSize)(d[state.nodeSize.field]);
      const labelColor = scale.scaleFunction(state.nodeLabelColor)(d[state.nodeLabelColor.field]);
      d3.select(this).select('.node-symbol')
          .attr('r', size)
          .style('fill', color);
      d3.select(this).select('.node-label')
          .text(d => {
            if (state.nodeLabel.field === null) return '';
            const field = state.nodes.fields.find(e => e.key === state.nodeLabel.field);
            if (field.format === 'd3_format') {
              return misc.formatNum(d[state.nodeLabel.field], field.d3_format);
            }
            return d[state.nodeLabel.field];
          })
          .attr('font-size', state.nodeLabel.size)
          .attr('y', parseFloat(size) + parseInt(state.nodeLabel.size))
          .attr('visibility', state.nodeLabel.visible ? 'inherit' : 'hidden')
          .style('fill', labelColor);
    });
}


function updateEdgeAttrs(selection, state) {
  selection.selectAll('.link').select('.edge-line')
    .style('stroke',
           d => scale.scaleFunction(state.edgeColor)(d[state.edgeColor.field]))
    .style('stroke-width',
           d => scale.scaleFunction(state.edgeWidth)(d[state.edgeWidth.field]));
  selection.selectAll('.link').select('.edge-label')
    .attr('visibility', state.edgeLabel.visible ? 'inherit' : 'hidden')
    .attr('font-size', state.edgeLabel.size)
    .text(d => d[state.edgeLabel.field]);
}


function updateNodeCoords(selection) {
  selection.attr('transform', d => `translate(${d.x}, ${d.y})`);
}


function updateEdgeCoords(selection) {
  selection.attr('transform', d => `translate(${d.sx}, ${d.sy})`);
  selection.select('.edge-line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', d => d.tx - d.sx)
    .attr('y2', d => d.ty - d.sy);
  selection.select('.edge-label')
    .attr('x', d => (d.tx - d.sx) / 2)
    .attr('y', d => (d.ty - d.sy) / 2);
}


function updateAttrs(selection, state) {
  selection.select('.nw-nodes').call(updateNodeAttrs, state);
  selection.select('.nw-edges').call(updateEdgeAttrs, state);
}


function updateComponents(selection, state) {
  const nodesToRender = state.nodesToRender();
  const numNodes = nodesToRender.length;
  if (state.enableFocusedView) {
    state.focusedView = numNodes < state.focusedViewThreshold;
  }
  if (state.enableOverlookView) {
    state.overlookView = numNodes > state.overlookViewThreshold;
  }
  const edgesToRender = state.overlookView ? [] : state.edgesToRender();
  selection.select('.nw-nodes')
    .call(updateNodes, nodesToRender, state.focusedView);
  selection.select('.nw-edges')
    .call(updateEdges, edgesToRender);
  selection.call(updateAttrs, state);
  // Rebind event listeners
  if (state.zoomListener) {
    selection.call(state.zoomListener);
  }
  if (state.dragListener) {
    selection.select('.nw-nodes').selectAll('.node')
      .call(state.dragListener);
  }
}


function moveNode(selection, x, y) {
  selection.attr('transform', `translate(${x}, ${y})`);
}


function moveEdge(selection, sx, sy, tx, ty) {
  selection.attr('transform', `translate(${sx}, ${sy})`);
  selection.select('.edge-line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', tx - sx)
    .attr('y2', ty - sy);
  selection.select('.edge-label')
    .attr('x', (tx - sx) / 2)
    .attr('y', (ty - sy) / 2);
}


function move(selection, node, x, y) {
  const n = d3.select(node).call(moveNode, x, y).datum();
  selection.select('.nw-edges')
    .selectAll(".link")
    .filter(d => n.adjacency.map(e => e[1]).includes(d.num))
    .each(function (d) {
      if (n.index === d.source.index || n.index === d.source) {
        d3.select(this).call(moveEdge, x, y, d.tx, d.ty);
      } else if (n.index === d.target.index || n.index === d.target) {
        d3.select(this).call(moveEdge, d.sx, d.sy, x, y);
      }
    });
}


function networkView(selection, state) {
  selection.call(transform.view, state);
  const field = selection.select('.field');
  const edges = field.append('g').classed('nw-edges', true);
  const nodes = field.append('g').classed('nw-nodes', true);

  state.updateAllNotifier = () => {
    state.updateWorkingCopy();
    selection.call(updateComponents, state);
  };
  state.updateComponentNotifier = () => {
    selection.call(updateComponents, state);
  };
  state.updateNodeNotifier = () => {
    nodes.call(updateNodes, state.nodesToRender());
  };
  state.updateEdgeNotifier = () => {
    edges.call(updateEdges, state.edgesToRender());
  };
  state.updateNodeAttrNotifier = () => {
    nodes.call(updateNodeAttrs, state);
  };
  state.updateEdgeAttrNotifier = () => {
    edges.call(updateEdgeAttrs, state);
  };
}


export default {
  updateNodes, updateEdges, updateNodeCoords, updateEdgeCoords,
  updateNodeAttrs, updateEdgeAttrs, updateAttrs, updateComponents,
  move, networkView
};
