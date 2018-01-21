
/** @module network */

import d3 from 'd3';

import {default as common} from './common.js';
import {default as def} from './helper/definition.js';
import {default as hfile} from './helper/file.js';
import {default as win} from './helper/window.js';
import {default as store} from './store/StoreConnection.js';
import {default as dialog} from './component/Dialog.js';
import {default as button} from './component/button.js';
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
  const storeID = win.URLQuery().id || null;
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

  // Toolbar
  if (d3.select('#toolbar').selectAll('div,span,a').size()) {
    d3.select('#toolbar').selectAll('div,span,a').remove();
  }
  const menu = d3.select('#toolbar').append('div')
      .call(button.dropdownMenuButton, null, 'View control', 'primary')
      .select('.dropdown-menu');
  // Save
  menu.append('a')
      .call(button.dropdownMenuItem, null, 'Save view')
      .on('click', function () {
        if (storeID) {
          return store.updateTableAttribute(storeID, 'snapshot', state.snapshot())
              .then(() => console.info('Snapshot saved'));
        } else {
          data.edges.snapshot = state.snapshot();
          return loadNewNetwork(data);
        }
      });
  if (storeID) {
    // Community detection
    menu.append('a')
        .call(button.dropdownMenuModal,
              'community', 'Comunity detection', 'community-dialog');
    // Rename
    menu.append('a')
        .call(button.dropdownMenuModal,
              'rename', 'Rename view', 'prompt-dialog')
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
    // Export
    menu.append('a')
        .call(button.dropdownMenuItem, null, 'Export to JSON')
        .on('click', () => {
          // Save snapshot before save
          return store.updateTableAttribute(storeID, 'snapshot', state.snapshot())
            .then(getGraph)
            .then(g => hfile.downloadJSON(g, g.edges.name));
        });
    // Node datatable link
    d3.select('#toolbar').append('a')
        .call(button.menuButton, null, 'Node datatable', 'outline-secondary')
        .attr('href', `datatable.html?id=${data.nodes.id}`)
        .attr('target', '_blank');
  }
  // Control panel
  d3.select('#toolbar').append('a')
      .call(button.menuButton, null, 'Control panel', 'outline-secondary')
      .attr('href', 'control.html')
      .attr('target', '_blank');
  // Fetch
  if (storeID && def.ongoing(data.edges)) {
    d3.select('#toolbar').append('a')
        .call(button.menuButton, null, 'Refresh', 'outline-secondary')
        .on('click', function () {
          // TODO: renderStatus
          common.fetchResults().then(getGraph).then(render);
        });
    d3.select('#toolbar').append('a')
        .call(button.menuButton, null, 'Abort server job', 'warning')
        .attr('data-toggle', 'modal')
        .attr('data-target', '#confirm-dialog')
        .on('click', function () {
          d3.select('#confirm-message')
              .text('Are you sure you want to abort this calculation job?');
          d3.select('#confirm-submit')
              .classed('btn-primary', false)
              .classed('btn-warning', true)
              .on('click', function () {
                // TODO: renderStatus
                common.fetchResults('abort').then(getGraph).then(render);
              });
        });
  }
  // Progress
  d3.select('#toolbar').append('span')
    .text(`(${data.edges.status} - ${data.edges.records.length} connections created in ${data.edges.execTime} sec.)`);
  if (storeID && def.ongoing(data.edges)) {
    d3.select('#toolbar').append('span')
      .append('progress')
        .attr('max', 100)
        .attr('value', data.edges.progress)
        .text(`${data.edges.progress}%`);
  }

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
    .then(() => {
      return common.interactiveInsert(data.edges);
    })
    .then(id => {
      window.location = `network.html?id=${id}`;
    });
}


function run() {
  return common.loader()
    .then(() => {
      if (win.URLQuery().hasOwnProperty('id')) {
        // IndexedDB
        return common.fetchResults('update')
          .then(getGraph)
          .then(render);
      } else if (win.URLQuery().hasOwnProperty('location')) {
        // Location parameter enables direct access to graph JSON via HTTP
        return hfile.fetchJSON(win.URLQuery().location)
          .then(render);
      } else {
        // Load data manually
        if (d3.select('#toolbar').selectAll('div,a').size()) {
          d3.select('#toolbar').selectAll('div,a').remove();
        }
        const menu = d3.select('#toolbar').append('div')
            .call(button.dropdownMenuButton, null, '+ New network', 'primary')
            .select('.dropdown-menu');
        menu.append('a')
            .call(button.dropdownMenuFile, 'import', 'Import view')
            .on('change', function () {
              const file = button.dropdownMenuFileValue(d3.select(this));
              hfile.loadJSON(file).then(render);
            });
        d3.select('#toolbar').append('a')
            .call(button.menuButton, null, 'Control panel', 'outline-secondary')
            .attr('href', 'control.html')
            .attr('target', '_blank');
        return Promise.resolve();
      }
    });
}


export default {
  view, run
};
