
/** @module component/controlBox */

import d3 from 'd3';

import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as rbox} from '../component/formRangeBox.js';
import {default as group} from '../component/formBoxGroup.js';


function colorControlBox(selection, colorState, scaledef, fieldName) {
  selection.append('div')
      .classed('field', true)
      .call(lbox.selectBox, fieldName || 'Field', null, colorState.field || '');
  selection.append('div')
      .classed('range', true)
      .call(
        group.colorRangeGroup, scaledef.palettes,
        scaledef.ranges, colorState.range, colorState.unknown
      );
  selection.append('div')
      .classed('scale', true)
      .call(
        group.scaleBoxGroup, scaledef.presets,
        scaledef.scales, colorState.scale, colorState.domain
      );
}


function updateColorControlBox(selection, fieldOptions, colorState, notifier) {
  selection.select('.field')
    .call(lbox.selectBoxItems, fieldOptions)
    .call(lbox.updateSelectBox, colorState.field)
    .on('change', function () {
      colorState.field = lbox.selectBoxValue(d3.select(this));
      notifier();
    });
  selection.select('.range')
    .call(group.updateColorRangeGroup, colorState.range, colorState.unknown)
    .on('change', function () {
      const values = group.colorRangeGroupValue(d3.select(this));
      colorState.range = values.range;
      colorState.unknown = values.unknown;
      if (values.range.length > 3) {
        colorState.scale = 'ordinal';
        selection.select('.scale').selectAll('select,input')
          .property('disabled', true)
          .style('opacity', 0.3);
      } else {
        selection.select('.scale').selectAll('select,input')
          .property('disabled', false)
          .style('opacity', null);
      }
      notifier();
    }
  );
  selection.select('.scale')
    .call(group.updateScaleBoxGroup, colorState.scale, colorState.domain)
    .on('change', function () {
      const values = group.scaleBoxGroupValue(d3.select(this));
      colorState.scale = values.scale;
      colorState.domain = values.domain;
      notifier();
    }
  );
}


function sizeControlBox(selection, sizeState, scaledef, fieldName) {
  selection.append('div')
    .classed('field', true)
    .call(
      lbox.selectBox, fieldName || 'Field', null, sizeState.field || '');
  selection.append('div')
    .classed('range', true)
    .classed('mb-3', true)
    .call(rbox.rangeBox, 'Range', sizeState.range);
  selection.append('div')
    .classed('scale', true)
    .call(
      group.scaleBoxGroup, scaledef.presets, scaledef.scales,
      sizeState.scale, sizeState.domain
    );
}


function updateSizeControlBox(selection, fieldOptions, sizeState, notifier) {
  selection.select('.field')
    .call(lbox.selectBoxItems, fieldOptions)
    .call(lbox.updateSelectBox, sizeState.field)
    .on('change', function () {
      sizeState.field = lbox.selectBoxValue(d3.select(this));
      notifier();
    });
  selection.select('.range')
    .call(rbox.updateRangeBox, sizeState.range)
    .on('change', function () {
      sizeState.range = rbox.rangeBoxValue(d3.select(this));
      notifier();
    });
  selection.select('.scale')
    .call(group.updateScaleBoxGroup, sizeState.scale, sizeState.domain)
    .on('change', function () {
      const values = group.scaleBoxGroupValue(d3.select(this));
      sizeState.scale = values.scale;
      sizeState.domain = values.domain;
      notifier();
    }
  );
}


function labelControlBox(selection, labelState, colorState, scaledef) {
  // nodeLabel.visible
  selection.append('div')
    .append('div')
      .classed('visible', true)
      .call(box.checkBox, 'Show labels', labelState.visible);
  // nodeLabel
  const labelGroup = selection.append('div')
      .classed('mb-3', true);
  labelGroup.append('div')
      .classed('text', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Text field', null, labelState.field || '');
  labelGroup.append('div')
      .classed('size', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Font size', 6, 100, 1, labelState.size);
  // nodeLabelColor
  colorControlBox(selection, colorState, scaledef, 'Color field');
}


function updateLabelControlBox(selection, fieldOptions, labelState, colorState, notifier) {
  // nodeLabel.visible
  selection.select('.visible')
      .call(box.updateCheckBox, labelState.visible)
      .on('change', function () {
        labelState.visible = box.checkBoxValue(d3.select(this));
        notifier();
      });
  // nodeLabel
  selection.select('.text')
      .call(lbox.selectBoxItems, fieldOptions)
      .call(lbox.updateSelectBox, labelState.field)
      .on('change', function () {
        labelState.field = lbox.selectBoxValue(d3.select(this));
        notifier();
      });
  selection.select('.size')
      .call(box.updateNumberBox, labelState.size)
      .on('change', function () {
        labelState.size = box.numberBoxIntValue(d3.select(this));
        notifier();
      });
  // nodeLabelColor
  updateColorControlBox(selection, fieldOptions, colorState, notifier);
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
  colorControlBox, updateColorControlBox, sizeControlBox, updateSizeControlBox, labelControlBox, updateLabelControlBox,
  controlBoxFrame, controlBoxNav, controlBoxItem
};
