
/** @module datagrid/component */

import d3 from 'd3';

import {default as fmt} from '../helper/formatValue.js';
import {default as img} from '../helper/image.js';


function updateHeader(selection, state) {
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
}


function updateViewport(selection, state) {
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
        selection.call(updateRows, state);
      }
    })
    .dispatch('scroll');
}


function updateRows(selection, state) {
  const cData = state.visibleFields;
  const rowSelection = selection.select('.dg-body')
    .selectAll('.dg-row')
      .data(state.recordsToRender(), state.keyFunc)
      .style('height', `${state.rowHeight}px`);
  rowSelection.exit().remove();
  const rowEntered = rowSelection.enter().append('div')
      .attr('class', 'dg-row')
      .style('position', "absolute");
  rowEntered.selectAll('.dg-cell')
    .data(cData.map(e => e.width))
    .enter().append('div')
      .classed('dg-cell', true)
      .classed('align-middle', true)
      .style('display', 'inline-block')
      .style('width', d => `${d}px`);
  // TODO: need refactoring
  rowEntered.merge(rowSelection)
      .order()
      .each(function(d, ri) {
        const rowPos = (state.viewportTop + ri) * state.rowHeight;
        d3.select(this)
          .style('transform', `translate(0px, ${rowPos}px)`)
          .classed('odd', (state.viewportTop + ri) % 2 === 0)
        .selectAll('.dg-cell')
          .html(function (_, i) {
            d3.select(this).attr('id', `c${ri}-${i}`);
            const value = d[cData[i].key];
            if (value === undefined) return '';
            if (cData[i].format === 'd3_format') {
              return fmt.formatNum(value, cData[i].d3_format);
            }
            if (cData[i].format === 'plot') return '';
            if (cData[i].format === 'compound_id') {
              return `<a href="profile.html?compound=${value}" target="_blank">${value}</a>`;
            }
            if (cData[i].format === 'image') {  // data URI
              return `<img src="${value}" width="180" height="180"/>`;
            }
            return value;
          })
          .each(function(_, i) {
            if (cData[i].format !== 'plot') return;
            if (!d.hasOwnProperty(cData[i].key)) return;
            const value = d[cData[i].key];
            img.showPlot(value, `#c${ri}-${i}`);
          });
    });
}

function resizeViewport(selection, state) {
  // TODO: set width
  selection.select('.dg-viewport').style('height', `${state.viewportHeight}px`);
}

export default {
  updateHeader, updateViewport, updateRows, resizeViewport
};
