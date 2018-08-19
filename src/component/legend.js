
/** @module component/legend */

import {default as scale} from '../common/scale.js';

import {default as shape} from './shape.js';


function colorBarLegend(selection) {
  selection.append('rect')
      .classed('bg', true)
      .attr('x', 0).attr('y', 0)
      .attr('width', 120).attr('height', 50)
      .attr('fill', 'white')
      .attr('opacity', 0.9);
  selection.append('text')
      .classed('title', true)
      .attr('text-anchor', 'middle')
      .attr('x', 60).attr('y', 15)
      .style('font-size', 12);
  selection.append('g')
      .classed('colorbar', true)
      .attr('transform', 'translate(10, 20)');
  const domains = selection.append('g')
      .classed('label', true)
      .attr('transform', 'translate(10, 40)')
      .style('font-size', 12);
  domains.append('text')
      .classed('min', true)
      .attr('text-anchor', 'start')
      .attr('x', 0).attr('y', 0);
  domains.append('text')
      .classed('max', true)
      .attr('text-anchor', 'end')
      .attr('x', 100).attr('y', 0);
}


function updateColorBarLegend(selection, colorState) {
  const field = scale.colorScales.find(e => e.key === colorState.color);
  const colorBar = shape.colorBar[field.type];
  const range = field.key === 'custom' ? colorState.range : field.colors;
  selection.select('.title').text(colorState.field);
  selection.select('.colorbar').selectAll('g,defs').remove();
  selection.select('.colorbar').call(colorBar, range);
  selection.select('.min')
    .attr('visibility',
          ['bicolor', 'tricolor'].includes(field.type) ? 'inherit' : 'hidden')
    .text(colorState.domain[0]);
  selection.select('.max')
    .attr('visibility',
          ['bicolor', 'tricolor'].includes(field.type) ? 'inherit' : 'hidden')
    .text(colorState.domain[1]);
}


/**
 * Legend group component
 * @param {d3.selection} selection - selection of group container (svg:g)
 */
function updateLegendGroup(selection, viewBox, orient) {
  const widthFactor = 0.2;
  const scaleF = viewBox.right * widthFactor / 120;
  const o = orient.split('-');
  const viewW = viewBox.right;
  const viewH = viewBox.bottom;
  const legW = viewW * widthFactor;
  const legH = legW * 50 / 120;
  const posX = {left: legW / 10, right: viewW - legW - (legW / 10)}[o[1]];
  const posY = {top: legH / 10, bottom: viewH - legH - (legH / 10)}[o[0]];
  selection.attr('transform',
                 `translate(${posX}, ${posY}) scale(${scaleF})`);
}


export default {
  colorBarLegend, updateColorBarLegend, updateLegendGroup
};
