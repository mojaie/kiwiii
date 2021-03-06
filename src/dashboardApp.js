
/** @module dashboardApp */

import d3 from 'd3';

import {default as client} from './common/client.js';
import Collection from './common/collection.js';
import {default as fetcher} from './common/fetcher.js';
import {default as hfile} from './common/file.js';
import {default as idb} from './common/idb.js';
import {default as specs} from './common/specs.js';

import {default as badge} from './component/badge.js';
import {default as button} from './component/button.js';
import {default as modal} from './component/modal.js';
import {default as tree} from './component/tree.js';

import {default as searchDialog} from './dialog/search.js';
import {default as structDialog} from './dialog/struct.js';
import {default as filterDialog} from './dialog/filter.js';
import {default as screenerDialog} from './dialog/screener.js';
import {default as sdfDialog} from './dialog/sdf.js';
import {default as renameDialog} from './dialog/rename.js';

import {default as table} from './datagrid/table.js';


function viewNode(selection, record) {
  const instance = record.instance || record.parent;
  selection.append('span').classed('arrow', true);
  const node = record.viewID
    ? selection.append('a')
      .attr(
        'href',
        `${record.viewType}.html?instance=${instance}&view=${record.viewID}`
      )
      .attr('target', '_blank')
    : selection;
  node.append('img')
      .classed('icon', true)
      .classed('mr-1', true)
      .style('width', '2rem')
      .style('height', '2rem');
  node.append('span')
      .classed('title', true)
      .classed('mr-1', true);
  selection.append('span')
      .classed('status', true)
      .classed('mr-1', true);
  selection.append('span')
      .classed('action', true)
      .classed('p-1', true)
      .style('border', '1px solid #999999')
      .style('border-radius', '5px');
}


function updateViewNode(selection, record) {
  const iconv = {
    'datagrid': 'table-darkorange', 'network': 'network-turquoise',
    'tile': 'tiles-yellowgreen'
  };
  const icon = record.viewID ? iconv[record.viewType] : 'file-seagreen';
  selection.select('.icon')
      .attr('src', icon ? `${button.iconBaseURL}${icon}.svg` : null);
  selection.select('.title')
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

  // View status
  const status = selection.select('.status');
  status.selectAll('*').remove();
  if (record.viewID) {
    record.stats.forEach(stat => {
      status.append('img')
          .attr('src', `${button.iconBaseURL}${icons[stat[0]]}.svg`)
          .style('width', '1rem')
          .style('height', '1rem');
      status.append('span')
          .style('font-size', '0.8rem')
          .style('color', colors[stat[0]])
          .text(stat[1]);
    });
  } else {
    status.append('span')
        .style('font-size', '0.7rem')
        .style('color', '#999999')
        .text(record.sessionStarted);
  }

  // Actions
  const action = selection.select('.action');
  action.selectAll('*').remove();
  const actionIcon = (sel, icon) => sel.append('img')
      .attr('src', `${button.iconBaseURL}${icon}.svg`)
      .classed('mx-1', true)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  if (!record.viewID) {
    action.append('a').call(actionIcon, 'menu-export')
        .on('click', () => {
          const data = JSON.parse(JSON.stringify(record));
          delete data.instance;
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
            d3.select('#menubar .loading-circle')
                .style('display', 'inline-block');
            if (record.viewID) {
              idb.updateView(record.parent, record.viewID, view => {
                view.name = renameDialog.value(d3.select(this));
              }).then(updateApp);
            } else {
              idb.updateItem(record.id, item => {
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
              d3.select('#menubar .loading-circle')
                  .style('display', 'inline-block');
              if (record.viewID && !record.alone) {
                idb.deleteView(record.parent, record.viewID)
                  .then(updateApp);
              } else {
                idb.deleteItem(record.id || record.parent)
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
  const menubar = d3.select('#menubar')
      .classed('my-1', true);
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
      .call(screenerDialog.menuLink);
  startMenu.append('a').classed('online-command', true)
      .call(sdfDialog.menuLink);
  startMenu.append('a')
      .call(button.dropdownMenuFile, 'Open file',
            '.apc,.apr,.ndc,.ndr,.gfc,.gfr,.json,.gz', 'menu-import')
      .on('change', function () {
        d3.select('#menubar .loading-circle').style('display', 'inline-block');
        const file = button.dropdownMenuFileValue(d3.select(this));
        return hfile.loadJSON(file)
          .then(idb.importItem)
          .then(updateApp);
      });
  // Refresh
  menubar.append('a')
      .classed('refresh', true)
      .classed('online-command', true)
      .call(button.menuButtonLink,
            'Refresh all', 'outline-secondary', 'refresh-gray')
      .on('click', () => {
        d3.select('#menubar .loading-circle').style('display', 'inline-block');
        return updateApp();
      });
  // Delete all
  menubar.append('a')
      .classed('reset', true)
      .call(button.menuModalLink, 'reset-dialog',
            'Reset local datastore', 'warning', 'delete-gray');
  // Status
  menubar.append('span')
      .classed('loading-circle', true)
      .call(badge.loadingCircle);

  // Contents
  const contents = d3.select('#contents')
      .style('padding-left', '10%')
      .style('padding-right', '10%');

  // Stored analysis packages
  contents.append('h5').classed('mt-5', true).text('Packages on local storage');
  contents.append('div').classed('mb-5', true)
      .classed('stored', true)
      .style('border', '1px solid #333333');

  // Server calc jobs
  // TODO: only for admin
  const calcFields = [
    {key: 'workflowID', name: 'WorkflowID', format: 'text'},
    {key: 'name', name: 'Name', format: 'text'},
    {key: 'size', name: 'File size', format: 'd3_format', d3_format: '.3s'},
    {key: 'status', name: 'Status', format: 'text'},
    {key: 'created', name: 'Created', format: 'date', height: 40}
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
      .classed('screenerd', true)
      .call(screenerDialog.body);
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
      .on('submit', () => {
        d3.select('#menubar .loading-circle').style('display', 'inline-block');
        return idb.clearAll().then(updateApp);
      });
  dialogs.append('div')
      .call(modal.confirmDialog, 'delete-dialog');

  // Update
  return updateApp();
}


function updateApp() {
  const onLoading = d3.select('#menubar .loading-circle');
  const dialogs = d3.select('#dialogs');

  // Server bound tasks
  return fetcher.serverStatus().then(response => {
    // Update server status table
    d3.select('#contents').select('.calc')
      .call(table.updateRecords, response.server.calc.records);
    const serverRecords = Object.entries(response.server)
      .filter(e => e[0] !== 'calc')
      .map(e => {
        const v = e[0] === 'externalModules'
          ? JSON.stringify(e[1].map(e => e.name)) : e[1];
        return {key: e[0], value: v};
      });
    d3.select('#contents').select('.server')
      .call(table.updateRecords, serverRecords);

    // Dialogs
    const chemrsrc = response.schema.resources.filter(e => e.domain === 'chemical');
    dialogs.select('.searchd')
        .call(searchDialog.updateBody, chemrsrc)
        .on('submit', function () {
          return searchDialog.execute(d3.select(this), chemrsrc)
            .then(idb.newDatagrid)
            .then(r => {
              onLoading.style('display', 'none');
              window.open(
                `datagrid.html?instance=${r.instance}&view=${r.viewID}`, '_blank');
            });
        });
    dialogs.select('.structd')
        .call(structDialog.updateBody, chemrsrc, response.server.rdkit)
        .on('submit', function () {
          return structDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              onLoading.style('display', 'none');
              window.open(
                `datagrid.html?instance=${r.instance}&view=${r.viewID}`, '_blank');
            });
        });
    dialogs.select('.filterd')
        .call(filterDialog.updateBody, chemrsrc)
        .on('submit', function () {
          return filterDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              onLoading.style('display', 'none');
              window.open(
                `datagrid.html?instance=${r.instance}&view=${r.viewID}`, '_blank');
            });
        });

    // screener extention
    const mod = response.server.externalModules
      .find(e => e.module === 'contrib.screenerapi');
    if (mod) {
      dialogs.select('.screenerd')
          .call(screenerDialog.updateBody, mod.base_url)
          .on('submit', function () {
            screenerDialog.execute(d3.select(this))
              .then(() => {
                onLoading.style('display', 'none');
                return updateApp();
              });
          });
    }

    dialogs.select('.sdfd')
        .call(sdfDialog.updateBody, chemrsrc)
        .on('submit', function () {
          return sdfDialog.execute(d3.select(this))
            .then(idb.newDatagrid)
            .then(r => {
              onLoading.style('display', 'none');
              window.open(
                `datagrid.html?instance=${r.instance}&view=${r.viewID}`, '_blank');
            });
        });

    // Form auto-fill for debug (Ctrl+F)
    client.registerCtrlCommand('f', () => {
      const activeID = dialogs.select('.show').attr('id');
      const modals = {
        'search-dialog': searchDialog,
        'struct-dialog': structDialog,
        'filter-dialog': filterDialog
      };
      dialogs.select(`#${activeID}`).call(modals[activeID].fill);
    });

    // Fetch all ongoing tasks
    return idb.getAllCollections()
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
      const treeNodes = [{id: 'root'}];
      const ogs = [];
      items.forEach(pkg => {
        pkg.parent = 'root';
        pkg.ongoing = specs.isRunning(pkg);
        ogs.push(pkg.ongoing);
        treeNodes.push(pkg);
        pkg.views.forEach(view => {
          view.parent = pkg.id;
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
      d3.select('.reset')
          .classed('disabled', ogs.some(e => e));
      d3.select('.stored')
          .call(tree.tree()
            .bodyHeight(300)
            .nodeEnterFactory(viewNode)
            .nodeMergeFactory(updateViewNode), treeNodes
          );
      onLoading.style('display', 'none');
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
  console.info(`Kiwiii version ${kwVersion}`)
  client.registerServiceWorker();
  app();
}


export default {
  run
};
