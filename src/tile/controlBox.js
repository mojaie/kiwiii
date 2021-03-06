
/** @module tile/controlBox */

import _ from 'lodash';

import {default as misc} from '../common/misc.js';
import {default as cscale} from '../common/scale.js';

import {default as badge} from '../component/badge.js';
import {default as box} from '../component/formBox.js';
import {default as cbox} from '../component/controlBox.js';
import {default as lbox} from '../component/formListBox.js';


function mainControlBox(selection) {
  const chunkGroup = selection.append('div')
      .classed('panel-group', true)
      .classed('mb-3', true);
  chunkGroup.append('div')
      .classed('rowcnt', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Rows')
      .call(box.updateNumberRange, 1, 9999, 1)
      .call(badge.updateInvalidMessage,
            `Please provide a valid range (1-9999)`)
    .select('.form-control')
      .attr('required', 'required');
  chunkGroup.append('div')
      .classed('colcnt', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Columns')
      .call(box.updateNumberRange, 1, 9999, 1)
      .call(badge.updateInvalidMessage,
            `Please provide a valid range (1-9999)`)
    .select('.form-control')
      .attr('required', 'required');
  chunkGroup.append('div')
      .classed('groupby', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'GroupBy');
  chunkGroup.append('div')
      .classed('crow', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'ChunksPerRow')
      .call(box.updateNumberRange, 1, 999, 1)
      .call(badge.updateInvalidMessage,
            `Please provide a valid range (1-999)`)
    .select('.form-control')
      .attr('required', 'required');
  chunkGroup.append('div')
      .classed('showcol', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'Show column number');
  chunkGroup.append('div')
      .classed('showrow', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'Show row number');
}


function updateMainControl(selection, state) {
  // Network threshold
  const chunkGroup = selection.select('.panel-group');
  chunkGroup.select('.rowcnt')
      .call(box.updateFormValue, state.rowCount);
  chunkGroup.select('.colcnt')
      .call(box.updateFormValue, state.columnCount);
  chunkGroup.select('.groupby')
    .call(lbox.updateSelectBoxOptions,
          state.items.fields.filter(e => misc.sortType(e.format) !== 'none'))
    .call(box.updateFormValue, state.groupField || '');
  chunkGroup.select('.crow')
      .call(box.updateFormValue, state.chunksPerRow);
  chunkGroup.select('.showcol')
      .call(box.updateCheckBox, state.showColumnNumber);
  chunkGroup.select('.showrow')
      .call(box.updateCheckBox, state.showRowNumber);
  chunkGroup.selectAll('input')
      .on('change', function () {
        if (!panelGroupValid(chunkGroup)) return;
        state.rowCount = box.formValue(chunkGroup.select('.rowcnt'));
        state.columnCount = box.formValue(chunkGroup.select('.colcnt'));
        state.groupField = box.formValue(chunkGroup.select('.groupby'));
        state.chunksPerRow = box.formValue(chunkGroup.select('.crow'));
        state.showColumnNumber = box.checkBoxValue(chunkGroup.select('.showcol'));
        state.showRowNumber = box.checkBoxValue(chunkGroup.select('.showrow'));
        state.updateFieldNotifier();
      });
}


function panelGroupValid(selection) {
  const rowValid = box.formValid(selection.select('.rowcnt'));
  const colValid = box.formValid(selection.select('.colcnt'));
  const crowValid = box.formValid(selection.select('.crow'));
  return rowValid && colValid && crowValid;
}


function updateTileColorControlBox(selection, state) {
  const fieldOptions = state.items.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  selection
    .call(cbox.updateColorControl, fieldOptions, state.tileColor)
    .on('change', function() {
      state.tileColor = cbox.colorControlState(selection);
      if (state.tileColor.scale === 'ordinal') {
        const keys = state.items.records().map(e => e[state.tileColor.field]);
        state.tileColor.domain = _.uniq(keys).sort();
      }
      state.updateItemAttrNotifier();
    });
}


function updateTileValueControlBox(selection, state) {
  const fieldOptions = state.items.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  selection
      .call(cbox.updateLabelControl, fieldOptions,
            state.tileValue, state.tileValueColor)
      .on('change', function() {
        const values = cbox.labelControlState(selection);
        state.tileValue = values.label;
        state.tileValueColor = values.labelColor;
        if (state.tileValueColor.scale === 'ordinal') {
          const keys = state.items.records()
            .map(e => e[state.tileValueColor.field]);
          state.tileValueColor.domain = _.uniq(keys).sort();
        }
        state.updateItemAttrNotifier();
      });
}


function controlBox(selection, state) {
  // Clean up
  selection.select('nav').remove();
  selection.select('.tab-content').remove();

  selection.call(
    cbox.controlBoxFrame, 'control-frame-nav', 'control-frame-content');
  const tabs = selection.select('.nav-tabs');
  const content = selection.select('.tab-content');

  // Main
  tabs.append('a')
      .classed('active', true)
      .attr('aria-selected', 'true')
      .call(cbox.controlBoxNav, 'control-main', 'Main');
  content.append('div')
      .classed('show', true)
      .classed('active', true)
      .classed('control-main', true)
      .call(cbox.controlBoxItem, 'control-main')
      .call(mainControlBox, state);

  // Color
  tabs.append('a')
      .call(cbox.controlBoxNav, 'control-color', 'Color');
  content.append('div')
      .classed('control-color', true)
      .call(cbox.controlBoxItem, 'control-color')
      .call(cbox.colorControlBox, cscale.colorScales);

  // Text
  tabs.append('a')
      .call(cbox.controlBoxNav, 'control-value', 'Value');
  content.append('div')
      .classed('control-value', true)
      .call(cbox.controlBoxItem, 'control-value')
      .call(cbox.labelControlBox, cscale.colorScales);

  selection.call(updateControlBox, state);
}


function updateControlBox(selection, state) {
  selection.select('.control-main')
      .call(updateMainControl, state);
  selection.select('.control-color')
      .call(updateTileColorControlBox, state);
  selection.select('.control-value')
      .call(updateTileValueControlBox, state);
}


export default {
  controlBox, updateControlBox
};
