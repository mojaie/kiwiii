
/** @module component/controlBox */

import d3 from 'd3';

import {default as item} from './listItems.js';


function buttonBox(selection, id, label, type) {
  selection
      .classed('form-group', true)
      .classed('mb-1', true)
    .append('button')
      .classed('btn', true)
      .classed(`btn-outline-${type}`, true)
      .classed('btn-sm', true)
      .attr('type', 'button')
      .attr('id', id)
      .text(label);
}


function checkBox(selection, id, label, checked) {
  const box = selection
      .classed('form-group', true)
      .classed('mb-1', true)
      .classed('form-check', true)
    .append('label')
      .classed('form-check-label', true);
  box.append('input')
      .classed('form-check-input', true)
      .attr('type', 'checkbox')
      .attr('id', id)
      .property('checked', checked);
  box.append('span')
      .text(label);
}

function updateCheckBox(selection, checked) {
  selection.select('input').text(checked);
}

function checkBoxValue(selection) {
  return selection.select('input').property('checked');
}


function numberBox(selection, id, label, min, max, step, value) {
  selection
      .classed('form-group', true)
      .classed('mb-1', true);
  selection.append('label')
      .classed('form-label', true)
      .attr('for', id)
      .text(label);
  selection.append('input')
      .classed('form-control-sm', true)
      .attr('id', 'thld')
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
      .classed('mb-1', true);
  selection.append('label')
      .classed('form-label', true)
      .attr('for', id)
      .text(label);
  selection.append('select')
      .classed('form-control-sm', true)
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
      .classed('form-group', true)
      .classed('row', true)
      .classed('mb-1', true)
      .attr('id', id);
  selection.append('div')
      .classed('col-6', true)
    .append('label')
      .classed('form-label', true)
      .classed('mb-1', true)
      .attr('for', id)
      .text(label);
  const form = selection.append('div')
      .classed('col-12', true)
      .classed('range', true);
  form.append('input')
      .classed('form-control-sm', true)
      .classed('min', true)
      .attr('type', 'text')
      .attr('size', 8);
  form.append('span')
      .style('margin', '0 6px')
      .text(' - ');
  form.append('input')
      .classed('form-control-sm', true)
      .classed('max', true)
      .attr('type', 'text')
      .attr('size', 8);
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
      .classed('form-group', true)
      .classed('row', true)
      .classed('mb-1', true)
      .attr('id', id);
  selection.append('div')
      .classed('col-6', true)
    .append('label')
      .classed('form-label', true)
      .classed('mb-1', true)
      .attr('for', id)
      .text(label);
  const form = selection.append('div')
      .classed('col-12', true);
  form.append('input')
      .classed('form-control-sm', true)
      .classed('min', true)
      .attr('type', 'color');
  form.append('span')
      .style('margin', '0 6px')
      .text(' - ');
  form.append('input')
      .classed('form-control-sm', true)
      .classed('mid', true)
      .attr('type', 'color');
  form.append('span')
      .style('margin', '0 6px')
      .text(' - ');
  form.append('input')
      .classed('form-control-sm', true)
      .classed('max', true)
      .attr('type', 'color');
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
  buttonBox, checkBox, updateCheckBox, checkBoxValue,
  numberBox, updateNumberBox, numberBoxValue,
  selectBox, updateSelectBoxItems, updateSelectBox, selectBoxValue,
  rangeBox, updateRangeBox, rangeBoxValue,
  colorScaleBox, updateColorScaleBox, colorScaleBoxValue
};
