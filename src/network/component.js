
/** @module network/component */

import d3 from 'd3';

import {default as d3scale} from '../helper/d3Scale.js';
import {default as fmt} from '../helper/formatValue.js';


function updateNodes(selection, records) {
  const nodes = selection.selectAll('.node')
    .data(records, d => d.index);
  nodes.exit().remove();
  const entered = nodes.enter()
    .append('g')
      .attr('class', 'node')
      .call(updateNodeCoords);
  entered
    .append('circle')
      .attr('class', 'node-symbol');
  entered
    .append('g')
      .attr('class', 'node-struct')
      .html(d => d.structure);
  entered
    .append('text')
      .attr('class', 'node-label')
      .attr('x', 0)
      .attr('text-anchor', 'middle');
}


function updateEdges(selection, records) {
  const edges = selection.selectAll('.link')
    .data(records, d => `${d.source}_${d.target}`);
  edges.exit().remove();
  const entered = edges.enter()
    .append('g')
      .attr('class', 'link');
  entered
    .append('line')
      .attr('class', 'edge-line')
      .style('stroke', '#999')
      .style('stroke-opacity', 0.6);
  entered
    .append('text')
      .attr('class', 'edge-label')
      .attr('text-anchor', 'middle')
      .text(d => d.weight);
  // draw all components and then
  entered.call(updateEdgeCoords);
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
  selection.select('.nw-nodes').call(updateNodes, state.nodesToRender());
  selection.select('.nw-edges').call(updateEdges, state.edgesToRender());
  selection.call(updateAttrs, state);
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
  n.adjacency.forEach(adj => {
    const nbr = adj[0];
    const edge = adj[1];
    selection.select('.nw-edges').selectAll(".link")
      .filter((_, i) => i === edge)
      .each(function(d) {
        if (n.index < nbr) {
          d3.select(this).call(moveEdge, x, y, d.tx, d.ty);
        } else {
          d3.select(this).call(moveEdge, d.sx, d.sy, x, y);
        }
    });
  });
}


function transform(selection, tx, ty, tk) {
  selection.select('.nw-field')
    .attr('transform', `translate(${tx}, ${ty}) scale(${tk})`);
}


function resizeViewBox(selection, width, height) {
  selection.attr('viewBox', `0 0 ${width} ${height}`);
  selection.select('.nw-view-boundary')
    .attr('width', width)
    .attr('height', height);
}


export default {
  updateNodes, updateEdges, updateNodeCoords,
  updateAttrs, updateComponents,
  move, transform, resizeViewBox
};
