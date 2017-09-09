
import d3 from 'd3';
import {default as d3form} from './helper/d3Form.js';
import {default as def} from './helper/definition.js';
import {default as fmt} from './helper/formatValue.js';
import {default as win} from './helper/window.js';
import {default as fetcher} from './fetcher.js';
import {default as common} from './common.js';
import {default as store} from './store/StoreConnection.js';
import {default as cmp} from './component/Component.js';


function updateChem(resources) {
  const compound = win.URLQuery().compound;
  const query = {
    type: 'chemsearch',
    targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
    key: 'id',
    values: [compound]
  };
  return fetcher.get('run', query)
    .then(fetcher.json)
    .then(res => {
      const rcd = res.records[0];
      d3.select('#compoundid').html(rcd.id);
      d3.select('#compounddb').html(resources.find(e => e.id === rcd.source).name);
      d3.select('#structure').html(rcd._structure);
      const records = res.fields
        .filter(e => !['_structure', '_index', 'id'].includes(e.key))
        .map(e => ({ key: e.name, value: rcd[e.key] }));
      const data = {
        fields: def.defaultFieldProperties([
          {key: 'key', valueType: 'text'},
          {key: 'value', valueType: 'text'}
        ])
      };
      d3.select('#properties').call(cmp.createTable, data)
        .call(cmp.updateTableRecords, records, d => d.key);
      return rcd;
    }, fetcher.error);
}


function updateChemAliases(resources, qrcd) {
  const query = {
    type: 'exact',
    targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
    queryMol: {
      format: 'dbid',
      source: qrcd.source,
      value: qrcd.id
    },
    params: {ignoreHs: true}
  };
  return fetcher.get('run', query)
    .then(fetcher.json)
    .then(res => {
      const records = res.records
        .filter(rcd => rcd.id !== qrcd.id || rcd.source !== qrcd.source)
        .map(rcd => {
          return {
            id: `<a href="profile.html?compound=${rcd.id}" target="_blank">${rcd.id}</a>`,
            database: resources.find(e => e.id === rcd.source).name
          };
        });
      const data = {
        fields: def.defaultFieldProperties([
          {key: 'id', valueType: 'text'},
          {key: 'database', valueType: 'text'}
        ])
      };
      d3.select('#aliases').call(cmp.createTable, data)
        .call(cmp.updateTableRecords, records, d => d.id);
    }, fetcher.error);
}


function updateActivities() {
  const compound = win.URLQuery().compound;
  // Prevent implicit submission
  document.getElementById('search')
    .addEventListener('keypress', event => {
      if (event.keyCode === 13) event.preventDefault();
    });
  d3.select('#search').on('keyup', function () {
    const match = obj => Object.values(obj)
      .some(e => fmt.partialMatch(d3form.value(this), e));
    d3.select('#results tbody').selectAll('tr')
      .style('visibility', d => match(d) ? null : 'hidden')
      .style('position', d => match(d) ? null : 'absolute');
  });
  const query = {
    type: 'profile',
    id: compound
  };
  return fetcher.get('run', query)
    .then(fetcher.json)
    .then(res => {
      const table = {
        fields: def.defaultFieldProperties([
          {key: '_index', name: 'index', valueType: 'numeric'},
          {key: 'assayID', valueType: 'text'},
          {key: 'field', valueType: 'text'},
          {key: 'valueType', valueType: 'text'},
          {key: '_value', name: 'value', valueType: 'numeric'}
        ])
      };
      d3.select('#results').call(cmp.createTable, table)
        .call(cmp.updateTableRecords, res.records, d => d.id)
        .call(cmp.addSort);
    }, fetcher.error);
}


function run() {
  return common.loader()
    .then(() => store.getResources())
    .then(rsrcs => Promise.all([
      updateChem(rsrcs).then(qrcd => updateChemAliases(rsrcs, qrcd)),
      updateActivities()
    ]));
}


export default {
  run
};
