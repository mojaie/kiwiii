
/** @module dialog/fieldConfig */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';

import {default as button} from '../component/button.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';
import {default as table} from '../component/table.js';


const id = 'fieldconf-dialog';
const title = 'Field Setting';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'fieldconf', title, id);
}


function updateRowFunc(selection, record) {
  selection.append('td')
      .classed('name', true)
      .text(record.name);
  selection.append('td')
      .classed('visible', true)
    .append('input')
      .attr('type', 'checkbox')
      .property('checked', record.visible);
  const generalFormat = ['text', 'numeric', 'd3_format', 'raw', 'compound_id'];
  const fs = generalFormat.includes(record.format) ? generalFormat : [record.format];
  const items = fs.map(e => ({key: e, name: e}));
  const format = selection.append('td')
      .classed('format', true);
  const formatSelect = format.append('select');
  format.call(lbox.selectBoxItems, items);
  formatSelect
      .property('disabled', !generalFormat.includes(record.format))
      .property('value', record.format);
  selection.append('td')
      .classed('d3format', true)
    .append('input')
      .attr('size', 10)
      .property('disabled', record.format === 'd3_format' ? null : true)
      .property('value', record.d3_format || null);
  formatSelect
      .on('change', function () {
        selection.select('.d3format')
          .select('input')
            .property('disabled', this.value !== 'd3_format');
      });
}


function tableRowValue(selection) {
  const value = {};
  value.visible = selection.select('.visible')
    .select('input').property('checked');
  value.format = selection.select('.format')
    .select('select').property('value');
  if (value.format === 'd3_format') {
    value.d3_format = selection.select('.d3format')
      .select('input').property('value');
  }
  return value;
}


function body(selection) {
  const fields = misc.defaultFieldProperties([
    {key: 'name', format: 'text'},
    {key: 'visible', format: 'control'},
    {key: 'format', format: 'control'},
    {key: 'd3_format', format: 'control'}
  ]);
  selection
      .call(modal.submitDialog, id, title)
    .select('.modal-body')
    .append('table')
      .classed('field', true)
      .call(table.render, null, null, fields);
}


function updateBody(selection, state) {
  selection.select('.field')
      .call(table.updateContents, state.fields, d => d.key, updateRowFunc);
}


function value(selection) {
  const fields = [];
  selection.select('tbody').selectAll('tr')
    .each(function (d) {
      const field = tableRowValue(d3.select(this));
      field.key = d.key;
      field.name = d.name;
      fields.push(field);
    });
  return fields;
}


export default {
  menuLink, updateRowFunc, body, updateBody, value
};