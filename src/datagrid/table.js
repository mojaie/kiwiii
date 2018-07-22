
/** @module datagrid/table */

import DatagridState from './state.js';
import {default as rowf} from './rowFilter.js';
import {default as component} from './component.js';


function table(selection, fields, records, rowFactory, height) {
  const data = {
    fields: fields,
    records: records
  };
  const state = new DatagridState({}, data);
  state.keyFunc = d => d;
  state.rowFactory = () => rowFactory(state.visibleFields);
  state.fixedViewportHeight = height;
  selection.append('div')
    .classed('table', true)
    .call(component.datagrid, state);
  selection.datum(state);
}


function filterTable(selection, fields, records) {
  const data = {
    fields: fields,
    records: records
  };
  const state = new DatagridState({}, data);
  state.fixedViewportHeight = 300;
  selection.append('div')
    .classed('search', true)
    .call(rowf.setFilter, state);
  selection.append('div')
    .classed('table', true)
    .call(component.datagrid, state);
  selection.datum(state);
}

function tableRecords(selection) {
  const state = selection.datum();
  return state.rows.records();
}


export default {
  table, filterTable, tableRecords
};
