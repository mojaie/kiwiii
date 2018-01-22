
/** @module component/table */

// Simple tables
// use dataGrid.js for interactive and smooth datatable


import d3 from 'd3';
import {default as def} from '../helper/definition.js';
import {default as fmt} from '../helper/formatValue.js';


function table(selection, data) {
  // TODO: deprecated. use dataGrid.js
  // Header
  if (selection.select('thead').size()) selection.select('thead').remove();
  selection.append('thead').append('tr');
  // Records
  if (selection.select('tbody').size()) selection.select('tbody').remove();
    selection.append('tbody');

  const cols = data.fields.filter(e => e.visible);
  const header = selection.select('thead tr').selectAll('th')
    .data(cols, d => d.key);
  header.exit().remove();
  header.enter().append('th')
    .merge(header)
      .text(d => d.name);
}


function updateTableRecords(selection, rcds, keyFunc) {
  const header = selection.select('thead tr').selectAll('th')
    .data();
  const rowSelection = selection.select('tbody').selectAll('tr')
    .data(rcds, keyFunc);
  rowSelection.exit().remove();
  const rowEntered = rowSelection.enter().append('tr');
  rowEntered.selectAll('td')
    .data(d => header.map(e => d[e.key]))
    .enter().append('td');
  rowEntered.merge(rowSelection)
    .selectAll('td')
      .classed('align-middle', true)
    .html(function (d, i) {
      if (d === undefined) return '';
      if (header[i].format === 'd3_format') {
        return fmt.formatNum(d, header[i].d3_format);
      }
      if (header[i].format === 'plot') return '[plot]';
      if (header[i].format === 'image') return '[image]';
      if (header[i].format === 'control') return;
      return d;
    })
    .each((d, i, nodes) => {
      // This should be called after html
      if (header[i].format === 'control') d3.select(nodes[i]).call(d);
    });
}


function appendTableRows(selection, rcds, keyFunc) {
  // TODO: deprecated. use dataGrid.js
  const newRcds = selection.select('tbody').selectAll('tr').data();
  Array.prototype.push.apply(newRcds, rcds);
  updateTableRecords(selection, newRcds, keyFunc);
}


function addSort(selection) {
  // TODO: deprecated. use dataGrid.js
  selection.select('thead tr').selectAll('th')
    .filter(d => def.sortType(d.format) !== 'none')
    .append('span').append('a')
      .attr('id', d => `sort-${d.key}`)
      .text('^v')
      .style('display', 'inline-block')
      .style('width', '30px')
      .style('text-align', 'center')
    .on('click', d => {
      const isAsc = d3.select(`#sort-${d.key}`).text() === 'v';
      const isNum = def.sortType(d.format) === 'numeric';
      const cmp = isAsc
        ? (isNum ? fmt.numericAsc : fmt.textAsc)
        : (isNum ? fmt.numericDesc : fmt.textDesc);
      selection.select('tbody').selectAll('tr')
        .sort((a, b) => cmp(a[d.key], b[d.key]));
      d3.select(`#sort-${d.key}`)
        .text(isAsc ? '^' : 'v');
    });
}


export default {
  selectOptions, checkboxList, checkboxListT,
  createTable, updateTableRecords,
  appendTableRows, addSort
};
