
/** @module component/formBoxGroup */

import d3 from 'd3';

import {default as badge} from './badge.js';
import {default as dropdown} from './dropdown.js';
import {default as box} from './formBox.js';
import {default as lbox} from './formListBox.js';
import {default as rbox} from './formRangeBox.js';


/**
 * Render color range control box group
 * @param {d3.selection} selection - selection of box container (div element)
 */
function colorRangeGroup(selection, colorScales) {
  selection
      .classed('mb-3', true);
  selection.append('div')
      .classed('colorscale', true)
      .classed('mb-2', true)
      .call(lbox.colorScaleBox, 'Colorscale')
      .call(lbox.colorScaleBoxItems, colorScales);

  // Custom colorscale
  const collapse = selection.append('div')
      .call(dropdown.dropdownFormGroup, 'Custom color')
    .select('.card-body')
      .classed('p-2', true);

  const customColorRanges = [
    {key: 'continuous', name: 'Continuous'},
    {key: 'two-piece', name: 'Two-piece'}
  ];
  collapse.append('div')
      .classed('rangetype', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Range type')
      .call(lbox.updateSelectBoxOptions, customColorRanges);
  collapse.append('div')
      .classed('range', true)
      .classed('mb-1', true)
      .call(rbox.colorRangeBox, 'Range');
  collapse.append('div')
      .classed('unknown', true)
      .classed('mb-1', true)
      .call(box.colorBox, 'Unknown');
}


function updateColorRangeGroup(selection, cscale, range, unknown) {
  const customRange = () => {
    const cs = lbox.colorScaleBoxValue(selection.select('.colorscale'));
    const rg = box.formValue(selection.select('.rangetype'));
    const customScale = cs === 'custom';
    selection.selectAll('.rangetype, .range, .unknown')
        .selectAll('select, input')
        .property('disabled', !customScale);
    selection.select('.range').select('.mid')
        .property('disabled', !customScale || rg === 'continuous');
  };
  selection.select('.colorscale')
      .call(lbox.updateColorScaleBox, cscale)
      .on('change', function () {
        customRange();
      });
  const rtype = range.length === 2 ? 'continuous' : 'two-piece';
  selection.select('.rangetype')
      .call(box.updateFormValue, rtype)
      .on('change', function () {
        customRange();
      })
      .dispatch('change');
  const rboxValues = range.length === 2  ? [range[0], null, range[1]] : range;
  selection.select('.range')
      .call(rbox.updateColorRangeValues, rboxValues)
      .on('focusin', () => {
        selection.dispatch('change', {bubbles: true});
      });
  selection.select('.unknown')
      .call(box.updateFormValue, unknown)
      .on('focusin', () => {
        selection.dispatch('change', {bubbles: true});
      });
}


function colorGroupValues(selection) {
  const colorScale = lbox.colorScaleBoxItem(selection.select('.colorscale'));
  const rtype = box.formValue(selection.select('.rangetype'));
  const range = rbox.colorRangeValues(selection.select('.range'));
  const unknown = box.formValue(selection.select('.unknown'));
  return {
    color: colorScale.key,
    colorScaleType: colorScale.type,
    range: rtype === 'continuous' ? [range[0], range[2]] : range,
    unknown: unknown
  };
}


/**
 * Render scale and domain control box group
 * @param {d3.selection} selection - selection of box container (div element)
 */
function scaleBoxGroup(selection) {
  selection.classed('mb-3', true);

  // Scale type
  const scaleOptions = [
    {key: 'linear', name: 'Linear'},
    {key: 'log', name: 'Log'}
  ];
  selection.append('div')
      .classed('scale', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Scale')
      .call(lbox.updateSelectBoxOptions, scaleOptions)
      .on('change', function () {
        const isLog = box.formValue(d3.select(this)) === 'log';
        selection.select('.domain')
          .call(isLog ? rbox.logRange : rbox.linearRange)
          .call(badge.updateInvalidMessage,
                isLog ? 'Please provide a valid range (larger than 0)'
                : 'Please provide a valid number');
      });
  selection.append('div')
      .classed('domain', true)
      .classed('mb-1', true)
      .call(rbox.rangeBox, 'Domain');
}


function updateScaleBoxGroup(selection, scale, domain) {
  selection.select('.scale')
      .call(box.updateFormValue, scale)
      .dispatch('change');
  selection.select('.domain')
      .call(rbox.updateRangeValues, domain);
}


function scaleBoxGroupValid(selection) {
  const isLog = box.formValue(selection.select('.scale')) === 'log';
  const dm = selection.select('.domain');
  return isLog ? rbox.logRangeValid(dm) : rbox.linearRangeValid(dm);
}


function scaleGroupValues(selection) {
  const scale = box.formValue(selection.select('.scale'));
  const domain = rbox.rangeValues(selection.select('.domain'));
  return {
    scale: scale || 'linear',
    domain: domain
  };
}


export default {
  colorRangeGroup, updateColorRangeGroup, colorGroupValues,
  scaleBoxGroup, updateScaleBoxGroup, scaleGroupValues, scaleBoxGroupValid
};
