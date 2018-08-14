
/** @module tileApp */

import d3 from 'd3';

import {default as client} from './common/client.js';
import {default as idb} from './common/idb.js';

import {default as badge} from './component/badge.js';
import {default as button} from './component/button.js';
import {default as transform} from './component/transform.js';

import {default as renameDialog} from './dialog/rename.js';

import TileState from './tile/state.js';
import {default as component} from './tile/component.js';
import {default as interaction} from './tile/interaction.js';
import {default as control} from './tile/controlBox.js';


function app(view, coll) {
  const menubar = d3.select('#menubar')
      .classed('my-1', true);
  menubar.selectAll('div,span,a').remove();  // Clean up
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up

  const state = new TileState(view, coll);

  // Tile view control
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Menu', 'primary', 'tiles-white')
      .select('.dropdown-menu');
  menu.append('a').call(renameDialog.menuLink);
  menu.append('a')
      .call(button.dropdownMenuItem, 'Save', 'menu-save')
      .on('click', function () {
        return state.save()
          .then(() => menubar.select('.notify-saved').call(badge.notify));
      });

  // Dashboard link
  menubar.append('a')
      .call(button.menuButtonLink, 'Dashboard',
            'outline-secondary', 'status-gray')
      .attr('href', 'dashboard.html')
      .attr('target', '_blank');

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
      .classed('items-count', true)
      .call(badge.badge);
  menubar.append('span')
      .classed('fetch-status', true)
      .call(badge.badge);
  menubar.append('span')
      .classed('exec-time', true)
      .call(badge.badge);

  // Dialogs
  dialogs.append('div')
      .classed('renamed', true)
      .call(renameDialog.body);

  // Contents
  const frame = d3.select('#tl-frame')
      .call(transform.viewFrame, state);
  frame.select('.view')
      .call(component.tileView, state)
      .call(interaction.setInteraction, state);
  d3.select('#tl-control')
      .call(control.controlBox, state);

  // Resize window
  window.onresize = () =>
    d3.select('#tl-frame').call(transform.resize, state);

  // Update
  updateApp(state);
}


function updateApp(state) {
  // Title
  d3.select('title').text(state.name);

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
  const fstatus = state.items.status();
  const fstext = fstatus === 'done' ?
    fstatus : `${fstatus} ${state.items.progress()}%`;
  d3.select('#menubar .items-count')
      .call(badge.updateBadge, `${state.items.size()} items`,
            'light', 'tiles-gray')
    .select('.text')
      .style('color', 'gray');
  d3.select('#menubar .fetch-status')
      .call(badge.updateBadge, fstext, 'light', icons[fstatus])
    .select('.text')
      .style('color', colors[fstatus]);
  d3.select('#menubar .exec-time')
      .call(badge.updateBadge, `${state.items.execTime()} seconds`,
            'light', 'clock-cornflowerblue')
    .select('.text')
      .style('color', 'cornflowerblue');

  // Dialogs
  const dialogs = d3.select('#dialogs');

  // Rename dialog
  dialogs.select('.renamed')
      .call(renameDialog.updateBody, state.name)
      .on('submit', function () {
        onLoading.style('display', 'inline-block');
        state.name = renameDialog.value(d3.select(this));
        updateApp(state);
  });

  onLoading.style('display', 'none');
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
  const storeID = client.URLQuery().store || null;
  const viewID = client.URLQuery().view || null;
  return idb.getView(storeID, viewID)
    .then(view => {
      if (!view) throw('ERROR: invalid URL');
      view.storeID = storeID;
      return idb.getCollection(storeID, view.items)
        .then(coll => app(view, coll));
    })
    .catch(err => {
      console.error(err);
      d3.select('#tileview')
        .style('color', 'red')
        .text(err);
    });
}


export default {
  run
};
