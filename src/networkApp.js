
/** @module networkApp */

import _ from 'lodash';
import d3 from 'd3';

import {default as client} from './common/client.js';
import {default as idb} from './common/idb.js';

import {default as badge} from './component/badge.js';
import {default as button} from './component/button.js';
import {default as modal} from './component/modal.js';
import {default as transform} from './component/transform.js';

import {default as communityDialog} from './dialog/community.js';
import {default as renameDialog} from './dialog/rename.js';

import NetworkState from './network/state.js';
import {default as community} from './network/communityDetection.js';
import {default as control} from './network/controlBox.js';
import {default as component} from './network/component.js';
import {default as force} from './network/force.js';
import {default as interaction} from './network/interaction.js';


function app(view, nodes, edges) {
  const menubar = d3.select('#menubar')
      .classed('my-1', true);
  menubar.selectAll('div,span,a').remove();  // Clean up
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up

  const state = new NetworkState(view, nodes, edges);
  // TODO: define field size according to the data size
  state.fieldWidth = 1200;
  state.fieldHeight = 1200;

  // Network view control
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Menu', 'primary', 'network-white')
      .select('.dropdown-menu');
  menu.append('a').call(communityDialog.menuLink);
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

  // Fetch control
  menubar.append('a')
      .classed('refresh', true)
      .call(button.menuButtonLink,
            'Refresh', 'outline-secondary', 'refresh-gray')
      .on('click', function () {
        d3.select('#menubar .loading-circle').style('display', 'inline-block');
        return state.edges.pull().then(() => {
          state.updateAllNotifier();
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
      .classed('nodes-count', true)
      .call(badge.badge);
  menubar.append('span')
      .classed('edges-count', true)
      .call(badge.badge);
  menubar.append('span')
      .classed('fetch-status', true)
      .call(badge.badge);
  menubar.append('span')
      .classed('exec-time', true)
      .call(badge.badge);

  // Dialogs
  dialogs.append('div')
      .classed('communityd', true)
      .call(communityDialog.body);
  dialogs.append('div')
      .classed('renamed', true)
      .call(renameDialog.body);
  dialogs.append('div')
      .classed('abortd', true)
      .call(modal.confirmDialog, 'abort-dialog');

  // Force simulation
  const simulation = force.forceSimulation(
    state.forcePreset, state.fieldWidth, state.fieldHeight);
  // Contents
  const frame = d3.select('#nw-frame')
      .call(transform.viewFrame, state);
  frame.select('.view')
      .call(component.networkView, state)
      .call(force.activate, simulation, state)
      .call(interaction.setInteraction, state);
  d3.select('#nw-control')
      .call(control.controlBox, state);

  // Resize window
  window.onresize = () =>
    d3.select('#nw-frame').call(transform.resize, state);

  // Update
  state.updateAllNotifier();
  updateApp(state);
}


function updateApp(state) {
  // Title
  d3.select('title').text(state.name);

  // hide fetch commands
  d3.select('#menubar').selectAll('.refresh, .abort')
    .style('display', state.edges.ongoing() ? null : 'none');

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
  const fstatus = state.edges.status();
  const fstext = fstatus === 'done' ?
    fstatus : `${fstatus} ${state.edges.progress()}%`;
  const commaf = d3.format(',');
  const timef = d3.format(',.4g');
  d3.select('#menubar .nodes-count')
      .call(badge.updateBadge, `${commaf(state.nodes.size())} nodes`,
            'light', 'nodes-gray')
    .select('.text')
      .style('color', 'gray');
  d3.select('#menubar .edges-count')
      .call(badge.updateBadge, `${commaf(state.edges.size())} edges`,
            'light', 'edges-gray')
    .select('.text')
      .style('color', 'gray');
  d3.select('#menubar .fetch-status')
      .call(badge.updateBadge, fstext, 'light', icons[fstatus])
    .select('.text')
      .style('color', colors[fstatus]);
  d3.select('#menubar .exec-time')
      .call(badge.updateBadge, `${timef(state.edges.execTime())} seconds`,
            'light', 'clock-cornflowerblue')
    .select('.text')
      .style('color', 'cornflowerblue');


  // Dialogs
  const dialogs = d3.select('#dialogs');

  // Community detection dialog
  dialogs.select('.communityd')
      .call(communityDialog.updateBody)
      .on('submit', function () {
        onLoading.style('display', 'inline-block');
        const value = communityDialog.value(d3.select(this));
        const ns = state.nodes.records();
        const es = state.currentEdges();
        const ops = {
          nodeField: 'index',
          weightField: state.connThldField,
          nulliso: value.nulliso
        };
        const comm = community.communityDetection(ns, es, ops);
        const mapping = {
          key: 'index',
          field: {key: value.name, name: value.name,
                  format: 'd3_format', d3_format: 'd'},
          mapping: comm
        };
        state.nodes.joinFields(mapping);
        const catKeys = state.nodes.records().map(e => e[value.name]);
        state.nodeColor = {
          field: value.name, color: 'category40',
          scale: 'ordinal', domain: _.uniq(catKeys).sort(),
          range: ['#7fffd4', '#7fffd4'], unknown: '#7fffd4'
        };
        state.updateAllNotifier();
        updateApp(state);
      });

  // Rename dialog
  dialogs.select('.renamed')
      .call(renameDialog.updateBody, state.name)
      .on('submit', function () {
        onLoading.style('display', 'inline-block');
        state.name = renameDialog.value(d3.select(this));
        updateApp(state);
      });

  // Abort dialog
  dialogs.select('.abortd')
      .call(modal.updateConfirmDialog,
            'Are you sure you want to abort this calculation job?')
      .on('submit', function () {
        onLoading.style('display', 'inline-block');
        return state.edges.abort().then(() => {
          state.updateAllNotifier();
          updateApp(state);
        });
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
      return Promise.all([
        idb.getCollection(storeID, view.nodes),
        idb.getCollection(storeID, view.edges)
      ])
      .then(colls => app(view, colls[0], colls[1]));
    })
    .catch(err => {
      console.error(err);
      d3.select('#nw-frame')
        .style('color', 'red')
        .text(err);
    });
}


export default {
  run
};
