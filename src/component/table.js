
/** @module component/table */

// Simple tables
// use dataGrid.js for interactive and smooth datatable


import d3 from 'd3';

import {default as misc} from '../common/misc.js';


function render(selection, caption, fields, records) {
  selection
      .classed('table', true)
      .classed('table-striped', true)
      .classed('table-hover', true);
  if (caption) {
    selection.append('caption').text(caption);
  }
  selection.append('thead').append('tr');
  selection.append('tbody');
  if (fields) {
    selection.call(updateHeader, fields, records);
  }
}


function updateHeader(selection, fields, records) {
  const header = selection.select('thead tr')
    .selectAll('th')
      .data(fields);
  header.exit().remove();
  header.enter().append('th')
      .text(d => d.name);
  if (records) {
    selection.call(updateContents, records, d => d.key, updateRowFunc(fields));
  }
}


function updateContents(selection, records, keyFunc, rowFactory) {  // TODO: specify key
  const rows = selection.select('tbody')
    .selectAll('tr')
      .data(records, keyFunc);
  rows.exit().remove();
  rows.enter().append('tr')
    .merge(rows)
      .each(function (d) {
        d3.select(this).selectAll('td').remove();
        d3.select(this).call(rowFactory, d);
      });
}


function updateRowFunc(fields) {
  return (selection, record) => {
    fields.forEach(field => {
      const value = record[field.key];
      const cell = selection.append('td')
        .classed('align-middle', true);
      if (value === undefined) return;
      if (field.format === 'd3_format') {
        cell.text(misc.formatNum(value, field.d3_format));
      }
      else if (field.format === 'plot') {
        cell.text('[plot]');
      }
      else if (field.format === 'image') {
        cell.text('[image]');
      }
      else if (field.format === 'control') {
        cell.call(value);
      } else {
        cell.text(value);
      }
    });
  };
}


export default {
  render, updateHeader, updateContents
};
