
/** @module profile */

import d3 from 'd3';

import {default as misc} from './common/misc.js';
import {default as fetcher} from './common/fetcher.js';

import {default as button} from './component/button.js';
import {default as table} from './component/table.js';

import DatagridState from './datagrid/state.js';
import {default as view} from './datagrid/view.js';
import {default as rowf} from './datagrid/rowfilter.js';


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
      profile.compound = res.records[0];
    })
    .then(() => {
      const aliasQuery = {
        workflow: 'exact',
        targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
        queryMol: {
          format: 'dbid',
          source: profile.compound.__source,
          value: profile.compound.compound_id
        },
        params: {ignoreHs: true}
      };
      return fetcher.get(aliasQuery.workflow, aliasQuery);
    })
    .then(fetcher.json)
    .then(res => {
      profile.aliases = res;
      profile.aliases.fields = misc.defaultFieldProperties(profile.aliases.fields);
      /*profile.aliases = res.records.filter(rcd => {
        return rcd.compound_id !== profile.compound.compound_id ||
        rcd.__source !== profile.compound.__source;
      });
      */
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
      profile.assays.fields = misc.defaultFieldProperties(profile.assays.fields);
      console.log(JSON.parse(JSON.stringify(profile)));
      return profile;
    });
}


function update(compoundID) {
  fetcher.get('schema')
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
      d3.select('#cid').text(res.compound.compound_id);
      d3.select('#db').text(res.compound.__source);
      d3.select('#struct').html(res.compound.structure);

      const aliasState = new DatagridState(res.aliases);
      const aliasFilter = d3.select('#aliases').append('div')
          .classed('alias-filter', true);
      const aliasdg = d3.select('#aliases').append('div')
          .classed('alias-dg', true);
      aliasState.fixedViewportHeight = 200;
      aliasdg.call(view.datagrid, aliasState);
      aliasFilter.call(rowf.setFilter, aliasState);

      const assayState = new DatagridState(res.assays);
      const assayFilter = d3.select('#assays').append('div')
          .classed('assay-filter', true);
      const assaydg = d3.select('#assays').append('div')
          .classed('assay-dg', true);
      assayState.fixedViewportHeight = 200;
      assaydg.call(view.datagrid, assayState);
      assayFilter.call(rowf.setFilter, assayState);
    });
}


function run() {
  // Menubar
  const menubar = d3.select('#menubar');
  menubar.append('a')
      .call(button.menuButtonLink, 'Control panel', 'outline-secondary', 'cog')
      .attr('href', 'control.html')
      .attr('target', '_blank');

  // Compound row
  const contents = d3.select('#contents');
  const cid = contents.append('div');
  contents.style('counter-reset', 'section');
  cid.append('h2').text('Compound ID');
  cid.append('div')
      .attr('id', 'cid')
      .classed('mb-2', true);
  const db = contents.append('div');
  db.append('h2').text('Database');
  db.append('div')
      .attr('id', 'db')
      .classed('mb-2', true);
  const struct = contents.append('div');
  struct.append('h2').text('Structure');
  struct.append('div')
      .attr('id', 'struct')
      .classed('mb-2', true);
  const props = contents.append('div');
  props.append('h2').text('Chemical properties');
  props.append('div')
      .attr('id', 'props')
      .classed('mb-2', true);
  const aliases = contents.append('div');
  aliases.append('h2').text('Aliases');
  aliases.append('div')
      .attr('id', 'aliases')
      .classed('mb-2', true);
  const assays = contents.append('div');
  assays.append('h2').text('Assay results');
  assays.append('div')
      .attr('id', 'assays')
      .classed('mb-2', true);

  const compoundID = misc.URLQuery().compound || null;
  if (!compoundID) return;
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";
  const offLine = 'onLine' in navigator && !navigator.onLine;
  console.info('Off-line mode is disabled for debugging');
  return update(compoundID);
}


export default {
  run
};
