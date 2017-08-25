
/** @module dialog */

import d3 from 'd3';
import {default as d3form} from '../helper/d3Form.js';
import {default as dstr} from '../helper/dataStructure.js';
import {default as fmt} from '../helper/formatValue.js';
import {default as hfile} from '../helper/file.js';
import {default as parser} from '../helper/parser.js';
import {default as himg} from '../helper/image.js';
import {default as store} from '../store/StoreConnection.js';
import {default as cmp} from './Component.js';

const localServer = store.localChemInstance();


function mergeDataSourceColumns(data) {
  return store.getDataSourceColumns(data.domain, data.dataSource)
  .then(cols => store.getFetcher(data.domain).formatResult(cols, data));
}


function pickDialog(rsrc, callback) {
  d3.select('#pick-target')
    .call(cmp.selectOptions, rsrc, d => d.entity, d => d.name)
    .on('change', function () {
      const rsrctbl = d3form.optionData(this);
      d3.select('#pick-queryarea').text(rsrctbl.placeholders.ID);
    });
  d3.select('#pick-queryarea').text(rsrc[0].placeholders.ID);  // initial value
  d3.select('#pick-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const query = {
        method: 'chemsql',
        targets: [d3form.value('#pick-target')],
        key: 'ID',
        values: d3form.textareaLines('#pick-queryarea'),
        operator: 'fm'
      };
      return localServer.getRecords(query)
        .then(mergeDataSourceColumns)
        .then(callback);
    });
}


function propDialog(rsrc, callback) {
  d3.select('#prop-targets')
    .call(cmp.checkboxList, rsrc, 'targets', d => d.entity, d => d.name)
    .on('change', function () {
      const cols = d3form.checkboxData('#prop-targets')
        .map(d => d.columns)
        .extend().unique('key');
      d3.select('#prop-key')
        .call(cmp.selectOptions, cols, d => d.key, d => d.name);
    });
  d3.select('#prop-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const selectedColumn = d3form.optionData('#prop-key');
      const query = {
        method: selectedColumn.method,
        targets: d3form.checkboxValues('#prop-targets'),
        key: selectedColumn.key,
        values: d3form.textareaLines('#prop-queryarea'),
        operator: d3form.value('#prop-operator')
      };
      return localServer.getRecords(query)
      .then(mergeDataSourceColumns)
      .then(callback);
    });
}


function structDialog(rsrc, callback) {
  d3.select('#struct-qsrc')
    .call(cmp.selectOptions, rsrc, d => d.entity, d => d.name);
  d3.select('#struct-targets')
    .call(cmp.checkboxList, rsrc, 'targets', d => d.entity, d => d.name);
  d3.select('#struct-method').selectAll('option.rd')
    .attr('disabled', store.getGlobalConfig('rdk') === true ? null : 'disabled');
  d3.select('#struct-method')
    .on('change', function () {
      const op = d3.select(this.selectedOptions[0]);
      d3.select('#struct-thldtype')
        .attr('disabled', op.classed('thld') ? null : 'disabled')
        .property('value', op.classed('edge') ? 'edge' : 'sim');
      d3.select('#struct-thld')
        .attr('disabled', op.classed('thld') ? null : 'disabled');
      d3.select('#struct-thldtype option.sim')
        .attr('disabled', op.classed('sim') ? null : 'disabled');
      d3.select('#struct-thldtype option.edge')
        .attr('disabled', op.classed('edge') ? null : 'disabled');
      d3.select('#struct-options').selectAll('.gls')
        .attr('disabled', op.classed('gls') ? null : 'disabled');
      d3.select('#struct-options').selectAll('.fmcs')
        .attr('disabled', this.value === 'rdfmcs' ? null : 'disabled');
      d3.select('#struct-thld')
        .attr('value', d3form.value('#struct-thldtype') === 'edge' ? 15 : 0.7)
        .attr('min', d3form.value('#struct-thldtype') === 'edge' ? 5 : 0)
        .attr('max', d3form.value('#struct-thldtype') === 'edge' ? 999 : 1.0)
        .attr('step', d3form.value('#struct-thldtype') === 'edge' ? 1 : 0.01);
    });
  d3.select('#struct-thldtype')
    .on('change', function () {
      d3.select('#struct-thld')
        .attr('value', this.value === 'edge' ? 15 : 0.7)
        .attr('min', this.value === 'edge' ? 5 : 0)
        .attr('max', this.value === 'edge' ? 999 : 1.0)
        .attr('step', this.value === 'edge' ? 1 : 0.01);
    });
  d3.select('#struct-format')
    .on('change', function () {
      d3.select('#struct-qsrc')
        .attr('disabled', this.value === 'dbid' ? null : 'disabled');
    });
  d3.select('#struct-preview')
    .on('click', () => {
      const fmt = d3form.value('#struct-format');
      const query = {
        format: fmt,
        querySource: fmt === 'dbid' ? d3form.value('#struct-qsrc') : null,
        value: fmt === 'molfile'
          ? d3form.value('#struct-queryarea') : d3form.textareaLines('#struct-queryarea')[0],
      };
      return localServer.strprev(query)
        .then(res => d3.select('#struct-image').html(res));
    });
  d3.select('#struct-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const mthdop = d3.select(d3.select('#struct-method').node().selectedOptions[0]);
      const fmt = d3form.value('#struct-format');
      const query = {
        method: d3form.value('#struct-method'),
        targets: d3form.checkboxValues('#struct-targets'),
        format: fmt,
        querySource: fmt === 'dbid' ? d3form.value('#struct-qsrc') : null,
        value: fmt === 'molfile'
          ? d3form.value('#struct-queryarea') : d3form.textareaLines('#struct-queryarea')[0],
        thresholdType: d3form.value('#struct-thldtype'),
        threshold: d3form.valueFloat('#struct-thld'),
        ignoreHs: d3form.checked('#struct-ignoreh'),
        diameter: mthdop.classed('gls') ? d3form.valueInt('#struct-diam') : null,
        maxTreeSize: mthdop.classed('gls') ? d3form.valueInt('#struct-tree') : null,
        molSizeCutoff: mthdop.classed('gls') ? d3form.valueInt('#struct-skip') : null,
        timeout: mthdop.classed('rd') ? d3form.valueInt('#struct-timeout') : null
      };
      return localServer.getRecords(query)
        .then(mergeDataSourceColumns)
        .then(callback);
    });
}


function sdfDialog(callback) {
  d3.select('#sdf-file')
    .on('change', () => {
      const reader = new FileReader();
      const file = document.getElementById('sdf-file').files[0];
      reader.onload = (e) => {
        d3.select('#sdf-cols')
          .call(cmp.checkboxList, parser.getSDFPropList(e.target.result),
                'columns', d => d, d => d
          );
      };
      // Scan only first 100mb of the file due to memory limit.
      reader.readAsText(file.slice(0, 100 * 1024 * 1024));
    });
  d3.select('#sdf-selectall')
    .on('change', () => {
      d3.select('#sdf-cols').selectAll('input')
        .property('checked', d3form.checked('#sdf-selectall'));
    });
  d3.select('#sdf-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const query = {
        contents: d3form.firstFile('#sdf-file'),
        query: JSON.stringify({
          columns: d3form.checkboxValues('#sdf-cols'),
          implh: d3form.checked('#sdf-implh'),
          recalc: d3form.checked('#sdf-recalc')
        })
      };
      return localServer.importSDF(query).then(callback);
    });
}


function columnDialog(tbl, callback) {
  // TODO: need refactoring
  const coltbl = {
    columns: [
      {key: 'name', sort: 'text', visible: true},
      {key: 'visible', sort: 'text', visible: true},
      {key: 'sort', sort: 'text', visible: true},
      {key: 'digit', sort: 'numeric', visible: true}
    ]
  };
  d3.select('#column-table thead').remove();
  d3.select('#column-table tbody').remove();
  d3.select('#column-table').call(cmp.createTable, coltbl)
    .select('tbody').selectAll('tr')
    .data(tbl.columns).enter().append('tr')
    .each(function (row) {
      d3.select(this).selectAll('td')
        .data(d => coltbl.columns.map(e => d[e.key])).enter().append('td')
        .each(function (cell, i) {
          if (i === 0) {
            d3.select(this).text(d => d);
          } else if (i === 1) {
            d3.select(this).classed('column-vis-select', true)
              .append('input')
                .attr('type', 'checkbox')
                .attr('value', row.key)
                .property('checked', d => d);
          } else if (i === 2) {
            d3.select(this).classed('column-sort-select', true)
              .append('select')
              .call(cmp.selectOptions,
                    cell === 'none' ? ['none'] : ['numeric', 'text'], null, d => d)
              .each(function (value) {
                d3.select(this).selectAll('option')
                  .property('selected', d => d === value);
              });
          } else if (i === 3) {
            d3.select(this).classed('column-digit-select', true)
              .append('select')
              .call(cmp.selectOptions, ['raw', 'rounded', 'scientific', 'si'], null, d => d)
              .each(function (value) {
                d3.select(this).selectAll('option')
                  .property('selected', d => d === value);
              });
            if (row.sort !== 'numeric') {
              d3.select(this).select('select').attr('disabled', 'disabled');
            }
          }
        });
    });
  d3.select('#column-table tbody').selectAll('tr')
    .on('change', function () {
        const sort = d3.select(this).select('.column-sort-select select').node().value;
        d3.select(this).select('.column-digit-select select')
          .attr('disabled', sort === 'numeric' ? null : 'disabled');
    });
  d3.select('#column-submit')
    .on('click', () => {
      const query = {
        visibles: d3form.checkboxValues('.column-vis-select'),
        sorts: d3form.optionValues('.column-sort-select'),
        digits: d3form.optionValues('.column-digit-select')
      };
      return store.setColumnsToShow(query).then(callback);
    });
}


function joinDialog(tbl, rcds, callback) {
  const domains = store.dataFetcherDomains();
  // Prevent implicit submission
  document.getElementById('join-search')
    .addEventListener('keypress', event => {
      if (event.keyCode === 13) event.preventDefault();
    });
  return store.getResourceColumns(domains).then(rsrcs => {
    const shownCols = tbl.columns.map(e => e.key);
    d3.select('#join-keys')
      .call(cmp.checkboxList, rsrcs.unique('key'), 'keys',
            d => d.key, d => d.name)
      .selectAll('li')
      .each(function(d) { // disable already shown columns
        const ex = shownCols.includes(d.key);
        d3.select(this).selectAll('label').select('input')
          .property('checked', ex)
          .attr('disabled', ex ? 'disabled' : null);
      });
    d3.select('#join-search').on('keyup', function () {
      const match = d => fmt.partialMatch(d3form.value(this), d.name);
      d3.select('#join-keys').selectAll('li')
        .style('visibility', d => match(d) ? null : 'hidden')
        .style('position', d => match(d) ? null : 'absolute');
    });
    d3.select('#join-submit').on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const selectedCols = d3form.checkboxValues('#join-keys');
      const mpgs = rsrcs
        .filter(col => !shownCols.includes(col.key))
        .filter(col => selectedCols.includes(col.key))
        .map(col => {
          const ids = rcds.map(row => row.ID);
          const api = store.getFetcher(col.domain);
          return api.getMapping(ids, col);
        });
      return Promise.all(mpgs).then(res => {
        // callback(res.filter(e => Object.keys(e.mapping).length !== 0));
        callback(res);
      });
    });
  });
}


function importColDialog(tbl, callback) {
  d3.select('#importcol-file')
    .on('change', () => {
      const file = document.getElementById('importcol-file').files[0];
      const isCsv = file.name.split('.').pop() === 'csv';
      hfile.readFile(file).then(res => {
        const mapping = isCsv ? dstr.csvToMapping(res) : JSON.parse(res);
        const tbl = dstr.columnMappingToTable(mapping);
        d3.select('#importcol-preview').call(cmp.createTable, tbl)
          .call(cmp.updateTableRecords,
                tbl.records.slice(0, 5), d => d[tbl.columns[0].key]);
        // bind mapping
        d3.select('#importcol-preview').datum(mapping);
      });
    });
  d3.select('#importcol-submit')
    .on('click', () => {
      let mapping = d3.select('#importcol-preview').datum();
      d3.select('#importcol-preview').datum(null);  // unbind mapping
      // Generate thumbnails
      const plotCols = [];
      if (mapping.hasOwnProperty('column')) {
        mapping = dstr.singleToMultiMapping(mapping);
      }
      mapping.columns.forEach((e, i) => {
        if (e.valueType === 'plot') {
          mapping.columns[i].valueType = 'image';
          plotCols.push(i);
        }
      });
      if (plotCols.length > 0) {
        const ps = [];
        Object.entries(mapping.mapping).forEach(m => {
          plotCols.forEach(e => {
            const p = himg.plotThumbnail(m[1][e])
              .then(img => {
                mapping.mapping[m[0]][e] = img;
              });
            ps.push(p);
          });
        });
        Promise.all(ps).then(() => callback([mapping]));
      } else {
        callback([mapping]);
      }
    });
}


function graphDialog(tbl, rcds, callback) {
  d3.select('#graph-measure').selectAll('option.rd')
    .attr('disabled', store.getGlobalConfig('rdk') === true ? null : 'disabled');
  d3.select('#graph-measure')
    .on('change', function () {
      d3.select('#graph-options').selectAll('.gls')
        .attr('disabled', this.value === 'gls' ? null : 'disabled');
      d3.select('#graph-options').selectAll('.fmcs')
        .attr('disabled', this.value === 'rdfmcs' ? null : 'disabled');
    });
  d3.select('#graph-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const mthdop = d3.select(d3.select('#graph-measure').node().selectedOptions[0]);
      const query = {
        measure: d3form.value('#graph-measure'),
        indices: [],
        molecules: [],
        nodeTableId: tbl.id,
        threshold: d3form.valueFloat('#graph-thld'),
        ignoreHs: d3form.checked('#graph-ignoreh'),
        diameter: mthdop.node().value === 'gls' ? d3form.valueInt('#graph-diam') : null,
        maxTreeSize: mthdop.node().value === 'gls' ? d3form.valueInt('#graph-tree') : null,
        molSizeCutoff: mthdop.node().value === 'gls' ? d3form.valueInt('#graph-skip') : null,
        timeout: mthdop.classed('rd') ? d3form.valueInt('#graph-timeout') : null
      };
      rcds.forEach(e => {
        query.molecules.push(e._mol);
        query.indices.push(e._index);
      });
      return localServer.getRecords(query).then(callback);
    });
}


function graphConfigDialog(edges, callback) {
  d3.select('#graphconfig-thld')
    .attr('value', edges.networkThreshold)
    .attr('max', 1.0)
    .attr('min', edges.query.threshold);
  d3.select('#graphconfig-submit')
    .on('click', () => {
      const newThld = d3form.valueFloat('#graphconfig-thld');
      if (newThld < edges.query.threshold) return;  // TODO: fool proof
      callback(newThld);
    });
}


function communityDialog(callback) {
  d3.select('#community-name').attr('value', 'comm_');
  d3.select('#community-submit')
    .on('click', () => {
      const query = {
        name: d3form.value('#community-name'),
        nulliso: d3form.checked('#community-nulliso')
      };
      callback(query);
    });
}


export default {
  pickDialog, propDialog, structDialog, sdfDialog,
  columnDialog, joinDialog, importColDialog, graphDialog,
  graphConfigDialog, communityDialog
};
