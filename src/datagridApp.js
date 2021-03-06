
/** @module datagridApp */

import d3 from 'd3';

import {default as client} from './common/client.js';
import {default as fetcher} from './common/fetcher.js';
import {default as hfile} from './common/file.js';
import {default as idb} from './common/idb.js';
import {default as misc} from './common/misc.js';

import {default as badge} from './component/badge.js';
import {default as button} from './component/button.js';
import {default as modal} from './component/modal.js';

import {default as fieldConfigDialog} from './dialog/fieldConfig.js';
import {default as fieldFetchDialog} from './dialog/fieldFetch.js';
import {default as fieldFileDialog} from './dialog/fieldFile.js';
import {default as fieldInputDialog} from './dialog/fieldInput.js';
import {default as networkgenDialog} from './dialog/networkgen.js';
import {default as renameDialog} from './dialog/rename.js';

import DatagridState from './datagrid/state.js';
import {default as rowf} from './datagrid/rowFilter.js';
import {default as sort} from './datagrid/sort.js';
import {default as dg} from './datagrid/component.js';


function app(view, coll) {
  const menubar = d3.select('#menubar')
      .classed('my-1', true);
  menubar.selectAll('div,span,a').remove();  // Clean up
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up

  const state = new DatagridState(view, coll);

  // Datagrid view control
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Menu', 'primary', 'table-white')
      .select('.dropdown-menu');
  menu.append('a').call(fieldConfigDialog.menuLink);
  menu.append('a')
      .classed('online-command', true)
      .call(fieldFetchDialog.menuLink);
  menu.append('a').call(fieldFileDialog.menuLink);
  menu.append('a').call(fieldInputDialog.menuLink);
  menu.append('a')
      .call(button.dropdownMenuItem, 'Generate tile view', 'menu-tiles')
      .on('click', function () {
        d3.select('#menubar .loading-circle').style('display', 'inline-block');
        const viewID = misc.uuidv4().slice(0, 8);
        return idb.appendView(state.instance, state.viewID, {
          $schema: "https://mojaie.github.io/kiwiii/specs/tile_v1.0.json",
          viewID: viewID,
          name: `${state.name}_tiles`,
          viewType: 'tile',
          items: state.rows.collectionID,
          rowCount: 5,
          columnCount: 5,
          tileContent: {field: 'structure', visible: true}
        }).then(() => {
          d3.select('#menubar .loading-circle').style('display', 'none');
          window.open(
            `tile.html?instance=${state.instance}&view=${viewID}`, '_blank');
        });
      });
  menu.append('a')
      .classed('online-command', true)
      .call(networkgenDialog.menuLink);
  menu.append('a').call(renameDialog.menuLink);
  menu.append('a')
      .call(button.dropdownMenuItem, 'Save', 'menu-save')
      .on('click', function () {
        return state.save()
          .then(() => menubar.select('.notify-saved').call(badge.notify));
      });
  menu.append('a')
      .classed('online-command', true)
      .call(button.dropdownMenuItem, 'Download SDFile', 'menu-exportsdf')
      .on('click', () => {
        d3.select('#menubar .loading-circle').style('display', 'inline-block');
        const coll = state.rows.export();
        const formData = new FormData();
        formData.append('contents', new Blob([JSON.stringify(coll)]));
        return fetcher.post('sdfout', formData)
          .then(fetcher.text)
          .then(text => {
            d3.select('#menubar .loading-circle').style('display', 'none');
            hfile.downloadDataFile(text, `${state.name}.sdf`);
          });
      });
  menu.append('a')
      .classed('online-command', true)
      .call(button.dropdownMenuItem, 'Download Excel', 'menu-exportexcel')
      .on('click', () => {
        d3.select('#menubar .loading-circle').style('display', 'inline-block');
        const coll = state.rows.export();
        const formData = new FormData();
        formData.append('contents', new Blob([JSON.stringify(coll)]));
        return fetcher.post('xlsx', formData)
          .then(fetcher.blob)
          .then(blob => {
            d3.select('#menubar .loading-circle').style('display', 'none');
            hfile.downloadDataFile(blob, `${state.name}.xlsx`);
          });
      });


  // Dashboard link
  menubar.append('a')
      .call(button.menuButtonLink, 'Dashboard',
            'outline-secondary', 'status-gray')
      .attr('href', 'dashboard.html')
      .attr('target', '_blank');

  // Fetch control
  menubar.append('a')
      .classed('refresh', true)
      .call(button.menuButtonLink,
            'Refresh', 'outline-secondary', 'refresh-gray')
      .on('click', function () {
        d3.select('#menubar .loading-circle').style('display', 'inline-block');
        return state.rows.pull().then(() => {
          state.updateContentsNotifier();
          return updateApp(state);
        });
      });
  menubar.append('a')
      .classed('abort', true)
      .call(button.menuButtonLink,
            'Abort server job', 'warning', 'delete-gray')
      .attr('data-toggle', 'modal')
      .attr('data-target', '#abort-dialog');

  // Status
  menubar.append('span')
      .classed('loading-circle', true)
      .call(badge.loadingCircle);
  menubar.append('span')
      .classed('notify-saved', true)
      .call(badge.alert)
      .call(badge.updateAlert, 'State saved', 'success', 'check-green')
      .style('display', 'none');
  menubar.append('span')
      .classed('name', true);
  menubar.append('span')
      .classed('rows-count', true)
      .call(badge.badge);
  menubar.append('span')
      .classed('fetch-status', true)
      .call(badge.badge);
  menubar.append('span')
      .classed('exec-time', true)
      .call(badge.badge);

  // Dialogs
  dialogs.append('div')
      .classed('fieldconfd', true)
      .call(fieldConfigDialog.body);
  dialogs.append('div')
      .classed('fieldfetchd', true)
      .call(fieldFetchDialog.body);
  dialogs.append('div')
      .classed('fieldfiled', true)
      .call(fieldFileDialog.body);
  dialogs.append('div')
      .classed('fieldinputd', true)
      .call(fieldInputDialog.body);
  dialogs.append('div')
      .classed('netgend', true)
      .call(networkgenDialog.body);
  dialogs.append('div')
      .classed('renamed', true)
      .call(renameDialog.body);
  dialogs.append('div')
      .classed('abortd', true)
      .call(modal.confirmDialog, 'abort-dialog');

  // Contents
  d3.select('#dg-search')
      .call(rowf.setFilter, state);
  d3.select('#datagrid')
      .call(sort.setSort, state)
      .call(dg.datagrid, state);

  // Resize window
  window.onresize = () => {
    d3.select('#datagrid').call(dg.resize, state)
      .call(dg.updateViewport, state, state.viewportTop);
  };

  state.updateContentsNotifier();
  return updateApp(state);
}


function updateApp(state) {
  // Title
  d3.select('title').text(state.name);

  // hide fetch commands
  d3.select('#menubar').selectAll('.refresh, .abort')
    .style('display', state.rows.ongoing() ? null : 'none');

  // Status
  d3.select('#menubar .name').text(state.name);

  const onLoading = d3.select('#menubar .loading-circle');
  const colors = {
    done: 'green', running: 'darkorange',
    ready: 'cornflowerblue', queued: 'cornflowerblue',
    interrupted: 'salmon', aborted: 'salmon', failure: 'salmon'
  };
  const icons = {
    done: 'check-green', running: 'running-darkorange',
    ready: 'clock-cornflowerblue', queued: 'clock-cornflowerblue',
    interrupted: 'caution-salmon', aborted: 'caution-salmon',
    failure: 'caution-salmon'
  };
  const fstatus = state.rows.status();
  const fstext = fstatus === 'done' ?
    fstatus : `${fstatus} ${state.rows.progress()}%`;
  d3.select('#menubar .rows-count')
      .call(badge.updateBadge, `${state.rows.size()} rows`,
            'light', 'table-gray')
    .select('.text')
      .style('color', 'gray');
  d3.select('#menubar .fetch-status')
      .call(badge.updateBadge, fstext, 'light', icons[fstatus])
    .select('.text')
      .style('color', colors[fstatus]);
  d3.select('#menubar .exec-time')
      .call(badge.updateBadge, `${state.rows.execTime()} seconds`,
            'light', 'clock-cornflowerblue')
    .select('.text')
      .style('color', 'cornflowerblue');


  // Dialogs
  const dialogs = d3.select('#dialogs');

  // Field config dialog
  dialogs.select('.fieldconfd')
      .call(fieldConfigDialog.updateBody, state.rows.fields)
      .on('submit', function () {
        const values = fieldConfigDialog.value(d3.select(this));
        state.updateFields(values);
        state.updateContentsNotifier();
        return updateApp(state);
      });

  // Import fields dialog
  dialogs.select('.fieldfiled')
      .call(fieldFileDialog.updateBody, state.visibleFields)
      .on('submit', function () {
        return fieldFileDialog.readFile(d3.select(this))
          .then(data => {
            state.joinFields(data);
            state.updateContentsNotifier();
            return updateApp(state);
          });
      });

  // Input field dialog
  dialogs.select('.fieldinputd')
      .call(fieldInputDialog.updateBody, state.rows.fields)
      .on('submit', function () {
        const values = fieldInputDialog.value(d3.select(this));
        state.rows.addField(values.field);
        state.rows.apply(rcd => {
          rcd[values.field.key] = values.converter(rcd);
        });
        state.updateContentsNotifier();
        return updateApp(state);
      });
  // Rename dialog
  dialogs.select('.renamed')
      .call(renameDialog.updateBody, state.name)
      .on('submit', function () {
        state.name = renameDialog.value(d3.select(this));
        return updateApp(state);
  });


  // Server bound tasks
  return fetcher.serverStatus().then(response => {
    // Fetch db fields dialog
    dialogs.select('.fieldfetchd')
        .call(fieldFetchDialog.updateBody, response.schema, state.rows.fields)
        .on('submit', function () {
          const compounds = state.rows.records().map(e => e.compound_id);
          return fieldFetchDialog
            .execute(d3.select(this), compounds, response.schema)
            .then(res => {
              state.joinFields(res);
              state.updateContentsNotifier();
              return updateApp(state);
            });
        });

    // Network generation dialog
    dialogs.select('.netgend')
        .call(networkgenDialog.updateBody, response.server.rdkit)
        .on('submit', function () {
          return networkgenDialog
            .execute(d3.select(this), state.rows.records())
            .then(data => {
              return idb.newNetwork(
                state.instance, state.rows.collectionID, state.name, data
              );
            })
            .then(viewID => {
              onLoading.style('display', 'none');
              window.open(
                `network.html?instance=${state.instance}&view=${viewID}`, '_blank');
            });
        });

    // Abort dialog
    dialogs.select('.abortd')
        .call(modal.updateConfirmDialog,
              'Are you sure you want to abort this calculation job?')
        .on('submit', function () {
          return state.rows.abort().then(() => {
            state.updateContentsNotifier();
            return updateApp(state);
          });
        });
  })
  .catch(() => {
    // disable on-line commands
    d3.select('#menubar').selectAll('.online-command')
      .attr('data-target', null)
      .classed('disabled', true)
      .on('click', null);
  })
  .finally(() => {
    onLoading.style('display', 'none');
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
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";  // TODO
  const offLine = 'onLine' in navigator && !navigator.onLine;  // TODO
  client.registerServiceWorker();
  const instance = client.URLQuery().instance || null;
  const viewID = client.URLQuery().view || null;
  return idb.getView(instance, viewID)
    .then(view => {
      if (!view) throw('ERROR: invalid URL');
      view.instance = instance;
      return idb.getCollection(instance, view.rows)
        .then(coll => {
          coll.instance = instance;
          app(view, coll);
        });
    })
    .catch(err => {
      console.error(err);
      d3.select('#datagrid')
        .style('color', 'red')
        .text(err);
    });
}


export default {
  run
};
