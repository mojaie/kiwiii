
/** @module component/Dialog */

import d3 from 'd3';

import KArray from '../helper/KArray.js';
import {default as d3form} from '../helper/d3Form.js';
import {default as mapper} from '../helper/mapper.js';
import {default as def} from '../helper/definition.js';
import {default as fmt} from '../helper/formatValue.js';
import {default as win} from '../helper/window.js';
import {default as hfile} from '../helper/file.js';
import {default as misc} from '../helper/misc.js';
import {default as himg} from '../helper/image.js';
import {default as store} from '../store/StoreConnection.js';
import {default as cmp} from './Component.js';
import {default as fetcher} from '../fetcher.js';


function pickDialog(resources, callback) {
  store.getAppSetting('compoundIDPlaceholder').then(ids => {
    d3.select('#pick-queryarea').text(ids);
  });
  d3.select('#pick-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const query = {
        type: 'chemsearch',
        targets: resources.filter(e => e.domain === 'chemical').map(e => e.id),
        key: 'compound_id',
        values: d3form.textareaLines('#pick-queryarea')
      };
      return fetcher.get('run', query)
        .then(fetcher.json)
        .then(callback, fetcher.error);
    });
}


function propDialog(resources, callback) {
  d3.select('#prop-targets')
    .call(cmp.checkboxList, resources, 'targets', d => d.id, d => d.name)
    .on('change', function () {
      const cols = KArray.from(d3form.checkboxData('#prop-targets'))
        .map(d => d.fields)
        .extend().unique('key');
      d3.select('#prop-key')
        .call(cmp.selectOptions, cols, d => d.key, d => d.name);
    });
  d3.select('#prop-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const query = {
        type: 'chemprop',
        targets: d3form.checkboxValues('#prop-targets'),
        key: d3form.optionData('#prop-key').key,
        values: d3form.textareaLines('#prop-queryarea'),
        operator: d3form.value('#prop-operator')
      };
      return fetcher.get('async', query)
        .then(fetcher.json)
        .then(callback, fetcher.error);
    });
}


function structDialog(resources, callback) {
  d3.select('#struct-qsrc')
    .call(cmp.selectOptions, resources, d => d.id, d => d.name);
  d3.select('#struct-targets')
    .call(cmp.checkboxList, resources, 'targets', d => d.id, d => d.name);
  store.getAppSetting('rdkit').then(rdk => {
    d3.select('#struct-method').selectAll('option.rd')
      .attr('disabled', rdk ? null : 'disabled');
  });
  d3.selectAll('#struct-method,#struct-thldtype')
    .on('change', function () {
      const method = d3form.value('#struct-method');
      const thldtype = d3form.value('#struct-thldtype');
      d3.select('#struct-thld')
        .attr('disabled', ['gls', 'rdmorgan', 'rdfmcs'].includes(method) ? null : 'disabled')
        .attr('value', thldtype === 'edge' ? 15 : 0.7)
        .attr('min', thldtype === 'edge' ? 5 : 0)
        .attr('max', thldtype === 'edge' ? 999 : 1.0)
        .attr('step', thldtype === 'edge' ? 1 : 0.01);
      d3.select('#struct-thldtype')
        .attr('disabled', ['gls', 'rdmorgan', 'rdfmcs'].includes(method) ? null : 'disabled')
        .property('value', ['gls', 'rdfmcs'].includes(method) ? undefined : 'sim');
      d3.select('#struct-thldtype option.sim')
        .attr('disabled', ['gls', 'rdmorgan', 'rdfmcs'].includes(method) ? null : 'disabled');
      d3.select('#struct-thldtype option.edge')
        .attr('disabled', ['gls', 'rdfmcs'].includes(method) ? null : 'disabled');
      d3.select('#struct-options').selectAll('.gls')
        .attr('disabled', method === 'gls' ? null : 'disabled');
      d3.select('#struct-options .fmcs')
        .attr('disabled', method === 'rdfmcs' ? null : 'disabled');
    })
    .dispatch('change');
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
        source: fmt === 'dbid' ? d3form.value('#struct-qsrc') : null,
        value: fmt === 'molfile'
          ? d3form.value('#struct-queryarea') : d3form.textareaLines('#struct-queryarea')[0],
      };
      return fetcher.get('strprev', query)
        .then(fetcher.text)
        .then(res => d3.select('#struct-image').html(res), fetcher.error);
    });
  d3.select('#struct-submit')
    .on('click', () => {
      const method = d3form.value('#struct-method');
      d3.select('#loading-circle').style('display', 'inline');
      const fmt = d3form.value('#struct-format');
      const query = {
        type: d3form.value('#struct-method'),
        targets: d3form.checkboxValues('#struct-targets'),
        queryMol: {
          format: fmt,
          source: fmt === 'dbid' ? d3form.value('#struct-qsrc') : null,
          value: fmt === 'molfile'
            ? d3form.value('#struct-queryarea') : d3form.textareaLines('#struct-queryarea')[0]
        },
        params: {
          measure: d3form.value('#struct-thldtype'),
          threshold: d3form.valueFloat('#struct-thld'),
          ignoreHs: d3form.checked('#struct-ignoreh'),
          diameter: method === 'gls' ? d3form.valueInt('#struct-diam') : null,
          maxTreeSize: method === 'gls' ? d3form.valueInt('#struct-tree') : null,
          molSizeCutoff: method === 'gls' ? d3form.valueInt('#struct-skip') : null,
          timeout: method === 'rdfmcs' ? d3form.valueInt('#struct-timeout') : null
        }
      };
      const command = query.type === 'exact' ? 'run' : 'async';
      return fetcher.get(command, query)
        .then(fetcher.json)
        .then(callback, fetcher.error);
    });
}


function sdfDialog(callback) {
  d3.select('#sdf-file')
    .on('change', () => {
      const reader = new FileReader();
      const file = document.getElementById('sdf-file').files[0];
      reader.onload = (e) => {
        d3.select('#sdf-cols')
          .call(cmp.checkboxList, misc.getSDFPropList(e.target.result),
                'fields', d => d, d => d
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
      const params = {
        fields: d3form.checkboxValues('#sdf-cols'),
        implh: d3form.checked('#sdf-implh'),
        recalc: d3form.checked('#sdf-recalc')
      };
      const formData = new FormData();
      formData.append('contents', d3form.firstFile('#sdf-file'));
      formData.append('params', JSON.stringify(params));
      return fetcher.post('sdfin', formData)
        .then(fetcher.json)
        .then(callback, fetcher.error);
    });
}


function columnDialog(dataFields, callback) {
  const table = {
    fields: def.defaultFieldProperties([
      {key: 'name', valueType: 'text'},
      {key: 'visible', valueType: 'control'},
      {key: 'sortType', valueType: 'control'},
      {key: 'digit', valueType: 'control'}
    ])
  };
  const records = dataFields.map((e, i) => {
    return {
      key: e.key,
      name: e.name,
      visible: selection => selection
          .classed('column-vis', true)
          .classed(`row${i}`, true)
        .append('input')
          .attr('type', 'checkbox')
          .attr('value', e.key)
          .property('checked', e.visible)
      ,sortType: selection => selection
          .classed('column-sort', true)
          .classed(`row${i}`, true)
        .append('select')
          .call(cmp.selectOptions,
                e.sortType === 'none' ? ['none'] : ['numeric', 'text'], d => d, d => d)
          .property('value', e.sortType)
          .on('change', function () {
            d3.select(`.column-digit.row${i} select`)
              .attr('disabled', this.value === 'numeric' ? null : 'disabled');
          })
      ,digit: selection => selection
          .classed('column-digit', true)
          .classed(`row${i}`, true)
        .append('select')
          .call(cmp.selectOptions, ['raw', 'rounded', 'scientific', 'si'], d => d, d => d)
          .property('value', e.digit)
          .attr('disabled', e.sortType === 'numeric' ? null : 'disabled')
    };
  });
  d3.select('#column-table')
    .call(cmp.createTable, table)
    .call(cmp.updateTableRecords, records, d => d.key);
  d3.select('#column-submit')
    .on('click', () => {
      const query = {
        visibles: d3form.checkboxValues('.column-vis'),
        sortTypes: d3form.optionValues('.column-sort'),
        digits: d3form.optionValues('.column-digit')
      };
      return store.setFieldProperties(win.URLQuery().id, query)
        .then(callback);
    });
}


// TODO:
function fieldFetchDialog(compoundIDs, dataFields, resources, callback) {
  // Prevent implicit submission
  document.getElementById('join-search')
    .addEventListener('keypress', event => {
      if (event.keyCode === 13) event.preventDefault();
    });
  const dataKeys = dataFields.map(e => e.key);
  const resourceFields = KArray.from(resources.map(e => e.fields))
    .extend().unique('key').filter(e => e.key !== 'id');
  d3.select('#join-keys')
    .call(cmp.checkboxList, resourceFields, 'keys', d => d.key, d => d.name)
    .selectAll('li')
    .each(function(d) { // disable already shown columns
      d3.select(this).selectAll('label').select('input')
        .property('checked', dataKeys.includes(d.key))
        .attr('disabled', dataKeys.includes(d.key) ? 'disabled' : null);
    });
  d3.select('#join-search')
    .on('keyup', function () {
      const match = d => fmt.partialMatch(d3form.value(this), d.name);
      d3.select('#join-keys').selectAll('li')
        .style('visibility', d => match(d) ? null : 'hidden')
        .style('position', d => match(d) ? null : 'absolute');
    });
  d3.select('#join-submit')
    .on('click', () => {
      d3.select('#loading-circle').style('display', 'inline');
      const selected = d3form.checkboxValues('#join-keys');
      const queryFieldKeys = resourceFields.map(e => e.key)
        .filter(e => !dataKeys.includes(e))
        .filter(e => selected.includes(e));
      const query = {
        type: 'fieldfilter',
        targetFields: queryFieldKeys,
        key: 'compound_id',
        values: compoundIDs
      };
      return fetcher.get('run', query)
        .then(fetcher.json)
        .then(json => callback(mapper.tableToMapping(json, 'id')),
              fetcher.error);
  });
}


function fieldFileDialog(callback) {
  // TODO: need to refactor
  d3.select('#importcol-file')
    .on('change', () => {
      const file = document.getElementById('importcol-file').files[0];
      const isCsv = file.name.split('.').pop() === 'csv';
      hfile.readFile(file).then(res => {
        const mapping = isCsv ? mapper.csvToMapping(res) : JSON.parse(res);
        const tbl = mapper.mappingToTable(mapping);
        d3.select('#importcol-preview').call(cmp.createTable, tbl)
          .call(cmp.updateTableRecords,
                tbl.records.slice(0, 5), d => d[tbl.fields[0].key]);
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
      if (mapping.hasOwnProperty('field')) {
        mapping = mapper.singleToMulti(mapping);
      }
      mapping.fields.forEach((e, i) => {
        if (e.valueType === 'plot') {
          mapping.fields[i].valueType = 'image';
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
        Promise.all(ps).then(() => callback(mapping));
      } else {
        callback(mapping);
      }
    });
}


function graphDialog(callback) {
  store.getAppSetting('rdkit').then(rdk => {
    d3.select('#graph-measure').selectAll('option.rd')
      .attr('disabled', rdk ? null : 'disabled');
  });
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
      const measure = d3form.value('#graph-measure');
      const params = {
        measure: measure,
        threshold: d3form.valueFloat('#graph-thld'),
        ignoreHs: d3form.checked('#graph-ignoreh'),
        diameter: measure === 'gls' ? d3form.valueInt('#graph-diam') : null,
        maxTreeSize: measure === 'gls' ? d3form.valueInt('#graph-tree') : null,
        molSizeCutoff: measure === 'gls' ? d3form.valueInt('#graph-skip') : null,
        timeout: measure === 'rdfmcs' ? d3form.valueInt('#graph-timeout') : null
      };
      callback(params);
    });
}


function graphConfigDialog(currentThld, minThld, callback) {
  d3.select('#graphconfig-thld')
    .attr('value', currentThld)
    .attr('max', 1.0)
    .attr('min', minThld);
  d3.select('#graphconfig-submit')
    .on('click', () => {
      const newThld = d3form.valueFloat('#graphconfig-thld');
      if (newThld < minThld) return;  // TODO: fool proof
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


function importConfirmDialog(callback) {
  d3.select('#importconfirm-overwrite')
    .on('click', () => callback('overwrite'));
  d3.select('#importconfirm-keepboth')
    .on('click', () => callback('keepboth'));
  d3.select('#importconfirm-cancel')
    .on('click', () => callback('cancel'));
}


export default {
  pickDialog, propDialog, structDialog, sdfDialog,
  columnDialog, fieldFetchDialog, fieldFileDialog, graphDialog,
  graphConfigDialog, communityDialog, importConfirmDialog
};
