
import d3 from 'd3';


export function formValue(selector) {
  return d3.select(selector).node().value;
}


export function formInt(selector) {
  return parseInt(d3.select(selector).node().value);
}


export function formFloat(selector) {
  return parseFloat(d3.select(selector).node().value);
}


export function formChecked(selector) {
  return d3.select(selector).node().checked;
}


export function firstFile(selector) {
  return d3.select(selector).node().files[0];
}


export function checkboxValues(selector) {
  return d3.selectAll(selector).selectAll('input:checked').nodes().map(e => e.value);
}


export function selectedOptionValues(selector) {
  return d3.selectAll(selector).selectAll('select').nodes().map(e => e.value);
}


export function textareaLines(selector) {
  return d3.select(selector).node().value.split('\n').filter(e => e.length > 0);
}


export function selectedOptionData(selector) {
  const si = d3.select(selector).property('selectedIndex');
  return d3.select(selector).selectAll('option').data().find((d, i) => i === si);
}


export function selectedCheckboxesData(selector) {
  return d3.selectAll(selector).selectAll('input:checked').data();
}
