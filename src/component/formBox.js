
/** @module component/controlBox */

import d3 from 'd3';

import {default as item} from './listItems.js';


function textBox(selection, id, label, size, value) {
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .attr('for', id)
      .text(label);
  selection.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('id', id)
      .attr('type', 'text')
      .attr('size', size);
  selection.call(updateTextBox, value);
}

function updateTextBox(selection, value) {
  selection.select('input').property('value', value);
}

function textBoxValue(selection) {
  return selection.select('input').property('value');
}


function readonlyBox(selection, id, label, value) {
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .attr('for', id)
      .text(label);
  selection.append('input')
      .classed('form-control-plaintext', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('id', id)
      .attr('type', 'text')
      .property('readonly', true);
  selection.call(updateTextBox, value);
}


function textareaBox(selection, id, label, rows, placeholder, value) {
  selection
      .classed('form-group', true)
      .classed('form-row', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .attr('for', id)
      .text(label);
  selection.append('textarea')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('rows', rows)
      .attr('placeholder', placeholder)
      .attr('id', id);
  selection.call(updateTextareaBox, value);
}

function updateTextareaBox(selection, value) {
  selection.select('textarea').text(value);
}

function textareaBoxValue(selection) {
  const value = selection.select('textarea').text();
  if (value === '') {
    return selection.select('textarea').attr('placeholder');
  } else {
    return value;
  }
}


function checkBox(selection, id, label, checked) {
  const box = selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('form-check', true)
    .append('label')
      .classed('form-check-label', true)
      .classed('col-form-label-sm', true);
  box.append('input')
      .classed('form-check-input', true)
      .attr('type', 'checkbox')
      .attr('id', id);
  box.append('span')
      .text(label);
  selection.call(updateCheckBox, checked);
}

function updateCheckBox(selection, checked) {
  selection.select('input').property('checked', checked);
}

function checkBoxValue(selection) {
  return selection.select('input').property('checked');
}


function numberBox(selection, id, label, min, max, step, value) {
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .attr('for', id)
      .text(label);
  selection.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('id', id)
      .attr('type', 'number')
      .attr('min', min)
      .attr('max', max)
      .attr('step', step);
  selection.call(updateNumberBox, value);
}

function updateNumberBox(selection, value) {
  selection.select('input').property('value', value);
}

function numberBoxValue(selection) {
  return selection.select('input').property('value');
}


/**
 * Render select box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function selectBox(selection, id, label, fields, value) {
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .attr('for', id)
      .text(label);
  selection.append('select')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('id', id);
  selection.call(updateSelectBoxItems, fields);
  selection.call(updateSelectBox, value);
}

function updateSelectBoxItems(selection, items) {
  selection.select('select')
      .call(item.selectOptions, items, d => d.key, d => d.name);
}

function updateSelectBox(selection, value) {
  selection.select('select').property('value', value);
}

function selectBoxValue(selection) {
  return selection.select('select').property('value');
}


function rangeBox(selection, id, label, range) {
  selection
      .classed('form-row', true)
      .classed('align-items-center', true)
      .attr('id', id);
  selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .classed('mb-1', true)
      .text(label);
  const f = selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .classed('mb-1', true);
  f.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .attr('for', `${id}-from`)
      .text('min');
  f.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('min', true)
      .attr('type', 'text')
      .attr('id', `${id}-from`);
  const t = selection.append('div')
      .classed('form-group', true)
      .classed('col-4', true)
      .classed('mb-1', true);
  t.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .attr('for', `${id}-to`)
      .text('max');
  t.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('max', true)
      .attr('type', 'text')
      .attr('id', `${id}-to`);
  // TODO: validation
  // not null, undef, text
  // min <= max
  selection.call(updateRangeBox, range);
}


function updateRangeBox(selection, range) {
  // TODO: validation
  // not null, undef, text
  // min <= max
  selection.select('.min').property('value', range[0]);
  selection.select('.max').property('value', range[1]);
}


function rangeBoxValue(selection) {
  return [
    parseFloat(selection.select('.min').property('value')),
    parseFloat(selection.select('.max').property('value'))
  ];
}


function colorScaleBox(selection, id, label, range) {
  selection
      .classed('form-row', true)
      .classed('align-items-center', true)
      .attr('id', id);
  selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-3', true)
      .classed('mb-1', true)
      .text(label);
  const f = selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-3', true)
      .classed('mb-1', true);
  f.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .attr('for', `${id}-from`)
      .text('min');
  f.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('min', true)
      .attr('type', 'color')
      .attr('id', `${id}-from`);
  const m = selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-3', true)
      .classed('mb-1', true);
  m.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .attr('for', `${id}-mid`)
      .text('mid');
  m.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('mid', true)
      .attr('type', 'color')
      .attr('id', `${id}-mid`);
  const t = selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-3', true)
      .classed('mb-1', true);
  t.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .attr('for', `${id}-to`)
      .text('max');
  t.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('max', true)
      .attr('type', 'color')
      .attr('id', `${id}-to`);
  selection
      .call(updateColorScaleBox, range)
      .on('change', () => {
        // avoid update by mousemove on the colorpicker
        d3.event.stopPropagation();
      });
}


function updateColorScaleBox(selection, range) {
  let rangeArray;
  if (range.length == 2) {
    rangeArray = [range[0], null, range[1]];
  } else if (range.length == 3) {
    rangeArray = [range[0], range[1], range[2]];
  } else {
    rangeArray = [null, null, null];
  }
  selection.select('.min')
      .property('value', rangeArray[0])
      .property('disabled', rangeArray[0] === null)
      .style('opacity', rangeArray[0] === null ? 0.3 : null);
  selection.select('.mid')
      .attr('value', rangeArray[1])
      .property('disabled', rangeArray[1] === null)
      .style('opacity', rangeArray[1] === null ? 0.3 : null);
  selection.select('.max')
      .property('value', rangeArray[2])
      .property('disabled', rangeArray[2] === null)
      .style('opacity', rangeArray[2] === null ? 0.3 : null);
}


function colorScaleBoxValue(selection) {
  const arr = [];
  if (!selection.select('.min').property('disabled')) {
    arr.push(selection.select('.min').property('value'));
  }
  if (!selection.select('.mid').property('disabled')) {
    arr.push(selection.select('.mid').property('value'));
  }
  if (!selection.select('.max').property('disabled')) {
    arr.push(selection.select('.max').property('value'));
  }
  return arr;
}


export default {
  textBox, updateTextBox, textBoxValue, readonlyBox,
  textareaBox, updateTextareaBox, textareaBoxValue,
  checkBox, updateCheckBox, checkBoxValue,
  numberBox, updateNumberBox, numberBoxValue,
  selectBox, updateSelectBoxItems, updateSelectBox, selectBoxValue,
  rangeBox, updateRangeBox, rangeBoxValue,
  colorScaleBox, updateColorScaleBox, colorScaleBoxValue
};
