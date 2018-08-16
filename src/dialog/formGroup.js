
/** @module dialog/formGroup */

import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';
import {default as misc} from '../common/misc.js';

import {default as badge} from '../component/badge.js';
import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';


/**
 * Render color range control box group
 * @param {d3.selection} selection - selection of box container (div element)
 */
function queryMolGroup(selection) {
  selection
      .classed('mb-3', true);
  selection.append('div')
      .classed('format', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Format')
      .call(lbox.selectBoxItems,
            [
              {key: 'molfile', name: 'MDL Molfile'},
              {key: 'dbid', name: 'Compound ID'}
            ]);
  selection.append('div')
      .classed('source', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Source');
  const queryBox = selection.append('div')
      .classed('textquery', true)
      .classed('mb-1', true)
      .call(box.textBox, 'Query')
      .on('input', function() {
        selection.dispatch('validate');
      });
  queryBox.select('.form-control')
      .attr('required', 'required');
  queryBox.select('.invalid-feedback')
      .call(badge.invalidFeedbackMsg, 'Please provide a valid query');
  selection.append('div')
      .classed('areaquery', true)
      .classed('mb-1', true)
      .attr('required', 'required')
      .call(box.textareaBox, 'Query', 6, null);
  // Popover
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
      .call(button.menuButton, 'Structure preview', 'primary');
}

function updateQueryMolGroup(selection, resources) {
  selection.select('.format')
      .call(lbox.updateSelectBox, 'molfile')
      .on('change', function () {
        const value = lbox.selectBoxValue(d3.select(this));
        selection.select('.source')
          .select('select')
            .property('disabled', value !== 'dbid');
        selection.select('.textquery')
            .property('hidden', value !== 'dbid');
        selection.select('.areaquery')
            .property('hidden', value !== 'molfile');
      })
      .dispatch('change');
  const res = resources.map(d => ({key: d.id, name: d.name}));
  selection.select('.source')
      .call(lbox.selectBoxItems, res)
      .call(lbox.updateSelectBox, res[0].key);
  selection.select('.preview')
      .on('click', function () {
        const query = queryMolGroupValue(selection);
        return fetcher.get('strprev', query)
          .then(fetcher.text)
          .then(res => d3.select('#previmg').html(res), fetcher.error);
      });
  selection.select('.textquery')
      .call(box.updateTextBox, '')
      .on('input', function() {
        // TODO: setValidity and if valid dispatch change
        selection.dispatch('validate');
      });
  selection.select('.areaquery')
      .call(box.updateTextareaBox, '')
      .on('input', function() {
        // TODO: setValidity and if valid dispatch change
        selection.dispatch('validate');
      });
}

function queryMolGroupValue(selection) {
  const format = lbox.selectBoxValue(selection.select('.format'));
  const source = lbox.selectBoxValue(selection.select('.source'));
  const textquery = box.textBoxValue(selection.select('.textquery'));
  const areaquery = box.textareaBoxLines(selection.select('.areaquery'));
  return {
    format: format,
    source: format === 'dbid' ? source : null,
    value: format === 'molfile' ? areaquery : textquery
  };
}

function queryMolGroupValid(selection) {
  const format = lbox.selectBoxValue(selection.select('.format'));
  const textValid = box.textValid(selection.select('.textquery'));
  const areaquery = box.textareaBoxLines(selection.select('.areaquery'));
  return format === 'molfile' ? areaquery.length : textValid;
}


function simOptionGroup(selection) {
  const id = misc.uuidv4().slice(0, 8);
  selection
      .classed('mb-3', true)
    .append('p')
    .append('button')
      .classed('btn', true)
      .classed('btn-sm', true)
      .classed('btn-outline-primary', true)
      .classed('dropdown-toggle', true)
      .attr('data-toggle', 'collapse')
      .attr('data-target', `#${id}-collapse`)
      .attr('aria-expanded', 'false')
      .attr('aria-controls', `${id}-collapse`)
      .text('Optional parameters');
  const collapse = selection.append('div')
      .classed('collapse', true)
      .attr('id', `${id}-collapse`)
    .append('div')
      .classed('card', true)
      .classed('card-body', true);
  collapse.append('div')
      .classed('ignoreh', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'Ignore explicit hydrogens');
  collapse.append('div')
      .classed('timeout', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Timeout', 1, 999, 1);
  collapse.append('div')
      .classed('diam', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Diameter (MCS-DR/GLS)', 4, 999, 1);
  collapse.selectAll('label.col-form-label')
      .classed('col-4', false)
      .classed('col-6', true);
  collapse.selectAll('input.form-control')
      .classed('col-8', false)
      .classed('col-6', true);
}


function updateSimOptionGroup(selection) {
  selection.select('.ignoreh')
      .call(box.updateCheckBox, true);
  selection.select('.timeout')
      .call(box.updateNumberBox, 2)
      .on('input', function() {
        // TODO: setValidity and if valid dispatch change
      });
  selection.select('.diam')
      .call(box.updateNumberBox, 8)
      .on('input', function() {
        // TODO: setValidity and if valid dispatch change
      });
}


function simOptionGroupValue(selection) {
  const timeout = selection.select('.timeout');
  const diam = selection.select('.diam');
  const query = {
    ignoreHs: box.checkBoxValue(selection.select('.ignoreh'))
  };
  if (!timeout.select('input').property('disabled')) {
    query.timeout = box.numberBoxIntValue(timeout);
  }
  if (!diam.select('input').property('disabled')) {
    query.diameter = box.numberBoxIntValue(diam);
  }
  return query;
}


export default {
  queryMolGroup, updateQueryMolGroup, queryMolGroupValue, queryMolGroupValid,
  simOptionGroup, updateSimOptionGroup, simOptionGroupValue
};
