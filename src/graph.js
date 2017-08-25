
/** @module graph */

import d3 from 'd3';

import {default as d3form} from './helper/d3Form.js';
import {default as d3scale} from './helper/d3Scale.js';
import {default as def} from './helper/definition.js';
import {default as hfile} from './helper/file.js';
import {default as loader} from './Loader.js';
import {default as store} from './store/StoreConnection.js';
import {default as header} from './component/Header.js';
import {default as dialog} from './component/Dialog.js';
import {default as force} from './graph/GraphForce.js';
import {default as control} from './graph/GraphControlBox.js';
import {default as component} from './graph/GraphComponent.js';
import {default as interaction} from './graph/GraphInteraction.js';
import {default as community} from './graph/communityDetection.js';


const localServer = store.localChemInstance();


function takeSnapshot() {
  return {
    nodePositions: d3.selectAll('.node').data().map(d => ({x: d.x, y: d.y})),
    fieldTransform: d3.zoomTransform(d3.select('#graph-field').node()),
    nodeContent: d3.select('#main-control').datum(),
    nodeColor: d3.select('#color-control').datum(),
    nodeSize: d3.select('#size-control').datum(),
    nodeLabel: d3.select('#label-control').datum(),
    edge: d3.select('#edge-control').datum()
  };
}


function saveSnapshot() {
  const currentId = store.getGlobalConfig('urlQuery').id;
  return store.updateTableAttribute(currentId, 'snapshot', takeSnapshot())
    .then(() => console.info('Snapshot saved'));
}


function resume(snapshot) {
  if (snapshot.hasOwnProperty('nodeContent')) {
    d3.select('#main-control').datum(snapshot.nodeContent);
    d3.select('#show-struct')
      .property('checked',
                snapshot.nodeContent.structure.visible ? true : false);
  }
  if (snapshot.hasOwnProperty('nodeColor')) {
    d3.select('#color-control').datum(snapshot.nodeColor);
    control.updateControl(snapshot.nodeColor);
  }
  if (snapshot.hasOwnProperty('nodeSize')) {
    d3.select('#size-control').datum(snapshot.nodeSize);
    control.updateControl(snapshot.nodeSize);
  }
  if (snapshot.hasOwnProperty('nodeLabel')) {
    d3.select('#label-control').datum(snapshot.nodeLabel);
    control.updateControl(snapshot.nodeLabel);
  }
  if (snapshot.hasOwnProperty('edge')) {
    d3.select('#edge-control').datum(snapshot.edge);
    control.updateControl(snapshot.edge);
  }
  if (snapshot.hasOwnProperty('fieldTransform')) {
    const tf = snapshot.fieldTransform;
    const transform = d3.zoomIdentity.translate(tf.x, tf.y).scale(tf.k);
    d3.select('#graph-contents').attr('transform', transform);
    d3.select('#graph-field').call(interaction.zoom.transform, transform);
  }
  if (snapshot.hasOwnProperty('nodePositions')) {
    d3.selectAll('.node').each((d, i) => {
      d.x = snapshot.nodePositions[i].x;
      d.y = snapshot.nodePositions[i].y;
    });
  }
  control.updateNodeImage(snapshot);
}


function getCurrentGraph() {
  return store.getCurrentTable().then(edges => {
    return store.getTable(edges.nodeTableId).then(nodes => {
      return {edges: edges, nodes: nodes};
    });
  });
}


function start() {
  return getCurrentGraph().then(g => {
    header.renderStatus(g.edges, refresh, abort);
    const edgesToDraw = g.edges.records
      .filter(e => e.weight >= g.edges.networkThreshold);
    const edgeDensity = d3.format('.3e')(edgesToDraw.length / g.edges.searchCount);
    d3.select('#edge-density').text(edgeDensity);
    d3.select('#network-thld').text(g.edges.networkThreshold);
    component.graphEdges(d3.select('#graph-contents'), edgesToDraw);
    component.graphNodes(d3.select('#graph-contents'), g.nodes.records);
    d3.select('#show-struct').property('checked', false);  // for fast loading
    force.setForce(
      g.nodes.records, edgesToDraw, force.tick,
      () => {
        force.end();
        saveSnapshot();
      });
    if (g.edges.hasOwnProperty('snapshot')) {
      resume(g.edges.snapshot);
      interaction.stickNodes();
    } else {
      interaction.restart();
    }
    d3.select('#graph-contents').style('opacity', 1e-6)
      .transition()
      .duration(1000)
      .style('opacity', 1);
  });
}


function render() {
  return getCurrentGraph().then(g => {
    g.nodes.records.forEach(e => { delete e._mol; });
    dialog.graphConfigDialog(g.edges, thld => {
      return store.updateTableAttribute(g.edges.id, 'networkThreshold', thld)
        .then(saveSnapshot).then(start);
    });
    dialog.communityDialog(query => {
      const nodeIds = g.nodes.records.map(e => e._index);
      const visibleEdges = g.edges.records
        .filter(e => e.weight >= g.edges.networkThreshold);
      const comm = community.communityDetection(
        nodeIds, visibleEdges, {nulliso: query.nulliso}
      );
      const mapping = {
        key: '_index',
        column: {
          key: query.name, name: query.name, sort: 'numeric', visible: true
        },
        mapping: comm
      };
      store.joinColumn(mapping, g.nodes.id)
        .then(() => {
          const snapshot = takeSnapshot();
          snapshot.nodeColor.column = query.name;
          snapshot.nodeColor.scale = d3scale.colorPresets
            .find(e => e.name === 'Categories').scale;
          const currentId = store.getGlobalConfig('urlQuery').id;
          return store.updateTableAttribute(currentId, 'snapshot', snapshot)
            .then(() => console.info('snapshot saved'));
        }).then(render);
    });
    control.mainControlBox();
    control.nodeColorControlBox(g.nodes.columns);
    control.nodeSizeControlBox(g.nodes.columns);
    control.nodeLabelControlBox(g.nodes.columns);
    control.edgeControlBox();
    d3.select('#stick-nodes')
      .on('change', function() {
        d3form.checked(this) === true ? interaction.stickNodes() : interaction.relax();
      });
    d3.select('#nodetable').attr('href', `datatable.html?id=${g.edges.nodeTableId}`);
    d3.select('#rename')
      .on('click', () => {
        d3.select('#prompt-title').text('Rename table');
        d3.select('#prompt-label').text('New name');
        d3.select('#prompt-input').attr('value', g.edges.name);
        d3.select('#prompt-submit')
          .on('click', () => {
            const name = d3form.value('#prompt-input');
            return store.updateTableAttribute(g.edges.id, 'name', name)
              .then(store.getCurrentTable)
              .then(t => header.renderStatus(t, refresh, abort));
          });
      });
    return start();
  });
}


function fetch_(command) {
  return store.getCurrentTable().then(edges => {
    if (!def.fetchable(edges)) return;
    const query = {id: edges.id, command: command};
    return localServer.getRecords(query).then(store.updateTable);
  });
}


function refresh() {
  return fetch_('update').then(isUpdated => {
    if (isUpdated !== undefined) return start();
  });
}


function abort() {
  return fetch_('abort').then(isUpdated => {
    if (isUpdated !== undefined) return start();
  });
}


function loadNewGraph(grf) {
  return Promise.all([
    store.insertTable(grf.nodes),
    store.insertTable(grf.edges)
  ]).then(() => {
    window.location = `graph.html?id=${grf.edges.id}`;
  });
}


function run() {
  d3.select('#export')
    .on('click', () => {
      // Working copy of edges and nodes are modified by d3.force.
      // Load original data from store.
      return getCurrentGraph().then(g => hfile.downloadJSON(g, g.edges.name));
    });
  d3.select('#graph-field')
    .attr('viewBox', `0 0 ${force.fieldWidth} ${force.fieldHeight}`)
    .call(interaction.zoom);
  d3.select('#snapshot')
    .on('click', saveSnapshot);
  d3.select('#restart')
    .on('click', interaction.restart);
  d3.select('#import-json')
    .on('click', () => document.getElementById('select-file').click());
  d3.select('#select-file')
    .on('change', () => {
      const file = document.getElementById('select-file').files[0];
      hfile.loadJSON(file).then(loadNewGraph);
    });
  if (store.getGlobalConfig('urlQuery').hasOwnProperty('location')) {
    const url = store.getGlobalConfig('urlQuery').location;
    return hfile.fetchJSON(url)
      .then(tbls => {
        return Promise.all([
          store.insertTable(tbls.nodes),
          store.insertTable(tbls.edges)
        ]).then(() => tbls.edges.id);
      })
      .then(id => {
        window.location = `graph.html?id=${id}`;
      });
  }
  return loader.loader().then(() => {
    if (store.getGlobalConfig('urlQuery').hasOwnProperty('id')) {
      header.initializeWithData();
      return fetch_('update').then(render);
    } else {
      header.initialize();
      return Promise.resolve();
    }
  });
}

export default {
  force, control, component, interaction, community, run
};
