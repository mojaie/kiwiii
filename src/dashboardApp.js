
/** @module dashboardApp */

import _ from 'lodash';
import d3 from 'd3';

import Collection from './common/collection.js';
import {default as fetcher} from './common/fetcher.js';
import {default as hfile} from './common/file.js';
import {default as idb} from './common/idb.js';
import {default as specs} from './common/specs.js';
import {default as sw} from './common/sw.js';

import {default as button} from './component/button.js';
import {default as modal} from './component/modal.js';
import {default as tree} from './component/tree.js';

import {default as searchDialog} from './dialog/search.js';
import {default as structDialog} from './dialog/struct.js';
import {default as filterDialog} from './dialog/filter.js';
import {default as sdfDialog} from './dialog/sdf.js';
import {default as renameDialog} from './dialog/rename.js';

import {default as table} from './datagrid/table.js';


function nodeFactory(selection, record) {
  const iconv = {
    'datagrid': 'table-gray', 'network': 'network', 'tile': 'painting'};
  const icon = record.viewID ? iconv[record.viewType] : 'export';
  const storeID = record.storeID || record.parent;
  const node = record.viewID
    ? selection.append('a')
      .attr(
        'href',
        `${record.viewType}.html?store=${storeID}&view=${record.viewID}`
      )
      .attr('target', '_blank')
    : selection;
  node.append('img')
      .attr('src', icon ? `./assets/icon/${icon}.svg` : null)
      .classed('mr-1', true)
      .style('width', '2rem')
      .style('height', '2rem');
  node.append('span')
      .classed('mr-1', true)
      .text(record.name);
  const action = selection.append('span')
      .classed('p-1', true)
      .style('border', '1px solid #999999')
      .style('border-radius', '5px');
  const actionIcon = (sel, icon) => sel.append('img')
      .attr('src', `./assets/icon/${icon}.svg`)
      .classed('mx-1', true)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  if (!record.viewID) {
    action.append('a').call(actionIcon, 'export')
        .on('click', () => {
          const data = JSON.parse(JSON.stringify(record));
          delete data.storeID;
          delete data.sessionStarted;
          hfile.downloadJSON(data, data.name);
        });
  }
  action.append('a')
      .attr('data-toggle', 'modal')
      .attr('data-target', '#rename-dialog')
      .call(actionIcon, 'edittext')
      .on('click', () =>{
        d3.select('#rename-dialog')
          .call(renameDialog.updateBody, record.name)
          .on('submit', function () {
            if (record.viewID) {
              idb.updateView(record.parent, record.viewID, view => {
                view.name = renameDialog.value(d3.select(this));
              }).then(updateStoredData);
            } else {
              idb.updateItem(record.storeID, item => {
                item.name = renameDialog.value(d3.select(this));
              }).then(updateStoredData);
            }
          });
      });
  if (!record.ongoing) {
    const recordType = record.viewID ? record.viewType : 'package';
    const deleteType = record.alone ? 'package' : recordType;
    const deleteName = record.alone ? record.parentName : record.name;
    action.append('a')
        .attr('data-toggle', 'modal')
        .attr('data-target', '#delete-dialog')
        .call(actionIcon, 'delete-gray')
        .on('click', () =>{
          d3.select('#delete-dialog')
            .call(
              modal.updateConfirmDialog,
              `Are you sure you want to delete ${deleteType} ${deleteName} ?`
            )
            .on('submit', () => {
              if (record.viewID && !record.alone) {
                idb.deleteView(record.parent, record.viewID)
                  .then(updateStoredData);
              } else {
                idb.deleteItem(record.storeID || record.parent)
                  .then(updateStoredData);
              }
            });
        });
  }
  action.selectAll('img')
    .on('mouseenter', function() {
      d3.select(this).style('background-color', '#ffcccc');
    })
    .on('mouseleave', function() {
      d3.select(this).style('background-color', null);
    });
}


function updateStoredData() {
  return idb.getAllItems()
    .then(items => {
      const treeNodes = [{storeID: 'root'}];
      items.forEach(pkg => {
        pkg.parent = 'root';
        pkg.ongoing = specs.isRunning(pkg);
        treeNodes.push(pkg);
        pkg.views.forEach(view => {
          view.parent = pkg.storeID;
          view.ongoing = pkg.ongoing;
          view.alone = pkg.views.length <= 1;
          view.parentName = pkg.name;
          treeNodes.push(view);
        });
      });
      d3.select('#contents').select('.stored')
        .call(tree.treeItems, treeNodes, d => d.storeID, nodeFactory);
    });
}


function updateServerStatus(server) {
  d3.select('#contents').select('.calc')
    .call(table.updateRecords, server.calc.records);
  const serverRecords = Object.entries(server)
    .filter(e => e[0] !== 'calc')
    .map(e => ({key: e[0], value: e[1]}));
  d3.select('#contents').select('.server')
    .call(table.updateRecords, serverRecords);
}


function app() {
  // Menubar
  const menubar = d3.select('#menubar');
  // Start
  const startMenu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Start', 'primary', 'plus-white')
      .select('.dropdown-menu');
  startMenu.append('a').classed('online-command', true)
      .call(searchDialog.menuLink);
  startMenu.append('a').classed('online-command', true)
      .call(structDialog.menuLink);
  startMenu.append('a').classed('online-command', true)
      .call(filterDialog.menuLink);
  startMenu.append('a').classed('online-command', true)
      .call(sdfDialog.menuLink);
  startMenu.append('a')
      .call(button.dropdownMenuFile, 'Open file',
            '.apc,.apr,.ndc,.ndr,.gfc,.gfr,.json,.gz', 'import')
      .on('change', function () {
        const file = button.dropdownMenuFileValue(d3.select(this));
        hfile.loadJSON(file)
          .then(idb.importItem)
          .then(updateStoredData);
      });

  // Refresh
  const refreshButton = menubar.append('a')
      .classed('refresh', true)
      .classed('online-command', true)
      .call(button.menuButtonLink,
            'Refresh all', 'outline-secondary', 'refresh-gray')
      .on('click', function() { updateStoredData(); });
  // Delete all
  menubar.append('a')
      .call(button.menuModalLink, 'reset-dialog',
            'Reset local datastore', 'warning', 'delete-gray');

  const contents = d3.select('#contents')
      .style('padding-left', '10%')
      .style('padding-right', '10%');

  // Stored analysis packages
  contents.append('h5').classed('mt-5', true).text('Packages on local storage');
  contents.append('div').classed('mb-5', true)
      .classed('stored', true)
      .style('border', '1px solid #333333')
      .call(tree.tree)
      .call(tree.setHeight, 300);
  updateStoredData();

  // Server calc jobs
  // TODO: only for admin
  const calcFields = [
    {key: 'id', name: 'Workflow ID', format: 'text'},
    {key: 'size', name: 'File size', format: 'd3_format', d3_format: '.3s'},
    {key: 'status', name: 'Status', format: 'text'},
    {key: 'created', name: 'Created', format: 'date', height: 40},
    {key: 'expires', name: 'Expires', format: 'date', height: 40}
  ];
  contents.append('h5').classed('mt-5', true).text('Server calculation job');
  contents.append('div').classed('mb-5', true).classed('calc', true)
  .call(table.table, calcFields, [], null, 300);

  // Server status
  const serverFields = [
    {key: 'key', name: 'Key', format: 'text'},
    {key: 'value', name: 'Value', format: 'text'}
  ];
  contents.append('h5').classed('mt-5', true).text('Server status');
  contents.append('div').classed('mb-5', true).classed('server', true)
  .call(table.table, serverFields, [], null, 300);

  // Dialogs
  const dialogs = d3.select('#dialogs');
  dialogs.append('div')
      .call(renameDialog.body, null);
  dialogs.append('div')
      .call(modal.confirmDialog, 'reset-dialog',
            'Are you sure you want to delete all local tables and reset the datastore ?')
      .on('submit', () => idb.reset().then(updateStoredData));
  dialogs.append('div')
      .call(modal.confirmDialog, 'delete-dialog', null);


  // Server bound tasks
  fetcher.serverStatus().then(response => {
    refreshButton.on('click', () => {
      idb.getAllItems()
        .then(items => _.flatten(items.map(e => e.dataset)))
        .then(colls => {
          const ongoings = colls.map(e => new Collection(e))
            .filter(e => e.ongoing());
          return Promise.all(ongoings.map(o => o.pull()));
        })
        .then(updateStoredData);
      updateServerStatus(response.server);
    });
    updateServerStatus(response.server);
    const chemrsrc = response.schema.resources.filter(e => e.domain === 'chemical');
    dialogs.append('div')
        .call(searchDialog.body, chemrsrc, response.schema.compoundIDPlaceholder)
        .on('submit', function () {
          searchDialog.execute(d3.select(this), chemrsrc)
            .then(idb.newDatagrid)
            .then(r => {
              window.open(
                `datagrid.html?store=${r.storeID}&view=${r.viewID}`, '_blank');
            });
        });
    dialogs.append('div')
        .call(structDialog.body, chemrsrc, response.server.rdkit)
        .on('submit', function () {
          structDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              window.open(
                `datagrid.html?store=${r.storeID}&view=${r.viewID}`, '_blank');
            });
        });
    dialogs.append('div')
        .call(filterDialog.body, chemrsrc)
        .on('submit', function () {
          filterDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              window.open(
                `datagrid.html?store=${r.storeID}&view=${r.viewID}`, '_blank');
            });
        });
    dialogs.append('div')
        .call(sdfDialog.body, chemrsrc)
        .on('submit', function () {
          sdfDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              window.open(
                `datagrid.html?store=${r.storeID}&view=${r.viewID}`, '_blank');
            });
        });
  })
  .catch(err => {
    console.info('Server did not respond');
    console.error(err);
    // disable on-line commands
    menubar.selectAll('.online-command')
      .attr('data-target', null)
      .classed('disabled', true);
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
  app();
}


export default {
  run
};
