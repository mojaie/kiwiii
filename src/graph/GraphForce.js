
import d3 from 'd3';

const fieldWidth = 1200;
const fieldHeight = 1200;

const simulation = d3.forceSimulation()
  .force('link',
    d3.forceLink().id(d => d._index)
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
    d3.forceCenter(fieldWidth / 2, fieldHeight / 2))
  .force('x',
    d3.forceX()
      .strength(0.002))
  .force('y',
    d3.forceY()
      .strength(0.002))
  .stop();


function setForce(nodes, edges, tick, end) {
  simulation.nodes(nodes)
    .force('link').links(edges);
  simulation.on('tick', tick)
    .on('end', end);
}


function tick() {
  d3.select('#graph-contents').selectAll('.node')
    .attr('transform', d => `translate(${d.x}, ${d.y})`);
  const alpha = simulation.alpha();
  const isStopped = alpha <= simulation.alphaMin();
  d3.select('#temperature')
    .classed('progress-success', isStopped)
    .classed('progress-warning', !isStopped)
    .attr('value', isStopped ? 1 : 1 - alpha)
    .text(isStopped ? 1 : 1 - alpha);
}


function end() {
  d3.select('#graph-contents').selectAll('.link')
    .attr('transform', d => `translate(${d.source.x}, ${d.source.y})`)
    .attr('visibility', 'visible');
  d3.select('#graph-contents').selectAll('.edge-line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', d => d.target.x - d.source.x)
    .attr('y2', d => d.target.y - d.source.y);
  d3.select('#graph-contents').selectAll('.edge-label')
    .attr('x', d => (d.target.x - d.source.x) / 2)
    .attr('y', d => (d.target.y - d.source.y) / 2);
}


export default {
  fieldWidth, fieldHeight, simulation, setForce, tick, end
};
