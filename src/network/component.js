
/** @module network */

import d3 from 'd3';

import {default as d3scale} from '../helper/d3Scale.js';
import {default as fmt} from '../helper/formatValue.js';


function updateNodes(selection, records) {
  const nodes = selection.selectAll('.node')
    .data(records, d => d.index);
  nodes.exit().remove();
  const entered = nodes.enter().append('g')
    .attr('class', 'node');
  entered.append('circle')
    .attr('class', 'node-symbol');
  entered.append('g')
    .attr('class', 'node-struct');
  entered.append('text')
    .attr('class', 'node-label');
  const updated = entered.merge(nodes);
  updated.select('.node-struct')
    .html(d => d.structure);
  updated.select('.node-label')
    .attr('x', 0)
    .attr('text-anchor', 'middle');
  updated.each(function(d) {
    d3.select(this).call(updateNodeCoords, d.x, d.y);
  });
}


function updateEdges(selection, records) {
  const edges = selection.selectAll('.link')
    .data(records, d => `${d.source}_${d.target}`);
  edges.exit().remove();
  const entered = edges.enter().append('g')
    .attr('class', 'link');
  entered.append('line')
    .attr('class', 'edge-line');
  entered.append('text')
    .attr('class', 'edge-label');
  const updated = entered.merge(edges);
  updated.select('.edge-line')
    .style('stroke', '#999')
    .style('stroke-opacity', 0.6);
  updated.select('.edge-label')
    .attr('text-anchor', 'middle')
    .text(d => d.weight);
  updated.each(function(d) {
    d3.select(this).call(updateEdgeCoords, d.sx, d.sy, d.tx, d.ty);
  });
}


function updateNodeAttrs(selection, state) {
  const nodes = selection.selectAll('.node');
  nodes.select('.node-symbol')
    .attr('r', d =>
      d3scale.scaleFunction(state.nodeSize.scale)(
        state.nodeSize.field ? d[state.nodeSize.field.key] : null)
    )
    .style('fill', d =>
      d3scale.scaleFunction(state.nodeColor.scale)(
        state.nodeColor.field ? d[state.nodeColor.field.key] : null)
    );
  nodes.select('.node-label')
    .text(d => {
      if (state.nodeLabel.text === null) return '';
      if (!d.hasOwnProperty(state.nodeLabel.text.key)) return '';
      if (state.nodeLabel.text.format === 'd3_format') {
        return fmt.formatNum(d[state.nodeLabel.text.key], state.nodeLabel.text.d3_format);
      }
      return d[state.nodeLabel.text.key];
    })
    .attr('font-size', state.nodeLabel.size)
    .attr('y', 90) // TODO: derived from structure size or node circle radius
    .attr('visibility', state.nodeLabel.visible ? 'inherit' : 'hidden')
    .style('fill', d =>
      d3scale.scaleFunction(state.nodeLabel.scale)(
        state.nodeLabel.field ? d[state.nodeLabel.field.key] : null));
  nodes.select('.node-struct')
    .attr('visibility', state.nodeContent.structure.visible ? 'inherit' : 'hidden')
    .each((d, i, nds) => {
      const w = d3.select(nds[i]).select('svg').attr('width');
      const h = d3.select(nds[i]).select('svg').attr('height');
      d3.select(nds[i]).attr('transform', `translate(${-w / 2},${-h / 2})`);
    });
}


function updateEdgeAttrs(selection, state) {
  selection.selectAll('.link').select('.edge-line')
    .style('stroke-width', d => d3scale.scaleFunction(state.edgeWidth.scale)(d.weight));
  selection.selectAll('.link').select('.edge-label')
    .attr('visibility', state.edgeLabel.visible ? 'inherit' : 'hidden')
    .attr('font-size', state.edgeLabel.size);
}


function updateNodeCoords(selection, x, y) {
  selection.attr('transform', `translate(${x}, ${y})`);
}


function updateEdgeCoords(selection, sx, sy, tx, ty) {
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


function updateCoords(selection, n, x, y) {
  selection.select('.nw-nodes').selectAll(".node")
    .filter(d => d.index == n)
    .call(updateNodeCoords, x, y);
  selection.select('.nw-edges').selectAll(".link")
    .filter(d => d.source == n)
    .each(function(d) {
      d3.select(this).call(updateEdgeCoords, x, y, d.tx, d.ty);
    });
  selection.select('.nw-edges').selectAll(".link")
    .filter(d => d.target == n)
    .each(function(d) {
      d3.select(this).call(updateEdgeCoords, d.sx, d.sy, x, y);
    });
}


function updateAttrs(selection, state) {
  selection.select('.nw-nodes').call(updateNodeAttrs, state);
  selection.select('.nw-edges').call(updateEdgeAttrs, state);
}


function updateComponents(selection, state) {
  selection.select('.nw-nodes').call(updateNodes, state.nodesToRender());
  selection.select('.nw-edges').call(updateEdges, state.edgesToRender());
}


function updateViewBox(selection, width, height) {
  selection.attr('viewBox', `0 0 ${width} ${height}`);
  selection.select('.nw-view-boundary')
    .attr('width', width)
    .attr('height', height);
}


function updateTransform(selection, tx, ty, tk) {
  selection.select('.nw-field')
    .attr('transform', `translate(${tx}, ${ty}) scale(${tk})`);
}


export default {
  updateComponents, updateCoords, updateAttrs, updateTransform, updateViewBox
};
