
/** @module datagrid/table */

import Collection from '../common/collection.js';

import DatagridState from './state.js';
import {default as component} from './component.js';
import {default as rowf} from './rowFilter.js';
import {default as sort} from './sort.js';


function table(selection, fields, records, rowFactory, height) {
  const data = {
    fields: fields,
    records: records
  };
  const state = new DatagridState({}, data);
  state.keyFunc = d => d;
  if (rowFactory) {
    state.rowFactory = () => rowFactory(state.visibleFields);
  }
  state.fixedViewportHeight = height || 300;
  selection.append('div')
    .classed('table', true)
    .call(component.datagrid, state);
  selection.datum(state);
}


function filterTable(selection, fields, records, rowFactory, height) {
  const data = {
    fields: fields,
    records: records
  };
  const state = new DatagridState({}, data);
  if (rowFactory) {
    state.rowFactory = () => rowFactory(state.visibleFields);
  }
  state.fixedViewportHeight = height || 300;
  selection.append('div')
    .classed('search', true)
    .call(rowf.setFilter, state);
  selection.append('div')
    .classed('table', true)
    .call(component.datagrid, state);
  selection.datum(state);
}


function filterSortTable(selection, fields, records, rowFactory, height) {
  const data = {
    fields: fields,
    records: records
  };
  const state = new DatagridState({}, data);
  if (rowFactory) {
    state.rowFactory = () => rowFactory(state.visibleFields);
  }
  state.fixedViewportHeight = height || 300;
  selection.append('div')
    .classed('search', true)
    .call(rowf.setFilter, state);
  selection.append('div')
    .classed('table', true)
    .call(sort.setSort, state)
    .call(component.datagrid, state);
  selection.datum(state);
}


function update(selection, fields, records) {
  const data = {
    fields: fields,
    records: records
  };
  const state = selection.datum();
  state.rows = new Collection(data);
  state.updateContentsNotifier();
}


function updateRecords(selection, records) {
  const state = selection.datum();
  state.rows.contents[0].records = records;
  state.updateContentsNotifier();
}


function tableRecords(selection) {
  const state = selection.datum();
  return state.rows.records();
}


export default {
  table, filterTable, filterSortTable, update, updateRecords, tableRecords
};
