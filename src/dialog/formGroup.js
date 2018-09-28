
/** @module dialog/formGroup */

import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';

import {default as badge} from '../component/badge.js';
import {default as button} from '../component/button.js';
import {default as dropdown} from '../component/dropdown.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';


/**
 * Render color range control box group
 * @param {d3.selection} selection - selection of box container (div element)
 */
function queryMolGroup(selection) {
  // Query format
  selection
      .classed('mb-3', true);
  selection.append('div')
      .classed('format', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Format')
      .call(lbox.updateSelectBoxOptions,
            [
              {key: 'molfile', name: 'MDL Molfile'},
              {key: 'dbid', name: 'Compound ID'}
            ])
      .on('change', function () {
        const value = box.formValue(d3.select(this));
        selection.select('.source .form-control')
            .property('disabled', value !== 'dbid');
        selection.select('.textquery')
            .property('hidden', value !== 'dbid');
        selection.select('.areaquery')
            .property('hidden', value !== 'molfile');
      });

  // Query ID source
  selection.append('div')
      .classed('source', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Source');

  // Database ID query input
  const queryBox = selection.append('div')
      .classed('textquery', true)
      .classed('mb-1', true)
      .call(box.textBox, 'Query');
  queryBox.select('.form-control')
      .attr('required', 'required');
  queryBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage, 'Please provide a valid query');

  // CTAB format structure query input
  const ctabBox = selection.append('div')
      .classed('areaquery', true)
      .classed('mb-1', true)
      .attr('required', 'required')
      .call(box.textareaBox, 'Query', 6, null);
  ctabBox.select('.form-control')
      .attr('required', 'required');
  ctabBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage,
            'Please provide a valid CTAB format text (.sdf or .mol)');

  // Preview popover
  $(function () {
    $('[data-toggle="popover"]')
      .popover({html: true, trigger: 'focus'});
  });
  selection.append('div')
      .classed('form-row', true)
      .classed('justify-content-end', true)
    .append('button')
      .classed('preview', true)
      .attr('data-toggle', 'popover')
      .attr('data-html', 'true')
      .attr('data-content', '<div id="previmg"></div>')
      .call(button.menuButton, 'Structure preview', 'primary')
      .on('click', function () {
        const query = queryMolValues(selection);
        return fetcher.get('strprev', query)
          .then(fetcher.text)
          .then(res => d3.select('#previmg').html(res), fetcher.error);
      });
}

function updateQueryMolResources(selection, resources) {
  const res = resources.map(d => ({key: d.id, name: d.name}));
  selection.select('.source')
      .call(lbox.updateSelectBoxOptions, res);
}

function updateQueryMolValues(selection, values) {
  selection.select('.format')
      .call(box.updateFormValue, values.format)
      .dispatch('change');
  selection.select('.source')
      .call(box.updateFormValue, values.source);
  selection.select('.textquery')
      .call(box.updateFormValue,
            values.format === 'dbid' ? values.value : null);
  selection.select('.areaquery')
      .call(box.updateFormValue,
            values.format === 'molfile' ? values.value : null);
}

function queryMolValues(selection) {
  const format = box.formValue(selection.select('.format'));
  const source = box.formValue(selection.select('.source'));
  const textquery = box.formValue(selection.select('.textquery'));
  const areaquery = box.formValue(selection.select('.areaquery'));
  return {
    format: format,
    source: format === 'dbid' ? source : null,
    value: format === 'molfile' ? areaquery : textquery
  };
}

function queryMolValid(selection) {
  const format = box.formValue(selection.select('.format'));
  const textValid = box.formValid(selection.select('.textquery'));
  const ctabValid = box.textareaValid(selection.select('.areaquery'));
  return format === 'molfile' ? ctabValid : textValid;
}


function simOptionGroup(selection) {
  const collapse = selection.append('div')
      .call(dropdown.dropdownFormGroup, 'Optional parameters')
    .select('.card-body');

  // Ignore H flag
  collapse.append('div')
      .classed('ignoreh', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'Ignore explicit hydrogens');

  // Timeout
  const timeoutBox = collapse.append('div')
      .classed('timeout', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Timeout')
      .call(box.updateNumberRange, 1, 999, 1);
  timeoutBox.select('.form-control')
      .attr('required', 'required');
  timeoutBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage,
            'Please provide a valid number (1 to 999)');

  // Diameter
  const diamBox = collapse.append('div')
      .classed('diam', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Diameter (MCS-DR/GLS)')
      .call(box.updateNumberRange, 4, 999, 1);
  diamBox.select('.form-control')
      .attr('required', 'required');
  diamBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage,
            'Please provide a valid number (4 to 999)');

  // Custom layout
  collapse.selectAll('label.col-form-label')
      .classed('col-4', false)
      .classed('col-6', true);
  collapse.selectAll('input.form-control')
      .classed('col-8', false)
      .classed('col-6', true);
}


function updateSimOptionValues(selection, values) {
  selection.select('.ignoreh')
      .call(box.updateCheckBox, values.ignoreHs);
  if (values.hasOwnProperty('timeout')) {
    selection.select('.timeout')
        .call(box.updateFormValue, values.timeout);
  }
  if (values.hasOwnProperty('diameter')) {
    selection.select('.diam')
        .call(box.updateFormValue, values.diameter);
  }
}


function simOptionValues(selection) {
  const timeout = selection.select('.timeout');
  const diam = selection.select('.diam');
  const query = {
    ignoreHs: box.checkBoxValue(selection.select('.ignoreh'))
  };
  if (!timeout.select('.form-control').property('disabled')) {
    query.timeout = box.formValue(timeout);
  }
  if (!diam.select('.form-control').property('disabled')) {
    query.diameter = box.formValue(diam);
  }
  return query;
}

function simOptionValid(selection) {
  const timeoutValid = box.formValid(selection.select('.timeout'));
  const diamValid = box.formValid(selection.select('.diam'));
  return timeoutValid && diamValid;
}


export default {
  queryMolGroup, updateQueryMolResources, updateQueryMolValues,
  queryMolValues, queryMolValid,
  simOptionGroup, updateSimOptionValues, simOptionValues, simOptionValid
};
