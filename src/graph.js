
/** @module graph */

import d3 from 'd3';

import {default as d3form} from './helper/d3Form.js';
import {default as d3scale} from './helper/d3Scale.js';
import {default as def} from './helper/definition.js';
import {default as hfile} from './helper/file.js';
import {default as win} from './helper/window.js';
import {default as common} from './common.js';
import {default as store} from './store/StoreConnection.js';
import {default as header} from './component/Header.js';
import {default as dialog} from './component/Dialog.js';
import {default as force} from './graph/GraphForce.js';
import {default as dflt} from './graph/defaultGraphControl.js';
import {default as control} from './graph/GraphControlBox.js';
import {default as component} from './graph/GraphComponent.js';
import {default as interaction} from './graph/GraphInteraction.js';
import {default as community} from './graph/communityDetection.js';


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
  return store.updateTableAttribute(win.URLQuery().id, 'snapshot', takeSnapshot())
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
  d3.select('#graph-contents').attr('transform', transform);
  d3.select('#graph-field').call(interaction.zoom.transform, transform);
  d3.selectAll('.node').each((d, i) => {
    d.x = snapshot.nodePositions[i].x;
    d.y = snapshot.nodePositions[i].y;
  });
  control.updateNodeImage(snapshot);
}


function getGraph() {
  return store.getTable(win.URLQuery().id)
    .then(edges => {
      return store.getTable(edges.nodesID)
        .then(nodes => {
          return {edges: edges, nodes: nodes};
        });
    });
}


function start() {
  return getGraph()
    .then(g => {
      header.renderStatus(g.edges,
        () => common.fetchResults().then(render),
        () => common.fetchResults('abort').then(render));
      const edgesToDraw = g.edges.records
        .filter(e => e.weight >= g.edges.networkThreshold);
      const logD = d3.format('.2f')(Math.log10(edgesToDraw.length / g.edges.taskCount));
      d3.select('#edge-density').text(logD);
      d3.select('#network-thld').text(g.edges.networkThreshold);
      component.graphEdges(d3.select('#graph-contents'), edgesToDraw);
      component.graphNodes(d3.select('#graph-contents'), g.nodes.records);

      // TODO: refactor
      d3.select('#color-control').datum(dflt.defaultNodeColor);
      control.updateControl(dflt.defaultNodeColor);
      d3.select('#size-control').datum(dflt.defaultNodeSize);
      control.updateControl(dflt.defaultNodeSize);
      d3.select('#label-control').datum(dflt.defaultNodeLabel);
      control.updateControl(dflt.defaultNodeLabel);
      d3.select('#main-control').datum(dflt.defaultNodeContent);
      d3.select('#show-struct')
        .property('checked', dflt.defaultNodeContent.structure.visible);
      d3.select('#edge-control').datum(dflt.defaultEdge);
      control.updateControl(dflt.defaultEdge);
      control.updateNodeImage({
        nodeColor: dflt.defaultNodeColor,
        nodeSize: dflt.defaultNodeSize,
        nodeLabel: dflt.defaultNodeLabel,
        nodeContent: dflt.defaultNodeContent
      });
      control.updateEdge(dflt.defaultEdge);

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
  return getGraph()
    .then(g => {
      g.nodes.records.forEach(e => { delete e._mol; });
      dialog.graphConfigDialog(
          g.edges.networkThreshold, g.edges.query.threshold, thld => {
        return store.updateTableAttribute(win.URLQuery().id, 'networkThreshold', thld)
          .then(saveSnapshot)
          .then(start);
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
          field: def.defaultFieldProperties([{key: query.name, valueType: 'numeric'}]),
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
      control.mainControlBox();
      control.nodeColorControlBox(g.nodes.fields);
      control.nodeSizeControlBox(g.nodes.fields);
      control.nodeLabelControlBox(g.nodes.fields);
      control.edgeControlBox();
      d3.select('#stick-nodes')
        .on('change', function() {
          d3form.checked(this) === true ? interaction.stickNodes() : interaction.relax();
        });
      d3.select('#nodetable').attr('href', `datatable.html?id=${g.edges.nodesID}`);
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
      return start();
    });
}


function loadNewGraph(data) {
  return common.interactiveInsert(data.nodes)
    .then(id => {
      data.edges.nodesID = id;
      return common.interactiveInsert(data.edges);
    })
    .then(id => {
      window.location = `graph.html?id=${id}`;
    });
}


function run() {
  d3.select('#export')
    .on('click', () => {
      // Working copy of edges and nodes are modified by d3.force.
      // Load original data from store.
      return getGraph().then(g => hfile.downloadJSON(g, g.edges.name));
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
  // location parameter enables direct access to graph JSON via HTTP
  if (win.URLQuery().hasOwnProperty('location')) {
    return hfile.fetchJSON(win.URLQuery().location)
      .then(data => {
        return common.interactiveInsert(data.nodes)
          .then(id => {
            data.edges.nodesID = id;
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
  force, control, component, interaction, community, run
};
