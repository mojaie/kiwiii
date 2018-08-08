
/** @module dashboardApp */

import _ from 'lodash';
import d3 from 'd3';

import {default as client} from './common/client.js';
import Collection from './common/collection.js';
import {default as fetcher} from './common/fetcher.js';
import {default as hfile} from './common/file.js';
import {default as idb} from './common/idb.js';
import {default as specs} from './common/specs.js';

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
    'datagrid': 'table-darkorange', 'network': 'network-turquoise',
    'tile': 'tiles-yellowgreen'
  };
  const icon = record.viewID ? iconv[record.viewType] : 'file-seagreen';
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
      .attr('src', icon ? `${button.iconBaseURL}${icon}.svg` : null)
      .classed('mr-1', true)
      .style('width', '2rem')
      .style('height', '2rem');
  node.append('span')
      .classed('mr-1', true)
      .text(record.name);
  const colors = {
    done: 'green', running: 'darkorange',
    ready: 'cornflowerblue', queued: 'cornflowerblue',
    interrupted: 'salmon', aborted: 'salmon', failure: 'salmon',
    rows: 'gray', items: 'gray',
    nodes: 'gray', edges: 'gray'
  };
  const icons = {
    done: 'check-green', running: 'running-darkorange',
    ready: 'clock-cornflowerblue', queued: 'clock-cornflowerblue',
    interrupted: 'caution-salmon', aborted: 'caution-salmon',
    failure: 'caution-salmon',
    rows: 'table-gray', items: 'tiles-gray',
    nodes: 'nodes-gray', edges: 'edges-gray'
  };
    if (record.viewID) {
    record.stats.forEach(stat => {
      selection.append('img')
          .attr('src', `${button.iconBaseURL}${icons[stat[0]]}.svg`)
          .style('width', '1rem')
          .style('height', '1rem');
      selection.append('span')
          .classed('pr-1', true)
          .style('font-size', '0.8rem')
          .style('color', colors[stat[0]])
          .text(stat[1]);
    });
  } else {
    selection.append('span')
        .classed('pr-1', true)
        .style('font-size', '0.7rem')
        .style('color', '#999999')
        .text(record.sessionStarted);
  }
  const action = selection.append('span')
      .classed('p-1', true)
      .style('border', '1px solid #999999')
      .style('border-radius', '5px');
  const actionIcon = (sel, icon) => sel.append('img')
      .attr('src', `${button.iconBaseURL}${icon}.svg`)
      .classed('mx-1', true)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  if (!record.viewID) {
    action.append('a').call(actionIcon, 'menu-export')
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
      .call(actionIcon, 'menu-edittext')
      .on('click', () =>{
        d3.select('#rename-dialog')
          .call(renameDialog.updateBody, record.name)
          .on('submit', function () {
            if (record.viewID) {
              idb.updateView(record.parent, record.viewID, view => {
                view.name = renameDialog.value(d3.select(this));
              }).then(updateApp);
            } else {
              idb.updateItem(record.storeID, item => {
                item.name = renameDialog.value(d3.select(this));
              }).then(updateApp);
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
                  .then(updateApp);
              } else {
                idb.deleteItem(record.storeID || record.parent)
                  .then(updateApp);
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
            '.apc,.apr,.ndc,.ndr,.gfc,.gfr,.json,.gz', 'menu-import')
      .on('change', function () {
        const file = button.dropdownMenuFileValue(d3.select(this));
        hfile.loadJSON(file)
          .then(idb.importItem)
          .then(updateApp);
      });

  // Refresh
  menubar.append('a')
      .classed('refresh', true)
      .classed('online-command', true)
      .call(button.menuButtonLink,
            'Refresh all', 'outline-secondary', 'refresh-gray')
      .on('click', () => updateApp());
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

  // Server calc jobs
  // TODO: only for admin
  const calcFields = [
    {key: 'name', name: 'Name', format: 'text'},
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
      .classed('searchd', true)
      .call(searchDialog.body);
  dialogs.append('div')
      .classed('structd', true)
      .call(structDialog.body);
  dialogs.append('div')
      .classed('filterd', true)
      .call(filterDialog.body);
  dialogs.append('div')
      .classed('sdfd', true)
      .call(sdfDialog.body);
  dialogs.append('div')
      .classed('renamed', true)
      .call(renameDialog.body);
  dialogs.append('div')
      .call(modal.confirmDialog, 'reset-dialog')
      .call(modal.updateConfirmDialog,
            'Are you sure you want to delete all local tables and reset the datastore ?')
      .on('submit', () => idb.reset().then(updateApp));
  dialogs.append('div')
      .call(modal.confirmDialog, 'delete-dialog');

  // Update
  updateApp();
}

function updateApp() {
  const dialogs = d3.select('#dialogs');
  // Server bound tasks
  fetcher.serverStatus().then(response => {
    // Update server status table
    d3.select('#contents').select('.calc')
      .call(table.updateRecords, response.server.calc.records);
    const serverRecords = Object.entries(response.server)
      .filter(e => e[0] !== 'calc')
      .map(e => ({key: e[0], value: e[1]}));
    d3.select('#contents').select('.server')
      .call(table.updateRecords, serverRecords);

    // Dialogs
    const chemrsrc = response.schema.resources.filter(e => e.domain === 'chemical');
    dialogs.select('.searchd')
        .call(searchDialog.updateBody, chemrsrc, response.schema.compoundIDPlaceholder)
        .on('submit', function () {
          searchDialog.execute(d3.select(this), chemrsrc)
            .then(idb.newDatagrid)
            .then(r => {
              window.open(
                `datagrid.html?store=${r.storeID}&view=${r.viewID}`, '_blank');
            });
        });
    dialogs.select('.structd')
        .call(structDialog.updateBody, chemrsrc, response.server.rdkit)
        .on('submit', function () {
          structDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              window.open(
                `datagrid.html?store=${r.storeID}&view=${r.viewID}`, '_blank');
            });
        });
    dialogs.select('.filterd')
        .call(filterDialog.updateBody, chemrsrc)
        .on('submit', function () {
          filterDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              window.open(
                `datagrid.html?store=${r.storeID}&view=${r.viewID}`, '_blank');
            });
        });
    dialogs.select('.sdfd')
        .call(sdfDialog.updateBody, chemrsrc)
        .on('submit', function () {
          sdfDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              window.open(
                `datagrid.html?store=${r.storeID}&view=${r.viewID}`, '_blank');
            });
        });

    // Fetch all ongoing tasks
    return idb.getAllItems()
      .then(items => _.flatten(items.map(e => e.dataset)))
      .then(colls => {
        const ongoings = colls.map(e => new Collection(e))
          .filter(e => e.ongoing());
        return Promise.all(ongoings.map(o => o.pull()));
      });
  })
  .catch(err => {
    console.info('Server did not respond');
    console.error(err);
    // disable on-line commands
    d3.select('#menubar').selectAll('.online-command')
      .attr('data-target', null)
      .classed('disabled', true);
    d3.select('#contents').select('.calc').text('Off-line');
    d3.select('#contents').select('.server').text('Off-line');
  })
  .finally(() => {
    // update stored package tree
    return idb.getAllItems().then(items => {
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
          view.stats = ['nodes', 'edges', 'rows', 'items']
            .filter(e => view.hasOwnProperty(e))
            .map(e => [e,
              d3.format(".3~s")(
                pkg.dataset.find(d => d.collectionID === view[e])
                  .contents.reduce((a, b) => a + b.records.length, 0))]);
          const coll = new Collection(pkg.dataset
            .find(d => d.collectionID === view[
              ['edges', 'rows', 'items'].filter(e => view.hasOwnProperty(e))[0]
            ]));
          const statusText = coll.status() === 'done' ? '' : coll.status();
          const progText = coll.ongoing() ? `${coll.progress()}%` : '';
          view.stats.push([coll.status(), `${statusText}${progText}`]);
          treeNodes.push(view);
        });
      });
      d3.select('#contents').select('.stored')
        .call(tree.treeItems, treeNodes, d => d.storeID, nodeFactory);
    });
  });
}


function run() {
  const err = client.compatibility();
  if (err) {
    d3.select('body')
      .style('color', '#ff0000')
      .text(err);
    return;
  }
  // TODO: show browser status
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";  // TODO
  const offLine = 'onLine' in navigator && !navigator.onLine;  // TODO
  client.registerServiceWorker();
  app();
}


export default {
  run
};
