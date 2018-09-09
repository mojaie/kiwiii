
/** @module network/controlBox */

import _ from 'lodash';
import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as cscale} from '../common/scale.js';

import {default as badge} from '../component/badge.js';
import {default as box} from '../component/formBox.js';
import {default as cbox} from '../component/controlBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as button} from '../component/button.js';

import {default as force} from './force.js';


function mainControlBox(selection, state) {
  // Zoom
  selection.append('div')
      .classed('mb-3', true)
    .append('div')
      .classed('fit', true)
      .call(button.buttonBox, 'Fit to screen', 'primary');
  // View modes
  const viewModes = selection.append('div')
      .classed('mb-3', true);
    viewModes.append('div')
      .classed('focused', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'Enable focused view');
    viewModes.append('div')
      .classed('overlook', true)
      .classed('mb-1', true)
      .call(box.checkBox, 'Enable overlook view');

  // Legend
  const legendOptions = [
    {key: 'top-left', name: 'Top-left'},
    {key: 'top-right', name: 'Top-right'},
    {key: 'bottom-left', name: 'Bottom-left'},
    {key: 'bottom-right', name: 'Bottom-right'},
  ];
  selection.append('div')
      .classed('legend', true)
      .classed('mb-3', true)
      .call(lbox.selectBox, 'Legend')
      .call(lbox.updateSelectBoxOptions, legendOptions)
      .on('change', function () {
        state.legendOrient = box.formValue(d3.select(this));
        state.updateLegendNotifier();
      });

  // Network threshold
  const thldGroup = selection.append('div')
      .classed('thld-group', true)
      .classed('mb-3', true);
  thldGroup.append('div')
      .classed('field', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Connection');
  thldGroup.append('div')
      .classed('thld', true)
      .classed('mb-1', true)
      .call(box.numberBox, 'Threshold')
      .call(box.updateNumberRange, state.minConnThld, 1, 0.01)
      .call(badge.updateInvalidMessage,
            `Please provide a valid range (${state.minConnThld}-1.00)`)
    .select('.form-control')
      .attr('required', 'required');
  thldGroup.append('div')
      .classed('logd', true)
      .classed('mb-1', true)
      .call(box.readonlyBox, 'logD');
  // Force layout
  const forceBox = selection.append('div')
      .classed('form-group', true)
      .classed('form-row', true);
  forceBox.append('div')
      .classed('col-12', true)
    .append('div')
      .classed('forcetype', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, 'Force')
      .call(lbox.updateSelectBoxOptions, force.forceType)
      .on('change', function () {
        const value = box.formValue(d3.select(this));
        state.forceType = value;
        state.setForceNotifier();
      });
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
      .call(box.checkBox, 'Stick nodes');
  forceBox.append('div')
      .classed('col-12', true)
    .append('div')
      .classed('restart', true)
      .classed('mb-1', true)
      .call(button.buttonBox, 'Activate', 'warning');
}


function updateMainControl(selection, state) {
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
  const thldFields = state.edges.fields
    .filter(e => misc.sortType(e.format) !== 'none')
    .filter(e => !['source', 'target'].includes(e.key));
  thldGroup.select('.field')
      .call(lbox.updateSelectBoxOptions, thldFields)
      .call(box.updateFormValue, state.connThldField);
  thldGroup.select('.thld')
      .call(box.updateFormValue, state.currentConnThld);
  thldGroup.selectAll('.field, .thld')
      .on('change', function () {
        if(!box.formValid(thldGroup.select('.thld'))) return;
        const field = box.formValue(thldGroup.select('.field'));
        const thld = box.formValue(thldGroup.select('.thld'));
        state.connThldField = field;
        state.currentConnThld = thld;
        thldGroup.select('.logd').dispatch('update');
        state.setForceNotifier();
        state.updateComponentNotifier();
      });
  thldGroup.select('.logd')
      .on('update', function () {
        // Calculate edge density
        const field = state.connThldField;
        const thld = state.currentConnThld;
        const numEdges = state.es.filter(e => e[field] >= thld).length;
        const n = state.ns.length;
        const combinations = n * (n - 1) / 2;
        const logD = d3.format('.2f')(Math.log10(numEdges / combinations));
        d3.select(this).call(box.updateReadonlyValue, logD);
      })
      .dispatch('update');

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
      .call(box.updateCheckBox, !state.forceActive)
      .on('change', function () {
        const value = box.checkBoxValue(d3.select(this));
        state.forceActive = !value;
        selection.select('.temperature')
            .style('background-color', value ? '#a3e4d7' : '#e9ecef')
          .select('.progress-bar')
            .style('width', `0%`)
            .attr('aria-valuenow', 0);
        value ? state.stickNotifier() : state.relaxNotifier();
        state.updateComponentNotifier();
      });
  selection.select('.restart')
      .on('click', function () {
        selection.select('.stick')
            .call(box.updateCheckBox, false)
            .dispatch('change');
        state.restartNotifier();
      });
}


function updateNodeColorControl(selection, state) {
  const fieldOptions = state.nodes.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  selection
      .call(cbox.updateColorControl, fieldOptions, state.nodeColor)
      .on('change', function() {
        if (!cbox.colorControlValid(selection)) return;
        state.nodeColor = cbox.colorControlState(selection);
        if (state.nodeColor.scale === 'ordinal') {
          const keys = state.nodes.records().map(e => e[state.nodeColor.field]);
          state.nodeColor.domain = _.uniq(keys).sort();
        }
        state.updateNodeAttrNotifier();
      });
}


function updateEdgeColorControl(selection, state) {
  const fieldOptions = state.edges.fields
    .filter(e => misc.sortType(e.format) !== 'none')
    .filter(e => !['source', 'target'].includes(e.key));
  selection
      .call(cbox.updateColorControl, fieldOptions, state.edgeColor)
      .on('change', function() {
        if (!cbox.colorControlValid(selection)) return;
        state.edgeColor = cbox.colorControlState(selection);
        if (state.edgeColor.scale === 'ordinal') {
          const keys = state.edges.records().map(e => e[state.edgeColor.field]);
          state.edgeColor.domain = _.uniq(keys).sort();
        }
        state.updateEdgeAttrNotifier();
      });

  // TODO: not implemented yet
  selection.select('.legend input').property('disabled', true);
}


function updateNodeSizeControl(selection, state) {
  const fieldOptions = state.nodes.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  selection
      .call(cbox.updateSizeControl, fieldOptions, state.nodeSize)
      .on('change', function() {
        if (!cbox.sizeControlValid(selection)) return;
        state.nodeSize = cbox.sizeControlState(selection);
        state.updateNodeAttrNotifier();
      });
}


function updateEdgeWidthControl(selection, state) {
  const fieldOptions = state.edges.fields
    .filter(e => misc.sortType(e.format) !== 'none')
    .filter(e => !['source', 'target'].includes(e.key));
  selection
      .call(cbox.updateSizeControl, fieldOptions, state.edgeWidth)
      .on('change', function() {
        if (!cbox.sizeControlValid(selection)) return;
        state.edgeWidth = cbox.sizeControlState(selection);
        state.updateEdgeAttrNotifier();
      });
}


function updateNodeLabelControl(selection, state) {
  const fieldOptions = state.nodes.fields
    .filter(e => misc.sortType(e.format) !== 'none');
  selection
      .call(cbox.updateLabelControl, fieldOptions,
            state.nodeLabel, state.nodeLabelColor)
      .on('change', function() {
        if (!cbox.labelControlValid(selection)) return;
        const values = cbox.labelControlState(selection);
        state.nodeLabel = values.label;
        state.nodeLabelColor = values.labelColor;
        if (state.nodeLabelColor.scale === 'ordinal') {
          const keys = state.nodes.records()
            .map(e => e[state.nodeLabelColor.field]);
          state.nodeLabelColor.domain = _.uniq(keys).sort();
        }
        state.updateNodeAttrNotifier();
      });
}


function updateEdgeLabelControl(selection, state) {
  const fieldOptions = state.edges.fields
    .filter(e => misc.sortType(e.format) !== 'none')
    .filter(e => !['source', 'target'].includes(e.key));
  selection
      .call(cbox.updateLabelControl, fieldOptions,
            state.edgeLabel, state.edgeLabelColor)
      .on('change', function() {
        if (!cbox.labelControlValid(selection)) return;
        const values = cbox.labelControlState(selection);
        state.edgeLabel = values.label;
        state.edgeLabelColor = values.labelColor;
        if (state.edgeLabelColor.scale === 'ordinal') {
          const keys = state.edges.records()
            .map(e => e[state.edgeLabelColor.field]);
          state.edgeLabelColor.domain = _.uniq(keys).sort();
        }
        state.updateEdgeAttrNotifier();
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

  // Size
  tabs.append('a')
      .call(cbox.controlBoxNav, 'control-size', 'Size');
  content.append('div')
      .classed('control-size', true)
      .call(cbox.controlBoxItem, 'control-size')
      .call(cbox.sizeControlBox);

  // Label
  tabs.append('a')
      .call(cbox.controlBoxNav, 'control-label', 'Label');
  content.append('div')
      .classed('control-label', true)
      .call(cbox.controlBoxItem, 'control-label')
      .call(cbox.labelControlBox, cscale.colorScales);

  // Edge color
  tabs.append('a')
      .call(cbox.controlBoxNav, 'control-edgecolor', 'eColor');
  content.append('div')
      .classed('control-edgecolor', true)
      .call(cbox.controlBoxItem, 'control-edgecolor')
      .call(cbox.colorControlBox, cscale.colorScales);

  // Edge width
  tabs.append('a')
      .call(cbox.controlBoxNav, 'control-edgewidth', 'eWidth');
  content.append('div')
      .classed('control-edgewidth', true)
      .call(cbox.controlBoxItem, 'control-edgewidth')
      .call(cbox.sizeControlBox);

  // Edge label
  tabs.append('a')
      .call(cbox.controlBoxNav, 'control-edgelabel', 'eLabel');
  content.append('div')
      .classed('control-edgelabel', true)
      .call(cbox.controlBoxItem, 'control-edgelabel')
      .call(cbox.labelControlBox, cscale.colorScales);

  state.updateControlBoxNotifier = () => {
    selection.call(updateControlBox, state);
  };
}


function updateControlBox(selection, state) {
  selection.select('.control-main')
      .call(updateMainControl, state);
  selection.select('.control-color')
      .call(updateNodeColorControl, state);
  selection.select('.control-size')
      .call(updateNodeSizeControl, state);
  selection.select('.control-label')
      .call(updateNodeLabelControl, state);
  selection.select('.control-edgecolor')
      .call(updateEdgeColorControl, state);
  selection.select('.control-edgewidth')
      .call(updateEdgeWidthControl, state);
  selection.select('.control-edgelabel')
      .call(updateEdgeLabelControl, state);
}


export default {
  controlBox, updateControlBox
};
