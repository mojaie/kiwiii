
import {dataSourceId} from '../helper/definition.js';
import {default as store} from './IDBStore.js';
import {LocalServerActivity, LocalServerChemical} from '../fetcher/LocalServer.js';
import {ScreenerFitting, ScreenerRawValue} from '../fetcher/Screener.js';
import {ScreenerFittingStub, ScreenerRawValueStub} from '../fetcher/ScreenerTestStub.js';


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


export function getGlobalConfig(key) {
  return globalConfig[key];
}


export function setGlobalConfig(key, value) {
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


export function localChemInstance() {
  return API.get('chemical');
}


export function getFetcher(domain) {
  return API.get(domain);
}


export function fetcherInstances() {
  return Array.from(API.values());
}


export function dataFetcherInstances() {
  const res = [];
  API.forEach((v, k) => {
    if (k !== 'chemical') res.push(v);
  });
  return res;
}


export function dataFetcherDomains() {
  const res = [];
  API.forEach((v, k) => {
    if (k !== 'chemical') res.push(k);
  });
  return res;
}


// API data resource on local IndexedDB

export function getResources(domains) {
  return store.getResources().then(rsrcs => {
    return rsrcs.filter(e => domains.includes(e.domain));
  });
}


export function setResources(rsrcs) {
  return store.putResources(rsrcs);
}


export function getResourceColumns(domains) {
  return getResources(domains).then(rsrcs => {
    return rsrcs.map(rsrc => {
      return rsrc.columns.map(col => {
        col.domain = rsrc.domain;
        col.key = dataSourceId(rsrc.domain, rsrc.id, col.key);
        col.entity = rsrc.entity;
        if (!col.hasOwnProperty('tags')) col.tags = rsrc.tags;
        return col;
      });
    }).extend();
  });
}


export function getDataSourceColumns(domain, ids) {
  return store.getResources([domain]).then(rsrcs => {
    return ids.map(d => rsrcs.find(e => e.id === d).columns)
      .extend();
  });
}


// Datatable on local IndexedDB

export function getAllTables() {
  return store.getAllItems();
}


export function getTablesByFormat(format) {
  return store.getItemsByFormat(format);
}


export function getTable(tableId) {
  return store.getItemById(tableId);
}


export function getRecords(tableId) {
  return store.getItemById(tableId)
    .then(tbl => tbl.records);
}


export function getCurrentTable() {
  const q = getGlobalConfig('urlQuery');
  if (!q.hasOwnProperty('id')) return Promise.resolve();
  return store.getItemById(q.id);
}


export function getCurrentRecords() {
  return getCurrentTable().then(tbl => tbl.records);
}


export function setColumnsToShow(updates) {
  return store.updateItem(getGlobalConfig('urlQuery').id, item => {
    item.columns.forEach((col, i) => {
      col.visible = updates.visibles.includes(col.key);
      col.sort = updates.sorts[i];
      col.digit = updates.digits[i];
    });
  });
}


export function joinColumn(mapping, tableId=globalConfig.urlQuery.id) {
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


export function updateTableAttribute(tblID, key, value) {
  return store.updateItem(tblID, item => {
    item[key] = value;
  });
}


export function insertTable(data) {
  return store.putItem(data);
}


export function updateTable(data) {
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


export function deleteTable(id) {
  return store.deleteItem(id);
}


export function reset() {
  return store.reset();
}
