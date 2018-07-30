
/** @module component/controlBox */

import d3 from 'd3';

import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as rbox} from '../component/formRangeBox.js';
import {default as group} from '../component/formBoxGroup.js';


function colorControlBox(selection, colorScales, fieldName) {
  selection.append('div')
      .classed('field', true)
      .call(lbox.selectBox, fieldName || 'Field');
  selection.append('div')
      .classed('range', true)
      .call(group.colorRangeGroup, colorScales);
  selection.append('div')
      .classed('scale', true)
      .call(group.scaleBoxGroup);
}


function updateColorControlBox(selection, fieldOptions, colorState) {
  selection.select('.field')
      .call(lbox.selectBoxItems, fieldOptions)
      .call(lbox.updateSelectBox, colorState.field);
  selection.select('.range')
      .call(group.updateColorRangeGroup, colorState.color,
            colorState.range, colorState.unknown);
  selection.select('.scale')
      .call(group.updateScaleBoxGroup, colorState.scale, colorState.domain);
  selection.selectAll('.field, .range, .scale')
      .on('change', function () {
        if (!colorControlValid(selection)) {
          d3.event.stopPropagation();
        }
      })
      .dispatch('change');
}


function colorControlValid(selection) {
  const values = group.colorRangeGroupValue(selection.select('.range'));
  const noScale = ['categorical', 'monocolor'].includes(values.colorScaleType);
  selection.select('.scale').selectAll('select,input')
    .property('disabled', noScale)
    .style('opacity', noScale ? 0.3 : null);
  const scaleValid = group.scaleBoxGroupValid(selection.select('.scale'));
  return noScale || scaleValid;
}


function colorControlBoxState(selection) {
  const range = group.colorRangeGroupValue(selection.select('.range'));
  const scale = group.scaleBoxGroupValue(selection.select('.scale'));
  return {
    field: lbox.selectBoxValue(selection.select('.field')),
    color: range.color,
    range: range.range,
    unknown: range.unknown,
    scale: range.colorScaleType === 'categorical' ? 'ordinal': scale.scale,
    domain: scale.domain
  };
}


function sizeControlBox(selection, fieldName) {
  selection.append('div')
      .classed('field', true)
      .call(lbox.selectBox, fieldName || 'Field');
  selection.append('div')
      .classed('range', true)
      .call(rbox.rangeBox, 'Range');
  selection.append('div')
      .classed('unknown', true)
      .classed('mb-3', true)
      .call(box.textBox, 'Unknown', 0, 1000, 1)
    .select('input')
      .classed('col-8', false)
      .classed('col-3', true);
  selection.append('div')
      .classed('scale', true)
      .call(group.scaleBoxGroup);
}


function updateSizeControlBox(selection, fieldOptions, sizeState) {
  selection.select('.field')
      .call(lbox.selectBoxItems, fieldOptions)
      .call(lbox.updateSelectBox, sizeState.field);
  selection.select('.range')
      .call(rbox.updateRangeBox, sizeState.range);
  selection.select('.unknown')
      .call(box.updateTextBox, sizeState.unknown);
  selection.select('.scale')
      .call(group.updateScaleBoxGroup, sizeState.scale, sizeState.domain);
  selection.selectAll('.range, .unknown')
      .on('input', function () {
        sizeRangeValid(selection);
      });
  selection.selectAll('.field, .range, .unknown, .scale')
      .on('change', function () {
        if (!sizeControlValid(selection)) {
          d3.event.stopPropagation();
        }
      });
}

function sizeRangeValid(selection) {
  if (!rbox.rangeBoxValid(selection.select('.range'))) return false;
  const range = rbox.rangeBoxValues(selection.select('.range'));
  const unk = box.textBoxValue(selection.select('.unknown'));
  const validUnk = unk !== '' && !isNaN(unk) && unk > 0;
  selection.select('.range').select('.min')
      .style('background-color', range[0] > 0 ? '#ffffff' : '#ffcccc');
  selection.select('.range').select('.max')
      .style('background-color', range[1] > 0 ? '#ffffff' : '#ffcccc');
  selection.select('.unknown').select('input')
      .style('background-color', validUnk ? '#ffffff' : '#ffcccc');
  return range[0] > 0 && range[1] > 0 && validUnk;
}


function sizeControlValid(selection) {
  if (!group.scaleBoxGroupValid(selection.select('.scale'))) return false;
  return sizeRangeValid(selection);
}


function sizeControlBoxState(selection) {
  const scale = group.scaleBoxGroupValue(selection.select('.scale'));
  return {
    field: lbox.selectBoxValue(selection.select('.field')),
    range: rbox.rangeBoxValues(selection.select('.range')),
    unknown: box.textBoxValue(selection.select('.unknown')),
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
      .call(box.numberBox, 'Font size', 4, 100, 1);
  // nodeLabelColor
  selection.call(colorControlBox, colorScales, 'Color field');
}


function updateLabelControlBox(selection, fieldOptions,
                               labelState, colorState) {
  // nodeLabel.visible
  selection.select('.visible')
      .call(box.updateCheckBox, labelState.visible);
  // nodeLabel.field
  selection.select('.text')
      .call(lbox.selectBoxItems, fieldOptions)
      .call(lbox.updateSelectBox, labelState.field);
  // nodeLabel.size
  selection.select('.size')
      .call(box.updateNumberBox, labelState.size)
      .on('input', function () {
        box.numberFloatValid(d3.select(this));
      });
  // nodeLabelColor
  selection.call(updateColorControlBox, fieldOptions, colorState)
      .selectAll('.visible, .text, .size, .field, .range, .scale')
      .on('change', function () {
        if (!labelControlValid(selection)) {
          d3.event.stopPropagation();
        }
      })
      .dispatch('change');
}


function labelControlValid(selection) {
  if (!box.numberFloatValid(selection.select('.size'))) return false;
  return colorControlValid(selection);
}


function labelControlBoxState(selection) {
  return {
    label: {
      field: lbox.selectBoxValue(selection.select('.text')),
      size: box.numberBoxFloatValue(selection.select('.size')),
      visible: box.checkBoxValue(selection.select('.visible'))
    },
    labelColor: colorControlBoxState(selection)
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
  colorControlBox, updateColorControlBox, colorControlValid, colorControlBoxState,
  sizeControlBox, updateSizeControlBox, sizeControlValid, sizeControlBoxState,
  labelControlBox, updateLabelControlBox, labelControlValid, labelControlBoxState,
  controlBoxFrame, controlBoxNav, controlBoxItem
};
