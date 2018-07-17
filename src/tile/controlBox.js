
/** @module tile/controlBox */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as scaledef} from '../common/scale.js';

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
        state.groupField
      );
  panelGroup.append('div')
      .classed('grow', true)
      .classed('mb-1', true)
      .call(box.numberBox, null, 'GroupsPerRow', 1, 999, 1, state.groupsPerRow);
  panelGroup.append('div')
      .classed('showcol', true)
      .classed('mb-1', true)
      .call(box.checkBox, null, 'Show column number', state.showColumnNumber);
  panelGroup.append('div')
      .classed('showrow', true)
      .classed('mb-1', true)
      .call(box.checkBox, null, 'Enable overlook view', state.showRowNumber);

  selection.call(updateMainControlBox, state);
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
  panelGroup.select('.grow')
      .call(box.updateNumberBox, state.groupsPerRow);
  panelGroup.select('.showcol')
      .call(box.updateCheckBox, state.showColumnNumber);
  panelGroup.select('.showrow')
      .call(box.updateCheckBox, state.showRowNumber);
  panelGroup.selectAll('.rowcnt, .colcnt, .groupby, .grow')
      .on('change', function () {
        state.rowCount = box.numberBoxValue(panelGroup.select('.rowcnt'));
        state.columnCount = box.numberBoxValue(panelGroup.select('.colcnt'));
        state.groupField = lbox.selectBoxValue(panelGroup.select('.groupby'));
        state.groupsPerRow = box.numberBoxValue(panelGroup.select('.grow'));
        state.showColumnNumber = box.checkBoxValue(panelGroup.select('.showcol'));
        state.showRowNumber = box.checkBoxValue(panelGroup.select('.showrow'));
        state.updatePanelNotifier();  // TODO:
      });
  panelGroup.select('.rowcnt').dispatch('change');
}


function colorControlBox(selection, colorState, fieldOptions, scaledef) {
  selection.append('div')
      .classed('field', true)
      .call(lbox.selectBox, null, 'Field', fieldOptions, colorState.field || '');
  selection.append('div')
      .classed('range', true)
      .call(
        group.colorRangeGroup, null, scaledef.palettes,
        scaledef.ranges, colorState.range, colorState.unknown
      );
  selection.append('div')
      .classed('scale', true)
      .call(
        group.scaleBoxGroup, null, scaledef.presets,
        scaledef.scales, colorState.scale, colorState.domain
      );
}

function tileColorControlBox(selection, state) {
  const scaleDefs = {
    palettes: scaledef.colorPalettes,
    ranges: scaledef.colorRangeTypes,
    presets: scaledef.presets,
    scales: scaledef.types.filter(e => e.key !== 'ordinal')
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
  const notifier = state.updateTileAttrNotifier;
  updateColorControlBox(selection, state.tileColor, notifier);
}


function labelControlBox(selection, labelState, colorState, fieldOptions) {
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
        group.colorRangeGroup, null, scaledef.palettes,
        scaledef.ranges, colorState.range, colorState.unknown
      );
  selection.append('div')
      .classed('scale', true)
      .call(
        group.scaleBoxGroup, null, scaledef.presets,
        scaledef.scales, colorState.scale, colorState.domain
      );
}

function tileTextControlBox(selection, state) {
  const scaleDefs = {
    palettes: scaledef.colorPalettes,
    ranges: scaledef.colorRangeTypes,
    presets: scaledef.presets,
    scales: scaledef.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.items.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  labelControlBox(selection, state.tileText, state.tileTextColor,
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

function updateTileTextControlBox(selection, state) {
  const notifier = state.updateItemAttrNotifier;
  updateLabelControlBox(
    selection, state.tileText, state.tileTextColor, notifier);
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
      .call(controlBoxNav, 'control-label', 'Label');
  content.append('div')
      .classed('control-label', true)
      .call(controlBoxItem, 'control-label')
      .call(tileTextControlBox, state);

  selection.call(updateControlBox, state);
}


function updateControlBox(selection, state) {
  selection.select('.control-main')
      .call(updateMainControlBox, state);
  selection.select('.control-color')
      .call(updateTileColorControlBox, state);
  selection.select('.control-label')
      .call(updateTileTextControlBox, state);
}


export default {
  controlBox, updateControlBox
};
