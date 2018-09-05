
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


function updateBody(selection, screenerURL) {
  const mbody = selection.select('.modal-body');
  return fetch(`${screenerURL}qcSessions?limit=0`, { credentials: 'include' })
    .then(res => res.json())
    .then(res => res.meta.totalHitCount)
    .then(cnt => {
      const reqs = [];
      const chunks = Math.ceil(cnt / 250);
      for (let i = 0; i < chunks; i++) {
        const q = JSON.stringify({limit: 250, offset: i * 250});
        const url = `../screener/qcsession?query=${q}`;
        const op = {credentials: 'include'};
        reqs.push(() => fetch(url, op).then(res => res.json()));
      }
      return reqs;
    })
    .then(reqs => fetcher.batchRequest(reqs, 0.5))
    .then(ress => _.flatten(ress.map(e => e.records)))
    .then(rcds => {
      const treeNodes = [{id: 'root'}];
      rcds.forEach(rcd => {
        const dirs = rcd.experiment.folderName.split('/');
        dirs.shift();
        dirs.forEach((dir, i) => {
          if (!treeNodes.find(e => dir === e.id)) {
            treeNodes.push({
              id: dir, parent: i === 0 ? 'root' : dirs[i - 1]});
          }
        });
        treeNodes.push({
          id: rcd.qcsRefId, parent: dirs[dirs.length - 1], content: rcd});
      });
      mbody.select('.qcsession')
          .call(tree.tree()
            .bodyHeight(300)
            .defaultLevel(1)
            .nodeEnterFactory(qcsNode)
            .nodeMergeFactory(updateQcsNode), treeNodes
          );
    });
}


function dialogFormValid(selection) {

}


function execute(selection) {
  // TODO: fetch 3 responses and build 3 views
  // generate tile with platevalues
  // generate datagrid with platestats
  // if compounds: generate datagrid with compound
}


function qcsNode(selection, record) {
  selection.append('span').classed('arrow', true);
  selection.append('img')
      .classed('icon', true)
      .classed('mr-1', true)
      .style('width', '1.3rem')
      .style('height', '1.3rem');
  selection.append('span')
      .classed('label', true);
  if (record.content) {
    selection.append('input')
      .classed('qcsvalue', true)
      .attr('type', 'radio')
      .attr('name', 'qcsvalue')
      .style('display', 'none');
    selection.select('.label')
      .on('click', function () {
        selection.select('.qcsvalue').property('checked', true);
        d3.select('.modal-body .qcsession')
          .selectAll('li')
            .style('background-color', null);
        selection.style('background-color', '#ffff00');
        console.log(tree.checkboxValues(d3.select('.modal-body .qcsession')))
      });
  }
}


function updateQcsNode(selection, record) {
  const iconType = record.content ? 'table-darkorange' : 'file-seagreen';
  selection.select('.icon')
      .attr('src', `${button.iconBaseURL}${iconType}.svg`);
  selection.select('.label')
      .text(record.content ? record.content.name : record.id);
}

export default {
  menuLink, body, updateBody, execute
};
