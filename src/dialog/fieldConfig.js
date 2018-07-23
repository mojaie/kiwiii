
/** @module dialog/fieldConfig */

import {default as button} from '../component/button.js';
import {default as modal} from '../component/modal.js';

import {default as table} from '../datagrid/table.js';
import {default as rowf} from '../datagrid/rowFactory.js';


const id = 'fieldconf-dialog';
const title = 'Column setting';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'edittable');
}


function rowFactory(fields) {
  return (selection, record) => {
    selection.append('div')
        .call(rowf.rowCell)
        .style('width', `${fields[0].width}%`)
        .text(record.name);
    selection.append('div')
        .call(rowf.rowCell)
        .style('width', `${fields[1].width}%`)
      .append('input')
        .attr('type', 'checkbox')
        .property('checked', record.visible)
        .on('click', function () {
          record.visible = this.checked;
        });
    const select = selection.append('div')
        .call(rowf.rowCell)
        .style('width', `${fields[2].width}%`)
      .append('select');
    const extra = !fields[2].options.includes(record.format);
    select.selectAll('option').data(extra ? [record.format] : fields[2].options)
      .enter().append('option')
        .attr('value', d => d)
        .text(d => d);
    select.property('value', record.format)
        .property('disabled', extra)
        .on('change', function () {
          record.format = this.value;
          selection.select('.d3f input')
            .property('disabled', record.format !== 'd3_format');
        });
    selection.append('div')
        .call(rowf.rowCell)
        .classed('d3f', true)
        .style('width', `${fields[3].width}%`)
      .append('input')
        .attr('type', 'text')
        .style('width', '90%')
        .property('value', record.d3_format)
        .property('disabled', record.format !== 'd3_format')
        .on('change', function () {
          record.d3_format = this.value;
        });
  };
}


function body(selection) {
  const fields = [
    {key: 'name', name: 'Name', format: 'text'},
    {key: 'visible', name: 'Visible', format: 'checkbox',
     widthf: 0.5, height: 40},
    {key: 'format', name: 'Format', format: 'select',
     options: ['text', 'numeric', 'd3_format', 'raw', 'compound_id'],
     height: 40},
    {key: 'd3_format', name: 'D3 format', format: 'text_field',
     height: 40}
  ];
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-dialog').classed('modal-lg', true);
  dialog.select('.modal-body').append('div')
    .classed('dgfields', true)
    .call(table.table, fields, [], rowFactory, 300);
}


function updateBody(selection, dgfields) {
  selection.select('.dgfields')
    .call(table.updateRecords, dgfields);
}


function value(selection) {
  return table.tableRecords(selection.select('.dgfields'));
}


export default {
  menuLink, body, updateBody, value
};
