
import Fetcher from './Fetcher.js';


export class LocalServerActivity extends Fetcher {
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


export class LocalServerChemical extends LocalServerActivity {
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
