
/** @module dashboardApp */

import _ from 'lodash';
import d3 from 'd3';

import Collection from './common/collection.js';
import {default as fetcher} from './common/fetcher.js';
import {default as hfile} from './common/file.js';
import {default as idb} from './common/idb.js';
import {default as legacy} from './common/legacySchema.js';
import {default as misc} from './common/misc.js';
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


function newData(response) {
  const now = new Date();
  const collectionID = response.workflowID.slice(0, 8);
  const viewID = misc.uuidv4().slice(0, 8);
  const data = {
    $schema: "https://mojaie.github.io/kiwiii/specs/package_v1.0.json",
    name: viewID,
    views: [
      {
        $schema: "https://mojaie.github.io/kiwiii/specs/datagrid_v1.0.json",
        viewID: viewID,
        name: viewID,
        viewType: "datagrid",
        rows: collectionID,
        checkpoints: [
          {type: 'creation', date: now.toString()}
        ]
      }
    ],
    dataset: [
      {
        $schema: "https://mojaie.github.io/kiwiii/specs/collection_v1.0.json",
        collectionID: collectionID,
        contents: [response]
      }
    ],
    sessionStarted: now.toString()
  };
  return idb.putItem(data).then(() => {
    window.open(`datagrid.html?view=${viewID}`, '_blank');
  });
}


function nodeFactory(selection, record) {
  if (record.viewID) {
    // View
    const iconv = {'datagrid': 'table-gray', 'network': 'network', 'tile': 'painting'};
    const icon = iconv[record.viewType];
    const link = selection.append('a')
        .attr('href', `${record.viewType}.html?view=${record.viewID}`)
        .attr('target', '_blank');
    link.append('img')
        .attr('src', icon ? `./assets/icon/${icon}.svg` : null)
        .style('width', '2rem')
        .style('height', '2rem');
    link.append('span')
      .text(record.name);
  } else {
    // Package
    selection.append('img')
        .attr('src', './assets/icon/export.svg')
        .classed('mr-1', true)
        .style('width', '2rem')
        .style('height', '2rem')
    selection.append('span')
      .text(record.name);
  }
  const action = selection.append('span')
    .classed('ml-2', true)
    .classed('p-1', true)
    .style('border', '1px solid #999999')
    .style('border-radius', '5px');
  if (!record.viewID) {
    const colls = record.dataset.map(e => new Collection(e));
    const ongoing = colls.some(e => e.ongoing());
    action.append('a')
      .append('img')
        .attr('src', './assets/icon/export.svg')
        .classed('mr-1', true)
        .style('width', '1.25rem')
        .style('height', '1.25rem')
        .on('click', () => {
          const data = JSON.parse(JSON.stringify(record));
          delete data.storeID;
          delete data.sessionStarted;
          // reindex
          data.dataset.forEach(coll => {
            const newCollID = misc.uuidv4().slice(0, 8);
            data.views.forEach(view => {
              ['rows', 'nodes', 'edges'].filter(e => view.hasOwnProperty(e))
                .forEach(type => {
                  if (view[type] === coll.collectionID) {
                    view[type] = newCollID;
                  }
                });
            });
            coll.collectionID = newCollID;
          });
          hfile.downloadJSON(data, data.name);
        });
    action.append('a')
      .append('img')
        .attr('src', './assets/icon/edittext.svg')
        .classed('mr-1', true)
        .style('width', '1.25rem')
        .style('height', '1.25rem')
        .on('click', () =>{
          d3.select('#rename-dialog')
            .call(renameDialog.updateBody, record.name)
            .on('submit', function () {
              idb.updateItem(record.storeID, pkg => {
                pkg.name = renameDialog.value(d3.select(this));
              })
              .then(updateStoredData);
            });
        });
    action.append('a')
      .append('img')
        .attr('src', './assets/icon/delete-gray.svg')
        .classed('mr-1', true)
        .style('width', '1.25rem')
        .style('height', '1.25rem')
        .property('disabled', ongoing)
        .on('click', () =>{
          d3.select('#delete-dialog')
            .select('.message')
              .text(`Are you sure you want to delete ${record.name} ?`);
          d3.select('#delete-dialog')
            .select('.ok')
            .on('click', () => idb.deleteItem(record.storeID).then(updateStoredData));
        });
  } else {
    action.append('a')
      .append('img')
        .attr('src', './assets/icon/edittext.svg')
        .classed('mr-1', true)
        .style('width', '1.25rem')
        .style('height', '1.25rem')
        .on('click', () =>{
          d3.select('#rename-dialog')
            .call(renameDialog.updateBody, record.name)
            .on('submit', function () {
              idb.updateView(record.viewID, view => {
                view.name = renameDialog.value(d3.select(this));
              })
              .then(updateStoredData);
            });
        });
    idb.getCollection(record.rows || record.items || record.edges)
      .then(data => {
        const coll = new Collection(data);
        const ongoing = coll.ongoing();
        const link = action.append('a')
          .attr('href', '#')
          .attr('role', 'button')
          .attr('data-toggle', 'modal')
          .attr('data-target', '#delete-dialog')
          .property('disabled', ongoing)
          .append('img')
            .attr('src', './assets/icon/delete-gray.svg')
            .classed('mr-1', true)
            .style('width', '1.25rem')
            .style('height', '1.25rem');
        link.on('click', () =>{
          d3.select('#delete-dialog')
            .select('.message')
              .text(`Are you sure you want to delete ${record.name} ?`);
          d3.select('#delete-dialog')
            .select('.ok')
            .on('click', () => idb.deleteView(record.viewID).then(updateStoredData));
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
        treeNodes.push(pkg);
        pkg.views.forEach(view => {
          view.parent = pkg.storeID;
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
          .then(data => {
            if (!data.hasOwnProperty('views')) {
              data = legacy.convertPackage(data);
            }
            const now = new Date();
            data.sessionStarted = now.toString();
            return data;
          })
          .then(idb.putItem)
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
    .select('.ok')
      .on('click', () => idb.reset().then(updateStoredData));
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
            .then(newData);
        });
    dialogs.append('div')
        .call(structDialog.body, chemrsrc, response.server.rdkit)
        .on('submit', function () {
          structDialog.execute(d3.select(this))
            .then(newData);
        });
    dialogs.append('div')
        .call(filterDialog.body, chemrsrc)
        .on('submit', function () {
          filterDialog.execute(d3.select(this))
            .then(newData);
        });
    dialogs.append('div')
        .call(sdfDialog.body, chemrsrc)
        .on('submit', function () {
          sdfDialog.execute(d3.select(this))
            .then(newData);
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
