
/** @module component */

import d3 from 'd3';
import {default as fmt} from '../helper/formatValue.js';


function selectOptions(selection, data, key, text) {
  const options = selection.selectAll('option')
    .data(data, key);
  options.exit().remove();
  options.enter().append('option')
    .merge(options)
      .attr('value', key)
      .text(text);
}


function checkboxList(selection, data, name, key, text) {
  const items = selection.selectAll('li').data(data, key);
  items.exit().remove();
  const entered = items.enter().append('li')
    .attr('class', 'form-check')
    .append('label');
  entered.append('input');
  entered.append('span');
  const updated = entered.merge(items.select('label'))
    .attr('class', 'form-check-label');
  updated.select('input')
    .attr('type', 'checkbox')
    .attr('class', 'form-check-input')
    .attr('name', name)
    .attr('value', key);
  updated.select('span')
    .text(text);
}


function createTable(selection, tbl) {
  // Header
  if (!selection.select('thead').size()) {
    selection.append('thead').append('tr');
  }
  // Records
  if (!selection.select('tbody').size()) {
    selection.append('tbody');
  }
  const cols = tbl.columns
    .filter(e => !e.hasOwnProperty('visible') || e.visible !== false
  );
  const header = selection.select('thead tr').selectAll('th')
    .data(cols, d => d.key);
  header.exit().remove();
  header.enter().append('th')
    .merge(header)
      .text(d => d.hasOwnProperty('name') ? d.name : d.key);
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
    .html((d, i) => {
      if (d === undefined) return '';
      if (header[i].valueType === 'plot') return '[plot]';
      if (header[i].valueType === 'image') return '[image]';
      if (header[i].hasOwnProperty('digit') && header[i].digit !== 'raw') {
        return fmt.formatNum(d, header[i].digit);
      }
      return d;
    });
}


function appendTableRows(selection, rcds, keyFunc) {
  const newRcds = selection.select('tbody').selectAll('tr').data();
  Array.prototype.push.apply(newRcds, rcds);
  updateTableRecords(selection, newRcds, keyFunc);
}


function addSort(selection) {
  selection.select('thead tr').selectAll('th')
    .filter(d => d.sort !== 'none')
    .append('span').append('a')
      .attr('id', d => `sort-${d.key}`)
      .text('^v')
      .style('display', 'inline-block')
      .style('width', '30px')
      .style('text-align', 'center')
    .on('click', d => {
      const isAsc = d3.select(`#sort-${d.key}`).text() === 'v';
      const isNum = !d.hasOwnProperty('sort') || d.sort === 'numeric';
      const cmp = isAsc
        ? (isNum ? fmt.numericAsc : fmt.textAsc)
        : (isNum ? fmt.numericDesc : fmt.textDesc);
      selection.select('tbody').selectAll('tr')
        .sort((a, b) => cmp(a[d.key], b[d.key]));
      d3.select(`#sort-${d.key}`)
        .text(isAsc ? '^' : 'v');
    });
}


function formatNumbers(selection) {
  // DEPRECATED: no longer used
  selection.select('thead tr').selectAll('th')
    .each((col, colIdx) => {
      if (!col.hasOwnProperty('digit') || col.digit === 'raw') return;
      selection.select('tbody').selectAll('tr')
        .selectAll('td')
          .filter((d, i) => i === colIdx)
          .text(d => fmt.formatNum(d, col.digit));
    });
}


export default {
  selectOptions, checkboxList,
  createTable, updateTableRecords,
  appendTableRows, addSort, formatNumbers
};
