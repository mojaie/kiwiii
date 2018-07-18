
/** @module tile/controlBox */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as cscale} from '../common/scale.js';

import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as group} from '../component/formBoxGroup.js';


function mainControlBox(selection, state) {
  const panelGroup = selection.append('div')
      .classed('panel-group', true)
      .classed('mb-3', true);
  panelGroup.append('div')
      .classed('rowcnt', true)
      .classed('mb-1', true)
      .call(box.numberBox, null, 'Rows', 1, 9999, 1, state.rowCount);
  panelGroup.append('div')
      .classed('colcnt', true)
      .classed('mb-1', true)
      .call(box.numberBox, null, 'Columns', 1, 9999, 1, state.columnCount);
  panelGroup.append('div')
      .classed('groupby', true)
      .classed('mb-1', true)
      .call(
        lbox.selectBox, null, 'GroupBy',
        state.items.fields.filter(e => misc.sortType(e.format) !== 'none'),
        state.groupField || ''
      );
  panelGroup.append('div')
      .classed('crow', true)
      .classed('mb-1', true)
      .call(box.numberBox, null, 'ChunksPerRow', 1, 999, 1, state.chunksPerRow);
  panelGroup.append('div')
      .classed('showcol', true)
      .classed('mb-1', true)
      .call(box.checkBox, null, 'Show column number', state.showColumnNumber);
  panelGroup.append('div')
      .classed('showrow', true)
      .classed('mb-1', true)
      .call(box.checkBox, null, 'Show row number', state.showRowNumber);
}


function updateMainControlBox(selection, state) {
  // Network threshold
  const panelGroup = selection.select('.panel-group');
  panelGroup.select('.rowcnt')
      .call(box.updateNumberBox, state.rowCount);
  panelGroup.select('.colcnt')
      .call(box.updateNumberBox, state.columnCount);
  panelGroup.select('.groupby')
    .call(lbox.updateSelectBox, state.groupField);
  panelGroup.select('.crow')
      .call(box.updateNumberBox, state.chunksPerRow);
  panelGroup.select('.showcol')
      .call(box.updateCheckBox, state.showColumnNumber);
  panelGroup.select('.showrow')
      .call(box.updateCheckBox, state.showRowNumber);
  panelGroup.selectAll('.rowcnt, .colcnt, .groupby, .crow, .showcol, .showrow')
      .on('change', function () {
        state.rowCount = parseInt(box.numberBoxValue(panelGroup.select('.rowcnt')));
        state.columnCount = parseInt(box.numberBoxValue(panelGroup.select('.colcnt')));
        state.groupField = lbox.selectBoxValue(panelGroup.select('.groupby'));
        state.chunksPerRow = parseInt(box.numberBoxValue(panelGroup.select('.crow')));
        state.showColumnNumber = box.checkBoxValue(panelGroup.select('.showcol'));
        state.showRowNumber = box.checkBoxValue(panelGroup.select('.showrow'));
        state.updateFieldNotifier();
      });
  panelGroup.select('.rowcnt').dispatch('change');
}


function colorControlBox(selection, colorState, fieldOptions, scaleDefs) {
  selection.append('div')
      .classed('field', true)
      .call(lbox.selectBox, null, 'Field', fieldOptions, colorState.field || '');
  selection.append('div')
      .classed('range', true)
      .call(
        group.colorRangeGroup, null, scaleDefs.palettes,
        scaleDefs.ranges, colorState.range, colorState.unknown
      );
  selection.append('div')
      .classed('scale', true)
      .call(
        group.scaleBoxGroup, null, scaleDefs.presets,
        scaleDefs.scales, colorState.scale, colorState.domain
      );
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
  colorControlBox(selection, state.tileColor, fieldOptions, scaleDefs);
}


function updateColorControlBox(selection, colorState, notifier) {
  selection.select('.field')
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

function updateTileColorControlBox(selection, state) {
  const notifier = state.updateItemAttrNotifier;
  updateColorControlBox(selection, state.tileColor, notifier);
}


function labelControlBox(selection, labelState,
                         colorState, fieldOptions, scaleDefs) {
  // nodeLabel.visible
  selection.append('div')
    .append('div')
      .classed('visible', true)
      .call(box.checkBox, null, 'Show labels', labelState.visible);
  // nodeLabel
  const labelGroup = selection.append('div')
      .classed('mb-3', true);
  labelGroup.append('div')
      .classed('text', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, null, 'Text field', fieldOptions, labelState.field || '');
  labelGroup.append('div')
      .classed('size', true)
      .classed('mb-1', true)
      .call(box.numberBox, null, 'Font size', 6, 100, 1, labelState.size);
  // nodeLabelColor
  selection.append('div')
      .classed('field', true)
      .call(lbox.selectBox, null, 'Color field', fieldOptions, colorState.field || '');
  selection.append('div')
      .classed('range', true)
      .call(
        group.colorRangeGroup, null, scaleDefs.palettes,
        scaleDefs.ranges, colorState.range, colorState.unknown
      );
  selection.append('div')
      .classed('scale', true)
      .call(
        group.scaleBoxGroup, null, scaleDefs.presets,
        scaleDefs.scales, colorState.scale, colorState.domain
      );
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
  labelControlBox(selection, state.tileValue, state.tileValueColor,
                  fieldOptions, scaleDefs);
}


function updateLabelControlBox(selection, labelState, colorState, notifier) {
  // nodeLabel.visible
  selection.select('.visible')
      .call(box.updateCheckBox, labelState.visible)
      .on('change', function () {
        labelState.visible = box.checkBoxValue(d3.select(this));
        notifier();
      });
  // nodeLabel
  selection.select('.text')
      .call(lbox.updateSelectBox, labelState.field)
      .on('change', function () {
        labelState.field = lbox.selectBoxValue(d3.select(this));
        notifier();
      });
  selection.select('.size')
      .call(box.updateNumberBox, labelState.size)
      .on('change', function () {
        labelState.size = box.numberBoxValue(d3.select(this));
        notifier();
      });
  // nodeLabelColor
  selection.select('.field')
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
          colorState.scale = lbox.selectBoxValue(selection.select('.range'));
          selection.select('.scale').selectAll('select,input')
            .property('disabled', false)
            .style('opacity', null);
        }
        notifier();
      });
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

function updateTileValueControlBox(selection, state) {
  const notifier = state.updateItemAttrNotifier;
  updateLabelControlBox(
    selection, state.tileValue, state.tileValueColor, notifier);
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


function controlBox(selection, state) {
  // Clean up
  selection.select('nav').remove();
  selection.select('.tab-content').remove();

  selection.call(
    controlBoxFrame, 'control-frame-nav', 'control-frame-content');
  const tabs = selection.select('.nav-tabs');
  const content = selection.select('.tab-content');

  // Main
  tabs.append('a')
      .classed('active', true)
      .attr('aria-selected', 'true')
      .call(controlBoxNav, 'control-main', 'Main');
  content.append('div')
      .classed('show', true)
      .classed('active', true)
      .classed('control-main', true)
      .call(controlBoxItem, 'control-main')
      .call(mainControlBox, state);

  // Color
  tabs.append('a')
      .call(controlBoxNav, 'control-color', 'Color');
  content.append('div')
      .classed('control-color', true)
      .call(controlBoxItem, 'control-color')
      .call(tileColorControlBox, state);

  // Text
  tabs.append('a')
      .call(controlBoxNav, 'control-value', 'Value');
  content.append('div')
      .classed('control-value', true)
      .call(controlBoxItem, 'control-value')
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
