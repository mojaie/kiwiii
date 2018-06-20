
/** @module dashboardApp */

import d3 from 'd3';

import {default as core} from './common/core.js';
import {default as fetcher} from './common/fetcher.js';
import {default as hfile} from './common/file.js';
import {default as idb} from './common/idb.js';
import {default as misc} from './common/misc.js';
import {default as sw} from './common/sw.js';

import {default as button} from './component/button.js';
import {default as table} from './component/table.js';
import {default as modal} from './component/modal.js';

import {default as searchDialog} from './dialog/search.js';
import {default as structDialog} from './dialog/struct.js';
import {default as filterDialog} from './dialog/filter.js';
import {default as sdfDialog} from './dialog/sdf.js';


function registerDatagrid(data) {
  data.fields = misc.defaultFieldProperties(data.fields);
  idb.putItem(data)
    .then(storeID => {
      window.open(`datagrid.html?id=${storeID}`, '_blank');
    });
}


function registerNetwork(data) {
  return idb.putItem(data.nodes)
    .then(storeID => {
      data.edges.reference.nodes = storeID;
      return idb.putItem(data.edges);
    })
    .then(storeID => {
      window.open(`network.html?id=${storeID}`, '_blank');
    });
}


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
      .call(button.menuButtonLink, 'Open', 'primary', 'open-white')
      .attr('href', `${app[record.dataType]}.html?id=${record.storeID}`)
      .attr('target', '_blank');
  const ongoing = ['running', 'ready'].includes(record.status);
  action.append('a')
      .call(button.menuModalLink, 'delete-dialog', 'Delete', 'warning', 'delete-gray')
      .property('disabled', ongoing)
      .on('click', () =>{
        d3.select('#delete-dialog')
          .select('.message')
            .text(`Are you sure you want to delete ${record.name} ?`);
        d3.select('#delete-dialog')
          .select('.ok')
          .on('click', () => idb.deleteItem(record.storeID).then(updateStoredData));
      })
    .select('.label')
      .text(ongoing ? 'Running' : 'Delete');
}


function updateStoredData() {
  // Stored datagrid
  idb.getItemsByDataType('nodes')
    .then(items => {
      d3.select('#contents').select('.dg')
        .call(table.updateContents, items, d => d.storeID, updateStoreRow);
    });
  // Stored network
  idb.getItemsByDataType('edges')
    .then(items => {
      d3.select('#contents').select('.nw')
        .call(table.updateContents, items, d => d.storeID, updateStoreRow);
    });
}


function updateServerStatus(status) {
  // Server calculation jobs
  const calcFields = misc.defaultFieldProperties([
    {key: 'id', name: 'Workflow ID', format: 'text'},
    {key: 'size', name: 'File size', d3_format: '.3s'},
    {key: 'status', name: 'Status', format: 'text'},
    {key: 'created', name: 'Created', format: 'date'},
    {key: 'expires', name: 'Expires', format: 'date'}
  ]);
  d3.select('#contents').select('.calc')
    .call(table.updateHeader, calcFields, status.server.calc.records);
  // Server status
  const serverFields = misc.defaultFieldProperties([
    {key: 'key', name: 'Key', format: 'text'},
    {key: 'value', name: 'Value', format: 'text'}
  ]);
  const serverRecords = Object.entries(status.server)
    .filter(e => e[0] !== 'calc')
    .map(e => ({key: e[0], value: e[1]}));
  d3.select('#contents').select('.server')
    .call(table.updateHeader, serverFields, serverRecords);
}


function app(status) {
  // menubar
  const menubar = d3.select('#menubar');
  // Datagrid
  const dgmenu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Datagrid', 'primary', 'plus-white')
      .select('.dropdown-menu');
  dgmenu.append('a').classed('online-command', true)
      .call(searchDialog.menuLink);
  dgmenu.append('a').classed('online-command', true)
      .call(structDialog.menuLink);
  dgmenu.append('a').classed('online-command', true)
      .call(filterDialog.menuLink);
  dgmenu.append('a').classed('online-command', true)
      .call(sdfDialog.menuLink);
  dgmenu.append('a')
      .call(button.dropdownMenuFile, 'Import JSON', '.ndc,.ndr,.json,.gz', 'import')
      .on('change', function () {
        const file = button.dropdownMenuFileValue(d3.select(this));
        hfile.loadJSON(file).then(registerDatagrid);
      });

  // disable on-line commands
  if (!status.server.instance) {
    menubar.selectAll('.online-command')
      .attr('data-target', null)
      .classed('disabled', true);
  }
  // Network
  const nwmenu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Network', 'primary', 'plus-white')
      .select('.dropdown-menu');
  nwmenu.append('a')
      .call(button.dropdownMenuFile, 'Import JSON', '.gfc,.gfr,.json,.gz', 'import')
      .on('change', function () {
        const file = button.dropdownMenuFileValue(d3.select(this));
        hfile.loadJSON(file).then(registerNetwork);
      });
  // Refresh
  menubar.append('a')
      .call(button.menuButtonLink, 'Refresh all', 'outline-secondary', 'refresh-gray')
      .on('click', () => {
        idb.getAllItems()
          .then(items => Promise.all(items.map(item => core.fetchProgress(item.storeID))))
          .then(updateStoredData);
        core.serverStatus()
          .then(updateServerStatus);
      });
  // Delete all
  menubar.append('a')
      .call(button.menuModalLink, 'reset-dialog',
            'Reset local datastore', 'warning', 'delete-gray');
  // Stored data
  const storeFields = misc.defaultFieldProperties([
    {key: 'name', name: 'Name', format: 'text'},
    {key: 'status', name: 'Status', format: 'text'},
    {key: 'size', name: 'Records', d3_format: 'd'},
    {key: 'action', name: 'Action', format: 'control'}
  ]);
  // Stored datagrids
  d3.select('#contents')
      .style('padding-left', '10%')
      .style('padding-right', '10%');
  const dg = d3.select('#contents')
    .append('div')
      .classed('py-4', true);
  dg.append('h5')
      .text('Datagrids on local storage');
  dg.append('table')
      .classed('dg', true)
      .call(table.render, null, null, storeFields);
  // Stored networks
  const nw = d3.select('#contents')
    .append('div')
      .classed('py-4', true);
  nw.append('h5')
      .text('Networks on local storage');
  nw.append('table')
      .classed('nw', true)
      .call(table.render, null, null, storeFields);
  updateStoredData();
  // Server calc jobs
  const calc = d3.select('#contents')
    .append('div')
      .classed('py-4', true);
  calc.append('h5')
      .text('Server calculation job');
  calc.append('table')
      .classed('calc', true)
      .call(table.render);
  // Server status
  const server = d3.select('#contents')
    .append('div')
      .classed('py-4', true);
  server.append('h5')
      .text('Server status');
  server.append('table')
      .classed('server', true)
      .call(table.render);
  updateServerStatus(status);
  // Dialogs
  const dialogs = d3.select('#dialogs');
  const chemrsrc = status.schema.resources.filter(e => e.domain === 'chemical');
  dialogs.append('div')
      .call(modal.confirmDialog, 'reset-dialog',
            'Are you sure you want to delete all local tables and reset the datastore ?')
    .select('.ok')
      .on('click', () => idb.reset().then(updateStoredData));
  dialogs.append('div')
      .call(modal.confirmDialog, 'delete-dialog', null);
  dialogs.append('div')
      .call(searchDialog.body, status.schema.compoundIDPlaceholder)
      .on('submit', function () {
        const targets = chemrsrc.map(e => e.id);
        const query = searchDialog.query(d3.select(this), targets);
        return fetcher.get(query.workflow, query)
          .then(fetcher.json)
          .then(registerDatagrid);
      });
  dialogs.append('div')
      .call(structDialog.body, chemrsrc, status.server.rdkit)
      .on('submit', function () {
        const query = structDialog.query(d3.select(this));
        return fetcher.get(query.workflow, query)
          .then(fetcher.json)
          .then(registerDatagrid);
      });
  dialogs.append('div')
      .call(filterDialog.body, chemrsrc)
      .on('submit', function () {
        const query = filterDialog.query(d3.select(this));
        return fetcher.get(query.workflow, query)
          .then(fetcher.json)
          .then(registerDatagrid);
      });
  dialogs.append('div')
      .call(sdfDialog.body, chemrsrc)
      .on('submit', function () {
        const formData = sdfDialog.queryFormData(d3.select(this));
        return fetcher.post('sdfin', formData)
          .then(fetcher.json)
          .then(registerDatagrid);
      });
}


function run() {
  // TODO: show browser status
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";  // TODO
  const offLine = 'onLine' in navigator && !navigator.onLine;  // TODO
  if (debug) {
    console.info('Off-line mode is disabled for debugging');
  } else {
    sw.registerServiceWorker();
  }
  return core.serverStatus()
    .then(app);
}


export default {
  run
};
