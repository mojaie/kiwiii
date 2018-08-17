
/** @module component/formBox */

import d3 from 'd3';

import {default as badge} from './badge.js';


function updateFormValue(selection, value) {
  selection.select('.form-control').property('value', value);
  selection.call(setValidity, true);  // Clear validity state
}


function formValue(selection) {
  return selection.select('.form-control').property('value');
}


function formValid(selection) {
  return selection.select('.form-control').node().checkValidity();
}


function setValidity(selection, valid) {
  selection.select('.invalid-feedback')
      .style('display', valid ? 'none': 'inherit');
  selection.select('.form-control')
      .style('background-color', valid ? null : '#ffcccc');
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
        const valid = formValid(selection);
        selection.call(setValidity, valid);
      });
  selection.append('div')
      .classed('col-4', true);
  selection.append('div')
      .call(badge.invalidFeedback)
      .classed('col-8', true);
}


function readonlyBox(selection, label) {
  selection
      .classed('form-group', true)
      .classed('form-row', true);
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

function updateReadonlyValue(selection, value) {
  selection.select('.form-control-plaintext').property('value', value);
}

function readonlyValue(selection) {
  return selection.select('.form-control-plaintext').property('value');
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
      .attr('placeholder', placeholder)
      .on('input', function () {
        const valid = textareaValid(selection);
        selection.call(setValidity, valid);
      });
}

function textareaBoxLines(selection) {
  const value = selection.select('textarea').property('value');
  if (value) return value.split('\n')
    .map(e => e.replace(/^\s+|\s+$/g, ''))  // strip spaces
    .filter(e => e.length > 0);
  return [];
}

function textareaValid(selection) {
  return /\s*?\w\s*?/.test(formValue(selection));
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


function numberBox(selection, label) {
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
      .attr('type', 'number')
      .on('input', function () {
        const valid = formValid(selection);
        selection.call(setValidity, valid);
      });
  selection.append('div')
      .classed('col-4', true);
  selection.append('div')
      .call(badge.invalidFeedback)
      .classed('col-8', true);
}

function updateNumberRange(selection, min, max, step) {
  selection.select('.form-control')
      .attr('min', min)
      .attr('max', max)
      .attr('step', step)
      .dispatch('input', {bubbles: true});
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
      .attr('accept', accept)
      .on('change', function () {
        const valid = fileInputValid(selection);
        selection.call(setValidity, valid);
      });
  selection.append('div')
      .classed('col-4', true);
  selection.append('div')
      .call(badge.invalidFeedback)
      .classed('col-8', true);
}

function clearFileInput(selection) {
  // TODO: FileList object (input.files) may be a readonly property
  const label = selection.select('label').text();
  const accept = selection.select('input').attr('accept');
  selection.selectAll('*').remove();
  selection.call(fileInputBox, label, accept);
}

function fileInputValue(selection) {
  return selection.select('input').property('files')[0];
}

function fileInputValid(selection) {
  // TODO: attribute 'require' does not work with input type=file
  return selection.select('input').property('files').length > 0;
}


export default {
  updateFormValue, formValue, formValid, setValidity,
  textBox, readonlyBox, updateReadonlyValue, readonlyValue,
  textareaBox, textareaBoxLines, textareaValid,
  numberBox, updateNumberRange,
  checkBox, updateCheckBox, checkBoxValue,
  colorBox,
  fileInputBox, clearFileInput, fileInputValue, fileInputValid
};
