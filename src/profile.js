
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
  d3.select('title').text(compound);
  const query = {
    workflow: 'chemsearch',
    targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
    key: 'compound_id',
    values: [compound]
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json)
    .then(res => {
      const rcd = res.records[0];
      d3.select('#compoundid').html(rcd.compound_id);
      d3.select('#compounddb').html(
        resources.find(e => e.id === rcd.__source).name);
      d3.select('#structure').html(rcd.structure);
      const records = res.fields
        .filter(e => !['structure', 'index', 'compound_id'].includes(e.key))
        .map(e => ({ key: e.name, value: rcd[e.key] }));
      const data = {
        fields: def.defaultFieldProperties([
          {key: 'key'}, {key: 'value'}
        ])
      };
      d3.select('#properties').call(cmp.createTable, data)
        .call(cmp.updateTableRecords, records, d => d.key);
      return rcd;
    }, fetcher.error);
}


function updateChemAliases(resources, qrcd) {
  const query = {
    workflow: 'exact',
    targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
    queryMol: {
      format: 'dbid',
      source: qrcd.__source,
      value: qrcd.compound_id
    },
    params: {ignoreHs: true}
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json)
    .then(res => {
      const records = res.records
        .filter(rcd => rcd.compound_id !== qrcd.compound_id ||
                rcd.__source !== qrcd.__source)
        .map(rcd => {
          return {
            compound_id: `<a href="profile.html?compound=${rcd.compound_id}" target="_blank">${rcd.compound_id}</a>`,
            database: resources.find(e => e.id === rcd.__source).name
          };
        });
      const data = {
        fields: def.defaultFieldProperties([
          {key: 'compound_id'}, {key: 'database'}
        ])
      };
      d3.select('#aliases').call(cmp.createTable, data)
        .call(cmp.updateTableRecords, records, d => d.compound_id);
    }, fetcher.error);
}


function updateActivities(resources) {
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
    workflow: 'profile',
    compound_id: compound,
    targets: resources.filter(e => e.domain === 'activity').map(e => e.id),
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json)
    .then(res => {
      const table = {
        fields: def.defaultFieldProperties([
          {key: 'assay_id', name: 'Assay ID', format: 'text'},
          {key: 'value_type', name: 'Value type', format: 'text'},
          {key: 'value', name: 'Value', format: 'numeric'}
        ])
      };
      d3.select('#results').call(cmp.createTable, table)
        .call(cmp.updateTableRecords, res.records, d => d.index)
        .call(cmp.addSort);
    }, fetcher.error);
}


function run() {
  return common.loader()
    .then(() => store.getResources())
    .then(rsrcs => Promise.all([
      updateChem(rsrcs).then(qrcd => updateChemAliases(rsrcs, qrcd)),
      updateActivities(rsrcs)
    ]));
}


export default {
  run
};
