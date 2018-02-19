
/** @module network/networkApp */

import d3 from 'd3';

import {default as core} from '../common/core.js';
import {default as hfile} from '../common/file.js';
import {default as idb} from '../common/idb.js';
import {default as mapper} from '../common/mapper.js';
import {default as misc} from '../common/misc.js';

import {default as box} from '../component/formBox.js';
import {default as button} from '../component/button.js';
import {default as modal} from '../component/modal.js';

import {default as communityDialog} from '../dialog/community.js';

import {default as view} from './view.js';
import {default as control} from './controlBox.js';
import {default as interaction} from './interaction.js';
import {default as force} from './force.js';
import {default as community} from './communityDetection.js';
import NetworkState from './state.js';


function getGraph(storeID) {
  return idb.getItemByID(storeID)
    .then(edges => {
      return idb.getItemByID(edges.reference.nodes)
        .then(nodes => {
          return {edges: edges, nodes: nodes};
        });
    });
}


function app(data) {
  console.log(data)
  // TODO: define field size according to the data size
  const width = 1200;
  const height = 1200;
  const state = new NetworkState(data, width, height);
  const simulation = force.forceSimulation(width, height);
  const frame = d3.select('#nw-frame')
      .call(view.networkViewFrame, state);
  frame.select('.nw-view')
      .call(view.networkView, state)
      .call(interaction.setInteraction, state)
      .call(force.activate, simulation, state);
  d3.select('#nw-control')
      .call(control.controlBox, state);

  // Resize window
  window.onresize = () =>
    d3.select('#nw-frame').call(view.resize, state);

  // Menubar
  const menubar = d3.select('#menubar');
  menubar.selectAll('div,span,a').remove();
  // Network view control
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, null, 'View control', 'primary')
      .select('.dropdown-menu');
  menu.append('a')
      .classed('communityd', true)
      .call(communityDialog.menuLink);
  menu.append('a')
      .classed('renamed', true)
      .call(button.dropdownMenuModal, null, 'Rename', 'rename-dialog');
  menu.append('a')
      .classed('saveview', true)
      .call(button.dropdownMenuItem, null, 'Save to local storage')
      .on('click', function () {
        if (state.data.edges.storeID) {
          return idb.updateItem(state.data.edges.storeID, item => {
            item.id = misc.uuidv4();
            item.snapshot = state.snapshot();
          })
          .then(() => console.info('Snapshot saved'));
        } else {
          const data = state.export();
          return idb.putItem(data.nodes)
            .then(storeID => {
              data.edges.reference.nodes = storeID;
              return idb.putItem(data.edges);
            })
            .then(storeID => {
              window.location = `network.html?id=${storeID}`;
            });
        }
      });
  menu.append('a')
      .call(button.dropdownMenuItem, null, 'Export to JSON')
      .on('click', () => {
        const data = state.export();
        // Delete local store information
        delete data.nodes.storeID;
        delete data.edges.storeID;
        delete data.edges.reference.nodes;
        hfile.downloadJSON(data, data.edges.name);
      });
  if (state.data.nodes.storeID) {
    // Node datatable link
    menubar.append('a')
        .call(button.menuButtonLink, null, 'Node datatable', 'outline-secondary')
        .attr('href', `datatable.html?id=${state.data.nodes.storeID}`)
        .attr('target', '_blank');
  }
  // Control panel
  menubar.append('a')
      .call(button.menuButtonLink, null, 'Control panel', 'outline-secondary')
      .attr('href', 'control.html')
      .attr('target', '_blank');
  // Fetch control
  const ongoing = ['running', 'ready'].includes(state.data.edges.status);
  if (ongoing) {
    menubar.append('a')
        .call(button.menuButtonLink, null, 'Refresh', 'outline-secondary')
        .on('click', function () {
          core.fetchProgress(state.data.edges.storeID)
            .then(() => getGraph(state.data.edges.storeID))
            .then(app);
        });
    menubar.append('a')
        .call(button.menuButtonLink, null, 'Abort server job', 'warning')
        .attr('data-toggle', 'modal')
        .attr('data-target', '#abort-dialog');
    menubar.append('span')
        .classed('progress', true)
      .append('progress')
        .attr('max', 100)
        .attr('value', state.data.edges.progress)
        .text(`${state.data.edges.progress}%`);
  }
  menubar.append('span')
    .classed('title', true)
    .text(state.data.name);
  menubar.append('span')
      .classed('status', true)
      .text(`(${state.data.edges.status} - ${state.data.edges.records.length} connections created in ${state.data.edges.execTime} sec.)`);

  // Dialogs
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up
  dialogs.append('div')
    .classed('communityd', true)
    .call(communityDialog.body);
  dialogs.append('div')
      .classed('renamed', true)
      .call(modal.submitDialog, 'rename-dialog', 'Rename view')
    .select('.modal-body').append('div')
      .classed('rename', true);
  dialogs.append('div')
      .classed('abortd', true)
      .call(
        modal.confirmDialog, 'abort-dialog',
        'Are you sure you want to abort this calculation job?'
      );
  updateApp(state);
}


function updateApp(state) {
  // Title
  d3.select('title').text(state.data.edges.name);
  d3.select('#menubar').select('.title').text(state.data.edges.name);
  // Dialogs
  const dialogs = d3.select('#dialogs');
  // Rename dialog
  const renamed = dialogs.select('.renamed');
  const rename = renamed.select('.rename')
      .call(box.textBox, 'rename', 'New name', 40, state.data.edges.name);
  renamed.select('.submit')
      .on('click', function () {
        state.data.edges.name = box.textBoxValue(rename);
        updateApp(state);
      });
  // TODO: Abort dialog
  dialogs.select('.abortd')
    .select('.ok')
      .on('click', function () {
        core.fetchProgress(state.data.edges.storeID, 'abort')
          .then(() => getGraph(state.data.edges.storeID))
          .then(app);
      });
  // Community dialog
  const communityd = dialogs.select('.communityd');
  communityd.select('.submit')
      .on('click', () => {
        const value = communityDialog.value(communityd);
        const nodeIds = state.data.nodes.records.map(e => e.index);
        const edges = state.data.edges.records
          .filter(e => e.weight >= state.networkThreshold);
        const comm = community.communityDetection(
          nodeIds, edges, {nulliso: value.nulliso}
        );
        const mapping = {
          key: 'index',
          field: misc.defaultFieldProperties(
            [{key: value.name, format: 'd3_format', d3_format: 'd'}]
          )[0],
          mapping: comm
        };
        mapper.apply(state.data.nodes, mapping);
        state.nodeColor = {
          field: value.name, scale: 'ordinal', domain: null,
          range: d3.schemeCategory10, unknown: '#cccccc'
        };
        $('#community-dialog').modal('hide');  // TODO:
        app(state.export());
      });
}


export default {
  getGraph, app, updateApp
};
