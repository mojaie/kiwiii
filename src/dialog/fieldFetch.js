
/** @module dialog/fieldFetch */


import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';

import DatagridState from '../datagrid/state.js';
import {default as view} from '../datagrid/view.js';
import {default as rowf} from '../datagrid/rowfilter.js';

const id = 'fieldfetch-dialog';
const title = 'Import fields from database';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'fieldfetch', title, id);
}

function rowFactory(state) {
  return (selection, record) => {
    const done = state.assayFields.includes(record.key);
    selection.append('div')
      .selectAll('label').select('input')
      .property('checked', done)
      .property('disabled', done);
    selection.append('div').text(record.assay_id);
    selection.append('div').text(record.name);
    selection.append('div').text(record.tags);
  };
}

function body(selection, schema) {
  const data = {
    fields: [
      {key: 'check', name: 'Check', format: 'control'},
      {key: 'assay_id', name: 'Assay ID', format: 'assay_id'},
      {key: 'name', name: 'Name', format: 'text'},
      {key: 'tags', name: 'Tags', format: 'list'}
    ],
    records: schema.resources.filter(e => e.domain === 'assay')
  };
  const dialog = selection.call(modal.submitDialog, id, title);
  const state = new DatagridState(data);
  const body = dialog.select('.modal-body');
  const filter = body.append('div').classed('fetchd-filter', true);
  const dg = body.append('div').classed('fetchd-dg', true);
  state.rowFactory = () => rowFactory(state);
  dg.call(view.datagrid, state);
  filter.call(rowf.setFilter, state);
}


function updateBody(selection, checked) {
  // TODO: update checked fields
}


function value(selection, state) {
  const selected = lbox.checkboxlistValues(selection)
    .filter(e => !state.assayFields.includes(e));
  return {
    type: 'results',
    targets: selected,
    compounds: state.data.records.map(e => e.compound_id)
  };
}



export default {
  menuLink, body, value
};
