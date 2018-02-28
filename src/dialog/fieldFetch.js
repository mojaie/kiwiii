
/** @module dialog/fieldFetch */


import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';

const id = 'fieldfetch-dialog';
const title = 'Import fields from database';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'fieldfetch', title, id);
}

function updateRowFunc() {
  return (selection, record) => {
    record.append('div')
      .selectAll('label').select('input')
      .property('checked', dataKeys.includes(d.key))
      .attr('disabled', dataKeys.includes(d.key) ? 'disabled' : null);
  };
}

function body(selection, fields) {
  const dialog = selection.call(modal.submitDialog, id, title);
  const state = new DatagridState(data);
  dialog.select('.modal-body').append('div')
    .call(view.datagrid, state)
    .call(rowf.setFilter, state);

  const dataKeys = dataFields.map(e => e.key);
  const resourceFields = KArray.from(resources.map(e => e.fields))
    .extend().unique('key').filter(e => e.key !== 'id');
}



function updateBody(selection, fields) {
  const dialog = selection.call(modal.submitDialog, id, title);
  const state = new DatagridState(data);
  dialog.select('.modal-body').append('div')
    .call(view.datagrid, state)
    .call(rowf.setFilter, state);

  const dataKeys = dataFields.map(e => e.key);
  const resourceFields = KArray.from(resources.map(e => e.fields))
    .extend().unique('key').filter(e => e.key !== 'id');
}


function value(selection) {
  const selected = d3form.checkboxValues('#join-keys');
  const queryFieldKeys = resourceFields.map(e => e.key)
    .filter(e => !dataKeys.includes(e))
    .filter(e => selected.includes(e));
  return {
    type: 'fieldfilter',
    targetFields: queryFieldKeys,
    key: 'compound_id',
    values: compoundIDs
  };
}



export default {
  menuLink, body, value
};
