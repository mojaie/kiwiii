
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
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-dialog').classed('modal-lg', true);
  dialog.select('.modal-body').append('div')
    .classed('qcsession', true);
}


function updateBody(selection) {
  // TODO: QCSession tree
  // no checkboxes
  // select only leaf nodes (QCSession)
  const mbody = selection.select('.modal-body');
  return fetch(`../screener/qcsession`, { credentials: 'include' })
    .then(fetcher.json)
    .then(res => {
      const treeNodes = [];
      res.records.forEach(rcd => {
        const dirs = rcd.path.split('/');
        dirs.unshift();
        dirs.forEach((dir, i) => {
          if (!treeNodes.find(e => dir === e.id)) {
            const n = {id: dir, parent: dirs[i - 1] || 'root'};
            if (i === dirs.length - 1) {
              n.concat(rcd);
            }
            treeNodes.push(n);
          }
        });
      });
      mbody.select('.qcsession')
          .call(tree.tree()
            .bodyHeight(300)
            .nodeEnterFactory(qcsNode)
            .nodeMergeFactory(updateQcsNode), treeNodes
          );
    });
}


function execute(selection) {
  // TODO: fetch 3 responses and build 3 views
  // generate tile with platevalues
  // generate datagrid with platestats
  // if compounds: generate datagrid with compound
}


function qcsNode(selection, record) {
  selection.append('span').classed('arrow', true);
  selection.append('span')
      .classed('label', true);
  if (record.QCSRefID) {
    // TODO: toggle selection state
  }
}


function updateQcsNode(selection, record) {
  selection.select('.label')
      .text(record.id);
}

export default {
  menuLink, body, updateBody, execute
};
