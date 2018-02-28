
/** @module datagrid/component */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as img} from '../common/image.js';


function updateContents(selection, state) {
  const header = selection.select('.dg-header')
    .selectAll('.dg-hcell')
      .data(state.visibleFields, d => d.key);
  header.exit().remove();
  header.enter().append('div')
      .classed('dg-hcell', true)
      .style('display', 'inline-block')
    .merge(header)
      .style('width', d => `${d.width}px`)
      .text(d => d.name);
  selection.call(updateViewport, state);
}


function updateViewport(selection, state) {
  selection.style('width', `${state.contentWidth}px`);
  selection.select('.dg-body')
    .style('height', `${state.bodyHeight}px`)
    .style('position', "relative");
  selection.select('.dg-viewport')
    .style('overflow-y', 'auto')
    .on('scroll', function () {
      const scrollTop = d3.select(this).node().scrollTop;
      const pos = Math.floor(scrollTop / state.rowHeight);
      if (pos !== state.previousViewportTop) {
        state.setScrollPosition(pos);
        selection.call(updateRows, state, updateRowFunc(state.visibleFields));
      }
    })
    .dispatch('scroll');
}


function updateRowFunc(fields) {
  return (selection, record) => {
    fields.forEach(field => {
      const value = record[field.key];
      const cell = selection.append('div')
        .classed('dg-cell', true)
        .classed('align-middle', true)
        .style('display', 'inline-block')
        .style('width', `${field.width}px`);
      if (value === undefined) return;
      if (field.format === 'd3_format') {
        cell.text(misc.formatNum(value, field.d3_format));
      } else if (['numeric', 'text', 'raw'].includes(field.format)) {
        cell.text(value);
      } else if (field.format === 'compound_id') {
        cell.append('a')
            .attr('href',`profile.html?compound=${value}`)
            .attr('target', '_blank')
            .text(value);
      } else if (field.format === 'plot') {
        cell.call(img.plotCell, value);  // TODO:
      } else if (field.format === 'image') {
        cell.append('img')
            .attr('width', 180)
            .attr('height', 180)
            .attr('src', value);
      } else if (field.format === 'control') {
        cell.call(value);
      } else {
        cell.html(value);
      }
    });
  };
}


function updateRows(selection, state, rowFactory) {
  const rows = selection.select('.dg-body')
    .selectAll('.dg-row')
      .data(state.recordsToShow(), state.keyFunc)
      .style('height', `${state.rowHeight}px`);
  rows.exit().remove();
  rows.enter()
    .append('div')
      .attr('class', 'dg-row')
      .style('position', "absolute")
    .merge(rows)
      .each(function (d, i) {
        const rowPos = (state.viewportTop + i) * state.rowHeight;
        d3.select(this)
          .style('transform', `translate(0px, ${rowPos}px)`)
          .classed('odd', (state.viewportTop + i) % 2 === 0);
        d3.select(this).selectAll('.dg-cell').remove();
        d3.select(this).call(rowFactory, d);
      });
}


function resizeViewport(selection, state) {
  // TODO: set width
  selection.select('.dg-viewport').style('height', `${state.viewportHeight}px`);
}


export default {
  updateContents, updateViewport, updateRowFunc, updateRows, resizeViewport
};
