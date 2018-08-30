
/** @module dialog/screener */

import _ from 'lodash';
import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';
import {default as mapper} from '../common/mapper.js';

import {default as button} from '../component/button.js';
import {default as modal} from '../component/modal.js';
import {default as tree} from '../component/tree.js';


const id = 'screener-dialog';
const title = 'Fetch Screener QCSession';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-addassay');
}


function body(selection) {
  // TODO: QCSession tree
  // no checkboxes
  // select only leaf nodes (QCSession)
  // generate tree from path (/screener/user/assay/...)
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-dialog').classed('modal-lg', true);
  dialog.select('.modal-body').append('div')
    .classed('qcsession', true)
    .call(tree.tree);
}


function updateBody(selection, schema, dgfields) {

}


function execute(selection, compounds, schema) {
  // TODO: fetch 3 responses and build 3 views
  // generate tile with platevalues
  // generate datagrid with platestats
  // if compounds: generate datagrid with compound
}


export default {
  menuLink, body, updateBody, execute
};
