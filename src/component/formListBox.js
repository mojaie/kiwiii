
/** @module component/formListBox */

import d3 from 'd3';


/**
 * Render select box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function selectBox(selection, label, fields, value) {
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .text(label);
  selection.append('select')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true);
  if (fields) {
    selection.call(selectBoxItems, fields);
    selection.call(updateSelectBox, value);
  }
}

function selectBoxItems(selection, items) {
  const options = selection.select('select')
    .selectAll('option')
      .data(items, d => d.key);
  options.exit().remove();
  options.enter()
    .append('option')
      .attr('value', d => d.key)
      .text(d => d.name);
}

function updateSelectBox(selection, value) {
  selection.select('select').property('value', value);
}

function selectBoxValue(selection) {
  return selection.select('select').property('value');
}


/**
 * Render select box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function checklistBox(selection, label, fields, values) {
  // TODO: scroll
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .text(label);
  selection.append('ul')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true);
  if (fields) {
    selection.call(checklistBoxItems, fields);
    selection.call(updateChecklistBox, values);
  }
}

function checklistBoxItems(selection, items) {
  const listitems = selection.select('ul')
    .selectAll('li')
      .data(items, d => d.key);
  listitems.exit().remove();
  const form = listitems.enter()
    .append('li')
      .attr('class', 'form-check')
    .append('label')
      .attr('class', 'form-check-label');
  form.append('input')
      .attr('type', 'checkbox')
      .attr('class', 'form-check-input')
      .property('value', d => d.key);
  form.append('span')
      .text(d => d.name);
}

function updateChecklistBox(selection, values) {
  if (!values) return;
  selection.selectAll('input')
    .each(function (d) {
      d3.select(this).property('checked', values.includes(d.key));
    });
}

function checklistBoxValue(selection) {
  return selection.selectAll('input:checked').data().map(d => d.key);
}


export default {
  selectBox, selectBoxItems, updateSelectBox, selectBoxValue,
  checklistBox, checklistBoxItems, updateChecklistBox, checklistBoxValue
};
