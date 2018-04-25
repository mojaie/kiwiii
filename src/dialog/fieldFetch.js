
/** @module dialog/fieldFetch */

import _ from 'lodash';

import {default as misc} from '../common/misc.js';

import {default as button} from '../component/button.js';
import {default as modal} from '../component/modal.js';

import DatagridState from '../datagrid/state.js';
import {default as component} from '../datagrid/component.js';
import {default as view} from '../datagrid/view.js';
import {default as rowf} from '../datagrid/rowfilter.js';


const id = 'fieldfetch-dialog';
const title = 'Append assays';
let fdstate = null;


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'beaker');
}


function body(selection, schema) {
  const rsrcs = schema.resources.filter(e => e.domain === 'assay');
  const assays = _(rsrcs.map(e => e.data)).flatten()
    .flatMap(rcd => rcd.value_types.map(e => {
      const copy = Object.assign({}, rcd);
      copy.value_type = e.key;
      return copy;
    }))
    .value();
  const data = {
    fields: misc.defaultFieldProperties([
      {key: 'check', name: 'Check', format: 'checkbox',
       widthf: 0.5, height: 40, disabled: 'check_d'},
      {key: 'assay_id', name: 'Assay ID', format: 'assay_id'},
      {key: 'name', name: 'Name', format: 'text'},
      {key: 'value_type', name: 'Value type', format: 'text'},
      {key: 'tags', name: 'Tags', format: 'list', widthf: 2}
    ]),
    records: assays.map(e => {
      e.check = false;
      return e;
    })
  };
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-dialog').classed('modal-lg', true);
  fdstate = new DatagridState(data);
  const body = dialog.select('.modal-body');
  const filter = body.append('div').classed('fetchd-filter', true);
  const dg = body.append('div').classed('fetchd-dg', true);
  dg.call(view.datagrid, fdstate);
  filter.call(rowf.setFilter, fdstate);
  fdstate.fixedViewportHeight = 300;
  dg.call(component.resizeViewport, fdstate);
}


function updateBody(selection) {
  fdstate.data.records.forEach(e => {
    if (e.check) {
      e.check_d = true;
    }
  });
  fdstate.updateContentsNotifier();
}


function queries(selection, targets, compounds) {
  return fdstate.data.records
    .filter(e => e.check && !e.check_d)
    .map(e => {
      return {
        workflow: 'activity',
        targets: targets,
        assay_id: e.assay_id,
        condition: {
          compounds: compounds,
          value_types: [e.value_type]
        }
      };
    });
}



export default {
  menuLink, body, updateBody, queries
};
