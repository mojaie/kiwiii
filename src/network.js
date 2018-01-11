
/** @module network */

import d3 from 'd3';

import {default as common} from './common.js';
import {default as def} from './helper/definition.js';
import {default as hfile} from './helper/file.js';
import {default as win} from './helper/window.js';
import {default as store} from './store/StoreConnection.js';
import {default as header} from './component/Header.js';
import {default as dialog} from './component/Dialog.js';
import {default as view} from './network/view.js';
import {default as control} from './network/controlBox.js';
import {default as interaction} from './network/interaction.js';
import {default as force} from './network/force.js';
import {default as community} from './network/communityDetection.js';
import NetworkState from './network/state.js';


function getGraph() {
  return store.getTable(win.URLQuery().id)
    .then(edges => {
      return store.getTable(edges.reference.nodes)
        .then(nodes => {
          return {edges: edges, nodes: nodes};
        });
    });
}


function render(data) {
  // Header
  header.renderStatus(data.edges,
    () => common.fetchResults().then(getGraph).then(render),
    () => common.fetchResults('abort').then(getGraph).then(render));
  d3.select('#nodetable')
    .attr('href', `datatable.html?id=${data.edges.reference.nodes}`);
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
  // Save snapshot
  state.snapshotNotifier = () => {
    return store.updateTableAttribute(win.URLQuery().id, 'snapshot', state.snapshot())
      .then(() => console.info('Snapshot saved'));
  };
  // Export network view
  d3.select('#export')
    .on('click', () => {
      // Save snapshot before save
      return store.updateTableAttribute(win.URLQuery().id, 'snapshot', state.snapshot())
        .then(getGraph)
        .then(g => hfile.downloadJSON(g, g.edges.name));
    });
  // Rename
  d3.select('#rename')
    .on('click', () => {
      d3.select('#prompt-title').text('Rename table');
      d3.select('#prompt-label').text('New name');
      d3.select('#prompt-input').property('value', data.edges.name);
      d3.select('#prompt-submit')
        .on('click', () => {
          const name = d3.select('#prompt-input').property('value');
          return store.updateTableAttribute(win.URLQuery().id, 'name', name)
            .then(() => {
              d3.select('title').text(name);
              d3.select('#title').text(name);
            });
        });
    });
  dialog.communityDialog(query => {
    const nodeIds = data.nodes.records.map(e => e.index);
    const edges = data.edges.records
      .filter(e => e.weight >= state.networkThreshold);
    const comm = community.communityDetection(
      nodeIds, edges, {nulliso: query.nulliso}
    );
    const mapping = {
      key: 'index',
      field: def.defaultFieldProperties(
        [{key: query.name, format: 'd3_format', d3_format: 'd'}]
      )[0],
      mapping: comm
    };
    store.joinFields(data.nodes.id, mapping)
      .then(() => {
        state.nodeColor.field = query.name;
        state.nodeColor.scale = 'ordinal';
        state.nodeColor.range = d3.schemeCategory20b.concat(d3.schemeCategory20c);
        state.nodeColor.unknown = '#fefefe';
      })
      .then(() => {
        return store.updateTableAttribute(
          win.URLQuery().id, 'snapshot', state.snapshot());
      })
      .then(getGraph)
      .then(render);
  });
}


function loadNewNetwork(data) {
  return common.interactiveInsert(data.nodes)
    .then(id => {
      data.edges.reference.nodes = id;
      return common.interactiveInsert(data.edges);
    })
    .then(id => {
      window.location = `network.html?id=${id}`;
    });
}


function run() {
  d3.select('#import-json')
    .on('click', () => document.getElementById('select-file').click());
  d3.select('#select-file')
    .on('change', () => {
      const file = document.getElementById('select-file').files[0];
      hfile.loadJSON(file).then(render);
    });
  // location parameter enables direct access to graph JSON via HTTP
  if (win.URLQuery().hasOwnProperty('location')) {
    return hfile.fetchJSON(win.URLQuery().location).then(render);
  }
  return common.loader()
    .then(() => {
      if (win.URLQuery().hasOwnProperty('id')) {
        header.initializeWithData();
        return common.fetchResults('update').then(getGraph).then(render);
      } else {
        header.initialize();
        return Promise.resolve();
      }
    });
}

export default {
  view, run
};
