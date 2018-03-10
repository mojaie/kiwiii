
/** @module datagrid/datagridApp */

import d3 from 'd3';

import {default as core} from '../common/core.js';
import {default as idb} from '../common/idb.js';
import {default as fetcher} from '../common/fetcher.js';
import {default as hfile} from '../common/file.js';
import {default as misc} from '../common/misc.js';

import {default as button} from '../component/button.js';
import {default as modal} from '../component/modal.js';

import {default as fieldConfigDialog} from '../dialog/fieldConfig.js';
import {default as fieldFileDialog} from '../dialog/fieldFile.js';
import {default as networkgenDialog} from '../dialog/networkgen.js';
import {default as renameDialog} from '../dialog/rename.js';

import {default as view} from './view.js';
import {default as sort} from './sort.js';
import {default as rowf} from './rowFilter.js';
import DatagridState from './state.js';


function app(data, serverStatus) {
  const menubar = d3.select('#menubar');
  menubar.selectAll('div,span,a').remove();  // Clean up
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up

  const state = new DatagridState(data);
  state.serverStatus = serverStatus;
  d3.select('#datagrid')
      .call(view.datagrid, state)
      .call(sort.setSort, state);
  d3.select('#dg-search')
      .call(rowf.setFilter, state);

  // Resize window
  window.onresize = () =>
    d3.select('#datagrid').call(view.resize, state);

  // Datagrid view control
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, null, 'View control', 'primary')
      .select('.dropdown-menu');
  menu.append('a')
      .call(fieldConfigDialog.menuLink);
  menu.append('a')
      .call(fieldFileDialog.menuLink);
  menu.append('a')
      .classed('networkgend', true)
      .call(networkgenDialog.menuLink);
  menu.append('a')
      .call(renameDialog.menuLink);
  menu.append('a')
      .classed('saveview', true)
      .call(button.dropdownMenuItem, null, 'Save to local storage')
      .on('click', function () {
        if (state.data.storeID) {
          return idb.updateItem(state.data.storeID, item => {
            item.id = misc.uuidv4();
            item.name = state.data.name;
            item.fields = state.data.fields;
            item.records = state.data.records;
          })
          .then(() => console.info('Datagrid saved'));
        } else {
          return idb.putItem(state.export())
            .then(storeID => {
              window.location = `datagrid.html?id=${storeID}`;
            });
        }
      });
  menu.append('a')
      .classed('exportjson', true)
      .call(button.dropdownMenuItem, null, 'Export to JSON')
      .on('click', () => {
        const data = state.export();
        // Delete local store information
        delete data.storeID;
        hfile.downloadJSON(data, data.name);
      });
  menu.append('a')
      .classed('exportexcel', true)
      .call(button.dropdownMenuItem, null, 'Export to Excel worksheet')
      .on('click', () => {
        const data = state.export();
        const formData = new FormData();
        formData.append('contents', new Blob([JSON.stringify(data)]));
        return fetcher.post('xlsx', formData)
          .then(fetcher.blob)
          .then(blob => hfile.downloadDataFile(blob, `${data.name}.xlsx`));
      });
  // Open control panel
  menubar.append('a')
      .call(button.menuButtonLink, null, 'Control panel', 'outline-secondary')
      .attr('href', 'control.html')
      .attr('target', '_blank');
  // Fetch control
  const ongoing = ['running', 'ready'].includes(state.data.status);
  if (ongoing) {
  menubar.append('a')
      .classed('refresh', true)
      .call(button.menuButtonLink, null, 'Refresh', 'outline-secondary')
      .on('click', function () {
        return core.fetchProgress(state.data.storeID)
          .then(() => idb.getItemByID(state.data.storeID))
          .then(item => app(item, state.serverStatus));
      });
  menubar.append('a')
      .call(button.menuButtonLink, null, 'Abort server job', 'warning')
      .attr('data-toggle', 'modal')
      .attr('data-target', '#abort-dialog');
  menubar.append('span')
      .classed('progress', true)
    .append('progress')
      .attr('max', 100)
      .attr('value', state.data.progress)
      .text(`${state.data.progress}%`);
  }
  menubar.append('span')
    .classed('title', true)
    .text(state.data.name);
  menubar.append('span')
      .classed('status', true)
      .text(`(${state.data.status} - ${state.data.records.length} records found in ${state.data.execTime} sec.)`);

  // disable on-line commands
  if (!serverStatus.instance) {
    menu.selectAll('.networkgend, .exportexcel')
      .attr('data-target', null)
      .classed('disabled', true)
      .on('click', null);
  }

  // Dialogs
  dialogs.append('div')
      .classed('fieldconfd', true)
      .call(fieldConfigDialog.body);
  dialogs.append('div')
      .classed('fieldfiled', true)
      .call(fieldFileDialog.body);
  dialogs.append('div')
      .classed('netgend', true)
      .call(networkgenDialog.body, serverStatus.rdkit);
  dialogs.append('div')
      .classed('renamed', true)
      .call(renameDialog.body, state.data.name);
  dialogs.append('div')
      .classed('abortd', true)
      .call(
        modal.confirmDialog, 'abort-dialog',
        'Are you sure you want to abort this calculation job?'
      );
  updateApp(state);
}


function updateApp(state) {
  d3.select('#loading-icon').style('display', 'none');
  // Title
  d3.select('title').text(state.data.name);
  d3.select('#menubar').select('.title').text(state.data.name);
  // Dialogs
  const dialogs = d3.select('#dialogs');
  dialogs.select('.fieldconfd')
      .call(fieldConfigDialog.updateBody, state)
      .on('submit', function () {
        state.data.fields = fieldConfigDialog.value(d3.select(this));
        state.updateContentsNotifier();
        updateApp(state);
      });
  dialogs.select('.fieldfiled')
      .on('submit', function () {
        return fieldFileDialog.readFile(d3.select(this))
          .then(data => {
            state.joinFields(data);
            state.updateContentsNotifier();
            updateApp(state);
          });
      });
  dialogs.select('.netgend')
      .on('submit', function () {
        const formData = new FormData();
        const params = networkgenDialog.queryParams(d3.select(this));
        formData.append('params', JSON.stringify(params));
        formData.append('contents', new Blob([JSON.stringify(state.export())]));
        return fetcher.post(`${params.measure}net`, formData)
          .then(fetcher.json)
          .then(data => {
            data.reference.nodes = state.data.storeID;
            data.fields = misc.defaultFieldProperties(data.fields);
            return data;
          })
          .then(idb.putItem)
          .then(storeID => {
            d3.select('#loading-icon').style('display', 'none');
            window.open(`network.html?id=${storeID}`, '_blank');
          });
      });
  dialogs.select('.renamed')
      .call(renameDialog.updateBody, state)
      .on('submit', function () {
        state.data.name = renameDialog.value(d3.select(this));
        updateApp(state);
  });
  dialogs.select('.abortd')
      .on('submit', function () {
        core.fetchProgress(state.data.storeID, 'abort')
          .then(() => idb.getItemByID(state.data.storeID))
          .then(item => app(item, state.serverStatus));
      });
}


export default {
  app, updateApp
};
