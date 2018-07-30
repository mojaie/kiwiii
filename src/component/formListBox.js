
/** @module component/formListBox */

import d3 from 'd3';

import {default as shape} from './shape.js';


/**
 * Render select box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function selectBox(selection, label) {
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
function checklistBox(selection, label) {
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

function anyChecked(selection) {
  return checklistBoxValue(selection).length > 0;
}


function colorScaleBox(selection, label) {
  selection
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .text(label || 'Colorscale');
  const form = selection.append('div')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('col-8', true);
  const dropdown = form.append('div')
      .classed('btn-group', true)
      .classed('mr-1', true);
  dropdown.append('button')
      .classed('btn', true)
      .classed(`btn-light`, true)
      .classed('btn-sm', true)
      .classed('dropdown-toggle', true)
      .attr('data-toggle', 'dropdown');
  dropdown.append('div')
      .classed('dropdown-menu', true)
      .classed('py-0', true);
  form.append('span')
      .classed('selected', true);
}

function colorScaleBoxItems(selection, items) {
  const listitems = selection.select('.dropdown-menu')
    .selectAll('a')
      .data(items, d => d);
  listitems.exit().remove();
  listitems.enter()
    .append('a')
      .classed('dropdown-item', true)
      .classed('py-0', true)
      .attr('href', '#')
      .attr('title', d => d.key)
      .on('click', function (d) {
        selection.call(setSelectedColorScale, d);
        selection.dispatch('change', {bubbles: true});
      })
    .append('svg')
      .each(function (d) {
        d3.select(this)
          .call(shape.colorBar[d.type], d.colors, d.text)
          .call(shape.setSize, 100, 10);
      });
}

function setSelectedColorScale(selection, item) {
  const selected = selection.select('.selected');
  selected.selectAll('svg').remove();
  selected.datum(item);  // Bind selected item record
  selected.append('svg')
      .call(shape.colorBar[item.type], item.colors, item.text)
      .call(shape.setSize, 100, 10);
}

function updateColorScaleBox(selection, key) {
  const data = selection.select('.dropdown-menu')
    .selectAll('a').data();
  const item = data.find(e => e.key === key);
  selection.call(setSelectedColorScale, item);
}

function colorScaleBoxValue(selection) {
  return selection.select('.selected').datum().key;
}

function colorScaleBoxItem(selection) {
  return selection.select('.selected').datum();
}


export default {
  selectBox, selectBoxItems, updateSelectBox, selectBoxValue,
  checklistBox, checklistBoxItems, updateChecklistBox, checklistBoxValue,
  anyChecked,
  colorScaleBox, colorScaleBoxItems, updateColorScaleBox,
  colorScaleBoxValue, colorScaleBoxItem
};
