
/** @module component/DataGrid */

import d3 from 'd3';
import {default as fmt} from '../helper/formatValue.js';
import {default as img} from '../helper/image.js';


const defaultColumnWidth = {
  numeric: 120,
  text: 200,
  none: 200
};

const defaultColumnHeight = {
  numeric: 40,
  text: 40,
  none: 200
};


function createDataGrid(selection, data) {
  // Header
  if (selection.select('div.dg-header').size()) {
    selection.select('div.dg-header').remove();
  }
  selection.append('div').classed('dg-header', true);
  // Body
  if (selection.select('div.dg-viewport').size()) {
    selection.select('div.dg-viewport').remove();
  }
  selection.append('div').classed('dg-viewport', true)
    .append('div').classed('dg-body', true);
  const cols = data.fields.filter(e => e.visible)
    .map(e => {
      e.width = defaultColumnWidth[e.sortType];
      e.height = defaultColumnHeight[e.sortType];
      return e;
    });
  const rowSize = {
    height: cols.reduce((a, b) => a.height > b.height ? a : b).height,
    width: cols.reduce((a, b) => ({width: a.width + b.width})).width
  };
  selection.style('width', `${rowSize.width}px`);
  selection.select('.dg-header').datum(rowSize);
  const header = selection.select('.dg-header')
    .selectAll('.dg-hcell')
      .data(cols, d => d.key);
  header.exit().remove();
  header.enter().append('div')
      .classed('dg-hcell', true)
      .style('display', 'inline-block')
    .merge(header)
      .style('width', d => `${d.width}px`)
      .text(d => d.name);
}


function updateRows(selection, rcds, keyFunc, position, visibleRows) {
  const rSize = selection.select('.dg-header').datum();
  const cData = selection.select('.dg-header').selectAll('.dg-hcell')
    .data();
  const topPos = Math.min(position, Math.max(0, rcds.length - visibleRows + 1));
  const bottomPos = topPos + visibleRows;
  const rcdSlice = rcds.slice(topPos, Math.min(bottomPos, rcds.length));
  const rowSelection = selection.select('.dg-body')
    .selectAll('.dg-row')
      .data(rcdSlice, keyFunc)
      .style('height', `${rSize.height}px`);
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
        const rowPos = (position + ri) * rSize.height;
        d3.select(this)
          .style('transform', `translate(0px, ${rowPos}px)`)
          .classed('odd', (position + ri) % 2 === 0)
        .selectAll('.dg-cell')
          .html(function(_, i) {
            d3.select(this).attr('id', `c${ri}-${i}`);
            const value = d[cData[i].key];
            if (value === undefined) return '';
            if (cData[i].valueType === 'plot') return '';
            if (cData[i].valueType === 'image') {  // data URI
              return `<img src="${value}" width="180" height="180"/>`;
            }
            if (cData[i].digit !== 'raw') return fmt.formatNum(value, cData[i].digit);
            return value;
          })
          .each(function(_, i) {
            if (cData[i].valueType !== 'plot') return;
            if (!d.hasOwnProperty(cData[i].key)) return;
            const value = d[cData[i].key];
            img.showPlot(value, `#c${ri}-${i}`);
          });
    });
}


function dataGridRecords(selection, rcds, keyFunc) {
  const rSize = selection.select('.dg-header').datum();
  const bodyHeight = rcds.length * rSize.height;
  let position;
  let visibleRows;
  selection.select('.dg-body')
    .style('height', `${bodyHeight}px`)
    .style('position', "relative");
  selection.select('.dg-viewport')
    .style('overflow-y', 'auto')
    .on('scroll', function() {
      const scrollTop = d3.select(this).node().scrollTop;
      const newPos = Math.min(Math.floor(scrollTop / rSize.height), rcds.length);
      if (newPos !== position) {
        position = newPos;
        updateRows(selection, rcds, keyFunc, position, visibleRows);
      }
    });
  d3.select(window)
    .on('resize', function() {
      const viewport = selection.select('.dg-viewport');
      const viewportTop = viewport.node().getBoundingClientRect().top;
      const viewportHeight = window.innerHeight - viewportTop - 5;
      viewport.style('height', `${viewportHeight}px`);
      const newVis = Math.ceil(viewportHeight / rSize.height) + 1;
      if (newVis !== visibleRows) {
        visibleRows = newVis;
        viewport.dispatch('scroll');
      }
    })
    .dispatch('resize');
}


function addSort(selection, rcds, keyFunc) {
  selection.select('.dg-header').selectAll('.dg-hcell')
    .filter(d => d.sortType !== 'none')
    .append('span').append('a')
      .attr('id', d => `sort-${d.key}`)
      .text('^v')
      .style('display', 'inline-block')
      .style('width', '30px')
      .style('text-align', 'center')
    .on('click', d => {
      const isAsc = d3.select(`#sort-${d.key}`).text() === 'v';
      d3.select(`#sort-${d.key}`).text(isAsc ? '^' : 'v');
      const isNum = d.sortType === 'numeric';
      const cmp = isAsc
        ? (isNum ? fmt.numericAsc : fmt.textAsc)
        : (isNum ? fmt.numericDesc : fmt.textDesc);
      const sorted = rcds.sort((a, b) => cmp(a[d.key], b[d.key]));
      dataGridRecords(selection, sorted, keyFunc);
    });
}


export default {
  createDataGrid, dataGridRecords, addSort
};
