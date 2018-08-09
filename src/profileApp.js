
/** @module profile */

import d3 from 'd3';

import {default as client} from './common/client.js';
import {default as fetcher} from './common/fetcher.js';

import {default as button} from './component/button.js';

import {default as table} from './datagrid/table.js';


function fetchProfile(compoundID, resources) {
  const profile = {};
  // Compound properties
  const cmpdQuery = {
    workflow: 'search',
    targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
    key: 'compound_id',
    values: [compoundID]
  };
  return fetcher.get(cmpdQuery.workflow, cmpdQuery)
    .then(fetcher.json)
    .then(res => {
      profile.compound = {
        fields: [
          {key: 'key', name: 'key', format: 'text'},
          {key: 'value', name: 'value', format: 'text'}
        ],
        records: [
          {key: 'Formula', value: res.records[0]._formula},
          {key: 'Molecular weight', value: res.records[0]._mw},
          {key: 'Wildman-Crippen logP', value: res.records[0]._logp},
          {key: 'Non-hydrogen atom count', value: res.records[0]._nonH}
        ]
      };
      profile.cid = res.records[0].compound_id;
      profile.name = res.records[0].name;
      profile.src = res.records[0].__source;
      profile.struct = res.records[0].structure;
    })
    .then(() => {
      const aliasQuery = {
        workflow: 'exact',
        targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
        queryMol: {
          format: 'dbid',
          source: profile.src,
          value: profile.cid
        },
        params: {ignoreHs: true}
      };
      return fetcher.get(aliasQuery.workflow, aliasQuery);
    })
    .then(fetcher.json)
    .then(res => {
      profile.aliases = res;
      profile.aliases.fields = [
        {key: 'index', name: 'Index', format: 'd3_format', d3_format: 'd'},
        {key: 'compound_id', name: 'Compound ID', format: 'compound_id'},
        {key: 'name', name: 'Name', format: 'text'},
        {key: '__source', name: 'Source', format: 'text'}
      ];
    })
    .then(() => {
      const assayQuery = {
        workflow: 'profile',
        compound_id: compoundID,
        targets: resources.filter(e => e.domain === 'activity').map(e => e.id),
      };
      return fetcher.get(assayQuery.workflow, assayQuery);
    })
    .then(fetcher.json)
    .then(res => {
      profile.assays = res;
      profile.assays.fields = [
        {key: 'index', name: 'Index', format: 'd3_format', d3_format: 'd'},
        {key: 'assay_id', name: 'Assay ID', format: 'assay_id'},
        {key: 'value_type', name: 'Value type', format: 'text'},
        {key: 'value', name: 'Value', format: 'numeric'}
      ];
      return profile;
    });
}


function render(compoundID) {
  return fetcher.get('schema')
    .then(fetcher.json)
    .then(schema => fetchProfile(compoundID, schema.resources))
    .catch(() => {
      console.info('Server did not respond');
      return {
        aliases: {},
        assays: {},
        compound: {}
      };
    })
    .then(res => {
      const contents = d3.select('#contents')
          .style('padding-left', '10%')
          .style('padding-right', '10%');
      contents.append('h2').classed('mt-5', true).text('Compound ID');
      contents.append('div').classed('mb-5', true).text(res.cid);
      contents.append('h2').classed('mt-5', true).text('Name');
      contents.append('div').classed('mb-5', true).text(res.name);
      contents.append('h2').classed('mt-5', true).text('Source');
      contents.append('div').classed('mb-5', true).text(res.src);
      contents.append('h2').classed('mt-5', true).text('Structure');
      contents.append('div').classed('mb-5', true).html(res.struct);

      contents.append('h2').classed('mt-5', true).text('Chemical properties');
      contents.append('div').classed('mb-5', true)
        .call(table.table, res.compound.fields, res.compound.records,
              null, 150);

      contents.append('h2').classed('mt-5', true).text('Aliases');
      contents.append('div').classed('mb-5', true)
        .call(table.table, res.aliases.fields, res.aliases.records,
              null, 150);

      contents.append('h2').classed('mt-5', true).text('Assay results');
      contents.append('div').classed('mb-5', true)
        .call(table.filterSortTable, res.assays.fields, res.assays.records,
              null, 400);
    });
}


function run() {
  const err = client.compatibility();
  if (err) {
    d3.select('body')
      .style('color', '#ff0000')
      .text(err);
    return;
  }
  // Menubar
  const menubar = d3.select('#menubar')
      .classed('my-1', true);
  menubar.append('a')
      .call(button.menuButtonLink, 'Dashboard', 'outline-secondary', 'db-gray')
      .attr('href', 'dashboard.html')
      .attr('target', '_blank');
  const compoundID = client.URLQuery().compound || null;
  if (!compoundID) return;
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";
  const offLine = 'onLine' in navigator && !navigator.onLine;  client.registerServiceWorker();
  return render(compoundID);
}


export default {
  run
};
