
/** @module network/component */

import d3 from 'd3';

import {default as scale} from '../common/scale.js';
import {default as misc} from '../common/misc.js';

import {default as legend} from '../component/legend.js';
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
  entered.append('foreignObject')
      .attr('class', 'node-html')
    .append('xhtml:div');
  const merged = entered.merge(nodes);
  if (showStruct) {
    merged.select('.node-content').html(d => d.structure);
  } else {
    merged.select('.node-content').select('svg').remove();
  }
}


function updateEdges(selection, records) {
  const edges = selection.selectAll('.link')
    .data(records, d => `${d.source.index}_${d.target.index}`);
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
  const colorConv = scale.scaleFunction(state.nodeColor);
  const sizeConv = scale.scaleFunction(state.nodeSize);
  const labelColorConv = scale.scaleFunction(state.nodeLabelColor);
  const field = state.nodes.fields
    .find(e => e.key === state.nodeLabel.field);
  const textConv = value => {
    return field.format === 'd3_format'
      ? misc.formatNum(value, field.d3_format) : value;
  };
  selection.selectAll('.node').select('.node-symbol')
      .attr('r', d => sizeConv(d[state.nodeSize.field]))
      .style('fill', d => colorConv(d[state.nodeColor.field]));
  // TODO: tidy up (like rowFactory?)
  if (field.format === 'html') {
    const htwidth = 200;
    const fo = selection.selectAll('.node').select('.node-html');
    fo.attr('x', -htwidth / 2)
      .attr('y', d => state.focusedView ? svgWidth / 2 - 10
        : parseFloat(sizeConv(d[state.nodeSize.field])))
      .attr('width', htwidth);
    fo.select('div')
      .style('font-size', `${state.nodeLabel.size}px`)
      .style('color', d => labelColorConv(d[state.nodeLabelColor.field]))
      .style('text-align', 'center')
      .style('display', state.nodeLabel.visible ? 'block' : 'none')
      .html(d => d[state.nodeLabel.field]);
    selection.selectAll('.node').select('.node-label').text('');
  } else {
    selection.selectAll('.node').select('.node-label')
        .attr('font-size', state.nodeLabel.size)
        .attr('y', d => state.focusedView ? svgWidth / 2 - 10
          : parseFloat(sizeConv(d[state.nodeSize.field])))
        .attr('visibility', state.nodeLabel.visible ? 'inherit' : 'hidden')
        .style('fill', d => labelColorConv(d[state.nodeLabelColor.field]))
        .text(d => textConv(d[state.nodeLabel.field]));
    selection.selectAll('.node').select('.node-html div').html('');
  }
}


function updateEdgeAttrs(selection, state) {
  const colorConv = scale.scaleFunction(state.edgeColor);
  const widthConv = scale.scaleFunction(state.edgeWidth);
  const labelColorConv = scale.scaleFunction(state.edgeLabelColor);
  selection.selectAll('.link').select('.edge-line')
    .style('stroke', d => colorConv(d[state.edgeColor.field]))
    .style('stroke-width', d => widthConv(d[state.edgeWidth.field]));
  selection.selectAll('.link').select('.edge-label')
    .attr('font-size', state.edgeLabel.size)
    .attr('visibility', state.edgeLabel.visible ? 'inherit' : 'hidden')
    .style('fill', d => labelColorConv(d[state.edgeLabelColor.field]))
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
  selection.call(updateNodeAttrs, state);
  selection.call(updateEdgeAttrs, state);
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
  selection.select('.node-layer')
    .call(updateNodes, nodesToRender, state.focusedView);
  selection.select('.edge-layer')
    .call(updateEdges, edgesToRender);
  selection.call(updateAttrs, state);
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
  selection.select('.edge-layer')
    .selectAll(".link")
    .filter(d => n.adjacency.map(e => e[1]).includes(d.num))
    .each(function (d) {
      if (n.index === d.source.index) {
        d3.select(this).call(moveEdge, x, y, d.tx, d.ty);
      } else if (n.index === d.target.index) {
        d3.select(this).call(moveEdge, d.sx, d.sy, x, y);
      }
    });
}


function networkView(selection, state) {
  selection.call(transform.view, state);
  const field = selection.select('.field');
  const edges = field.append('g').classed('edge-layer', true);
  const nodes = field.append('g').classed('node-layer', true);
  const legendGroup = selection.append('g')
      .classed('legends', true);
  legendGroup.append('g')
      .classed('nodecolor', true)
      .call(legend.colorBarLegend);

  // Apply changes in datasets
  state.updateAllNotifier = () => {
    state.updateWorkingCopy();
    state.updateControlBoxNotifier();  // Update selectBox options
    state.setForceNotifier();
    state.updateComponentNotifier();
  };
  // Apply changes in nodes and edges displayed
  state.updateComponentNotifier = () => {
    state.updateLegendNotifier();
    const coords = state.ns.map(e => ({x: e.x, y: e.y}));
    state.setAllCoords(coords);
    selection.call(updateComponents, state);
    state.updateInteractionNotifier();  // Apply drag events to each nodes
  };
  state.updateNodeNotifier = () => {
    nodes.call(updateNodes, state.nodesToRender());
    state.updateLegendNotifier();
  };
  state.updateEdgeNotifier = () => {
    edges.call(updateEdges, state.edgesToRender());
  };
  state.updateNodeAttrNotifier = () => {
    nodes.call(updateNodeAttrs, state);
    state.updateLegendNotifier();
  };
  state.updateEdgeAttrNotifier = () => {
    edges.call(updateEdgeAttrs, state);
  };
  state.updateLegendNotifier = () => {
    legendGroup.call(legend.updateLegendGroup,
                     state.viewBox, state.legendOrient);
    legendGroup.select('.nodecolor')
        .attr('visibility', state.nodeColor.legend ? 'inherit' : 'hidden')
        .call(legend.updateColorBarLegend, state.nodeColor);
  };
}


export default {
  updateNodes, updateEdges, updateNodeCoords, updateEdgeCoords,
  updateNodeAttrs, updateEdgeAttrs, updateAttrs, updateComponents,
  move, moveEdge, networkView
};
