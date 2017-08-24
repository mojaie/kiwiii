
import d3 from 'd3';

import {formChecked, formValue} from './helper/d3Selection.js';
import {colorPresets} from './helper/d3Scale.js';
import {fetchable} from './helper/definition.js';
import {loadJSON, fetchJSON, downloadJSON} from './helper/file.js';
import {loader} from './Loader.js';
import {
  getGlobalConfig, localChemInstance, getTable, insertTable, updateTable,
  joinColumn, getCurrentTable, updateTableAttribute
} from './store/StoreConnection.js';
import {renderStatus, initialize, initializeWithData} from './component/Header.js';
import {graphConfigDialog, communityDialog} from './component/Dialog.js';

import {setForce, tick, end, fieldWidth, fieldHeight} from './graph/GraphForce.js';
import {
  nodeColorControlBox, nodeSizeControlBox, nodeLabelControlBox, edgeControlBox,
  updateNodeImage, mainControlBox, updateControl
} from './graph/GraphControlBox.js';
import {graphNodes, graphEdges} from './graph/GraphComponent.js';
import {zoom, restart, relax, stickNodes} from './graph/GraphInteraction.js';
import {communityDetection} from './graph/communityDetection.js';


const localServer = localChemInstance();


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
  const currentId = getGlobalConfig('urlQuery').id;
  return updateTableAttribute(currentId, 'snapshot', takeSnapshot())
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
    updateControl(snapshot.nodeColor);
  }
  if (snapshot.hasOwnProperty('nodeSize')) {
    d3.select('#size-control').datum(snapshot.nodeSize);
    updateControl(snapshot.nodeSize);
  }
  if (snapshot.hasOwnProperty('nodeLabel')) {
    d3.select('#label-control').datum(snapshot.nodeLabel);
    updateControl(snapshot.nodeLabel);
  }
  if (snapshot.hasOwnProperty('edge')) {
    d3.select('#edge-control').datum(snapshot.edge);
    updateControl(snapshot.edge);
  }
  if (snapshot.hasOwnProperty('fieldTransform')) {
    const tf = snapshot.fieldTransform;
    const transform = d3.zoomIdentity.translate(tf.x, tf.y).scale(tf.k);
    d3.select('#graph-contents').attr('transform', transform);
    d3.select('#graph-field').call(zoom.transform, transform);
  }
  if (snapshot.hasOwnProperty('nodePositions')) {
    d3.selectAll('.node').each((d, i) => {
      d.x = snapshot.nodePositions[i].x;
      d.y = snapshot.nodePositions[i].y;
    });
  }
  updateNodeImage(snapshot);
}


function getCurrentGraph() {
  return getCurrentTable().then(edges => {
    return getTable(edges.nodeTableId).then(nodes => {
      return {edges: edges, nodes: nodes};
    });
  });
}


function start() {
  return getCurrentGraph().then(g => {
    renderStatus(g.edges, refresh, abort);
    const edgesToDraw = g.edges.records
      .filter(e => e.weight >= g.edges.networkThreshold);
    const edgeDensity = d3.format('.3e')(edgesToDraw.length / g.edges.searchCount);
    d3.select('#edge-density').text(edgeDensity);
    d3.select('#network-thld').text(g.edges.networkThreshold);
    graphEdges(d3.select('#graph-contents'), edgesToDraw);
    graphNodes(d3.select('#graph-contents'), g.nodes.records);
    d3.select('#show-struct').property('checked', false);  // for fast loading
    setForce(
      g.nodes.records, edgesToDraw, tick,
      () => {
        end();
        saveSnapshot();
      });
    if (g.edges.hasOwnProperty('snapshot')) {
      resume(g.edges.snapshot);
      stickNodes();
    } else {
      restart();
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
    graphConfigDialog(g.edges, thld => {
      return updateTableAttribute(g.edges.id, 'networkThreshold', thld)
        .then(saveSnapshot).then(start);
    });
    communityDialog(query => {
      const nodeIds = g.nodes.records.map(e => e._index);
      const visibleEdges = g.edges.records
        .filter(e => e.weight >= g.edges.networkThreshold);
      const community = communityDetection(
        nodeIds, visibleEdges, {nulliso: query.nulliso}
      );
      const mapping = {
        key: '_index',
        column: {
          key: query.name, name: query.name, sort: 'numeric', visible: true
        },
        mapping: community
      };
      joinColumn(mapping, g.nodes.id)
        .then(() => {
          const snapshot = takeSnapshot();
          snapshot.nodeColor.column = query.name;
          snapshot.nodeColor.scale = colorPresets
            .find(e => e.name === 'Categories').scale;
          const currentId = getGlobalConfig('urlQuery').id;
          return updateTableAttribute(currentId, 'snapshot', snapshot)
            .then(() => console.info('snapshot saved'));
        }).then(render);
    });
    mainControlBox();
    nodeColorControlBox(g.nodes.columns);
    nodeSizeControlBox(g.nodes.columns);
    nodeLabelControlBox(g.nodes.columns);
    edgeControlBox();
    d3.select('#stick-nodes')
      .on('change', function() {
        formChecked(this) === true ? stickNodes() : relax();
      });
    d3.select('#nodetable').attr('href', `datatable.html?id=${g.edges.nodeTableId}`);
    d3.select('#rename')
      .on('click', () => {
        d3.select('#prompt-title').text('Rename table');
        d3.select('#prompt-label').text('New name');
        d3.select('#prompt-input').attr('value', g.edges.name);
        d3.select('#prompt-submit')
          .on('click', () => {
            const name = formValue('#prompt-input');
            return updateTableAttribute(g.edges.id, 'name', name)
              .then(getCurrentTable)
              .then(t => renderStatus(t, refresh, abort));
          });
      });
    return start();
  });
}


function fetch_(command) {
  return getCurrentTable().then(edges => {
    if (!fetchable(edges)) return;
    const query = { id: edges.id, command: command };
    return localServer.getRecords(query).then(updateTable);
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
    insertTable(grf.nodes),
    insertTable(grf.edges)
  ]).then(() => {
    window.location = `graph.html?id=${grf.edges.id}`;
  });
}


d3.select('#export')
  .on('click', () => {
    // Working copy of edges and nodes are modified by d3.force.
    // Load original data from store.
    return getCurrentGraph().then(g => downloadJSON(g, g.edges.name));
  });


d3.select('#graph-field')
  .attr('viewBox', `0 0 ${fieldWidth} ${fieldHeight}`)
  .call(zoom);


d3.select('#snapshot')
  .on('click', saveSnapshot);


d3.select('#restart')
  .on('click', restart);


d3.select('#import-json')
  .on('click', () => document.getElementById('select-file').click());
d3.select('#select-file')
  .on('change', () => {
    const file = document.getElementById('select-file').files[0];
    loadJSON(file).then(loadNewGraph);
  });


function run() {
  if (getGlobalConfig('urlQuery').hasOwnProperty('location')) {
    const url = getGlobalConfig('urlQuery').location;
    return fetchJSON(url)
      .then(tbls => {
        return Promise.all([
          insertTable(tbls.nodes),
          insertTable(tbls.edges)
        ]).then(() => tbls.edges.id);
      })
      .then(id => {
        window.location = `graph.html?id=${id}`;
      });
  }
  return loader().then(() => {
    if (getGlobalConfig('urlQuery').hasOwnProperty('id')) {
      initializeWithData();
      return fetch_('update').then(render);
    } else {
      initialize();
      return Promise.resolve();
    }
  });
}
run();
