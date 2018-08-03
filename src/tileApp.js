
/** @module tileApp */

import d3 from 'd3';

import {default as client} from './common/client.js';
import {default as idb} from './common/idb.js';

import {default as button} from './component/button.js';
import {default as transform} from './component/transform.js';

import {default as renameDialog} from './dialog/rename.js';

import TileState from './tile/state.js';
import {default as component} from './tile/component.js';
import {default as interaction} from './tile/interaction.js';
import {default as control} from './tile/controlBox.js';


function app(view, coll) {
  const menubar = d3.select('#menubar');
  menubar.selectAll('div,span,a').remove();  // Clean up
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up

  const state = new TileState(view, coll);

  // Tile view control
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Tile', 'primary', 'table-white')
      .select('.dropdown-menu');
  menu.append('a').call(renameDialog.menuLink);
  menu.append('a')
      .call(button.dropdownMenuItem, 'Save', 'menu-save')
      .on('click', function () {
        state.save().then(() => console.info('Tile view saved'));
      });
  // Dashboard link
  menubar.append('a')
      .call(button.menuButtonLink, 'Dashboard', 'outline-secondary', 'db-gray')
      .attr('href', 'dashboard.html')
      .attr('target', '_blank');
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
  d3.select('#loading-icon').style('display', 'none');

  // Title
  d3.select('title').text(state.name);

  // Menubar
  const menubar = d3.select('#menubar');
  const fstatus = state.items.status();
  const fsize = state.items.size();
  const ftime = state.items.execTime();
  menubar.select('.title').text(state.name);
  menubar.select('.status')
      .text(`(${fstatus} - ${fsize} records found in ${ftime} sec.)`);

  // Dialogs
  const dialogs = d3.select('#dialogs');

  // Rename dialog
  dialogs.select('.renamed')
      .call(renameDialog.updateBody, state.name)
      .on('submit', function () {
        state.name = renameDialog.value(d3.select(this));
        updateApp(state);
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
  if (debug) {
    console.info('Off-line mode is disabled for debugging');
  } else {
    client.registerServiceWorker();
  }
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
