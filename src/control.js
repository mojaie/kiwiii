
import d3 from 'd3';

import {default as common} from './common.js';
import {default as fetcher} from './fetcher.js';
import {default as cmp} from './component/Component.js';
import {default as store} from './store/StoreConnection.js';
import {default as def} from './helper/definition.js';


function tableAction(selection, data, app) {
  selection.append('a')
      .classed('btn btn-secondary btn-sm', true)
      .attr('role', 'button')
      .attr('href', `${app}?id=${data.id}`)
      .attr('target', '_blank')
      .text('Open');
  const ongoing = def.ongoing(data);
  selection.insert('button')
      .classed('btn btn-warning btn-sm', true)
      .attr('type', 'button')
      .attr('data-toggle', ongoing ? null : 'modal')
      .attr('data-target', ongoing ? null : '#confirm-dialog')
      .property('disabled', ongoing ? 'disabled' : null)
      .text(ongoing ? 'Running' : 'Delete')
      .on('click', function() {
        d3.select('#confirm-message')
          .text(`Are you sure you want to delete ${data.name} ?`);
        d3.select('#confirm-submit')
          .on('click', () => store.deleteTable(data.id).then(run));
      });
}


function renderTableStatus(data) {
  const table = {
    fields: def.defaultFieldProperties([
      {key: 'name', format: 'text'},
      {key: 'status', format: 'text'},
      {key: 'resultCount', d3_format: 'd'},
      {key: 'action', format: 'control'}
    ])
  };
  const records = data.map(e => {
    e.resultCount = e.records.length;
    e.action = (s) => tableAction(s, e, 'datatable.html');
    return e;
  });
  d3.select('#local-tables').call(cmp.createTable, table)
    .call(cmp.updateTableRecords, records, d => d.id);
}


function renderGraphStatus(data) {
  const table = {
    fields: def.defaultFieldProperties([
      {key: 'name', format: 'text'},
      {key: 'nodes', format: 'text'},
      {key: 'status', format: 'text'},
      {key: 'resultCount', d3_format: 'd'},
      {key: 'action', format: 'control'}
    ])
  };
  const records = data.map(e => {
    e.nodes = e.reference.nodes;
    e.resultCount = e.records.length;
    e.action = (s) => tableAction(s, e, 'graph.html');
    return e;
  });
  d3.select('#local-graphs').call(cmp.createTable, table)
    .call(cmp.updateTableRecords, records, d => d.id);
}


function renderServerStatus(data) {
  const calc = {
    fields: def.defaultFieldProperties(data.calc.fields)
  };
  d3.select('#server-calc').call(cmp.createTable, calc)
    .call(cmp.updateTableRecords, data.calc.records, d => d.index);
  const server = {
    fields: def.defaultFieldProperties([
      {key: 'key', format: 'text'},
      {key: 'value', format: 'text'}
    ])
  };
  server.records = Object.entries(data)
    .filter(e => e[0] !== 'calc')
    .map(e => ({key: e[0], value: e[1]}));
  d3.select('#server-status').call(cmp.createTable, server)
    .call(cmp.updateTableRecords, server.records, d => d.index);
}


function run() {
  d3.select('#refresh-all')
    .on('click', () => {
      return store.getAllTables().then(tables => {
        return Promise.all(tables.map(tbl => {
          if (tbl.status !== 'running') return Promise.resolve();
          const query = {id: tbl.id, command: 'fetch'};
          return fetcher.get('res', query)
            .then(fetcher.json)
            .then(store.updateTable);
        }));
      }).then(run);
    });
  d3.select('#reset-local')
    .on('click', () => {
      d3.select('#confirm-message')
        .text('Are you sure you want to delete all local tables and reset the datastore ?');
      d3.select('#confirm-submit')
        .on('click', () => store.reset().then(run));
    });
  return common.loader().then(serverStatus => {
    if (serverStatus) renderServerStatus(serverStatus);
    return Promise.all([
      store.getTablesByDataType('nodes').then(renderTableStatus),
      store.getTablesByDataType('edges').then(renderGraphStatus)
    ]);
  });
}
run();
