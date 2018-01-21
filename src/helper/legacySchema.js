
/** @module helper/legacySchema */

import d3 from 'd3';
import {default as def} from './definition.js';


const statusConv = {
  Queued: 'ready',
  'In progress': 'running',
  Aborting: 'running',
  Aborted: 'aborted',
  Completed: 'done',
  Failure: 'failure'
};

const dataTypeConv = {
  datatable: 'nodes',
  connection: 'edges'
};

function v07_to_v08_nodes(json) {
  const fields = json.columns.map(e => {
    if (e.sort === 'numeric') {
      e.format = 'numeric';
    } else if (e.sort === 'text') {
      e.format = 'text';
    } else if (e.sort === 'none') {
      e.format = 'raw';
    }
    return e;
  });
  return {
    id: json.id,
    name: json.name,
    dataType: dataTypeConv[json.format],
    schemaVersion: 0.8,
    revision: 0,
    status: statusConv[json.status],
    fields: fields,
    records: json.records,
    query: json.query,
    taskCount: json.searchCount,
    doneCount: json.searchDoneCount | json.searchCount,
    resultCount: json.recordCount,
    progress: json.progress | 100,
    execTime: json.execTime,
    created: json.startDate | json.responseDate,
  };
}

function v07_to_v08_edges(json, nodeFields) {
  const snp = {
    fieldTransform: json.snapshot.fieldTransform,
    nodePositions: json.snapshot.nodePositions,
    nodeColor: {},
    nodeSize: {},
    nodeLabel: {},
    edge: {}
  };
  if (json.snapshot.hasOwnProperty('nodeColor')) {
    snp.nodeColor.id = json.snapshot.nodeColor.id;
    snp.nodeColor.scale = json.snapshot.nodeColor.scale;
    snp.nodeColor.field = nodeFields.find(e => e.key === json.snapshot.nodeColor.column);
  } else {
    snp.nodeColor = {
      id: 'color', field: nodeFields[0],
      scale: {scale: 'linear', domain: [0, 1], range: ['black', 'white'], unknown: 'gray'}
    };
  }
  if (json.snapshot.hasOwnProperty('nodeSize')) {
    snp.nodeSize.id = json.snapshot.nodeSize.id;
    snp.nodeSize.scale = json.snapshot.nodeSize.scale;
    snp.nodeSize.field = nodeFields.find(e => e.key === json.snapshot.nodeSize.column);
  } else {
    snp.nodeSize = {
      id: 'size', field: nodeFields[0],
      scale: {scale: 'linear', domain: [0, 1], range: [20, 20], unknown: 20}
    };
  }
  if (json.snapshot.hasOwnProperty('nodeLabel')) {
    snp.nodeLabel.id = json.snapshot.nodeLabel.id;
    snp.nodeLabel.size = json.snapshot.nodeLabel.size;
    snp.nodeLabel.text = json.snapshot.nodeLabel.text;
    snp.nodeLabel.visible = json.snapshot.nodeLabel.visible;
    snp.nodeLabel.scale = json.snapshot.nodeLabel.scale;
    snp.nodeLabel.field = nodeFields.find(e => e.key === json.snapshot.nodeLabel.column);
  } else {
    snp.nodeLabel = {
      id: 'label', size: 12, text: 'index', visible: false, field: nodeFields[0],
      scale: {scale: 'linear', domain: [0, 1], range: ['black', 'white'], unknown: 'gray'}
    };
  }
  if (json.snapshot.hasOwnProperty('nodeContent')) {
    snp.nodeContent = json.snapshot.nodeContent;
  } else {
    snp.nodeContent = {structure: {visible: false}};
  }
  if (json.snapshot.hasOwnProperty('edge')) {
    snp.edge = json.snapshot.edge;
  } else {
    snp.edge = {
      id: 'label', label: {size: 10, visible: false}, visible: true,
      scale: {scale: 'linear', domain: [0, 1], range: [5, 5], unknown: 5}
    };
  }
  return {
    id: json.id,
    name: json.name,
    dataType: dataTypeConv[json.format],
    schemaVersion: 0.8,
    revision: 0,
    reference: {
      nodes: json.nodeTableId
    },
    status: statusConv[json.status],
    fields: def.defaultFieldProperties([
      {'key': 'source'},
      {'key': 'target'},
      {'key': 'weight'}
    ]),
    records: json.records,
    query: json.query,
    networkThreshold: json.networkThreshold,
    taskCount: json.searchCount,
    doneCount: json.searchDoneCount | json.searchCount,
    resultCount: json.recordCount,
    progress: json.progress | 100,
    execTime: json.execTime,
    created: json.startDate | json.responseDate,
    snapshot: snp
  };
}


function v08_nodes(json) {
  json.records.forEach((e, i) => {
    e.index = i;
    e.structure = e._structure;
    delete e._index;
    delete e._structure;
  });
  json.fields.forEach(e => {
    if (e.key === '_index') e.key = 'index';
    if (e.key === '_structure') e.key = 'structure';
    if (e.sort === 'numeric') e.format = 'numeric';
    if (e.sort === 'text') e.format = 'text';
    if (e.sort === 'none') e.format = 'raw';
  });
  return json;
}

function v08_graph(json) {
  if (!json.edges.hasOwnProperty('reference')) { // ver0.8.0-0.8.1
    json.edges.reference = {nodes: json.edges.nodesID};
  }
  if (json.nodes.fields.find(e => e.key === '_index')) {
    const idx_converter = {};
    json.nodes.records.forEach((e, i) => {
        e.index = i;
        e.structure = e._structure;
        idx_converter[e._index] = e.index;
        delete e._index;
        delete e._structure;
    });
    json.edges.records.forEach(e => {
        e.source = idx_converter[e.source];
        e.target = idx_converter[e.target];
    });
    json.nodes.fields.forEach(e => {
      if (e.key === '_index') e.key = 'index';
      if (e.key === '_structure') e.key = 'structure';
      if (e.sort === 'numeric') e.format = 'numeric';
      if (e.sort === 'text') e.format = 'text';
      if (e.sort === 'none') e.format = 'raw';
    });
  }
  return json;
}

function v10_nodes(json) {
  return {
    id: json.id,
    name: json.name,
    dataType: json.dataType,
    schemaVersion: '0.10',
    revision: json.revision,
    status: json.status,
    fields: json.fields,
    records: json.records,
    query: json.query,
    progress: json.progress,
    execTime: json.execTime,
    created: json.created,
    reference: {}
  };
}


function v10_edges(json) {
  const snapshot = {
    networkThreshold: json.networkThreshold
  };
  snapshot.nodeContentVisible = json.snapshot.nodeContent.structure.visible;
  snapshot.nodeColor = json.snapshot.nodeColor.scale || {};
  snapshot.nodeColor.field = json.snapshot.nodeColor.field.key;
  if (snapshot.nodeColor.field === '_index') {
    snapshot.nodeColor.field = 'index';
  }
  if (snapshot.nodeColor.scale === 'ordinal') {
    snapshot.nodeColor.range = d3.schemeCategory20;
  }
  snapshot.nodeSize = json.snapshot.nodeSize.scale || {};
  snapshot.nodeSize.field = json.snapshot.nodeSize.field.key;
  if (snapshot.nodeSize.field === '_index') {
    snapshot.nodeSize.field = 'index';
  }
  snapshot.nodeLabel = {};
  snapshot.nodeLabel.text = json.snapshot.nodeLabel.text.key;
  if (snapshot.nodeLabel.text === '_index') {
    snapshot.nodeLabel.text = 'index';
  }
  snapshot.nodeLabel.size = json.snapshot.nodeLabel.size;
  snapshot.nodeLabel.visible = json.snapshot.nodeLabel.visible;
  snapshot.nodeLabelColor = json.snapshot.nodeLabel.scale || {};
  snapshot.nodeLabelColor.field = json.snapshot.nodeLabel.field.key;
  if (snapshot.nodeLabelColor.field === '_index') {
    snapshot.nodeLabelColor.field = 'index';
  }
  if (snapshot.nodeLabelColor.scale === 'ordinal') {
    snapshot.nodeLabelColor.range = d3.schemeCategory20;
  }
  snapshot.edgeVisible = json.snapshot.edge.visible;
  snapshot.edgeWidth = json.snapshot.edge.scale || {};
  snapshot.edgeLabel = {};
  snapshot.edgeLabel.size = json.snapshot.edge.label.size;
  snapshot.edgeLabel.visible = json.snapshot.edge.label.visible;
  snapshot.networkThreshold = json.networkThreshold || json.query.threshold;
  snapshot.coords = json.snapshot.nodePositions;
  // TODO: when created date is lost
  return {
    id: json.id,
    name: json.name,
    dataType: json.dataType,
    schemaVersion: '0.10',
    revision: json.revision,
    status: json.status,
    fields: json.fields,
    records: json.records,
    query: {params: json.query},
    progress: json.progress,
    execTime: json.execTime,
    created: json.created,
    snapshot: snapshot,
    reference: json.reference
  };
}

function convertTable(json) {
  let data = json;
  if (!data.hasOwnProperty('schemaVersion')) { // v0.7
    data = v07_to_v08_nodes(data);
  }
  if (data.schemaVersion == '0.8') {
    data = v08_nodes(data);
    data = v10_nodes(data);
  }
  return data;
}

function convertNetwork(json) {
  let data = json;
  if (!data.edges.hasOwnProperty('schemaVersion')) { // v0.7
    data.nodes = v07_to_v08_nodes(data.nodes);
    data.edges = v07_to_v08_edges(data.edges, data.nodes.fields);
  }
  if (data.edges.schemaVersion == '0.8') {
    data = v08_graph(data);
    data.nodes = v10_nodes(data.nodes);
    data.edges = v10_edges(data.edges);
  }
  return data;
}


export default {
  convertTable, convertNetwork
};
