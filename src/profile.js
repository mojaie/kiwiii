
/** @module profile */

import d3 from 'd3';

import {default as misc} from './common/misc.js';
import {default as fetcher} from './common/fetcher.js';

import {default as button} from './component/button.js';
import {default as table} from './component/table.js';


function updateChem(compoundID, resources) {
  d3.select('title').text(compoundID);
  const query = {
    workflow: 'search',
    targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
    key: 'compound_id',
    values: [compoundID]
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json)
    .then(res => {
      const rcd = res.records[0];
      d3.select('#compoundid').html(rcd.compound_id);
      d3.select('#compounddb').html(
        resources.find(e => e.id === rcd.__source).name);
      d3.select('#structure').html(rcd.structure);
      const fields = misc.defaultFieldProperties([
        {key: 'key'}, {key: 'value'}
      ]);
      const records = res.fields
        .filter(e => !['structure', 'index', 'compound_id'].includes(e.key))
        .map(e => ({ key: e.name, value: rcd[e.key] }));
      d3.select('#properties')
        .call(table.render, null, null, fields, records);
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
      const fields = misc.defaultFieldProperties([
        {key: 'compound_id'}, {key: 'database'}
      ]);
      const records = res.records
        .filter(rcd => rcd.compound_id !== qrcd.compound_id ||
                rcd.__source !== qrcd.__source)
        .map(rcd => {
          return {
            compound_id: `<a href="profile.html?compound=${rcd.compound_id}" target="_blank">${rcd.compound_id}</a>`,
            database: resources.find(e => e.id === rcd.__source).name
          };
        });
      d3.select('#aliases')
        .call(table.render, fields, records);
    }, fetcher.error);
}


function updateActivities(compoundID, resources) {
  // Prevent implicit submission
  /* TODO: instant search component
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
  */
  const query = {
    workflow: 'profile',
    compound_id: compoundID,
    targets: resources.filter(e => e.domain === 'activity').map(e => e.id),
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json)
    .then(res => {
      const fields= misc.defaultFieldProperties([
        {key: 'assay_id', name: 'Assay ID', format: 'text'},
        {key: 'value_type', name: 'Value type', format: 'text'},
        {key: 'value', name: 'Value', format: 'numeric'}
      ]);
      // TODO: use datagrid?
      d3.select('#results').call(table.render, null, null, fields, res.records);
    }, fetcher.error);
}


function run() {
  // Menubar
  const menubar = d3.select('#menubar');
  menubar.append('a')
      .call(button.menuButton, null, 'Control panel', 'outline-secondary')
      .attr('href', 'control.html')
      .attr('target', '_blank');

  // Compound row
  const chemDataRow = d3.select('#contents')
    .append('div')
      .classed('row', true);
  const firstCol = chemDataRow.append('div')
      .classed('col-sm-4', true);
  firstCol.append('h5').text('Compound ID');
  firstCol.append('div')
      .attr('id', 'compoundid')
      .classed('mb-2');
  firstCol.append('h5').text('Database');
  firstCol.append('div')
      .attr('id', 'compounddb')
      .classed('mb-2');
  firstCol.append('h5').text('Structure');
  firstCol.append('div')
      .attr('id', 'structure')
      .classed('mb-2');
  const propCol = chemDataRow.append('div')
      .classed('col-sm-4', true);
  propCol.append('h5').text('Compound properties');
  propCol.append('table')
      .attr('id', 'properties')
      .style('display', 'inline-block');
  const aliaseCol = chemDataRow.append('div')
      .classed('col-sm-4', true);
  aliaseCol.append('h5').text('Compound structure aliases');
  aliaseCol.append('table')
      .attr('id', 'aliases')
      .style('display', 'inline-block');
  const compoundID = misc.URLQuery().compound || null;

  // Result row
  const resultRow = d3.select('#contents')
    .append('div')
      .classed('row', true);
  const results = resultRow.append('div')
      .classed('col-sm-12', true);
  results.append('h5').text('Assay results and annotations');
  results.append('input')
      .classed('form-control', true)
      .attr('type', 'text')
      .attr('placeholder', 'Search')
      .attr('id', 'search');
  results.append('table')
      .attr('id', 'results');

  if (!compoundID) return;
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";
  const offLine = 'onLine' in navigator && !navigator.onLine;
  return fetcher.get('schema')
    .then(fetcher.json)
    .then(schema => {
      console.info('Off-line mode is disabled for debugging');
      return Promise.all([
        updateChem(compoundID, schema.resources)
          .then(qrcd => updateChemAliases(schema.resources, qrcd)),
        updateActivities(compoundID, schema.resources)
      ]);
    }, () => {
      console.info('Server did not respond');
    });
}


export default {
  run
};
