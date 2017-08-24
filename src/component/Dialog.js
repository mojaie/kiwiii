
import d3 from 'd3';
import {
  formValue, formInt, formFloat, formChecked,
  checkboxValues, selectedOptionValues, textareaLines,
  firstFile, selectedCheckboxesData, selectedOptionData
} from '../helper/d3Selection.js';
import {
  csvToMapping, columnMappingToTable, singleToMultiMapping
} from '../helper/dataStructure.js';
import {partialMatch} from '../helper/formatValue.js';
import {readFile} from '../helper/file.js';
import {getSDFPropList} from '../helper/parser.js';
import {plotThumbnail} from '../helper/image.js';
import {
  localChemInstance, getFetcher, dataFetcherDomains, getGlobalConfig,
  getResourceColumns, getDataSourceColumns, setColumnsToShow
} from '../store/StoreConnection.js';
import {
  checkboxList, selectOptions, createTable, updateTableRecords
} from './Component.js';

const localServer = localChemInstance();


function mergeDataSourceColumns(data) {
  return getDataSourceColumns(data.domain, data.dataSource)
  .then(cols => getFetcher(data.domain).formatResult(cols, data));
}


export function pickDialog(rsrc, callback) {
  d3.select('#pick-target')
    .call(selectOptions, rsrc, d => d.entity, d => d.name)
    .on('change', function () {
      const rsrctbl = selectedOptionData(this);
      d3.select('#pick-queryarea').text(rsrctbl.placeholders.ID);
    });
  d3.select('#pick-queryarea').text(rsrc[0].placeholders.ID);  // initial value
  d3.select('#pick-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const query = {
        method: 'chemsql',
        targets: [formValue('#pick-target')],
        key: 'ID',
        values: textareaLines('#pick-queryarea'),
        operator: 'fm'
      };
      return localServer.getRecords(query)
        .then(mergeDataSourceColumns)
        .then(callback);
    });
}


export function propDialog(rsrc, callback) {
  d3.select('#prop-targets')
    .call(checkboxList, rsrc, 'targets', d => d.entity, d => d.name)
    .on('change', function () {
      const cols = selectedCheckboxesData('#prop-targets')
        .map(d => d.columns)
        .extend().unique('key');
      d3.select('#prop-key')
        .call(selectOptions, cols, d => d.key, d => d.name);
    });
  d3.select('#prop-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const selectedColumn = selectedOptionData('#prop-key');
      const query = {
        method: selectedColumn.method,
        targets: checkboxValues('#prop-targets'),
        key: selectedColumn.key,
        values: textareaLines('#prop-queryarea'),
        operator: formValue('#prop-operator')
      };
      return localServer.getRecords(query)
      .then(mergeDataSourceColumns)
      .then(callback);
    });
}


export function structDialog(rsrc, callback) {
  d3.select('#struct-qsrc')
    .call(selectOptions, rsrc, d => d.entity, d => d.name);
  d3.select('#struct-targets')
    .call(checkboxList, rsrc, 'targets', d => d.entity, d => d.name);
  d3.select('#struct-method').selectAll('option.rd')
    .attr('disabled', getGlobalConfig('rdk') === true ? null : 'disabled');
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
        .attr('value', formValue('#struct-thldtype') === 'edge' ? 15 : 0.7)
        .attr('min', formValue('#struct-thldtype') === 'edge' ? 5 : 0)
        .attr('max', formValue('#struct-thldtype') === 'edge' ? 999 : 1.0)
        .attr('step', formValue('#struct-thldtype') === 'edge' ? 1 : 0.01);
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
      const fmt = formValue('#struct-format');
      const query = {
        format: fmt,
        querySource: fmt === 'dbid' ? formValue('#struct-qsrc') : null,
        value: fmt === 'molfile'
          ? formValue('#struct-queryarea') : textareaLines('#struct-queryarea')[0],
      };
      return localServer.strprev(query)
        .then(res => d3.select('#struct-image').html(res));
    });
  d3.select('#struct-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const mthdop = d3.select(d3.select('#struct-method').node().selectedOptions[0]);
      const fmt = formValue('#struct-format');
      const query = {
        method: formValue('#struct-method'),
        targets: checkboxValues('#struct-targets'),
        format: fmt,
        querySource: fmt === 'dbid' ? formValue('#struct-qsrc') : null,
        value: fmt === 'molfile'
          ? formValue('#struct-queryarea') : textareaLines('#struct-queryarea')[0],
        thresholdType: formValue('#struct-thldtype'),
        threshold: formFloat('#struct-thld'),
        ignoreHs: formChecked('#struct-ignoreh'),
        diameter: mthdop.classed('gls') ? formInt('#struct-diam') : null,
        maxTreeSize: mthdop.classed('gls') ? formInt('#struct-tree') : null,
        molSizeCutoff: mthdop.classed('gls') ? formInt('#struct-skip') : null,
        timeout: mthdop.classed('rd') ? formInt('#struct-timeout') : null
      };
      return localServer.getRecords(query)
        .then(mergeDataSourceColumns)
        .then(callback);
    });
}


export function sdfDialog(callback) {
  d3.select('#sdf-file')
    .on('change', () => {
      const reader = new FileReader();
      const file = document.getElementById('sdf-file').files[0];
      reader.onload = (e) => {
        d3.select('#sdf-cols')
          .call(checkboxList, getSDFPropList(e.target.result),
                'columns', d => d, d => d
          );
      };
      // Scan only first 100mb of the file due to memory limit.
      reader.readAsText(file.slice(0, 100 * 1024 * 1024));
    });
  d3.select('#sdf-selectall')
    .on('change', () => {
      d3.select('#sdf-cols').selectAll('input')
        .property('checked', formChecked('#sdf-selectall'));
    });
  d3.select('#sdf-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const query = {
        contents: firstFile('#sdf-file'),
        query: JSON.stringify({
          columns: checkboxValues('#sdf-cols'),
          implh: formChecked('#sdf-implh'),
          recalc: formChecked('#sdf-recalc')
        })
      };
      return localServer.importSDF(query).then(callback);
    });
}

export function columnDialog(tbl, callback) {
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
  d3.select('#column-table').call(createTable, coltbl)
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
              .call(selectOptions,
                    cell === 'none' ? ['none'] : ['numeric', 'text'], null, d => d)
              .each(function (value) {
                d3.select(this).selectAll('option')
                  .property('selected', d => d === value);
              });
          } else if (i === 3) {
            d3.select(this).classed('column-digit-select', true)
              .append('select')
              .call(selectOptions, ['raw', 'rounded', 'scientific', 'si'], null, d => d)
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
        visibles: checkboxValues('.column-vis-select'),
        sorts: selectedOptionValues('.column-sort-select'),
        digits: selectedOptionValues('.column-digit-select')
      };
      return setColumnsToShow(query).then(callback);
    });
}


export function joinDialog(tbl, rcds, callback) {
  const domains = dataFetcherDomains();
  // Prevent implicit submission
  document.getElementById('join-search')
    .addEventListener('keypress', event => {
      if (event.keyCode === 13) event.preventDefault();
    });
  return getResourceColumns(domains).then(rsrcs => {
    const shownCols = tbl.columns.map(e => e.key);
    d3.select('#join-keys')
      .call(checkboxList, rsrcs.unique('key'), 'keys',
            d => d.key, d => d.name)
      .selectAll('li')
      .each(function(d) { // disable already shown columns
        const ex = shownCols.includes(d.key);
        d3.select(this).selectAll('label').select('input')
          .property('checked', ex)
          .attr('disabled', ex ? 'disabled' : null);
      });
    d3.select('#join-search').on('keyup', function () {
      const match = d => partialMatch(formValue(this), d.name);
      d3.select('#join-keys').selectAll('li')
        .style('visibility', d => match(d) ? null : 'hidden')
        .style('position', d => match(d) ? null : 'absolute');
    });
    d3.select('#join-submit').on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const selectedCols = checkboxValues('#join-keys');
      const mpgs = rsrcs
        .filter(col => !shownCols.includes(col.key))
        .filter(col => selectedCols.includes(col.key))
        .map(col => {
          const ids = rcds.map(row => row.ID);
          const api = getFetcher(col.domain);
          return api.getMapping(ids, col);
        });
      return Promise.all(mpgs).then(res => {
        // callback(res.filter(e => Object.keys(e.mapping).length !== 0));
        callback(res);
      });
    });
  });
}


export function importColDialog(tbl, callback) {
  d3.select('#importcol-file')
    .on('change', () => {
      const file = document.getElementById('importcol-file').files[0];
      const isCsv = file.name.split('.').pop() === 'csv';
      readFile(file).then(res => {
        const mapping = isCsv ? csvToMapping(res) : JSON.parse(res);
        const tbl = columnMappingToTable(mapping);
        d3.select('#importcol-preview').call(createTable, tbl)
          .call(updateTableRecords,
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
        mapping = singleToMultiMapping(mapping);
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
            const p = plotThumbnail(m[1][e])
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


export function graphDialog(tbl, rcds, callback) {
  d3.select('#graph-measure').selectAll('option.rd')
    .attr('disabled', getGlobalConfig('rdk') === true ? null : 'disabled');
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
        measure: formValue('#graph-measure'),
        indices: [],
        molecules: [],
        nodeTableId: tbl.id,
        threshold: formFloat('#graph-thld'),
        ignoreHs: formChecked('#graph-ignoreh'),
        diameter: mthdop.node().value === 'gls' ? formInt('#graph-diam') : null,
        maxTreeSize: mthdop.node().value === 'gls' ? formInt('#graph-tree') : null,
        molSizeCutoff: mthdop.node().value === 'gls' ? formInt('#graph-skip') : null,
        timeout: mthdop.classed('rd') ? formInt('#graph-timeout') : null
      };
      rcds.forEach(e => {
        query.molecules.push(e._mol);
        query.indices.push(e._index);
      });
      return localServer.getRecords(query).then(callback);
    });
}


export function graphConfigDialog(edges, callback) {
  d3.select('#graphconfig-thld')
    .attr('value', edges.networkThreshold)
    .attr('max', 1.0)
    .attr('min', edges.query.threshold);
  d3.select('#graphconfig-submit')
    .on('click', () => {
      const newThld = formFloat('#graphconfig-thld');
      if (newThld < edges.query.threshold) return;  // TODO: fool proof
      callback(newThld);
    });
}


export function communityDialog(callback) {
  d3.select('#community-name').attr('value', 'comm_');
  d3.select('#community-submit')
    .on('click', () => {
      const query = {
        name: formValue('#community-name'),
        nulliso: formChecked('#community-nulliso')
      };
      callback(query);
    });
}
