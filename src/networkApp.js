
/** @module networkApp */

import d3 from 'd3';

import {default as idb} from './common/idb.js';
import {default as misc} from './common/misc.js';
import {default as scale} from './common/scale.js';
import {default as sw} from './common/sw.js';

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
  const menubar = d3.select('#menubar');
  menubar.selectAll('div,span,a').remove();  // Clean up
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up

  const state = new NetworkState(view, nodes, edges);
  // TODO: define field size according to the data size
  state.fieldWidth = 1200;
  state.fieldHeight = 1200;

  // Network view control
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Network', 'primary', 'network-white')
      .select('.dropdown-menu');
  menu.append('a').call(communityDialog.menuLink);
  menu.append('a').call(renameDialog.menuLink);
  menu.append('a')
      .call(button.dropdownMenuItem, 'Save', 'save')
      .on('click', function () {
        state.save().then(() => console.info('Snapshot saved'));
      });
  // Dashboard link
  menubar.append('a')
      .call(button.menuButtonLink, 'Dashboard', 'outline-secondary', 'db-gray')
      .attr('href', 'dashboard.html')
      .attr('target', '_blank');
  // Fetch control
  menubar.append('a')
      .classed('refresh', true)
      .call(button.menuButtonLink,
            'Refresh', 'outline-secondary', 'refresh-gray')
      .on('click', function () {
        return state.edges.pull().then(() =>
          app(state.export(), state.nodes.export(), state.edges.export()));
      });
  menubar.append('a')
      .classed('abort', true)
      .call(button.menuButtonLink,
            'Abort server job', 'warning', 'delete-gray')
      .attr('data-toggle', 'modal')
      .attr('data-target', '#abort-dialog');
  menubar.append('span').classed('progress', true)
    .append('progress')
      .attr('max', 100);
  menubar.append('span').classed('title', true);
  menubar.append('span').classed('status', true);

  // Dialogs
  dialogs.append('div')
      .classed('communityd', true)
      .call(communityDialog.body);
  dialogs.append('div')
      .classed('renamed', true)
      .call(renameDialog.body, state.name);
  dialogs.append('div')
      .classed('abortd', true)
      .call(
        modal.confirmDialog, 'abort-dialog',
        'Are you sure you want to abort this calculation job?'
      );

  // Force simulation
  const simulation = force.forceSimulation(
    state.forcePreset, state.fieldWidth, state.fieldHeight);
  // Contents
  const frame = d3.select('#nw-frame')
      .call(transform.viewFrame, state);
  frame.select('.view')
      .call(component.networkView, state)
      .call(interaction.setInteraction, state)
      .call(force.activate, simulation, state);
  d3.select('#nw-control')
      .call(control.controlBox, state);

  // Resize window
  window.onresize = () =>
    d3.select('#nw-frame').call(transform.resize, state);

  // Update
  updateApp(state);
}


function updateApp(state) {
  // Title
  d3.select('title').text(state.name);
  d3.select('#menubar').select('.title').text(state.name);

  // Menubar
  const menubar = d3.select('#menubar');
  const fstatus = state.edges.status();
  const fsize = state.edges.size();
  const ftime = state.edges.execTime();
  const fprog = state.edges.progress();
  const ongoing = state.edges.ongoing();
  menubar.select('.title').text(state.name);
  menubar.select('.status')
      .text(`(${fstatus} - ${fsize} connections created in ${ftime} sec.)`);
  menubar.select('.progress').select('progress')
      .attr('value', fprog)
      .text(`${fprog}%`);
  // hide fetch commands
  menubar.selectAll('.progress, .refresh, .abort')
    .style('display', ongoing ? null : 'none');

  // Dialogs
  const dialogs = d3.select('#dialogs');

  // Community detection dialog
  dialogs.select('.communityd')
      .call(communityDialog.updateBody)
      .on('submit', function () {
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
        const defaultScale = scale.colorRangeTypes
          .find(e => e.key === 'category40');
        state.nodeColor = {
          field: value.name, scale: 'ordinal', domain: [0, 1],
          range: defaultScale.range, unknown: defaultScale.unknown
        };
        $('#community-dialog').modal('hide');  // TODO:
        d3.select('#loading-icon').style('display', 'none');
        app(state.export(), state.nodes.export(), state.edges.export());
      });

  // Rename dialog
  dialogs.select('.renamed')
      .call(renameDialog.updateBody, state.name)
      .on('submit', function () {
        state.name = renameDialog.value(d3.select(this));
        updateApp(state);
      });

  // Abort dialog
  dialogs.select('.abortd')
      .on('submit', function () {
        state.edges.abort().then(() =>
          app(state.export(), state.nodes.export(), state.edges.export()));
      });
}


function run() {
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";  // TODO
  const offLine = 'onLine' in navigator && !navigator.onLine;  // TODO
  if (debug) {
    console.info('Off-line mode is disabled for debugging');
  } else {
    sw.registerServiceWorker();
  }
  const viewID = misc.URLQuery().view || null;
  return idb.getView(viewID)
    .then(view => {
      return Promise.all([
        idb.getCollection(view.nodes),
        idb.getCollection(view.edges)
      ])
      .then(colls => app(view, colls[0], colls[1]));
    })
    .catch(err => {
      console.error(err);
      d3.select('#datagrid')
        .style('color', 'red')
        .text('ERROR: invalid URL');
    });
}


export default {
  run
};
