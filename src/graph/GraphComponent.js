
function graphNodes(selection, data) {
  const nodes = selection.selectAll('.node')
    .data(data, d => d.key);
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
    .html(d => d._structure);
  updated.select('.node-label')
    .attr('x', 0)
    .attr('text-anchor', 'middle');
}


function graphEdges(selection, data) {
  const edges = selection.selectAll('.link')
    .data(data, d => `${d.source}_${d.target}`);
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
}


export default {
  graphNodes, graphEdges
};
