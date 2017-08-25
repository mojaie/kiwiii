
import d3 from 'd3';
import {default as def} from './helper/definition.js';
import {default as d3form} from './helper/d3Form.js';
import {default as fmt} from './helper/formatValue.js';
import {default as loader} from './Loader.js';
import {default as store} from './store/StoreConnection.js';
import {default as cmp} from './component/Component.js';


function updateChemicals(chemicals) {
  const compound = store.getGlobalConfig('urlQuery').compound;
  const localServer = store.localChemInstance();
  const query = {
    method: 'chemsql',
    targets: chemicals.map(e => e.entity),
    key: 'ID',
    values: [compound],
    operator: 'fm'
  };
  // Chemical properties
  const properties = localServer.getRecords(query).then(res => {
    const rcd = res.records[0];
    d3.select('#compoundid').html(rcd.ID);
    d3.select('#compounddb').html(chemicals.find(e => e.id === rcd.source).name);
    d3.select('#structure').html(rcd._structure);
    const props = {
        columns: [
          {key: 'key', sort: 'text', visible: true},
          {key: 'value', sort: 'text', visible: true}
        ]
    };
    // Convert the record into key-value table
    store.getDataSourceColumns(res.domain, [rcd.source])
      .then(cols => store.getFetcher(res.domain).formatResult(cols, res))
      .then(data => {
        const rcds = data.columns
          .filter(e => !['_structure', '_index', 'ID'].includes(e.key))
          .map(e => ({ key: e.name, value: rcd[e.key] }));
        d3.select('#properties').call(cmp.createTable, props)
          .call(cmp.updateTableRecords, rcds, d => d.key);
      });
    return rcd;
  });
  // Compound structure alias
  properties.then(qrcd => {
    const aliases = {
        columns: [
          {key: 'ID', sort: 'text', visible: true},
          {key: 'database', sort: 'text', visible: true}
        ]
    };
    const aliasQuery = {
      method: 'exact',
      targets: chemicals.map(e => e.entity),
      format: 'dbid',
      querySource: chemicals.find(e => e.id === qrcd.source).entity,
      value: compound,
      ignoreHs: true,
      flush: true
    };
    return localServer.getRecords(aliasQuery).then(res => {
      const rcds = res.records
        .filter(rcd => rcd.ID !== compound || rcd.source !== qrcd.source)
        .map(rcd => {
        return {
          ID: `<a href="profile.html?compound=${rcd.ID}" target="_blank">${rcd.ID}</a>`,
          database: chemicals.find(e => e.id === rcd.source).name
        };
      });
      d3.select('#aliases').call(cmp.createTable, aliases)
        .call(cmp.updateTableRecords, rcds, d => d.ID);
      return;
    });
  });
}

function updateActivities(activities) {
  const tbl = {
    columns: [
      {key: 'name', sort: 'text', visible: true},
      {key: 'tags', sort: 'text', visible: true},
      {key: 'valueType', sort: 'text', visible: true},
      {key: 'value', sort: 'numeric', visible: true, valueType: 'AC50'},
      {key: 'remarks', sort: 'none', visible: true}
    ]
  };
  const compound = store.getGlobalConfig('urlQuery').compound;
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
  d3.select('#results').call(cmp.createTable, tbl)
    .call(cmp.addSort);
  const tasks = store.dataFetcherInstances()
    .filter(fetcher => fetcher.available === true)
    .map(fetcher => {
      return fetcher.getRecordsByCompound(compound).then(res => {
        const rcds = res.records.map(rcd => {
          return Object.entries(rcd).map(r => {
            const rcdKey = r[0];
            const rcdValue = r[1];
            const sourceKey = def.dataSourceId(fetcher.domain, rcd.source, rcdKey);
            const sourceCol = activities.find(e => e.key === sourceKey);
            if (sourceCol === undefined) return;  // found in database but not annotated
            if (sourceCol.valueType === 'flag' && rcdValue === 0) return;  // empty flag
            return {
              name: sourceCol.name,
              tags: sourceCol.tags,
              valueType: sourceCol.valueType,
              value: d3.format('.3c')(rcdValue),
              remarks: ''
            };
          }).filter(e => e !== undefined);
        }).extend();
        cmp.appendTableRows(d3.select('#results'), rcds, undefined);
      });
    });
  return Promise.all(tasks);
}


function run() {
  const domains = store.dataFetcherDomains();
  return loader.loader().then(() => {
    return Promise.all([
      store.getResources('chemical').then(updateChemicals),
      store.getResourceColumns(domains).then(updateActivities)
    ]);
  });
}
run();
