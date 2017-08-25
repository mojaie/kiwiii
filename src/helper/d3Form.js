
/** @module helper/d3Form */

import d3 from 'd3';


function value(selector) {
  return d3.select(selector).node().value;
}


function valueInt(selector) {
  return parseInt(d3.select(selector).node().value);
}


function valueFloat(selector) {
  return parseFloat(d3.select(selector).node().value);
}


function checked(selector) {
  return d3.select(selector).node().checked;
}


function firstFile(selector) {
  return d3.select(selector).node().files[0];
}


function checkboxValues(selector) {
  return d3.selectAll(selector).selectAll('input:checked').nodes().map(e => e.value);
}


function optionValues(selector) {
  return d3.selectAll(selector).selectAll('select').nodes().map(e => e.value);
}


function textareaLines(selector) {
  return d3.select(selector).node().value.split('\n').filter(e => e.length > 0);
}


function optionData(selector) {
  const si = d3.select(selector).property('selectedIndex');
  return d3.select(selector).selectAll('option').data().find((d, i) => i === si);
}


function checkboxData(selector) {
  return d3.selectAll(selector).selectAll('input:checked').data();
}


export default {
  value, valueInt, valueFloat, checked,
  firstFile, checkboxValues, optionValues, textareaLines,
  optionData, checkboxData
};
