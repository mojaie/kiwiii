
/** @module component/Component */

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


// checkbox list with tooltip
// call $('[data-toggle="tooltip"]').tooltip() after this function
function checkboxListT(selection, data, name, key, text) {
  const items = selection.selectAll('li').data(data, key);
  items.exit().remove();
  const entered = items.enter().append('li')
    .attr('class', 'form-check')
    .append('label');
  entered.append('input');
  entered.append('a');
  const updated = entered.merge(items.select('label'))
    .attr('class', 'form-check-label');
  updated.select('input')
    .attr('type', 'checkbox')
    .attr('class', 'form-check-input')
    .attr('name', name)
    .attr('value', key);
  updated.select('a')
    .attr('data-toggle', 'tooltip')
    .attr('data-placement', 'bottom')
    .attr('title', d => d.description || 'No')
    .text(text);
}


function createTable(selection, data) {
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
      if (header[i].valueType === 'plot') return '[plot]';
      if (header[i].valueType === 'image') return '[image]';
      if (header[i].valueType === 'control') return;
      if (header[i].digit !== 'raw') return fmt.formatNum(d, header[i].digit);
      return d;
    })
    .each((d, i, nodes) => {
      // This should be called after html
      if (header[i].valueType === 'control') d3.select(nodes[i]).call(d);
    });
}


function appendTableRows(selection, rcds, keyFunc) {
  const newRcds = selection.select('tbody').selectAll('tr').data();
  Array.prototype.push.apply(newRcds, rcds);
  updateTableRecords(selection, newRcds, keyFunc);
}


function addSort(selection) {
  selection.select('thead tr').selectAll('th')
    .filter(d => d.sortType !== 'none')
    .append('span').append('a')
      .attr('id', d => `sort-${d.key}`)
      .text('^v')
      .style('display', 'inline-block')
      .style('width', '30px')
      .style('text-align', 'center')
    .on('click', d => {
      const isAsc = d3.select(`#sort-${d.key}`).text() === 'v';
      const isNum = d.sortType === 'numeric';
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
      if (col.digit === 'raw') return;
      selection.select('tbody').selectAll('tr')
        .selectAll('td')
          .filter((d, i) => i === colIdx)
          .text(d => fmt.formatNum(d, col.digit));
    });
}


export default {
  selectOptions, checkboxList, checkboxListT,
  createTable, updateTableRecords,
  appendTableRows, addSort, formatNumbers
};
