
/** @module datagrid/datagridApp */

import d3 from 'd3';

import {default as core} from '../common/core.js';
import {default as idb} from '../common/idb.js';
import {default as fetcher} from '../common/fetcher.js';
import {default as hfile} from '../common/file.js';
import {default as misc} from '../common/misc.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';

import {default as fieldConfigDialog} from '../dialog/fieldConfig.js';
import {default as fieldFileDialog} from '../dialog/fieldFile.js';
import {default as networkgenDialog} from '../dialog/networkgen.js';

import {default as view} from './view.js';
import {default as sort} from './sort.js';
import DatagridState from './state.js';


function app(data, serverStatus) {
  const state = new DatagridState(data);
  d3.select('#datagrid')
    .call(view.datagrid, state)
    .call(sort.setSort, state);

  // Resize window
  window.onresize = () =>
    d3.select('#datagrid').call(view.resize, state);

  // Menubar
  const menubar = d3.select('#menubar');
  menubar.selectAll('div,span,a').remove();  // Clean up
  // Datagrid view control
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, null, 'View control', 'primary')
      .select('.dropdown-menu');
  menu.append('a')
      .call(fieldConfigDialog.menuLink);
  menu.append('a')
      .call(fieldFileDialog.menuLink);
  menu.append('a')
      .call(networkgenDialog.menuLink);
  menu.append('a')
      .call(button.dropdownMenuModal,
            'rename', 'Rename', 'rename-dialog');
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
          .then(item => app(item, serverStatus));
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

  // Dialogs
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up
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
      .call(modal.submitDialog, 'rename-dialog', 'Rename view')
    .select('.modal-body').append('div')
      .classed('rename', true);
  updateApp(state);
}


function updateApp(state) {
  // Title
  d3.select('title').text(state.data.name);
  d3.select('#menubar').select('.title').text(state.data.name);
  // Dialogs
  const dialogs = d3.select('#dialogs');
  const fieldconfd = dialogs.select('.fieldconfd')
      .call(fieldConfigDialog.updateBody, state);
  fieldconfd.select('.submit')
      .on('click', () => {
        d3.select('#loading-icon').style('display', 'inline');
        state.setFields(fieldConfigDialog.value(fieldconfd));
        state.updateHeaderNotifier();
        updateApp(state);
        d3.select('#loading-icon').style('display', 'none');
      });
  const fieldfiled = dialogs.select('.fieldfiled');
  fieldfiled.select('.submit')
      .on('click', () => {
        d3.select('#loading-icon').style('display', 'inline');
        return fieldFileDialog.readFile(fieldfiled)
          .then(data => {
            state.joinFields(data);
            state.updateHeaderNotifier();
            updateApp(state);
            d3.select('#loading-icon').style('display', 'none');
          });
      });
  const netgend = dialogs.select('.netgend');
  netgend.select('.submit')
      .on('click', () => {
        d3.select('#loading-icon').style('display', 'inline');
        const formData = new FormData();
        const params = networkgenDialog.queryParams(netgend);
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
  const renamed = dialogs.select('.renamed');
  const rename = renamed.select('.rename')
      .call(box.textBox, 'rename', 'New name', 40, state.data.name);
  renamed.select('.submit')
      .on('click', function () {
        state.data.name = box.textBoxValue(rename);
        updateApp(state);
      });
}


export default {
  app, updateApp
};
