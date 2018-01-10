
/** @module network */

import d3 from 'd3';

import {default as hfile} from './helper/file.js';
import {default as win} from './helper/window.js';
import {default as common} from './common.js';
import {default as store} from './store/StoreConnection.js';
import {default as header} from './component/Header.js';
import {default as view} from './network/view.js';
import {default as frame} from './network/frame.js';
import {default as interaction} from './network/interaction.js';
import {default as force} from './network/force.js';
import NetworkState from './network/state.js';


/*
function takeSnapshot(selection) {
  return {
    nodePositions: selection.selectAll('.node').data().map(d => ({x: d.x, y: d.y})),
    fieldTransform: d3.zoomTransform(selection.select('.nw-view').node()),
    nodeContent: d3.select('#main-control').datum(),
    nodeColor: d3.select('#color-control').datum(),
    nodeSize: d3.select('#size-control').datum(),
    nodeLabel: d3.select('#label-control').datum(),
    edge: d3.select('#edge-control').datum()
  };
}


function saveSnapshot(selection, state) {
  return store.updateTableAttribute(win.URLQuery().id, 'snapshot', state.snapshot())
    .then(() => console.info('Snapshot saved'));
}

function resume(snapshot) {
  d3.select('#main-control').datum(snapshot.nodeContent);
  d3.select('#show-struct')
    .property('checked', snapshot.nodeContent.structure.visible);
  d3.select('#color-control').datum(snapshot.nodeColor);
  control.updateControl(snapshot.nodeColor);
  d3.select('#size-control').datum(snapshot.nodeSize);
  control.updateControl(snapshot.nodeSize);
  d3.select('#label-control').datum(snapshot.nodeLabel);
  control.updateControl(snapshot.nodeLabel);
  d3.select('#edge-control').datum(snapshot.edge);
  control.updateControl(snapshot.edge);
  const tf = snapshot.fieldTransform;
  const transform = d3.zoomIdentity.translate(tf.x, tf.y).scale(tf.k);
  d3.select('#graph-field').attr('transform', transform);
  d3.selectAll('.node').each((d, i) => {
    d.x = snapshot.nodePositions[i].x;
    d.y = snapshot.nodePositions[i].y;
  });
  control.updateNodeImage(snapshot);
}
*/

function getGraph() {
  return store.getTable(win.URLQuery().id)
    .then(edges => {
      return store.getTable(edges.reference.nodes)
        .then(nodes => {
          return {edges: edges, nodes: nodes};
        });
    });
}


function render() {
  return getGraph()
    .then(data => {
      // TODO: define field size according to the data size
      const width = 1200;
      const height = 1200;
      const state = new NetworkState(data, width, height);
      const simulation = force.forceSimulation(width, height);
      d3.select('#nw-frame')
          .call(frame.networkViewFrame, state)
        .select('.nw-view')
          .call(view.networkView, state)
          .call(interaction.setInteraction, state)
          .call(force.activate, simulation, state);
      window.onresize = () =>
        d3.select('#nw-frame').call(frame.resize, state);
    });
}

/*
function render() {
  return getGraph()
    .then(g => {
      d3.select('#export')
        .on('click', () => {
          // Working copy of edges and nodes are modified by d3.force.
          // Load original data from store.
          hfile.downloadJSON(g, g.edges.name);
        });
      resume(g.edges.snapshot);
      window.onresize = () => interaction.resizeViewBox(
        d3.select('#graph-area'), d3.select('#graph-view'));
      // TODO: dispatch resize
      header.renderStatus(g.edges,
        () => common.fetchResults().then(render),
        () => common.fetchResults('abort').then(render));
      // networkView
      d3.select('#nw-view')
        .call(view.networkView, g)
        .call(interaction.setZoom, g)
        .call(force.setForce, g);
      d3.select('#nw-control-fit')
        .call(interaction.fit, g);
      d3.select('#nw-control-main')
        .call(control.mainControlBox, g);
      d3.select('#nw-control-node-color')
        .call(control.mainControlBox, g);
      d3.select('#nw-control-node-size')
        .call(control.nodeSizeControlBox, g);
      d3.select('#nw-control-node-label')
        .call(control.nodeLabelControlBox, g);
      d3.select('#nw-control-edge')
        .call(control.edgeControlBox, g);

      // Control
      d3.select('#restart')
        .on('click', interaction.restart);
      const n = g.nodes.records.length;
      const combinations = n * (n - 1) / 2;
      const logD = d3.format('.2f')(Math.log10(edgesToDraw.length / combinations));
      d3.select('#edge-density').text(logD);
      d3.select('#network-thld').text(g.edges.networkThreshold);

      dialog.communityDialog(query => {
        const nodeIds = g.nodes.records.map(e => e.index);
        const visibleEdges = g.edges.records
          .filter(e => e.weight >= g.edges.networkThreshold);
        const comm = community.communityDetection(
          nodeIds, visibleEdges, {nulliso: query.nulliso}
        );
        const mapping = {
          key: 'index',
          field: def.defaultFieldProperties(
            [{key: query.name, format: 'd3_format', d3_format: 'd'}]),
          mapping: comm
        };
        store.joinFields(g.nodes.id, mapping)
          .then(() => {
            const snapshot = takeSnapshot();
            snapshot.nodeColor.field = query.name;
            snapshot.nodeColor.scale = d3scale.colorPresets
              .find(e => e.name === 'Categories').scale;
            return store.updateTableAttribute(win.URLQuery().id, 'snapshot', snapshot)
              .then(() => console.info('snapshot saved'));
          }).then(render);
      });
      d3.select('#stick-nodes')
        .on('change', function() {
          d3form.checked(this) === true ? interaction.stickNodes() : interaction.relax();
        });
      d3.select('#nodetable').attr('href', `datatable.html?id=${g.edges.reference.nodes}`);
      d3.select('#rename')
        .on('click', () => {
          d3.select('#prompt-title').text('Rename table');
          d3.select('#prompt-label').text('New name');
          d3.select('#prompt-input').attr('value', g.edges.name);
          d3.select('#prompt-submit')
            .on('click', () => {
              const name = d3form.value('#prompt-input');
              return store.updateTableAttribute(win.URLQuery().id, 'name', name)
                .then(() => store.getTable(win.URLQuery().id))  // updateTableAttribute returns 1
                .then(t => header.renderStatus(t,
                  () => common.fetchResults().then(render),
                  () => common.fetchResults('abort').then(render))
                );
            });
        });
    });
}
*/

function loadNewNetwork(data) {
  return common.interactiveInsert(data.nodes)
    .then(id => {
      data.edges.reference.nodes = id;
      return common.interactiveInsert(data.edges);
    })
    .then(id => {
      window.location = `graph.html?id=${id}`;
    });
}


function run() {
  d3.select('#import-json')
    .on('click', () => document.getElementById('select-file').click());
  d3.select('#select-file')
    .on('change', () => {
      const file = document.getElementById('select-file').files[0];
      hfile.loadJSON(file).then(loadNewNetwork);
    });
  // location parameter enables direct access to graph JSON via HTTP
  if (win.URLQuery().hasOwnProperty('location')) {
    return hfile.fetchJSON(win.URLQuery().location)
      .then(data => {
        return common.interactiveInsert(data.nodes)
          .then(id => {
            data.edges.reference.nodes = id;
            return common.interactiveInsert(data.edges);
          })
          .then(id => {
            window.location = `graph.html?id=${id}`;
          });
      });
  }
  return common.loader()
    .then(() => {
      if (win.URLQuery().hasOwnProperty('id')) {
        header.initializeWithData();
        return common.fetchResults('update').then(render);
      } else {
        header.initialize();
        return Promise.resolve();
      }
    });
}

export default {
  view, run
};
