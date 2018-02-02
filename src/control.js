
/** @module control */

import d3 from 'd3';

import {default as core} from './common/core.js';
import {default as fetcher} from './common/fetcher.js';
import {default as idb} from './common/idb.js';
import {default as misc} from './common/misc.js';

import {default as button} from './component/button.js';
import {default as table} from './component/table.js';
import {default as modal} from './component/modal.js';


function updateStoreRow(selection, record) {
  selection.append('td')
      .classed('name', true)
      .text(record.name);
  selection.append('td')
      .classed('status', true)
      .text(record.status);
  selection.append('td')
      .classed('size', true)
      .text(record.records.length);
  const action = selection.append('td')
      .classed('action', true);
  const app = {nodes: 'datagrid', edges: 'network'};
  action.append('a')
      .call(button.menuButtonLink, null, 'Open', 'primary')
      .attr('href', `${app[record.dataType]}.html?id=${record.storeID}`)
      .attr('target', '_blank');
  const ongoing = ['running', 'ready'].includes(record.status);
  action.append('a')
      .call(button.menuModalLink, null, 'Delete', 'warning', 'delete-dialog')
      .property('disabled', ongoing)
      .text(ongoing ? 'Running' : 'Delete')
      .on('click', () =>{
        d3.select('#delete-dialog')
          .select('.message')
            .text(`Are you sure you want to delete ${record.name} ?`);
        d3.select('#delete-dialog')
          .select('.ok')
          .on('click', () => idb.deleteItem(record.storeID).then(update));
      });
}


function update() {
  // Server status
  fetcher.get('server')
    .then(fetcher.json)
    .catch()
    .then(res => {
      if (!res) return;
      // Server calculation jobs
      const calcFields = misc.defaultFieldProperties([
        {key: 'id', name: 'Workflow ID', format: 'text'},
        {key: 'size', name: 'File size', d3_format: '.3s'},
        {key: 'status', name: 'Status', format: 'text'},
        {key: 'created', name: 'Created', format: 'date'},
        {key: 'expires', name: 'Expires', format: 'date'}
      ]);
      d3.select('#contents').select('.calc')
        .call(table.updateHeader, calcFields, res.calc.records);
      // Server status
      const serverFields = misc.defaultFieldProperties([
        {key: 'key', name: 'Key', format: 'text'},
        {key: 'value', name: 'Value', format: 'text'}
      ]);
      const serverRecords = Object.entries(res)
        .filter(e => e[0] !== 'calc')
        .map(e => ({key: e[0], value: e[1]}));
      d3.select('#contents').select('.server')
        .call(table.updateHeader, serverFields, serverRecords);
    });
  // Datagrid store
  idb.getItemsByDataType('nodes')
    .then(items => {
      d3.select('#contents').select('.dg')
        .call(table.updateContents, items, d => d.storeID, updateStoreRow);
    });
  // Network store
  idb.getItemsByDataType('edges')
    .then(items => {
      d3.select('#contents').select('.nw')
        .call(table.updateContents, items, d => d.storeID, updateStoreRow);
    });
}


function run() {
  // Menubar
  const menu = d3.select('#menubar');
  menu.append('a')
      .call(button.menuButtonLink, null, '+ New datagrid', 'primary')
      .attr('href', 'datagrid.html')
      .attr('target', '_blank');
  menu.append('a')
      .call(button.menuButtonLink, null, '+ New network', 'primary')
      .attr('href', 'network.html')
      .attr('target', '_blank');
  menu.append('a')
      .call(button.menuButtonLink, null, 'Refresh all', 'outline-secondary')
      .on('click', () => {
        return idb.getAllItems()
          .then(items => {
            return Promise.all(
              items.map(item => core.fetchProgress(item.storeID))
            );
          })
          .then(update);
      });
  menu.append('a')
      .call(button.menuModalLink, null, 'Reset local datastore', 'warning', 'reset-dialog');

  // Tables
  const storeFields = misc.defaultFieldProperties([
    {key: 'name', name: 'Name', format: 'text'},
    {key: 'status', name: 'Status', format: 'text'},
    {key: 'size', name: 'Records', d3_format: 'd'},
    {key: 'action', name: 'Action', format: 'control'}
  ]);
  const dg = d3.select('#contents')
    .append('div')
      .classed('py-4', true);
  dg.append('h5')
      .text('Datagrids on local storage');
  dg.append('table')
      .classed('dg', true)
      .call(table.render, null, null, storeFields);
  const nw = d3.select('#contents')
    .append('div')
      .classed('py-4', true);
  nw.append('h5')
      .text('Networks on local storage');
  nw.append('table')
      .classed('nw', true)
      .call(table.render, null, null, storeFields);
  const calc = d3.select('#contents')
    .append('div')
      .classed('py-4', true);
  calc.append('h5')
      .text('Server calculation job');
  calc.append('table')
      .classed('calc', true)
      .call(table.render);
  const server = d3.select('#contents')
    .append('div')
      .classed('py-4', true);
  server.append('h5')
      .text('Server status');
  server.append('table')
      .classed('server', true)
      .call(table.render);

  // Dialogs
  d3.select('#dialogs').append('div')
      .call(modal.confirmDialog, 'reset-dialog',
            'Are you sure you want to delete all local tables and reset the datastore ?')
    .select('.ok')
      .on('click', () => idb.reset().then(update));
  d3.select('#dialogs').append('div')
      .call(modal.confirmDialog, 'delete-dialog', null);
  // TODO: show browser status
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";  // TODO
  const offLine = 'onLine' in navigator && !navigator.onLine;  // TODO
  console.info('Off-line mode is disabled for debugging');
  return update();
}


export default {
  run
};
