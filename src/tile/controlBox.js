
/** @module tile/controlBox */

import {default as misc} from '../common/misc.js';
import {default as cscale} from '../common/scale.js';

import {default as box} from '../component/formBox.js';
import {default as cbox} from '../component/controlBox.js';
import {default as lbox} from '../component/formListBox.js';


function mainControlBox(selection, state) {
  const chunkGroup = selection.append('div')
      .classed('panel-group', true)
      .classed('mb-3', true);
  chunkGroup.append('div')
      .classed('rowcnt', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Rows', 1, 9999, 1, state.rowCount);
  chunkGroup.append('div')
      .classed('colcnt', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Columns', 1, 9999, 1, state.columnCount);
  chunkGroup.append('div')
      .classed('groupby', true)
      .classed('mb-1', true)
      .call(
        lbox.selectBox, 'GroupBy',
        state.items.fields.filter(e => misc.sortType(e.format) !== 'none'),
        state.groupField || ''
      );
  chunkGroup.append('div')
      .classed('crow', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'ChunksPerRow', 1, 999, 1, state.chunksPerRow);
  chunkGroup.append('div')
      .classed('showcol', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'Show column number', state.showColumnNumber);
  chunkGroup.append('div')
      .classed('showrow', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'Show row number', state.showRowNumber);
}


function updateMainControlBox(selection, state) {
  // Network threshold
  const chunkGroup = selection.select('.panel-group');
  chunkGroup.select('.rowcnt')
      .call(box.updateNumberBox, state.rowCount);
  chunkGroup.select('.colcnt')
      .call(box.updateNumberBox, state.columnCount);
  chunkGroup.select('.groupby')
    .call(lbox.updateSelectBox, state.groupField);
  chunkGroup.select('.crow')
      .call(box.updateNumberBox, state.chunksPerRow);
  chunkGroup.select('.showcol')
      .call(box.updateCheckBox, state.showColumnNumber);
  chunkGroup.select('.showrow')
      .call(box.updateCheckBox, state.showRowNumber);
  chunkGroup.selectAll('.rowcnt, .colcnt, .groupby, .crow, .showcol, .showrow')
      .on('change', function () {
        state.rowCount = box.numberBoxIntValue(chunkGroup.select('.rowcnt'));
        state.columnCount = box.numberBoxIntValue(chunkGroup.select('.colcnt'));
        state.groupField = lbox.selectBoxValue(chunkGroup.select('.groupby'));
        state.chunksPerRow = box.numberBoxIntValue(chunkGroup.select('.crow'));
        state.showColumnNumber = box.checkBoxValue(chunkGroup.select('.showcol'));
        state.showRowNumber = box.checkBoxValue(chunkGroup.select('.showrow'));
        state.updateFieldNotifier();
      });
}


function tileColorControlBox(selection, state) {
  const scaleDefs = {
    palettes: cscale.colorPalettes,
    ranges: cscale.colorRangeTypes,
    presets: cscale.presets,
    scales: cscale.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.items.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  cbox.colorControlBox(selection, state.tileColor, fieldOptions, scaleDefs);
}


function updateTileColorControlBox(selection, state) {
  const notifier = state.updateItemAttrNotifier;
  cbox.updateColorControlBox(selection, state.tileColor, notifier);
}


function tileValueControlBox(selection, state) {
  const scaleDefs = {
    palettes: cscale.colorPalettes,
    ranges: cscale.colorRangeTypes,
    presets: cscale.presets,
    scales: cscale.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.items.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  cbox.labelControlBox(selection, state.tileValue, state.tileValueColor,
                       fieldOptions, scaleDefs);
}


function updateTileValueControlBox(selection, state) {
  const notifier = state.updateItemAttrNotifier;
  cbox.updateLabelControlBox(
    selection, state.tileValue, state.tileValueColor, notifier);
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
      .call(tileColorControlBox, state);

  // Text
  tabs.append('a')
      .call(cbox.controlBoxNav, 'control-value', 'Value');
  content.append('div')
      .classed('control-value', true)
      .call(cbox.controlBoxItem, 'control-value')
      .call(tileValueControlBox, state);

  selection.call(updateControlBox, state);
}


function updateControlBox(selection, state) {
  selection.select('.control-main')
      .call(updateMainControlBox, state);
  selection.select('.control-color')
      .call(updateTileColorControlBox, state);
  selection.select('.control-value')
      .call(updateTileValueControlBox, state);
}


export default {
  controlBox, updateControlBox
};
