
/** @module component/formBox */

import d3 from 'd3';

import {default as badge} from './badge.js';


function setValidity(selection, valid) {
  selection.select('.invalid-feedback')
      .style('display', valid ? 'none': 'inherit');
  selection.select('.form-control')
      .style('background-color', valid ? '#ffffff' : '#ffcccc');
}


function textBox(selection, label) {
  selection
      .classed('form-group', true)
      .classed('form-row', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .text(label);
  selection.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('type', 'text')
      .on('input', function () {
        const valid = textValid(selection);
        selection.call(setValidity, valid);
      });
  selection.append('div')
      .classed('col-4', true);
  selection.append('div')
      .call(badge.invalidFeedback)
      .classed('col-8', true);
}

function updateTextBox(selection, value) {
  selection.select('input').property('value', value);
  // TODO:
  /*    .on('input', function () { selection.call(setValidity, valid); });
  */
}

function textBoxValue(selection) {
  return selection.select('input').property('value');
}

function textValid(selection) {
  return selection.select('input').node().checkValidity();
}


function readonlyBox(selection, label) {
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .text(label);
  selection.append('input')
      .classed('form-control-plaintext', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('type', 'text')
      .attr('readonly', 'readonly');
}


function textareaBox(selection, label, rows, placeholder) {
  selection
      .classed('form-group', true)
      .classed('form-row', true);
  const formLabel = selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .text(label);
  formLabel.append('div')
      .call(badge.invalidFeedback);
  selection.append('textarea')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('rows', rows)
      .attr('placeholder', placeholder);
}

function updateTextareaBox(selection, value) {
  selection.select('textarea').property('value', value);
}

function textareaBoxValue(selection) {
  const value = selection.select('textarea').property('value');
  if (value) return value;  // TODO: 0 is falsy
  return '';
}

function textareaBoxLines(selection) {
  const value = selection.select('textarea').property('value');
  if (value) return value.split('\n')
    .map(e => e.replace(/^\s+|\s+$/g, ''))  // strip spaces
    .filter(e => e.length > 0);
  return [];
}

function textareaValid(selection) {
  return /\s*?\w\s*?/.test(textareaBoxValue(selection));
}

function setValidity(selection, valid) {
  selection.select('.form-control')
      .style('background-color', valid ? '#ffffff' : '#ffcccc');
  selection.select('.invalid-feedback')
      .style('display', valid ? 'none' : 'block');
}

function setInvalidMessage(selection, msg) {
  selection.select('.invalid-msg')
      .text(msg);
}


function checkBox(selection, label) {
  const box = selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('form-check', true)
    .append('label')
      .classed('form-check-label', true)
      .classed('col-form-label-sm', true);
  box.append('input')
      .classed('form-check-input', true)
      .attr('type', 'checkbox');
  box.append('span')
      .text(label);
}

function updateCheckBox(selection, checked) {
  selection.select('input').property('checked', checked);
}

function checkBoxValue(selection) {
  return selection.select('input').property('checked');
}


function numberBox(selection, label, min, max, step) {
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .text(label);
  selection.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true)
      .attr('type', 'number')
      .attr('min', min)
      .attr('max', max)
      .attr('step', step);
}

function updateNumberBox(selection, value) {
  selection.select('input').property('value', value);
}

function numberIntValid(selection) {
  const value = numberBoxIntValue(selection);
  const min = parseInt(selection.select('input').attr('min'));
  const max = parseInt(selection.select('input').attr('max'));
  const valid = !isNaN(value) && value >= min && value <= max;
  selection.select('input')
      .style('background-color', valid ? '#ffffff' : '#ffcccc');
  return valid;
}

function numberFloatValid(selection) {
  const value = numberBoxFloatValue(selection);
  const min = parseInt(selection.select('input').attr('min'));
  const max = parseInt(selection.select('input').attr('max'));
  const valid = !isNaN(value) && value >= min && value <= max;
  selection.select('input')
      .style('background-color', valid ? '#ffffff' : '#ffcccc');
  return valid;
}

function numberBoxIntValue(selection) {
  return parseInt(selection.select('input').property('value'));
}

function numberBoxFloatValue(selection) {
  return parseFloat(selection.select('input').property('value'));
}


/**
 * Render color scale box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function colorBox(selection, label) {
  selection
      .classed('form-row', true)
      .classed('align-items-center', true)
      .on('change', () => {
        // avoid update by mousemove on the colorpicker
        d3.event.stopPropagation();
      });
  selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .classed('mb-1', true)
      .text(label);
  selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .classed('mb-1', true)
    .append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .attr('type', 'color');
}


function updateColorBox(selection, value) {
  selection.select('input').property('value', value);
}


function colorBoxValue(selection) {
  return selection.select('input').property('value');
}


function fileInputBox(selection, label, accept) {
selection
    .classed('form-group', true)
    .classed('form-row', true);
selection.append('label')
    .classed('col-form-label', true)
    .classed('col-form-label-sm', true)
    .classed('col-4', true)
    .text(label);
selection.append('input')
    .classed('form-control', true)
    .classed('form-control-sm', true)
    .classed('form-control-file', true)
    .classed('col-8', true)
    .attr('type', 'file')
    .attr('accept', accept);
}

function clearFileInput(selection) {
  // TODO: FileList object (input.files) may be a readonly property
  const accept = selection.select('input').attr();
  selection.select('input').remove();
  selection.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('form-control-file', true)
      .classed('col-8', true)
      .attr('type', 'file')
      .attr('accept', accept);
}

function fileInputBoxValue(selection) {
  return selection.select('input').property('files')[0];
}


export default {
  setValidity,
  textBox, updateTextBox, textBoxValue, textValid, readonlyBox,
  textareaBox, updateTextareaBox,
  textareaBoxValue, textareaBoxLines, textareaValid,
  checkBox, updateCheckBox, checkBoxValue,
  numberBox, updateNumberBox, numberIntValid, numberFloatValid,
  numberBoxIntValue, numberBoxFloatValue,
  colorBox, updateColorBox, colorBoxValue,
  fileInputBox, clearFileInput, fileInputBoxValue
};
