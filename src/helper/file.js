
/** @module helper/file */

import pako from 'pako';

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
    e.sortType = e.sort;
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
      id: 'label', size: 12, text: '_index', visible: false, field: nodeFields[0],
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
    nodesID: json.nodeTableId,
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

function v07_to_v08_convert(json) {
  if (json.hasOwnProperty('edges')) {
    const nodes = v07_to_v08_nodes(json.nodes);
    const edges = v07_to_v08_edges(json.edges, nodes.fields);
    return {nodes: nodes, edges: edges};
  } else {
    return v07_to_v08_nodes(json);
  }
}


function readFile(file, sizeLimit, blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const truncated = sizeLimit ? file.slice(0, sizeLimit) : file;
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    if (blob) {
      reader.readAsArrayBuffer(truncated);
    } else {
      reader.readAsText(truncated);
    }
  });
}


function parseJSON(data, compressed) {
  const text = compressed ? pako.inflate(data, {to: 'string'}) : data;
  const json = JSON.parse(text);
  if (json.hasOwnProperty('schemaVersion')) return json;
  if (json.hasOwnProperty('edges')) {
    if (json.edges.hasOwnProperty('schemaVersion')) return json;
  }
  return v07_to_v08_convert(json);
}


function loadJSON(file) {
  const compressed = file.name.endsWith('c') || file.name.endsWith('.gz');
  return readFile(file, false, compressed)
    .then(data => parseJSON(data, compressed));
}


function fetchJSON(url) {
  const decoded = decodeURIComponent(url);
  const compressed = decoded.endsWith('c') || decoded.endsWith('.gz');
  return fetch(decoded)
    .then(res => compressed ? res.arrayBuffer() : res.json())
    .then(data => parseJSON(data, compressed));
}


function downloadDataFile(data, name) {
  try {
    // cannot hundle large file with dataURI scheme
    // url = 'data:application/json,' + encodeURIComponent(JSON.stringify(json))
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.download = name;
    a.href = url;
    // a.click() does not work on firefox
    a.dispatchEvent(new MouseEvent('click', {
      'view': window,
      'bubbles': true,
      'cancelable': false
    }));
    // window.URL.revokeObjectURL(url) does not work on firefox
  } catch (e) {
    // no DOM (unit testing)
  }
}


function downloadJSON(json, name, compress=true) {
  const str = JSON.stringify(json);
  const data = compress ? pako.gzip(str) : str;
  const c = compress ? 'c' : 'r';
  const ext = json.hasOwnProperty('edges') ? `.gf${c}` :  `.nd${c}`;
  downloadDataFile(data, `${name}${ext}`);
}


export default {
  readFile, parseJSON, loadJSON, fetchJSON,
  downloadDataFile, downloadJSON
};
