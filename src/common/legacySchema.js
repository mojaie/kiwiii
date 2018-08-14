
/** @module common/legacySchema */

import d3 from 'd3';


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
    fields: [
      {'key': 'source'},
      {'key': 'target'},
      {'key': 'weight'}
    ],
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
  if (snapshot.nodeColor.field) {
    snapshot.nodeColor.field = json.snapshot.nodeColor.field.key;
    if (snapshot.nodeColor.field === '_index') {
      snapshot.nodeColor.field = 'index';
    }
  }
  if (snapshot.nodeColor.scale === 'ordinal') {
    snapshot.nodeColor.range = d3.schemeCategory20;
  }
  snapshot.nodeSize = json.snapshot.nodeSize.scale || {};
  if (json.snapshot.nodeSize.field) {
    snapshot.nodeSize.field = json.snapshot.nodeSize.field.key;
    if (snapshot.nodeSize.field === '_index') {
      snapshot.nodeSize.field = 'index';
    }
  }
  snapshot.nodeLabel = {};
  if (json.snapshot.nodeLabel.text) {
    snapshot.nodeLabel.text = json.snapshot.nodeLabel.text.key;
    if (snapshot.nodeLabel.text === '_index') {
      snapshot.nodeLabel.text = 'index';
    }
  }
  snapshot.nodeLabel.size = json.snapshot.nodeLabel.size;
  snapshot.nodeLabel.visible = json.snapshot.nodeLabel.visible;
  snapshot.nodeLabelColor = json.snapshot.nodeLabel.scale || {};
  if (json.snapshot.nodeLabel.field) {
    snapshot.nodeLabelColor.field = json.snapshot.nodeLabel.field.key;
    if (snapshot.nodeLabelColor.field === '_index') {
      snapshot.nodeLabelColor.field = 'index';
    }
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
  if (!(data.hasOwnProperty('schemaVersion') || data.hasOwnProperty('$schema'))) { // v0.7
    data = v07_to_v08_nodes(data);
  }
  if (data.schemaVersion == '0.8') {
    data = v08_nodes(data);
    data = v10_nodes(data);
  }
  if (!data.hasOwnProperty('$schema')) {
    delete data.schemaVersion;
    delete data.revision;
    data.$schema = "https://mojaie.github.io/flashflood/_static/specs/job_result_v1.0.json";
  }
  data.fields.forEach(e => {
    if (e.key === 'structure') {
      e.format = 'svg';
    }
    delete e.width;
    delete e.height;
  });
  return data;
}

function convertNetwork(json) {
  let data = json;
  if (!(data.edges.hasOwnProperty('schemaVersion') || data.edges.hasOwnProperty('$schema'))) { // v0.7
    data.nodes = v07_to_v08_nodes(data.nodes);
    data.edges = v07_to_v08_edges(data.edges, data.nodes.fields);
  }
  if (data.edges.schemaVersion == '0.8' || data.edges.schemaVersion === 0.1) {  // wrong conversion of '0.10'
    data = v08_graph(data);
    data.nodes = v10_nodes(data.nodes);
    data.edges = v10_edges(data.edges);
  }
  if (!data.edges.hasOwnProperty('$schema')) {
    delete data.nodes.schemaVersion;
    delete data.edges.schemaVersion;
    delete data.nodes.revision;
    delete data.edges.revision;
    data.nodes.$schema = "https://mojaie.github.io/flashflood/_static/specs/job_result_v1.0.json";
    data.edges.$schema = "https://mojaie.github.io/flashflood/_static/specs/job_result_v1.0.json";
  }
  return data;
}


function convertPackage(json) {
  let specs = {};
  if (!json.hasOwnProperty('views')) {
    const now = new Date();
    const isNW = json.hasOwnProperty('edges');
    const data = isNW ? convertNetwork(json) : convertTable(json);
    const nodes = isNW ? data.nodes : data;
    specs = {
      $schema: "https://mojaie.github.io/kiwiii/specs/package_v1.0.json",
      name: data.edges.name,
      views: [],
      dataset: []
    };
    specs.dataset.push({
      $schema: "https://mojaie.github.io/kiwiii/specs/collection_v1.0.json",
      collectionID: nodes.id,
      name: nodes.name,
      contents: [{
        $schema: nodes.$schema,
        workflowID: nodes.reference.workflow,
        name: nodes.name,
        fields: nodes.fields,
        records: nodes.records,
        created: nodes.created,
        status: nodes.status,
        query: nodes.query,
        execTime: nodes.execTime,
        progress: nodes.progress
      }]
    });
    specs.views.push({
      $schema: "https://mojaie.github.io/kiwiii/specs/datagrid_v1.0.json",
      viewID: nodes.id,
      name: nodes.name,
      viewType: "datagrid",
      rows: nodes.id,
      fields: nodes.fields,
      sortOrder: null,
      filterText: null,
      checkpoints: [{
        type: 'convert',
        date: now.toString(),
        description: 'converted from legacy format'
      }]
    });
    if (isNW) {
      specs.dataset.push({
        $schema: "https://mojaie.github.io/kiwiii/specs/collection_v1.0.json",
        collectionID: data.edges.id,
        name: data.edges.name,
        contents: [{
          $schema: data.edges.$schema,
          workflowID: data.edges.reference.workflow,
          name: data.edges.name,
          fields: data.edges.fields,
          records: data.edges.records,
          created: data.edges.created,
          status: data.edges.status,
          query: data.edges.query,
          execTime: data.edges.execTime,
          progress: data.edges.progress
        }]
      });
      specs.views.push({
        $schema: "https://mojaie.github.io/kiwiii/specs/network_v1.0.json",
        viewID: data.edges.id,
        name: data.edges.name,
        viewType: "network",
        nodes: nodes.id,
        edges: data.edges.id,
        nodeColor: data.edges.snapshot.nodeColor,
        nodeSize: data.edges.snapshot.nodeSize,
        nodeLabel: data.edges.snapshot.nodeLabel,
        nodeLabelColor: data.edges.snapshot.nodeLabelColor,
        edgeWidth: data.edges.snapshot.edgeWidth,
        edgeLabel: data.edges.snapshot.edgeLabel,
        networkThreshold: data.edges.snapshot.networkThreshold,
        networkThresholdCutoff: data.edges.snapshot.networkThresholdCutoff,
        fieldTransform: data.edges.snapshot.fieldTransform,
        coords: data.edges.snapshot.coords,
        checkpoints: [{
          type: 'convert',
          date: now.toString(),
          description: 'converted from legacy format'
        }]
      });
    }
    specs.views.filter(e => e.viewType === 'network')
      .forEach(view => {
        view.minConnThld = view.networkThresholdCutoff;
        view.currentConnThld = view.networkThreshold;
        if (view.hasOwnProperty('nodeLabel')) {
          view.nodeLabel.field = view.nodeLabel.text;
        }
        if (view.hasOwnProperty('edgeLabel')) {
          view.edgeLabel.field = 'weight';
        }
        if (view.hasOwnProperty('edgeWidth')) {
          view.edgeWidth.field = 'weight';
        }
      });
  } else {
    specs = json;
  }
  specs.views.filter(e => e.viewType === 'network')
    .forEach(view => {
      if (!view.nodeColor.field) { view.nodeColor.field = 'index' ;}
      if (!view.nodeSize.field) { view.nodeSize.field = 'index' ;}
      if (!view.nodeLabel.field) { view.nodeLabel.field = 'index' ;}
      if (!view.nodeLabelColor.field) { view.nodeLabelColor.field = 'index' ;}
      if (!view.edgeColor) {
        view.edgeColor = {
          field: 'weight', color: 'monogray',
          scale: 'linear', domain: [0, 1],
          range: ['#999999', '#999999'], unknown: '#cccccc'
        };
      } else if (!view.edgeColor.field) { view.edgeColor.field = 'weight' ;}
      if (!view.edgeWidth.field) { view.edgeWidth.field = 'weight' ;}
      if (!view.edgeLabel.field) { view.edgeLabel.field = 'weight' ;}
      if (!view.edgeLabelColor) {
        view.edgeLabelColor = {
          field: 'weight', color: 'monoblack',
          scale: 'linear', domain: [1, 1],
          range: ['#333333', '#333333'], unknown: '#cccccc'
        };
      } else if (!view.edgeLabelColor.field) { view.edgeLabelColor.field = 'weight' ;}
    });
  return specs;
}


export default {
  convertPackage
};
