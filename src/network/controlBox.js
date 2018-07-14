
/** @module network/controlBox */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as scaledef} from '../common/scale.js';

import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as rbox} from '../component/formRangeBox.js';
import {default as button} from '../component/button.js';
import {default as group} from '../component/formBoxGroup.js';


function mainControlBox(selection, state) {
  // Zoom
  selection.append('div')
      .classed('mb-3', true)
    .append('div')
      .classed('fit', true)
      .call(button.buttonBox, 'fit-to-screen', 'Fit to screen', 'primary');
  // View modes
  const viewModes = selection.append('div')
      .classed('mb-3', true);
    viewModes.append('div')
      .classed('focused', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'focused', 'Enable focused view', state.enableFocusedView);
    viewModes.append('div')
      .classed('overlook', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'overlook', 'Enable overlook view', state.enableOverlookView);
  // Network threshold
  const thldGroup = selection.append('div')
      .classed('thld-group', true)
      .classed('mb-3', true);
  thldGroup.append('div')
      .classed('field', true)
      .classed('mb-1', true)
      .call(
        lbox.selectBox, null, 'Connection',
        state.edges.fields.filter(e => misc.sortType(e.format) !== 'none')
          .filter(e => !['source', 'target'].includes(e.key)),
        state.connThldField
      );
  thldGroup.append('div')
      .classed('thld', true)
      .classed('mb-1', true)
      .call(box.numberBox, null, 'Threshold',
            state.minConnThld, 1.000, 0.01, state.currentConnThld);
  thldGroup.append('div')
      .classed('logd', true)
      .classed('mb-1', true)
      .call(box.readonlyBox, 'logd', 'logD', null);
  // Force layout
  const forceBox = selection.append('div')
      .classed('form-group', true)
      .classed('form-row', true);
  forceBox.append('div')
      .classed('col-6', true)
    .append('span')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('mb-1', true)
      .text('Temperature');
  forceBox.append('div')
      .classed('col-12', true)
    .append('div')
      .classed('temperature', true)
      .classed('progress', true)
    .append('div')
      .classed('progress-bar', true)
      .classed('w-30', true)
      .attr('id', 'temperature')
      .attr('role', 'progressbar')
      .attr('aria-valuemin', 0)
      .attr('aria-valuemax', 100);
  forceBox.append('div')
      .classed('col-12', true)
    .append('div')
      .classed('stick', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'stick-nodes', 'Stick nodes', !state.simulationOnLoad);
  forceBox.append('div')
      .classed('col-12', true)
    .append('div')
      .classed('restart', true)
      .classed('mb-1', true)
      .call(button.buttonBox, 'restart-force', 'Activate', 'warning');

  selection.call(updateMainControlBox, state);
}


function updateMainControlBox(selection, state) {
  // Snapshot
  selection.select('.snapshot')
      .on('click', function () { state.snapshotNotifier(); });
  // Zoom
  selection.select('.fit')
      .on('click', function () { state.fitNotifier(); });
  // Focused view
  selection.select('.focused')
      .call(box.updateCheckBox, state.enableFocusedView)
      .on('change', function () {
        state.enableFocusedView = box.checkBoxValue(d3.select(this));
        state.focusedView = box.checkBoxValue(d3.select(this));
        state.updateComponentNotifier();
      });
  // Overlook view
  selection.select('.overlook')
      .call(box.updateCheckBox, state.enableOverlookView)
      .on('change', function () {
        state.enableOverlookView = box.checkBoxValue(d3.select(this));
        state.overlookView = box.checkBoxValue(d3.select(this));
        state.updateComponentNotifier();
      });
  // Network threshold
  const thldGroup = selection.select('.thld-group');
  thldGroup.select('.field')
      .call(lbox.updateSelectBox, state.connThldField);
  thldGroup.select('.thld')
      .call(box.updateNumberBox, state.currentConnThld);
  thldGroup.selectAll('.field, .thld')
      .on('change', function () {
        const field = lbox.selectBoxValue(thldGroup.select('.field'));
        const thld = box.numberBoxValue(thldGroup.select('.thld'));
        state.connThldField = field;
        state.currentConnThld = thld;
        state.updateComponentNotifier();
        state.setForceNotifier();
        const numEdges = state.es.filter(e => e[field] >= thld).length;
        const n = state.ns.length;
        const combinations = n * (n - 1) / 2;
        const logD = d3.format('.2f')(Math.log10(numEdges / combinations));
        selection.select('.logd').call(box.updateTextBox, logD);
      });
  thldGroup.select('.field').dispatch('change');
  // Force layout
  state.tickCallback = (simulation) => {
    const alpha = simulation.alpha();
    const isStopped = alpha <= simulation.alphaMin();
    const progress = parseInt(isStopped ? 0 : alpha * 100);
    selection.select('.temperature')
      .select('.progress-bar')
        .classed('bg-success', isStopped)
        .classed('bg-warning', !isStopped)
        .style('width', `${progress}%`)
        .attr('aria-valuenow', progress);
  };
  selection.select('.stick')
      .call(box.updateCheckBox, !state.simulationOnLoad)
      .on('change', function () {
        const value = box.checkBoxValue(d3.select(this));
        selection.select('.temperature')
            .style('background-color', value ? '#a3e4d7' : '#e9ecef')
          .select('.progress-bar')
            .style('width', `0%`)
            .attr('aria-valuenow', 0);
        if (value) {
          state.stickNotifier();
        } else {
          state.relaxNotifier();
        }
      });
  selection.select('.restart')
      .on('click', function () {
        selection.select('.stick')
            .call(box.updateCheckBox, false)
            .dispatch('change');
        state.restartNotifier();
      });
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

function nodeColorControlBox(selection, state) {
  const scaleDefs = {
    palettes: scaledef.colorPalettes,
    ranges: scaledef.colorRangeTypes,
    presets: scaledef.presets,
    scales: scaledef.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.nodes.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  colorControlBox(selection, state.nodeColor, fieldOptions, scaleDefs);
}

function edgeColorControlBox(selection, state) {
  const scaleDefs = {
    palettes: scaledef.colorPalettes,
    ranges: scaledef.colorRangeTypes,
    presets: scaledef.presets,
    scales: scaledef.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.edges.fields
    .filter(e => misc.sortType(e.format) !== 'none')
    .filter(e => !['source', 'target'].includes(e.key));
  colorControlBox(selection, state.edgeColor, fieldOptions, scaleDefs);
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

function updateNodeColorControlBox(selection, state) {
  const notifier = state.updateNodeAttrNotifier;
  updateColorControlBox(selection, state.nodeColor, notifier);
}

function updateEdgeColorControlBox(selection, state) {
  const notifier = state.updateEdgeAttrNotifier;
  updateColorControlBox(selection, state.edgeColor, notifier);
}


function sizeControlBox(selection, sizeState, fieldOptions, scaledef) {
  selection.append('div')
    .classed('field', true)
    .call(
      lbox.selectBox, null, 'Field', fieldOptions, sizeState.field || '');
  selection.append('div')
    .classed('range', true)
    .classed('mb-3', true)
    .call(rbox.rangeBox, null, 'Range', sizeState.range);
  selection.append('div')
    .classed('scale', true)
    .call(
      group.scaleBoxGroup, null, scaledef.presets, scaledef.scales,
      sizeState.scale, sizeState.domain
    );
}

function nodeSizeControlBox(selection, state) {
  const scaleDefs = {
    presets: scaledef.presets.filter(e => e.scale !== 'ordinal'),
    scales: scaledef.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.nodes.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  sizeControlBox(selection, state.nodeSize, fieldOptions, scaleDefs);
}

function edgeWidthControlBox(selection, state) {
  const scaleDefs = {
    presets: scaledef.presets.filter(e => e.scale !== 'ordinal'),
    scales: scaledef.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.edges.fields
    .filter(e => misc.sortType(e.format) !== 'none')
    .filter(e => !['source', 'target'].includes(e.key));
  sizeControlBox(selection, state.edgeWidth, fieldOptions, scaleDefs);
}


function updateSizeControlBox(selection, sizeState, notifier) {
  selection.select('.field')
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

function updateNodeSizeControlBox(selection, state) {
  const notifier = state.updateNodeAttrNotifier;
  updateSizeControlBox(selection, state.nodeSize, notifier);
}

function updateEdgeWidthControlBox(selection, state) {
  const notifier = state.updateEdgeAttrNotifier;
  updateSizeControlBox(selection, state.edgeWidth, notifier);
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

function nodeLabelControlBox(selection, state) {
  const scaleDefs = {
    palettes: scaledef.colorPalettes,
    ranges: scaledef.colorRangeTypes,
    presets: scaledef.presets,
    scales: scaledef.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.nodes.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  labelControlBox(selection, state.nodeLabel, state.nodeLabelColor,
                 fieldOptions, scaleDefs);
}

function edgeLabelControlBox(selection, state) {
  const scaleDefs = {
    palettes: scaledef.colorPalettes,
    ranges: scaledef.colorRangeTypes,
    presets: scaledef.presets,
    scales: scaledef.types.filter(e => e.key !== 'ordinal')
  };
  const fieldOptions = state.edges.fields
    .filter(e => misc.sortType(e.format) !== 'none')
    .filter(e => !['source', 'target'].includes(e.key));
  labelControlBox(selection, state.edgeLabel, state.edgeLabelColor,
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

function updateNodeLabelControlBox(selection, state) {
  const notifier = state.updateNodeAttrNotifier;
  updateLabelControlBox(
    selection, state.nodeLabel, state.nodeLabelColor, notifier);
}

function updateEdgeLabelControlBox(selection, state) {
  const notifier = state.updateEdgeAttrNotifier;
  updateLabelControlBox(
    selection, state.edgeLabel, state.edgeLabelColor, notifier);
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
      .call(nodeColorControlBox, state);

  // Size
  tabs.append('a')
      .call(controlBoxNav, 'control-size', 'Size');
  content.append('div')
      .classed('control-size', true)
      .call(controlBoxItem, 'control-size')
      .call(nodeSizeControlBox, state);

  // Label
  tabs.append('a')
      .call(controlBoxNav, 'control-label', 'Label');
  content.append('div')
      .classed('control-label', true)
      .call(controlBoxItem, 'control-label')
      .call(nodeLabelControlBox, state);

  // Edge color
  tabs.append('a')
      .call(controlBoxNav, 'control-edgecolor', 'eColor');
  content.append('div')
      .classed('control-edgecolor', true)
      .call(controlBoxItem, 'control-edgecolor')
      .call(edgeColorControlBox, state);

  // Edge width
  tabs.append('a')
      .call(controlBoxNav, 'control-edgewidth', 'eWidth');
  content.append('div')
      .classed('control-edgewidth', true)
      .call(controlBoxItem, 'control-edgewidth')
      .call(edgeWidthControlBox, state);

  // Edge label
  tabs.append('a')
      .call(controlBoxNav, 'control-edgelabel', 'eLabel');
  content.append('div')
      .classed('control-edgelabel', true)
      .call(controlBoxItem, 'control-edgelabel')
      .call(edgeLabelControlBox, state);

  selection.call(updateControlBox, state);
}


function updateControlBox(selection, state) {
  selection.select('.control-main')
      .call(updateMainControlBox, state);
  selection.select('.control-color')
      .call(updateNodeColorControlBox, state);
  selection.select('.control-size')
      .call(updateNodeSizeControlBox, state);
  selection.select('.control-label')
      .call(updateNodeLabelControlBox, state);
  selection.select('.control-edgecolor')
      .call(updateEdgeColorControlBox, state);
  selection.select('.control-edgewidth')
      .call(updateEdgeWidthControlBox, state);
  selection.select('.control-edgelabel')
      .call(updateEdgeLabelControlBox, state);
}


export default {
  controlBox, updateControlBox
};
