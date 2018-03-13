
/** @module dialog/fieldFetch */

import _ from 'lodash';

import {default as misc} from '../common/misc.js';

import {default as button} from '../component/button.js';
import {default as modal} from '../component/modal.js';

import DatagridState from '../datagrid/state.js';
import {default as view} from '../datagrid/view.js';
import {default as rowf} from '../datagrid/rowfilter.js';


const id = 'fieldfetch-dialog';
const title = 'Import fields from database';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'fieldfetch', title, id);
}

function rowFactory(fields, assays) {
  return (selection, record) => {
    fields.forEach(field => {
      const cell = selection.append('div')
          .classed('dg-cell', true)
          .classed('align-middle', true)
          .style('display', 'inline-block')
          .style('width', `${field.width}px`);
      if (field.key === 'check') {
        const done = assays.includes(record.key);
        cell.append('input')
          .attr('type', 'checkbox')
          .property('checked', done)
          .property('disabled', done);
      } else {
        cell.text(record[field.key]);
      }
    });
  };
}


function body(selection, schema) {
  const rsrcs = schema.resources.filter(e => e.domain === 'assay');
  const assays = _(rsrcs.map(e => e.data))
    .flatten()
    .uniqBy('assay_id')
    .value();
  const data = {
    fields: misc.defaultFieldProperties([
      {key: 'check', name: 'Check', format: 'control', width: 100, height: 50},
      {key: 'assay_id', name: 'Assay ID', format: 'assay_id', width: 100},
      {key: 'name', name: 'Name', format: 'text', width: 100},
      {key: 'tags', name: 'Tags', format: 'list', width: 100}
    ]),
    records: assays
  };
  const dialog = selection.call(modal.submitDialog, id, title);
  const state = new DatagridState(data);
  state.rowFactory = () => rowFactory(data.fields, state.assays);
  const body = dialog.select('.modal-body');
  const filter = body.append('div').classed('fetchd-filter', true);
  const dg = body.append('div').classed('fetchd-dg', true);
  dg.call(view.datagrid, state);
  filter.call(rowf.setFilter, state);
}


function updateBody(selection, checked) {
  // TODO: update checked fields
}


function value(selection, state) {
  const selected = lbox.checkboxlistValues(selection)
    .filter(e => !state.assays.includes(e));
  return {
    type: 'results',
    targets: selected,
    compounds: state.data.records.map(e => e.compound_id)
  };
}



export default {
  menuLink, body, updateBody, value
};
