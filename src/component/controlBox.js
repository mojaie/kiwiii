
/** @module component/controlBox */

import d3 from 'd3';

import {default as badge} from '../component/badge.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as rbox} from '../component/formRangeBox.js';
import {default as group} from '../component/formBoxGroup.js';


function colorControlBox(selection, colorScales, fieldName) {
  // Color field
  selection.append('div')
      .classed('field', true)
      .call(lbox.selectBox, fieldName || 'Field');

  // Colorscale and custom range
  selection.append('div')
      .classed('range', true)
      .call(group.colorRangeGroup, colorScales)
      .on('change', function () {
        const values = group.colorGroupValues(d3.select(this));
        const noScale = ['categorical', 'monocolor']
          .includes(values.colorScaleType);
        selection.select('.scale').selectAll('select,input')
            .property('disabled', noScale);
      });

  // Scale
  selection.append('div')
      .classed('scale', true)
      .call(group.scaleBoxGroup);

  // Legend
  selection.append('div')
      .classed('legend', true)
      .call(box.checkBox, 'Show legend');
}


function updateColorControl(selection, fieldOptions, colorState) {
  selection.select('.field')
      .call(lbox.updateSelectBoxOptions, fieldOptions)
      .call(box.updateFormValue, colorState.field);
  selection.select('.range')
      .call(group.updateColorRangeGroup, colorState.color,
            colorState.range, colorState.unknown);
  selection.select('.scale')
      .call(group.updateScaleBoxGroup, colorState.scale, colorState.domain)
      .dispatch('change');
  selection.select('.legend')
      .call(box.updateCheckBox, colorState.legend);
}


function colorControlValid(selection) {
  return group.scaleBoxGroupValid(selection.select('.scale'));
}


function colorControlState(selection) {
  const range = group.colorGroupValues(selection.select('.range'));
  const scale = group.scaleGroupValues(selection.select('.scale'));
  return {
    field: box.formValue(selection.select('.field')),
    color: range.color,
    range: range.range,
    unknown: range.unknown,
    scale: range.colorScaleType === 'categorical' ? 'ordinal': scale.scale,
    domain: scale.domain,
    legend: box.checkBoxValue(selection.select('.legend'))
  };
}


function sizeControlBox(selection, fieldName) {
  // Size field
  selection.append('div')
      .classed('field', true)
      .call(lbox.selectBox, fieldName || 'Field');

  // Size range
  selection.append('div')
      .classed('range', true)
      .classed('mb-2', true)
      .call(rbox.rangeBox, 'Range')
      .call(rbox.linearRange, 0.1, 999, 0.1)
      .call(badge.updateInvalidMessage,
            'Please provide a valid range (0.1-999)');

  // Size unknown
  selection.append('div')
      .classed('unknown', true)
      .call(box.numberBox, 'Unknown')
      .call(box.updateNumberRange, 0.1, 999, 0.1)
      .call(badge.updateInvalidMessage,
            'Please provide a valid number (0.1-999)')
    .select('input')
      .classed('col-8', false)
      .classed('col-3', true);

  // Size scale
  selection.append('div')
      .classed('scale', true)
      .call(group.scaleBoxGroup);
}


function updateSizeControl(selection, fieldOptions, sizeState) {
  selection.select('.field')
      .call(lbox.updateSelectBoxOptions, fieldOptions)
      .call(box.updateFormValue, sizeState.field);
  selection.select('.range')
      .call(rbox.updateRangeValues, sizeState.range);
  selection.select('.unknown')
      .call(box.updateFormValue, sizeState.unknown);
  selection.select('.scale')
      .call(group.updateScaleBoxGroup, sizeState.scale, sizeState.domain);
}


function sizeControlValid(selection) {
  const rangeValid = rbox.linearRangeValid(selection.select('.range'));
  const unkValid = box.formValid(selection.select('.unknown'));
  const scaleValid = group.scaleBoxGroupValid(selection.select('.scale'));
  return rangeValid && unkValid && scaleValid;
}


function sizeControlState(selection) {
  const scale = group.scaleGroupValues(selection.select('.scale'));
  return {
    field: box.formValue(selection.select('.field')),
    range: rbox.rangeValues(selection.select('.range')),
    unknown: box.formValue(selection.select('.unknown')),
    scale: scale.scale,
    domain: scale.domain
  };
}


function labelControlBox(selection, colorScales) {
  // nodeLabel.visible
  selection.append('div')
    .append('div')
      .classed('visible', true)
      .call(box.checkBox, 'Show labels');

  // nodeLabel
  const labelGroup = selection.append('div')
      .classed('mb-3', true);
  labelGroup.append('div')
      .classed('text', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Text field');
  labelGroup.append('div')
      .classed('size', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Font size')
      .call(box.updateNumberRange, 0.1, 999, 0.1)
      .call(badge.updateInvalidMessage,
            'Please provide a valid number (0.1-999)')
    .select('.form-control')
      .attr('required', 'required');

  // nodeLabelColor
  selection.call(colorControlBox, colorScales, 'Color field');
  // TODO: not implemented yet
  selection.select('.legend input').property('disabled', true);
}


function updateLabelControl(selection, fieldOptions,
                               labelState, colorState) {
  selection.select('.visible')
      .call(box.updateCheckBox, labelState.visible);
  selection.select('.text')
      .call(lbox.updateSelectBoxOptions, fieldOptions)
      .call(box.updateFormValue, labelState.field);
  selection.select('.size')
      .call(box.updateFormValue, labelState.size);
  selection.call(updateColorControl, fieldOptions, colorState);
}


function labelControlValid(selection) {
  const fontValid = box.formValid(selection.select('.size'));
  return fontValid && colorControlValid(selection);
}


function labelControlState(selection) {
  return {
    label: {
      field: box.formValue(selection.select('.text')),
      size: box.formValue(selection.select('.size')),
      visible: box.checkBoxValue(selection.select('.visible'))
    },
    labelColor: colorControlState(selection)
  };
}


function controlBoxFrame(selection, navID, contentID) {
  selection.append('nav')
    .append('div')
      .classed('nav', true)
      .classed('nav-tabs', true)
      .attr('id', navID)
      .attr('role', 'tablist');
  selection.append('div')
      .classed('tab-content', true)
      .classed('p-2', true)
      .attr('id', contentID);
}


function controlBoxNav(selection, id, label) {
  selection
      .classed('nav-item', true)
      .classed('nav-link', true)
      .classed('py-1', true)
      .attr('id', `${id}-tab`)
      .attr('data-toggle', 'tab')
      .attr('href', `#${id}`)
      .attr('role', 'tab')
      .attr('aria-controls', id)
      .attr('aria-selected', 'false')
      .text(label);
}


function controlBoxItem(selection, id) {
  selection
      .classed('tab-pane', true)
      .classed('fade', true)
      .classed('container', true)
      .classed('px-0', true)
      .attr('id', id)
      .attr('role', 'tabpanel')
      .attr('aria-labelledby', `${id}-tab`);
}


export default {
  colorControlBox, updateColorControl, colorControlValid, colorControlState,
  sizeControlBox, updateSizeControl, sizeControlValid, sizeControlState,
  labelControlBox, updateLabelControl, labelControlValid, labelControlState,
  controlBoxFrame, controlBoxNav, controlBoxItem
};
