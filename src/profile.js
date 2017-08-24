
import d3 from 'd3';
import {dataSourceId} from './helper/definition.js';
import {formValue} from './helper/d3Selection.js';
import {partialMatch} from './helper/formatValue.js';
import {loader} from './Loader.js';
import {
  getGlobalConfig, getFetcher, dataFetcherInstances, dataFetcherDomains,
  getResources, getResourceColumns, getDataSourceColumns, localChemInstance
} from './store/StoreConnection.js';
import {
  createTable, updateTableRecords, appendTableRows, addSort
} from './component/Component.js';


function updateChemicals(chemicals) {
  const compound = getGlobalConfig('urlQuery').compound;
  const localServer = localChemInstance();
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
    getDataSourceColumns(res.domain, [rcd.source])
      .then(cols => getFetcher(res.domain).formatResult(cols, res))
      .then(data => {
        const rcds = data.columns
          .filter(e => !['_structure', '_index', 'ID'].includes(e.key))
          .map(e => ({ key: e.name, value: rcd[e.key] }));
        d3.select('#properties').call(createTable, props)
          .call(updateTableRecords, rcds, d => d.key);
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
      d3.select('#aliases').call(createTable, aliases)
        .call(updateTableRecords, rcds, d => d.ID);
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
  const compound = getGlobalConfig('urlQuery').compound;
  // Prevent implicit submission
  document.getElementById('search')
    .addEventListener('keypress', event => {
      if (event.keyCode === 13) event.preventDefault();
    });
  d3.select('#search').on('keyup', function () {
    const match = obj => Object.values(obj)
      .some(e => partialMatch(formValue(this), e));
    d3.select('#results tbody').selectAll('tr')
      .style('visibility', d => match(d) ? null : 'hidden')
      .style('position', d => match(d) ? null : 'absolute');
  });
  d3.select('#results').call(createTable, tbl)
    .call(addSort);
  const tasks = dataFetcherInstances()
    .filter(fetcher => fetcher.available === true)
    .map(fetcher => {
      return fetcher.getRecordsByCompound(compound).then(res => {
        const rcds = res.records.map(rcd => {
          return Object.entries(rcd).map(r => {
            const rcdKey = r[0];
            const rcdValue = r[1];
            const sourceKey = dataSourceId(fetcher.domain, rcd.source, rcdKey);
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
        appendTableRows(d3.select('#results'), rcds, undefined);
      });
    });
  return Promise.all(tasks);
}


function run() {
  const domains = dataFetcherDomains();
  return loader().then(() => {
    return Promise.all([
      getResources('chemical').then(updateChemicals),
      getResourceColumns(domains).then(updateActivities)
    ]);
  });
}
run();
