
/** @module component/formBox */


function textBox(selection, id, label, size, value) {  // TODO: remove size
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
  selection.select('textarea').property('value', value);
}

function textareaBoxValue(selection) {
  const value = selection.select('textarea').property('value');
  if (value) return value;  // TODO: 0 is falsy
  const placeholder = selection.select('textarea').attr('placeholder');
  if (placeholder) return placeholder;
  return '';
}

function textareaBoxLines(selection) {
  const value = selection.select('textarea').property('value');
  if (value) return value.split('\n').filter(e => e.length > 0);
  const placeholder = selection.select('textarea').attr('placeholder');
  if (placeholder) return placeholder.split('\n').filter(e => e.length > 0);
  return [];
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


function fileInputBox(selection, id, label, accept) {
selection
    .classed('form-group', true)
    .classed('form-row', true);
selection.append('label')
    .classed('col-form-label', true)
    .classed('col-form-label-sm', true)
    .classed('col-4', true)
    .attr('for', id)
    .text(label);
selection.append('input')
    .classed('form-control', true)
    .classed('form-control-sm', true)
    .classed('form-control-file', true)
    .classed('col-8', true)
    .attr('type', 'file')
    .attr('accept', accept)
    .attr('id', id);
}

function fileInputBoxValue(selection) {
  return selection.select('input').property('files')[0];
}


export default {
  textBox, updateTextBox, textBoxValue, readonlyBox,
  textareaBox, updateTextareaBox, textareaBoxValue, textareaBoxLines,
  checkBox, updateCheckBox, checkBoxValue,
  numberBox, updateNumberBox, numberBoxValue,
  fileInputBox, fileInputBoxValue
};
