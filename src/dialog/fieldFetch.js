
/** @module dialog/fieldFetch */

import _ from 'lodash';

import {default as misc} from '../common/misc.js';

import {default as button} from '../component/button.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';

import DatagridState from '../datagrid/state.js';
import {default as component} from '../datagrid/component.js';
import {default as view} from '../datagrid/view.js';
import {default as rowf} from '../datagrid/rowfilter.js';


const id = 'fieldfetch-dialog';
const title = 'Append assays';
let state = null;


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'fieldfetch', title, id);
}


function body(selection, schema) {
  const rsrcs = schema.resources.filter(e => e.domain === 'assay');
  const assays = _(rsrcs.map(e => e.data)).flatten().value();
  const data = {
    fields: misc.defaultFieldProperties([
      {key: 'check', name: 'Check', format: 'checkbox', widthf: 0.5, height: 40},
      {key: 'assay_id', name: 'Assay ID', format: 'assay_id'},
      {key: 'name', name: 'Name', format: 'text'},
      {key: 'tags', name: 'Tags', format: 'list', widthf: 2}
    ]),
    records: assays.map(e => {
      e.check = false;
      return e;
    })
  };
  const dialog = selection.call(modal.submitDialog, id, title);
  state = new DatagridState(data);
  const body = dialog.select('.modal-body');
  const filter = body.append('div').classed('fetchd-filter', true);
  const dg = body.append('div').classed('fetchd-dg', true);
  dg.call(view.datagrid, state);
  filter.call(rowf.setFilter, state);
  state.fixedViewportHeight = 200;
  dg.call(component.resizeViewport, state);
  const vtypes = _(assays.map(e => e.value_types))
    .flatten()
    .uniqBy('key')
    .value();
  body.append('div')
      .classed('my-3', true)
      .classed('vtype', true)
      .call(lbox.checklistBox, null, 'Value type', vtypes, ['IC50']);
}


function updateBody(selection) {
  state.data.records.forEach(e => {
    e.check = false;
  });
  state.updateContentsNotifier();
}


function queries(selection, targets, compounds) {
  return state.data.records
    .filter(e => e.check && !e.check_d)
    .map(e => {
      return {
        workflow: 'activity',
        targets: targets,
        assay_id: e.assay_id,
        condition: {
          compounds: compounds,
          value_types: lbox.checklistBoxValue(selection.select('.vtype'))
        }
      };
    });
}



export default {
  menuLink, body, updateBody, queries
};
