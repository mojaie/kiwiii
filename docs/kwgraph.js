// https://github.com/mojaie/kiwiii-client Version 0.7.0. Copyright 2017 Seiji Matsuoka.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3'), require('pako'), require('Dexie'), require('vega'), require('jLouvain')) :
	typeof define === 'function' && define.amd ? define(['d3', 'pako', 'Dexie', 'vega', 'jLouvain'], factory) :
	(global.kwgraph = factory(global.d3,global.pako,global.Dexie,global.vega,global.jLouvain));
}(this, (function (d3,pako,Dexie,vega,jLouvain) { 'use strict';

const debug = true;

d3 = d3 && d3.hasOwnProperty('default') ? d3['default'] : d3;
pako = pako && pako.hasOwnProperty('default') ? pako['default'] : pako;
Dexie = Dexie && Dexie.hasOwnProperty('default') ? Dexie['default'] : Dexie;
vega = vega && vega.hasOwnProperty('default') ? vega['default'] : vega;
jLouvain = jLouvain && jLouvain.hasOwnProperty('default') ? jLouvain['default'] : jLouvain;

function formValue(selector) {
  return d3.select(selector).node().value;
}





function formFloat(selector) {
  return parseFloat(d3.select(selector).node().value);
}


function formChecked(selector) {
  return d3.select(selector).node().checked;
}














function selectedOptionData(selector) {
  const si = d3.select(selector).property('selectedIndex');
  return d3.select(selector).selectAll('option').data().find((d, i) => i === si);
}

const categoryMany = d3.schemeSet1
  .concat(d3.schemeSet3, d3.schemePastel2, d3.schemeSet2);
const defaultSizeRange = [20, 80];

const colorPresets = [
  {
    name: 'Activity',
    scale: {
      scale: 'log',
      domain: [1e-4, 1e-6],
      range: ['#708090', '#7fffd4'],
      unknown: '#696969'
    }
  },
  {
    name: 'Percent',
    scale: {
      scale: 'linear',
      domain: [0, 100],
      range: ['#708090', '#7fffd4'],
      unknown: '#696969'
    }
  },
  {
    name: 'True or False',
    scale: {
      scale: 'quantize',
      domain: [1, 0],
      range: ['#708090', '#7fffd4'],
      unknown: '#696969'
    }
  },
  {
    name: 'LogP',
    scale: {
      scale: 'linear',
      domain: [-2, 8],
      range: ['#6495ed', '#ccff66', '#ffa500'],
      unknown: '#696969'
    }
  },
  {
    name: 'Categories',
    scale: {
      scale: 'ordinal',
      range: d3.schemeCategory20,
      unknown: '#dedede'
    }
  },
  {
    name: 'ManyCategories',
    scale: {
      scale: 'ordinal',
      range: categoryMany,
      unknown: '#dedede'
    }
  }
];

const sizePresets = [
  {
    name: 'Activity',
    scale: {
      scale: 'log',
      domain: [1e-4, 1e-6],
      range: defaultSizeRange,
      unknown: defaultSizeRange[0]
    }
  },
  {
    name: 'Percent',
    scale: {
      scale: 'linear',
      domain: [0, 100],
      range: defaultSizeRange,
      unknown: defaultSizeRange[0]
    }
  },
  {
    name: 'True or False',
    scale: {
      scale: 'quantize',
      domain: [1, 0],
      range: defaultSizeRange,
      unknown: defaultSizeRange[0]
    }
  },
  {
    name: 'LogP',
    scale: {
      scale: 'linear',
      domain: [-2, 6],
      range: defaultSizeRange,
      unknown: defaultSizeRange[0]
    }
  }
];

const edgeWidthPresets = [
  {
    name: 'Universal',
    scale: {
      scale: 'linear',
      domain: [0.3, 1],
      range: [0.5, 5],
      unknown: 1
    }
  },
  {
    name: 'Thin',
    scale: {
      scale: 'linear',
      domain: [0.5, 1],
      range: [0.5, 3],
      unknown: 1
    }
  },
  {
    name: 'Amplified',
    scale: {
      scale: 'linear',
      domain: [0.5, 1],
      range: [1, 10],
      unknown: 1
    }
  }
];

const colorPalette = [
  {name: 'Aquamarine', range: ['#778899', '#7fffd4'], unknown: '#696969'},
  {name: 'Chartreuse', range: ['#778899', '#7fff00'], unknown: '#696969'},
  {name: 'Salmon', range: ['#778899', '#fa8072'], unknown: '#696969'},
  {name: 'Violet', range: ['#778899', '#ee82ee'], unknown: '#696969'},
  {name: 'blue-red', range: ['#87ceeb', '#fff5ee', '#fa8072'], unknown: '#696969'},
  {name: 'Spectrum', range: ['#6495ed', '#ccff66', '#ffa500'], unknown: '#696969'}
];

const scaleTypes = [
  {name: 'linear', func: d3.scaleLinear()},
  {name: 'log', func: d3.scaleLog()},
  {name: 'quantize', func: d3.scaleQuantize()},
  {name: 'ordinal', func: d3.scaleOrdinal()}
];

const sizeScaleTypes = [
  {name: 'linear', func: d3.scaleLinear()},
  {name: 'log', func: d3.scaleLog()},
  {name: 'quantize', func: d3.scaleQuantize()}
];

function scaleFunction(scale) {
  let sf = scaleTypes.find(e => e.name === scale.scale).func;
  let domain = scale.domain;
  if (scale.range.length === 3) {
    const mid = (parseFloat(scale.domain[0]) + parseFloat(scale.domain[1])) / 2;
    domain = [scale.domain[0], mid, scale.domain[1]];
  }
  if (scale.scale !== 'ordinal') {
    sf = sf.domain(domain);
  }
  sf = sf.range(scale.range);
  if (['linear', 'log'].includes(scale.scale)) {
    sf = sf.clamp(true);
  }
  return d => {
    if (d === '' || typeof d === 'undefined' || d === null) {
      return scale.unknown;
    }
    if (scale.scale !== 'ordinal' && parseFloat(d) != d) {
      return scale.unknown;
    }
    if (scale.scale === 'log' && d <= 0) {
      return scale.unknown;
    }
    const result = sf(d);
    if (result === undefined) {
      return scale.unknown;
    }
    return result;
  };
}

function fetchable(tbl) {
  return ['In progress', 'Queued', 'Aborting'].includes(tbl.status);
}


function abortRequestable(tbl) {
  return ['In progress', 'Queued'].includes(tbl.status);
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
  return JSON.parse(text);
}


function loadJSON(file) {
  const compressed = file.name.endsWith('.gz');
  return readFile(file, false, compressed)
    .then(data => parseJSON(data, compressed));
}


function fetchJSON(url) {
  const decoded = decodeURIComponent(url);
  const compressed = decoded.endsWith('.gz');
  return fetch(decoded)
    .then(res => compressed ? res.arrayBuffer() : res.json())
    .then(data => parseJSON(data, compressed));
}


function downloadDataFile(data, name) {
  try {
    // cannot hundle large file with dataURI scheme
    // url = "data:application/json," + encodeURIComponent(JSON.stringify(json))
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.download = name;
    a.href = url;
    // a.click() does not work on firefox
    a.dispatchEvent(new MouseEvent("click", {
      "view": window,
      "bubbles": true,
      "cancelable": false
    }));
    // window.URL.revokeObjectURL(url) does not work on firefox
  } catch (e) {
    // no DOM (unit testing)
  }
}


function downloadJSON(json, name, compress=true) {
  const str = JSON.stringify(json);
  const data = compress ? pako.gzip(str) : str;
  const ext = compress ? '.gz' : '';
  downloadDataFile(data, `${name}.json${ext}`);
}

// TODO: can indexed records improve query performance ?
// TODO: remove app table. no longer used

const schema = {
  app: 'key',
  items: 'id, format, responseDate',
  resources: 'idx, id'
};

let idb = new Dexie('Store');
idb.version(1).stores(schema);


function getAppSetting(key) {
  return idb.app.where('key').equals(key).first()
    .then(res => {
      if (res === undefined) return undefined;
      return res.value;
    });
}


function putAppSetting(k, v) {  // returns id in success
  return idb.app.put({ key: k, value: v });
}


function getResources$1() {
  return idb.resources.orderBy('idx')
    .toArray();
}


function putResources(data) { // returns last id in success
  return idb.resources.bulkPut(data);
}


function getAllItems() {
  return idb.items.orderBy('responseDate').reverse()
    .toArray();
}


function getItemsByFormat(format) {
  return idb.items.where('format').equals(format).reverse()
    .sortBy('responseDate');
}


function getItemById(tableId) {
  return idb.items.where('id').equals(tableId).first();
}


function updateItem(tableId, callback) {  // returns num of updated items
  return idb.items.where('id').equals(tableId).modify(callback);
}


function deleteItem(tableId) { // returns num of deleted items
  return idb.items.where('id').equals(tableId).delete();
}


function putItem(data) { // returns id in success
  return idb.items.put(data);
}


function reset$1() {
  // Try this before tackling with local db troubles
  return idb.delete().then(() => {
    idb = new Dexie('Store');
    idb.version(1).stores(schema);
  });
}

var store = {
  getAppSetting, putAppSetting, getResources: getResources$1, putResources,
  getAllItems, getItemsByFormat, getItemById,
  updateItem, deleteItem, putItem, reset: reset$1
};

class Fetcher {
  constructor() {
    this.baseURL = "";
    this.available = false;
  }

  xhrRequest(url, formData=null, options={}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('method' in options ? options.method : 'POST', url);
      xhr.responseType = 'responseType' in options ? options.responseType : 'json';
      xhr.withCredentials = 'withCredentials' in options ? options.withCredentials : false;
      xhr.onload = () => {
        if (xhr.status !== 200) {
          reject(xhr);
        } else {
          resolve(xhr.response);
        }
      };
      xhr.send(formData);
    });
  }

  now() {
    const now = new Date();
    return now.toString();
  }

  getResources() {
    // required
  }

  formatResult(cols, data) {
    // to be called by store.updateTable
    // required for chemical domain
    data.lastUpdated = this.now();
    return data;
  }

  getRecords() {
    // required
  }

  getRecordsByCompound() {
    // required for activity domain
  }

  getMapping() {
    // required for activity domain
  }

  getGraphEdges() {

  }
}

class LocalServerActivity extends Fetcher {
  constructor() {
    super();
    this.baseURL = './';
    this.domain = 'activity';
    this.entities = [];
  }

  serializedRequest(url, query={}) {
    const formData = new FormData();
    formData.set('query', JSON.stringify(query));
    return fetch(`${this.baseURL}${url}`,
      {method: 'post', body: formData, credentials: 'include'});
  }

  request(url, query={}) {
    const formData = new FormData();
    const qmap = new Map(Object.entries(query));
    qmap.forEach((v, k) => {
      if (Array.isArray(v)) {
        v.forEach(e => formData.append(k, e));
      } else {
        formData.set(k, v);
      }
    });
    return fetch(`${this.baseURL}${url}`,
      {method: 'post', body: formData, credentials: 'include'});
  }

  getResources() {
    return this.request('schema', {domain: this.domain})
      .then(res => res.json())
      .then(json => {
        json.resources.forEach(rsrc => {
          rsrc.domain = this.domain;
          rsrc.columns.forEach(col =>{
            if (!col.hasOwnProperty('name')) col.name = col.key;
            if (!col.hasOwnProperty('dataColumn')) col.dataColumn = col.key;
            if (!col.hasOwnProperty('method')) col.method = 'sql';
            col.visible = true;
          });
          this.entities.push(rsrc.entity);
        });
        this.available = true;
        return json.resources;
      });
  }

  getRecords(queries) {
    return this.serializedRequest('sql', queries)
      .then(res => res.json())
      .then(json => {
        json.domain = this.domain;
        return json;
      });
  }

  getRecordsByCompound(compound) {
    // TODO: this.entities
    const query = {
      method: 'sql',
      targets: this.entities,
      key: 'ID',
      values: [compound],
      operator: 'eq'
    };
    return this.getRecords(query);
  }

  getMapping(ids, column) {
    const query = {
      method: 'sql',
      targets: [column.entity],
      key: 'ID',
      values: ids,
      operator: 'fm'
    };
    return this.serializedRequest('sql', query)
      .then(res => res.json())
      .then(json => {
        const mapping = {};
        json.records.filter(row => row.hasOwnProperty(column.dataColumn))
          .forEach(row => { mapping[row.ID] = row[column.dataColumn]; });
        return {
          key: query.key,
          column: column,
          mapping: mapping,
          lastUpdated: this.now(),
        };
      });
  }

  status() {
    return this.request('server').then(res => res.json());
  }

  templates() {
    return this.request('templates').then(res => res.json());
  }

  strprev(query) {
    return this.serializedRequest('strprev', query).then(res => res.text());
  }

  exportExcel(query) {
    return this.request('xlsx', query).then(res => res.blob());
  }

  exportSDFile(query) {
    return this.request('exportsdf', query).then(res => res.text());
  }

  reportPreview(query) {
    return this.request('reportprev', query).then(res => res.json());
  }

  report(query) {
    return this.request('report', query).then(res => res.blob());
  }
}


class LocalServerChemical extends LocalServerActivity {
  constructor() {
    super();
    this.domain = 'chemical';
    this.hiddenColumns = ["_mw", "_mw_wo_sw", "_formula", "_logp", "_nonH"];
  }

  formatResult(cols, data) {
    if (cols.length === 0) {  // sdf
      data.columns.forEach(col => {
        col.visible = this.hiddenColumns.includes(col.key) ? false : true;
      });
      return data;
    }
    Array.prototype.push.apply(data.columns, cols);
    if (data.hasOwnProperty('extraColumns')) {
      Array.prototype.push.apply(data.columns, data.extraColumns);
      delete data.extraColumns;
    }
    data.columns.forEach(col => {
      if (!col.hasOwnProperty('name')) col.name = col.key;
      if (col.key === data.query.key) {
        col.visible = true;  // Search key
      } else {
        col.visible = this.hiddenColumns.includes(col.key) ? false : true;
      }
    });
    data.lastUpdated = this.now();
    return data;
  }

  getResources() {
    return this.request('schema', {domain: this.domain})
      .then(res => res.json())
      .then(json => {
        json.resources.forEach(rsrc => {
          rsrc.domain = this.domain;
          rsrc.columns.forEach(col =>{
            if (!col.hasOwnProperty('name')) col.name = col.key;
            if (!col.hasOwnProperty('dataColumn')) col.dataColumn = col.key;
            if (!col.hasOwnProperty('method')) col.method = 'chemsql';
            col.visible = true;
          });
        });
        this.available = true;
        return json.resources;
      });
  }

  getRecords(query) {
    let url;
    if (query.hasOwnProperty('command')) {
      url = 'rows';
    } else if (query.hasOwnProperty('nodeTableId')) {
      url = 'graph';
    } else if (['chemsql', 'sql'].includes(query.method)) {
      url = 'sql';
    } else {
      url = 'compute';
    }
    return this.serializedRequest(url, query)
      .then(res => res.json())
      .then(json => {
        json.domain = this.domain;
        return json;
      });
  }

  importSDF(query) {
    return this.request('sdf', query)
    .then(res => res.json())
    .then(json => {
      json.domain = this.domain;
      json.columns.forEach(col =>{
        col.visible = this.hiddenColumns.includes(col.key) ? false : true;
      });
      const now = new Date();
      json.lastUpdated = now.toString();
      return json;
    });
  }
}

class ScreenerFitting extends Fetcher {
  constructor() {
    super();
    this.resourceFile = 'screener_fitting.yaml';
    this.domain = null;
    this.baseURL = null;
  }

  getResources() {
    const formData = new FormData();
    formData.set('filename', this.resourceFile);
    return fetch('source', {method: 'post', body: formData, credentials: 'include'})
      .then(res => res.json())
      .then(json => {
        if (json.hasOwnProperty('enabled') && json.enabled === false) return;
        this.available = true;
        this.domain = json.domain;
        this.baseURL = json.url;
        return json.resources.map(rsrc => {
          rsrc.domain = json.domain;
          rsrc.entity = `${rsrc.qcsRefId}:${rsrc.layerIndex}`;
          delete rsrc.qcsRefId;
          delete rsrc.layerIndex;
          rsrc.columns.forEach(col => {
            if (!col.hasOwnProperty('name')) col.name = col.key;
            if (!col.hasOwnProperty('dataColumn')) col.dataColumn = col.key;
            col.visible = true;
          });
          return rsrc;
        });
    });
  }

  request(queryString) {
    return fetch(`${this.baseURL}${queryString}`, {
      method: 'GET',
      credentials : 'include'
    }).then(res => res.json());
  }

  requestRecords(queryString) {
    return this.request(queryString)
      .then(json => {
        const rcds = json.compounds.map(c => {
          return {
            ID: c.compoundId,
            qcsRefId: c.qcsRefId,
            layerIndex: c.layerIndex,
            drcPlot: c.fitting.drcPlot,
            AC50: c.fitting.linearAC50,
            hill: Math.round(c.fitting.hillCoefficient * 100) / 100
          };
        });
        return { records: rcds };
      });
  }

  getRecords(q) {
    const joinedIds = q.qcsRefIds.join('%2C');
    const queryString = `/compounds?qcsRefIds=${joinedIds}\
&layerIndices=${q.layerIndex - 1}\
&fields=compoundId%2Cfitting.drcPlot%2Cfitting.linearAC50%2Cfitting.hillCoefficient`;
    return this.requestRecords(queryString);
  }

  getRecordsByCompound(compound) {
    const queryString = `/compounds?q=compoundId%3A${compound}\
&fields=compoundId%2CqcsRefId%2ClayerIndex\
%2Cfitting.drcPlot%2Cfitting.linearAC50%2Cfitting.hillCoefficient`;
    return this.requestRecords(queryString);
  }

  getMapping(ids, column) {
    const refid_layer = column.entity.split(':');
    const query = {
      qcsRefId: refid_layer[0],
      layerIndex: parseInt(refid_layer[1])
    };
    return this.getRecords(query).then(res => {
      const mapping = {};
      res.records.filter(row => ids.includes(row.ID))
        .forEach(row => { mapping[row.ID] = row[column.dataColumn]; });
      return {
        key: 'ID',
        column: column,
        mapping: mapping,
        lastUpdated: this.now()
      };
    });
  }

  getDrcPlot(compoundId, plotId, min = -20, max = 120) {
    // compoundResult.fitting.drcPlot -> drcPlots/idstring
    // returns image/png
    const queryString = `/${plotId}?width=180&height=180&title=compoundId\
&activityRangeMin=${min}&activityRangeMax=${max}`;
    return this.request(queryString);
  }

  getQcsInfo(qcsRefIds) {
    const ids = qcsRefIds.map(e => `qcsRefId:${e}`).join(' OR ');
    const queryString = `/qcSessions?q=${ids}`;
    return this.request(queryString).then(res => res.qcSessions);
  }
}


class ScreenerRawValue extends ScreenerFitting{
  constructor() {
    super();
    this.resourceFile = 'screener_rawvalue.yaml';
  }

  getResources() {
    const formData = new FormData();
    formData.set('filename', this.resourceFile);
    return fetch('source', {method: 'post', body: formData, credentials: 'include'})
      .then(res => res.json())
      .then(json => {
        if (json.hasOwnProperty('enabled') && json.enabled === false) return;
        this.available = true;
        this.domain = json.domain;
        this.baseURL = json.url;
        return json.resources.map(rsrc => {
          rsrc.domain = json.domain;
          rsrc.entity = `${rsrc.qcsRefId}:${rsrc.layerIndex}`;
          delete rsrc.qcsRefId;
          delete rsrc.layerIndex;
          rsrc.columns.forEach(col => {
            col.key = 'rawValue';
            if (!col.hasOwnProperty('name')) col.name = col.key;
            if (!col.hasOwnProperty('dataColumn')) col.dataColumn = col.key;
            col.visible = true;
          });
          return rsrc;
        });
      });
  }

  requestRecords(queryString, pred) {
    return this.request(queryString).then(res => {
      const rcds = res.plates.filter(plt => plt.wells.hasOwnProperty('compoundIds'))
        .map(plt => {
          return plt.wells.compoundIds.map((c, i) => {
            return {
              ID: c,
              qcsRefId: plt.qcsRefId,
              layerIndex: plt.layerIndex,
              rawValue: plt.wells.rawValues[i]
            };
          }).filter(pred);
        }).extend();
      return { records: rcds };
    });
  }

  getRecords(q) {
    const joinedIds = q.qcsRefIds.join('%2C');
    const queryString = `/plates?qcsRefIds=${joinedIds}\
&layerIndices=${q.layerIndex - 1}\
&limit=200\
&fields=wells.rawValues%2Cwells.compoundIds`;
    return this.requestRecords(queryString, e => e.ID !== null);
  }

  getRecordsByCompound(compound) {
    const queryString = `/plates?q=wells.compoundIds%3A${compound}\
&fields=wells.rawValues%2Cwells.compoundIds`;
    return this.requestRecords(queryString, e => e.ID === compound);
  }
}


/*
function request(query) {
  return store.getDBResources('activity')
    .then(rsrc => {
      const url = `${rsrc.find(e => e.id === 'screenerapi').url}${query}`;
      return server.request(url, null, {
        method: 'GET',
        responseType: 'json',
        withCredentials : true
      });
    });
}


function getRawValuesByQcs(qcsRefIds, layerIndex) {
  const joined = qcsRefIds.join('%2C');
  const query = `/plates?qcsRefIds=${joined}\
&layerIndices=${layerIndex - 1}\
&limit=200\
&fields=wells.rawValues%2Cwells.compoundIds`;
  return request(query).then(res => {
    const rcds = [];
    res.plates.forEach(plt => {
      if (!plt.wells.hasOwnProperty('compoundIds')) return;  // unmapped
      const values = plt.wells.compoundIds.map((c, i) => {
        if (c !== null) return { ID: c, rawValue: plt.wells.rawValues[i]};
      }).filter(e => e !== undefined);
      Array.prototype.push.apply(rcds, values);
    });
    const now = new Date();
    return {
      created: now.toString(),
      records: rcds
    };
  });
}
exports.getRawValuesByQcs = getRawValuesByQcs;


function getRawValuesMappingColumn(qcsRefIds, layerIndex, compoundIds) {
  const joined = qcsRefIds.join('%2C');
  const query = `/plates?qcsRefIds=${joined}\
&layerIndices=${layerIndex - 1}\
&limit=200\
&fields=wells.rawValues%2Cwells.compoundIds`;
  return request(query).then(res => {
    const mapping = {};
    res.plates.forEach(plt => {
      if (!plt.wells.hasOwnProperty('compoundIds')) return;  // unmapped
      plt.wells.compoundIds.forEach((c, i) => {
        if (compoundIds.includes(c)) {
          mapping[c] = plt.wells.rawValues[i];
        }
      });
    });
    const now = new Date();
    return {
      created: now.toString(),
      mapping: mapping
    };
  });
}
exports.getRawValuesMappingColumn = getRawValuesMappingColumn;


function getRawValuesByCompound(compoundId) {
  const query = `/plates?q=wells.compoundIds%3A${compoundId}\
&fields=wells.rawValues%2Cwells.compoundIds`;
  return request(query).then(res => {
    const rcds = [];
    res.plates.forEach(plt => {
      if (!plt.wells.hasOwnProperty('compoundIds')) return;  // unmapped
      const i = plt.wells.compoundIds.findIndex(c => c === compoundId);
      rcds.push({
        qcsRefId: plt.qcsRefId,
        layerIndex: plt.layerIndex,
        rawValue: plt.wells.rawValues[i]
      });
    });
    const now = new Date();
    return {
      created: now.toString(),
      records: rcds
    };
  });
}
exports.getRawValuesByCompound = getRawValuesByCompound;


function getFittingByQcs(qcsRefIds, layerIndex) {
  const joined = qcsRefIds.join('%2C');
  const query = `/compounds?qcsRefIds=${joined}\
&layerIndices=${layerIndex - 1}\
&fields=compoundId%2Cfitting.drcPlot%2Cfitting.linearAC50%2Cfitting.hillCoefficient`;
  return request(query).then(res => {
    const rcds = res.compounds.map(c => {
      return {
        ID: c.compoundId,
        drcPlot: c.fitting.drcPlot,
        AC50: c.fitting.linearAC50,
        hill: Math.round(c.fitting.hillCoefficient * 100) / 100
      };
    });
    const now = new Date();
    return {
      created: now.toString(),
      records: rcds
    };
  });
}
exports.getFittingByQcs = getFittingByQcs;


function getAC50MappingColumn(qcsRefIds, layerIndex, compoundIds) {
  const joined = qcsRefIds.join('%2C');
  const query = `/compounds?qcsRefIds=${joined}\
&layerIndices=${layerIndex - 1}\
&fields=compoundId%2Cfitting.linearAC50`;
  return request(query).then(res => {
    const mapping = {};
    res.compounds.forEach(c => {
      if (compoundIds.includes(c.compoundId)) {
        mapping[c] = c.fitting.linearAC50;
      }
    });
    const now = new Date();
    return {
      created: now.toString(),
      mapping: mapping
    };
  });
}
exports.getAC50MappingColumn = getAC50MappingColumn;


function getFittingByCompound(compoundId) {
  const query = `/compounds?q=compoundId%3A${compoundId}\
&fields=compoundId%2CqcsRefId%2ClayerIndex\
%2Cfitting.drcPlot%2Cfitting.linearAC50%2Cfitting.hillCoefficient`;
  return request(query).then(res => {
    const rcds = res.compounds.map(c => {
      return {
        ID: c.compoundId,
        drcPlot: c.fitting.drcPlot,
        AC50: c.fitting.linearAC50,
        hill: Math.round(c.fitting.hillCoefficient * 100) / 100,
        qcsRefId: c.qcsRefId,
        layerIndex: c.layerIndex
      };
    });
    const now = new Date();
    return {
      created: now.toString(),
      records: rcds
    };
  });
}
exports.getFittingByCompound = getFittingByCompound;


function getDrcPlot(compoundId, plotId, min = -20, max = 120) {
  const query = `/${plotId}?width=180&height=180&title=compoundId\
&activityRangeMin=${min}&activityRangeMax=${max}`;
  return request(query);
}
exports.getDrcPlot = getDrcPlot;


function getQcsInfo(qcsRefIds) {
  const ids = qcsRefIds.map(e => `qcsRefId:${e}`).join(' OR ');
  const query = `/qcSessions?q=${ids}`;
  return request(query).then(res => res.qcSessions);
}
exports.getQcsInfo = getQcsInfo;

function getAllResults(qcsRefId, layerIdx) {
  const query = `/plates?qcsRefIds=${qcsRefId}\
&layerIndices=${layerIdx}\
&limit=200\
&fields=barcode%2CzPrime%2CwellTypes%2Cwells.rawValues%2Cwells.compoundIds`;
  return request(query, res => res);
}
exports.getAllResults = getAllResults;


function getPlateStats(allResults) {
  const plates = allResults.plates;
  const parsed = plates.map(p => {
    const lowMean = p.wellTypes.NEUTRAL_CONTROL.mean;
    const lowStdDev = p.wellTypes.NEUTRAL_CONTROL.sd;
    const highMean = p.wellTypes.INHIBITOR_CONTROL.mean;
    const highStdDev = p.wellTypes.INHIBITOR_CONTROL.sd;
    return {
      barcode: p.barcode,
      lowCtrlMean: lowMean,
      lowCtrlStdDev: lowStdDev,
      lowCtrlCV: lowStdDev / lowMean * 100,
      highCtrlMean: highMean,
      highCtrlStdDev: highStdDev,
      highCtrlCV: highStdDev / highMean * 100,
      SignalBackground: lowMean / highMean,
      zPrime: p.zPrime
    };
  });
  return parsed;
}
exports.getPlateStats = getPlateStats;


function getWellValues(allResults) {
  const plates = allResults.plates;
  const results = {};
  plates.forEach(p => {
    p.wells.compoundIds.forEach((value, i) => {
      if (value !== null) {
        results[value] = p.wells.rawValues[i];
      }
    });
  });
  return results;
}
exports.getWellValues = getWellValues;


function getFirstPlateValues(qcsRefId, layerIdxs) {
  const query = `/plates?qcsRefIds=${qcsRefId}\
&layerIndices=${layerIdxs}\
&q=plateIndex%3A0\
&fields=layerIndex%2CzPrime%2CwellTypes%2Cwells.rawValues%2Cwells.compoundIds`;
  return request(query, res => {
    const results = {};
    res.plates.forEach(p => {
      const idx = p.layerIndex;
      p.wells.compoundIds.forEach(value => {
        if (value !== null) {
          if (!results.hasOwnProperty(value)) {
            results[value] = {};
          }
          results[value][idx] = p.wells.rawValues[idx];
        }
      });
    });
  });
}
exports.getFirstPlateValues = getFirstPlateValues;
*/

class ScreenerFittingStub extends ScreenerFitting {
  constructor() {
    super();
    this.resourceFile = 'screener_fitting_stub.yaml';
  }

  fittingStub(q) {
    if (typeof q.qcsRefId !== 'string') throw `${q.qcsRefId} is not a string`;
    if (typeof q.layerIndex !== 'number') throw `${q.layerIndex} is not a number`;
    return [
      {ID: 'DB00189', drcPlot: 'dummy1', AC50: 2.1e-6, hill: 1.1, source: 'target1_validation'},
      {ID: 'DB00193', drcPlot: 'dummy2', AC50: 4.2e-6, hill: null, source: 'target1_validation'},
      {ID: 'DB00203', drcPlot: 'dummy3', AC50: 1.0e-5, hill: 0.9, source: 'target1_validation'},
      {ID: 'DB00865', drcPlot: 'dummy4', AC50: 8.8e-8, hill: 2.1, source: 'target1_validation'},
      {ID: 'DB01143', drcPlot: 'dummy5', AC50: 'n.d.', hill: null, source: 'target1_validation'},
      {ID: 'DB01240', drcPlot: 'dummy6', AC50: null, hill: null, source: 'target1_validation'}
    ];
  }

  getRecords(q) {
    return Promise.resolve({ records: this.fittingStub(q) });
  }

  getRecordsByCompound(compound) {
    const rcds = this.fittingStub({qcsRefId: 'QCS-YYYY', layerIndex: 1})
      .filter(e => e.ID === compound);
    return Promise.resolve({ records: rcds });
  }

  qcsInfoStub(ids) {
    if (!Array.isArray(ids)) throw `${ids} is not a string`;
    const layers = [
      {layerIndex: 0, name: 'Activity%'},
      {layerIndex: 1, name: 'Background%'},
      {layerIndex: 2, name: 'Correction'}
    ];
    return [
      {qcsRefId: 'QCS-XXX0', name: 'hoge', layers: layers},
      {qcsRefId: 'QCS-XXX1', name: 'fuga', layers: layers},
      {qcsRefId: 'QCS-XXX2', name: 'piyo', layers: layers}
    ];
  }

  getQcsInfo(qcsRefIds) {
    return Promise.resolve(this.qcsInfoStub(qcsRefIds));
  }
}


class ScreenerRawValueStub extends ScreenerRawValue {
  constructor() {
    super();
    this.resourceFile = 'screener_rawvalue_stub.yaml';
  }

  rawValueStub(q) {
    if (typeof q.qcsRefId !== 'string') throw `${q.qcsRefId} is not a string`;
    if (typeof q.layerIndex !== 'number') throw `${q.layerIndex} is not a number`;
    return [
        {ID: 'DB00189', rawValue: 12.7, source: 'target1_screen'},
        {ID: 'DB00193', rawValue: 43.6, source: 'target1_screen'},
        {ID: 'DB00203', rawValue: 102.6, source: 'target1_screen'},
        {ID: 'DB00865', rawValue: -0.6, source: 'target1_screen'},
        {ID: 'DB01143', rawValue: 50, source: 'target1_screen'},
        {ID: 'DB01240', rawValue: null, source: 'target1_screen'}
    ];
  }

  getRecords(q) {
    return Promise.resolve({ records: this.rawValueStub(q) });
  }

  getRecordsByCompound(compound) {
    const rcds = this.rawValueStub({qcsRefId: 'QCS-XXXX', layerIndex: 1})
      .filter(e => e.ID === compound);
    return Promise.resolve({ records: rcds });
  }
}

// Global config

const globalConfig = {
  "onLine": true,
  "server": {},
  "templates": {},
  "urlQuery": {}
};

window.location.search.substring(1).split("&")
  .map(e => e.split('=')).forEach(e => {
    globalConfig.urlQuery[e[0]] = e[1];
  });


function getGlobalConfig(key) {
  return globalConfig[key];
}


function setGlobalConfig(key, value) {
  globalConfig[key] = value;
}


// API instances

const API = new Map(Object.entries({
  chemical: new LocalServerChemical(),
  activity: new LocalServerActivity(),
  screenerrawvalue: new ScreenerRawValue(),
  screenerfitting: new ScreenerFitting(),
  screenerrawvaluestub: new ScreenerRawValueStub(),
  screenerfittingstub: new ScreenerFittingStub()
}));


function localChemInstance() {
  return API.get('chemical');
}





function fetcherInstances() {
  return Array.from(API.values());
}








// API data resource on local IndexedDB




function setResources(rsrcs) {
  return store.putResources(rsrcs);
}








// Datatable on local IndexedDB







function getTable(tableId) {
  return store.getItemById(tableId);
}





function getCurrentTable() {
  const q = getGlobalConfig('urlQuery');
  if (!q.hasOwnProperty('id')) return Promise.resolve();
  return store.getItemById(q.id);
}








function joinColumn(mapping, tableId=globalConfig.urlQuery.id) {
  const cols = mapping.hasOwnProperty('column') ? mapping.column : mapping.columns;
  return store.updateItem(tableId, item => {
    item.records
      .filter(rcd => mapping.mapping.hasOwnProperty(rcd[mapping.key]))
      .forEach(rcd => {
        if (mapping.hasOwnProperty('column')) {
          rcd[mapping.column.key] = mapping.mapping[rcd[mapping.key]];
        } else {
          mapping.columns.forEach((col, i) => {
            rcd[col.key] = mapping.mapping[rcd[mapping.key]][i];
          });
        }
      });
    item.columns = item.columns.concat(cols).unique('key');
    item.lastUpdated = mapping.lastUpdated;
  });
}


function updateTableAttribute(tblID, key, value) {
  return store.updateItem(tblID, item => {
    item[key] = value;
  });
}


function insertTable(data) {
  return store.putItem(data);
}


function updateTable(data) {
  if (data === undefined) return Promise.resolve();  // No update
  if (data.status === 'Failure') {  // No data found on server
    return updateTableAttribute(data.id, 'status', 'Failure');
  }
  // update
  return store.updateItem(data.id, item => {
    const update = {
      responseDate: data.responseDate,
      records: data.records,
      columns: data.columns,
      recordCount: data.recordCount,
      searchDoneCount: data.searchDoneCount,
      execTime: data.execTime,
      progress: data.progress,
      status: data.status,
    };
    if (data.hasOwnProperty('lastUpdated')) {
      update.lastUpdated = data.lastUpdated;
    }
    Object.assign(item, update);
  });
}

const localServer$1 = localChemInstance();


function initialize() {
  if ('serviceWorker' in navigator && !debug) {
    navigator.serviceWorker
      .register('sw.js')
      .then(registration => {
        console.info(
          'ServiceWorker registration successful with scope: ',
          registration.scope
        );
      }).catch(err => {
        console.info('ServiceWorker registration failed: ', err);
      });
  } else if (debug) {
    console.info('Off-line mode is disabled for debugging');
  } else {
    console.info('Off-line mode is not supported');
  }
  const serverTmpl = localServer$1.templates().then(res => {
    setGlobalConfig('templates', res.templates);
  });
  const serverConfig = localServer$1.status().then(res => {
    setGlobalConfig('server', res);
  });
  // TODO: skip loader if there is already resources in the store
  // 1. collate resource version
  // 2. if no local resource or server resource is newer, fetch
  const rsrcFetched = fetcherInstances()
    .map(api => api.getResources())
    .extendAsync().then(res => {
      const indexed = res.map((e, i) => {
        e.idx = i;
        return e;
      });
      return setResources(indexed);
    });
  return Promise.all([serverTmpl, serverConfig, rsrcFetched]);
}


function loader() {
  if (document.location.protocol === "file:") {
    console.info('Off-line mode (local file)');
    setGlobalConfig('onLine', false);
    return Promise.resolve();
  }
  if ('onLine' in navigator) {
    if (!navigator.onLine) {
      console.info('Off-line mode (no internet connection)');
      setGlobalConfig('onLine', false);
      return Promise.resolve();
    }
  }
  return fetch(`${localServer$1.baseURL}favicon.ico`)
    .then(() => {
      // HTTP 404
      setGlobalConfig('onLine', true);
      return initialize();
    }).catch(() => {
      console.info('Off-line mode (server not responding)');
      setGlobalConfig('onLine', false);
      return Promise.resolve();
    });
}

function renderStatus(tbl, refresh_callback, abort_callback) {
  d3.select('#loading-circle').style('display', 'none');
  if (!tbl.hasOwnProperty('status')) tbl.status = 'Completed';
  d3.select('title').text(tbl.name);
  d3.select('#title').text(tbl.name);
  d3.select('#refresh')
    .text(tbl.status === 'Aborting' ? 'Abort requested' : 'Refresh')
    .style('display', fetchable(tbl) ? 'inline-block' : 'none');
  d3.select('#abort')
    .style('display', abortRequestable(tbl) ? 'inline-block' : 'none');
  const doneText = {
    'datatable': 'entries found',
    'connection': 'connections created'
  };
  const dtx = doneText[tbl.format];
  d3.select('#progress')
    .text(`(${tbl.status} - ${tbl.recordCount} ${dtx} in ${tbl.execTime} sec.)`);
  if (tbl.status === 'In progress') {
    d3.select('#progress').append('div').append('progress')
      .attr('max', 100)
      .attr('value', tbl.progress)
      .text(`${tbl.progress}%`);
  }
  d3.select('#refresh').on('click', refresh_callback);
  d3.select('#abort')
    .on('click', () => {
      d3.select('#confirm-message')
        .text('Are you sure you want to abort this calculation job?');
      d3.select('#confirm-submit')
        .classed('btn-primary', false)
        .classed('btn-warning', true)
        .on('click', () => {
          abort_callback();
        });
    });
  console.info('Query');
  console.info(tbl.query);  // query datails are available on browser console.
}


function initializeWithData() {
  d3.select('#new-data').style('display', 'none');
  d3.select('#loading-circle').style('display', 'none');
}


function initialize$1() {
  d3.select('#data-control').style('display', 'none');
  d3.select('#nodedata').style('display', 'none');
  d3.select('#refresh').style('display', 'none');
  d3.select('#abort').style('display', 'none');
  d3.select('#loading-circle').style('display', 'none');
  d3.select('#status').selectAll('li').style('display', 'none');
}

/** @module dataStructure */

/**
 * Format number
 * @param {object} value - value
 * @param {string} type - si | scientific | rounded | raw
 */
function formatNum(value, type) {
  const conv = {
    scientific: ".3e",
    si: ".3s",
    rounded: ".3r"
  };
  if (type === 'raw') return value;
  if (value === undefined || value === null || Number.isNaN(value)) return '';
  return value == parseFloat(value) ? d3.format(conv[type])(value) : value;
}

function selectOptions(selection, data, key, text) {
  const options = selection.selectAll('option')
    .data(data, key);
  options.exit().remove();
  options.enter().append('option')
    .merge(options)
      .attr('value', key)
      .text(text);
}

const localServer$2 = localChemInstance();

























function graphConfigDialog(edges, callback) {
  d3.select('#graphconfig-thld')
    .attr('value', edges.networkThreshold)
    .attr('max', 1.0)
    .attr('min', edges.query.threshold);
  d3.select('#graphconfig-submit')
    .on('click', () => {
      const newThld = formFloat('#graphconfig-thld');
      if (newThld < edges.query.threshold) return;  // TODO: fool proof
      callback(newThld);
    });
}


function communityDialog(callback) {
  d3.select('#community-name').attr('value', 'comm_');
  d3.select('#community-submit')
    .on('click', () => {
      const query = {
        name: formValue('#community-name'),
        nulliso: formChecked('#community-nulliso')
      };
      callback(query);
    });
}

const fieldWidth = 1200;
const fieldHeight = 1200;

const simulation = d3.forceSimulation()
  .force('link',
    d3.forceLink().id(d => d._index)
      .distance(60)
      .strength(1))
  .force('charge',
    d3.forceManyBody()
      .strength(-600)
      .distanceMin(15)
      .distanceMax(720))
  .force('collide',
    d3.forceCollide()
      .radius(90))
  .force('center',
    d3.forceCenter(fieldWidth / 2, fieldHeight / 2))
  .force('x',
    d3.forceX()
      .strength(0.002))
  .force('y',
    d3.forceY()
      .strength(0.002))
  .stop();


function setForce(nodes, edges, tick, end) {
  simulation.nodes(nodes)
    .force('link').links(edges);
  simulation.on('tick', tick)
    .on('end', end);
}


function tick() {
  d3.select('#graph-contents').selectAll('.node')
    .attr('transform', d => `translate(${d.x}, ${d.y})`);
  const alpha = simulation.alpha();
  const isStopped = alpha <= simulation.alphaMin();
  d3.select('#temperature')
    .classed('progress-success', isStopped)
    .classed('progress-warning', !isStopped)
    .attr('value', isStopped ? 1 : 1 - alpha)
    .text(isStopped ? 1 : 1 - alpha);
}


function end() {
  d3.select('#graph-contents').selectAll('.link')
    .attr('transform', d => `translate(${d.source.x}, ${d.source.y})`)
    .attr('visibility', 'visible');
  d3.select('#graph-contents').selectAll('.edge-line')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', d => d.target.x - d.source.x)
    .attr('y2', d => d.target.y - d.source.y);
  d3.select('#graph-contents').selectAll('.edge-label')
    .attr('x', d => (d.target.x - d.source.x) / 2)
    .attr('y', d => (d.target.y - d.source.y) / 2);
}


var force = {
  fieldWidth, fieldHeight, simulation, setForce, tick, end
};

// Get data

function colorControlInput(id) {
  const data = {
    id: id,
    column: selectedOptionData(`#${id}-col`)
  };
  const preset = selectedOptionData(`#${id}-preset`);
  if (preset.scale.scale === 'ordinal') {
    data.scale = preset.scale;
    return data;
  }
  data.scale = {
    scale: formValue(`#${id}-scaletype`),
    domain: [
      formValue(`#${id}-domain-from`),
      formValue(`#${id}-domain-to`)
    ],
    unknown: '#696969'
  };
  const range = [formValue(`#${id}-range-from`)];
  if (formChecked(`#${id}-range-enable-mid`)) {
    range.push(formValue(`#${id}-range-mid`));
  }
  range.push(formValue(`#${id}-range-to`));
  data.scale.range = range;
  return data;
}


function labelControlInput() {
  const data = colorControlInput('label');
  data.text = formValue('#label-text');
  data.size = formValue('#label-size');
  data.visible = formChecked('#label-visible');
  return data;
}


function sizeControlInput(id) {
  return {
    id: id,
    scale: {
      scale: formValue(`#${id}-scaletype`),
      domain: [
        formValue(`#${id}-domain-from`),
        formValue(`#${id}-domain-to`)
      ],
      range: [
        formValue(`#${id}-range-from`),
        formValue(`#${id}-range-to`)
      ],
      unknown: 10
    }
  };
}


function nodeSizeControlInput() {
  const data = sizeControlInput('size');
  data.column = selectedOptionData('#size-col');
  return data;
}


function nodeContentInput() {
  return {
    structure: {
      visible: formChecked('#show-struct')
    }
  };
}


function edgeControlInput() {
  const data = sizeControlInput('edge');
  data.visible = formChecked('#edge-visible');
  data.label = {
    size: formValue('#edge-label-size'),
    visible: formChecked('#edge-label-visible')
  };
  return data;
}


// Update DOM attributes

function updateNodeColor(data) {
  d3.selectAll('.node').select('.node-symbol')
    .style('fill', d => scaleFunction(data.scale)(d[data.column.key]));
}


function updateNodeSize(data) {
  d3.selectAll('.node').select('.node-symbol')
    .attr('r', d => scaleFunction(data.scale)(d[data.column.key]));
}


function updateNodeLabelVisibility(visible) {
  d3.selectAll('.node').select('.node-label')
    .attr('visibility', visible ? 'inherit' : 'hidden');
}


function updateNodeLabel(data) {
  d3.selectAll('.node').select('.node-label')
    .text(d => {
      if (!d.hasOwnProperty(data.text)) return '';
      if (!data.column.hasOwnProperty('digit') || data.column.digit === 'raw') return d[data.text];
      return formatNum(d[data.text], data.column.digit);
    })
    .attr('font-size', data.size)
    .attr('visibility', data.visible ? 'inherit' : 'hidden')
    .style('fill', d => scaleFunction(data.scale)(d[data.column.key]));
}


function updateNodeStructure(data) {
  d3.selectAll('.node').select('.node-struct')
    .attr('visibility', data.structure.visible ? 'inherit' : 'hidden')
    .each((d, i, nds) => {
      const w = d3.select(nds[i]).select('svg').attr('width');
      const h = d3.select(nds[i]).select('svg').attr('height');
      d3.select(nds[i]).attr('transform', `translate(${-w / 2},${-h / 2})`);
    });
}


function updateNodeImage(data) {
  updateNodeSize(data.nodeSize);
  updateNodeColor(data.nodeColor);
  updateNodeLabel(data.nodeLabel);
  updateNodeStructure(data.nodeContent);
}


function updateEdgeVisibility(visible) {
  d3.selectAll('.link').select('.edge-line')
    .attr('visibility', visible ? 'inherit' : 'hidden');
}


function updateEdgeLabelVisibility(visible) {
  d3.selectAll('.link').select('.edge-label')
    .attr('visibility', visible ? 'inherit' : 'hidden');
}


function updateEdge(data) {
  d3.selectAll('.link').select('.edge-line')
    .style('stroke-width', d => scaleFunction(data.scale)(d.weight));
  d3.selectAll('.link').select('.edge-label')
    .attr('font-size', data.label.size);
  updateEdgeVisibility(data.visible);
  updateEdgeLabelVisibility(data.label.visible);
}


function updateRange(range, id) {
  if (range.length === 2) {
    d3.select(`#${id}-range-from`).property('value', range[0]);
    d3.select(`#${id}-range-enable-mid`).attr('checked', null);
    d3.select(`#${id}-range-mid`).attr('disabled','disabled');
    d3.select(`#${id}-range-to`).property('value', range[1]);
    d3.selectAll(`#${id}-range input`).attr('disabled', null);
  } else if (range.length === 3) {
    d3.select(`#${id}-range-from`).property('value', range[0]);
    d3.select(`#${id}-range-enable-mid`).attr('checked', 'checked');
    d3.select(`#${id}-range-mid`).property('value', range[1]);
    d3.select(`#${id}-range-to`).property('value', range[2]);
    d3.selectAll(`#${id}-range input`).attr('disabled', null);
  } else {
    d3.selectAll(`#${id}-range input`).attr('disabled', 'disabled');
  }
}


function updateScale(scale, id) {
  d3.select(`#${id}-scaletype`).property('value', scale.scale);
  const hasDomain = scale.hasOwnProperty('domain');
  d3.selectAll(`#${id}-domain input`)
    .attr('disabled', hasDomain ? null : 'disabled');
  if (hasDomain) {
    d3.select(`#${id}-domain-from`).property('value', scale.domain[0]);
    d3.select(`#${id}-domain-to`).property('value', scale.domain[1]);
  }
  updateRange(scale.range, id);
}


function updateControl(data) {
  const id = data.id;
  d3.select(`#${id}-visible`).attr('checked', data.visible ? 'checked' : null);
  d3.select(`#${id}-text`).property('value', data.text);
  d3.select(`#${id}-size`).property('value', data.size);
  if (data.hasOwnProperty('column')) {
    d3.select(`#${id}-col`).property('value', data.column.key);
  }
  if (data.hasOwnProperty('label')) {
    d3.select(`#${id}-label-visible`)
      .attr('checked', data.label.visible ? 'checked' : null);
    d3.select(`#${id}-label-size`).property('value', data.label.size);
  }
  updateScale(data.scale, data.id);
}



// Generate controlBox elements

function mainControlBox() {
  d3.select('#show-struct')
    .on('change', function () {
      const data = nodeContentInput();
      d3.select('#main-control').datum(data);
      updateNodeStructure(data);
    })
    .dispatch('change');
}


function colorControlBox(columns, id) {
  d3.select(`#${id}-col`)
    .call(selectOptions, columns, d => d.key, d => d.name);
  d3.select(`#${id}-preset`)
    .call(selectOptions, colorPresets, d => d.name, d => d.name)
    .on('change', function() {
      updateScale(selectedOptionData(this).scale, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-palette`)
    .call(selectOptions, colorPalette, d => d.name, d => d.name)
    .on('change', function() {
      updateRange(selectedOptionData(this).range, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-scaletype`)
    .call(selectOptions, scaleTypes, d => d.name, d => d.name);
}


function nodeColorControlBox(columns) {
  const textCols = columns.filter(e => e.sort !== 'none');
  colorControlBox(textCols, 'color');
  d3.selectAll('.color-update')
    .on('change', () => {
      const data = colorControlInput('color');
      d3.select('#color-control').datum(data);
      updateControl(data);
      updateNodeColor(data);
    })
    .dispatch('change');
}


function nodeLabelControlBox(columns) {
  const textCols = columns.filter(e => e.sort !== 'none');
  d3.select('#label-text')
    .call(selectOptions, textCols, d => d.key, d => d.name);
  colorControlBox(textCols, 'label');
  d3.select('#label-visible')
    .on('change', function() {
      updateNodeLabelVisibility(formChecked(this), 'label');
      d3.select(`.label-update`).dispatch('change');
    });
  d3.selectAll('.label-update')
    .on('change', () => {
      const data = labelControlInput();
      d3.select('#label-control').datum(data);
      updateControl(data);
      updateNodeLabel(data);
    })
    .dispatch('change');
}


function sizeControlBox(presets, id) {
  d3.select(`#${id}-preset`)
    .call(selectOptions, presets, d => d.name, d => d.name)
    .on('change', function() {
      updateScale(selectedOptionData(this).scale, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-scaletype`)
    .call(selectOptions, sizeScaleTypes, d => d.name, d => d.name);
}


function nodeSizeControlBox(columns) {
  const numCols = columns.filter(e => e.sort === 'numeric');
  d3.select(`#size-col`)
    .call(selectOptions, numCols, d => d.key, d => d.name);
  sizeControlBox(sizePresets, 'size');
  d3.selectAll('.size-update')
    .on('change', () => {
      const data = nodeSizeControlInput('size');
      d3.select('#size-control').datum(data);
      updateControl(data);
      updateNodeSize(data);
    })
    .dispatch('change');
}


function edgeControlBox() {
  sizeControlBox(edgeWidthPresets, 'edge');
  d3.select('#edge-visible')
    .on('change', function() {
      updateEdgeVisibility(formChecked(this));
      updateEdgeLabelVisibility(formChecked(this));
      d3.select(`.edge-update`).dispatch('change');
    });
  d3.select('#edge-label-visible')
    .on('change', function() {
      updateEdgeLabelVisibility(formChecked(this));
      d3.select(`.edge-update`).dispatch('change');
    });
  d3.selectAll('.edge-update')
    .on('change', () => {
      const data = edgeControlInput('edge');
      d3.select('#edge-control').datum(data);
      updateControl(data);
      updateEdge(data);
    })
    .dispatch('change');
}


var control = {
  updateNodeStructure, updateNodeImage, updateControl,
  mainControlBox, nodeColorControlBox, nodeLabelControlBox, nodeSizeControlBox, edgeControlBox
};

function graphNodes(selection, data) {
  const nodes = selection.selectAll('.node')
    .data(data, d => d.key);
  nodes.exit().remove();
  const entered = nodes.enter().append('g')
    .attr('class', 'node');
  entered.append('circle')
    .attr('class', 'node-symbol');
  entered.append('g')
    .attr('class', 'node-struct');
  entered.append('text')
    .attr('class', 'node-label');
  const updated = entered.merge(nodes);
  updated.select('.node-symbol')
    .attr('r', 20)
    .style('fill', '#6c6');
  updated.select('.node-struct')
    .attr('visibility', 'hidden')
    .html(d => d._structure);
  updated.select('.node-label')
    .attr('visibility', 'hidden')
    .attr('x', 0)
    .attr('y', 20 + 10)
    .attr('font-size', 16)
    .attr('text-anchor', 'middle');
}


function graphEdges(selection, data) {
  const edges = selection.selectAll('.link')
    .data(data, d => `${d.source}_${d.target}`);
  edges.exit().remove();
  const entered = edges.enter().append('g')
    .attr('class', 'link');
  entered.append('line')
    .attr('class', 'edge-line');
  entered.append('text')
    .attr('class', 'edge-label');
  const updated = entered.merge(edges);
  updated.select('.edge-line')
    .style('stroke', '#999')
    .style('stroke-opacity', 0.6);
  updated.select('.edge-label')
    .attr('font-size', 16)
    .attr('text-anchor', 'middle')
    .attr('visibility', 'hidden')
    .text(d => d.weight);
}


var component = {
  graphNodes, graphEdges
};

const zoom = d3.zoom()
  .on('zoom', () => {
    d3.select('#graph-contents').attr('transform', d3.event.transform);
  });

const dragWithForce = d3.drag()
  .on('start', () => {
    d3.select('#graph-contents').selectAll('.link')
      .attr('visibility', 'hidden');
    if (!d3.event.active) force.simulation.alphaTarget(0.1).restart();
  })
  .on('drag', d => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  })
  .on('end', d => {
    if (!d3.event.active) force.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  });

const dragNoForce = d3.drag()
  .on('drag', function (d) {
    d3.select(this)
      .attr('transform', () => `translate(${d3.event.x}, ${d3.event.y})`);
    d.x = d3.event.x;
    d.y = d3.event.y;
    const connected = d3.select('#graph-contents').selectAll('.link')
      .filter(d => [d.source.index, d.target.index].includes(this.__data__.index));
    connected.attr('transform', d => `translate(${d.source.x}, ${d.source.y})`)
      .attr('visibility', 'visible');
    connected.select('.edge-line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', d => d.target.x - d.source.x)
      .attr('y2', d => d.target.y - d.source.y);
    connected.select('.edge-label')
      .attr('x', d => (d.target.x - d.source.x) / 2)
      .attr('y', d => (d.target.y - d.source.y) / 2);
  })
  .on('end', () => {
    force.end();
  });


function stickNodes() {
  force.simulation.alpha(0).stop();
  d3.selectAll('.node').each(d => {
    d.fx = d.x;
    d.fy = d.y;
  });
  force.tick();
  force.end();
  d3.select('#stick-nodes').property('checked', true);
  d3.select('#graph-contents').selectAll('.link')
    .attr('visibility', 'visible');
  d3.select('#graph-contents').selectAll('.node')
    .call(dragNoForce);
}


function unstickNodes() {
  d3.selectAll('.node').each(d => {
    d.fx = null;
    d.fy = null;
  });
  d3.select('#stick-nodes').property('checked', false);
  d3.select('#graph-contents').selectAll('.link')
    .attr('visibility', 'hidden');
  d3.select('#graph-contents').selectAll('.node')
    .call(dragWithForce);
}


function relax() {
  unstickNodes();
  force.simulation.alpha(0.1).restart();
}


function restart() {
  unstickNodes();
  force.simulation.alpha(1).restart();
}


function fitToScreen() {
  d3.select('#graph-field').call(zoom.transform, d3.zoomIdentity);
  // TODO
  /*
  const p = 0.9;  // padding factor
  const x = extent(selectAll('.node').data(), d => d.x);
  const y = extent(selectAll('.node').data(), d => d.y);
  const w = x[1] - x[0];
  const h = y[1] - y[0];
  const vb = select('#graph-field').attr('viewBox').split(' ');
  const xScaleF = vb[2] / w * p;
  const yScaleF = vb[3] / h * p;
  const scaleF = Math.max(xScaleF, yScaleF);
  const center = [(w * (1 - p) / 2 - x[0]) * xScaleF,
                  (h * (1 - p) / 2 - y[0]) * yScaleF];
  // Reset zoom point
  zoom.scale(scaleF);
  zoom.translate(center);
  updateViewportTransform(center, scaleF);
  */
}


var interaction = {
  zoom, dragWithForce, dragNoForce,
  stickNodes, unstickNodes,
  relax, restart, fitToScreen
};

function communityDetection(nodes, edges, option) {
  // TODO: partition resolution setting
  // TODO: Error at edges.length 0
  const community = jLouvain().nodes(nodes).edges(edges)();
  // assign null to singletons
  if (option.nulliso) {
    const clusters = {};
    Object.entries(community).forEach(e => {
      if (!clusters.hasOwnProperty(e[1])) {
        clusters[e[1]] = [];
      }
      clusters[e[1]].push(e[0]);
    });
    Object.entries(clusters).forEach(e => {
      if (e[1].length === 1) {
        community[e[1][0]] = null;
      }
    });
  }
  return community;
}


var community = {
  communityDetection
};

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
    graphConfigDialog(g.edges, thld => {
      return updateTableAttribute(g.edges.id, 'networkThreshold', thld)
        .then(saveSnapshot).then(start);
    });
    communityDialog(query => {
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
    control.mainControlBox();
    control.nodeColorControlBox(g.nodes.columns);
    control.nodeSizeControlBox(g.nodes.columns);
    control.nodeLabelControlBox(g.nodes.columns);
    control.edgeControlBox();
    d3.select('#stick-nodes')
      .on('change', function() {
        formChecked(this) === true ? interaction.stickNodes() : interaction.relax();
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


function run() {
  d3.select('#export')
    .on('click', () => {
      // Working copy of edges and nodes are modified by d3.force.
      // Load original data from store.
      return getCurrentGraph().then(g => downloadJSON(g, g.edges.name));
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
      loadJSON(file).then(loadNewGraph);
    });
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
      initialize$1();
      return Promise.resolve();
    }
  });
}

var graph = {
  force, control, component, interaction, community, run
};

return graph;

})));
//# sourceMappingURL=kwgraph.js.map
