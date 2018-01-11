
import d3 from 'd3';

import {default as box} from '../component/formBox.js';
import {default as group} from '../component/formBoxGroup.js';
import {default as def} from '../helper/definition.js';
import {default as scaledef} from '../helper/scale.js';


function mainControlBox(selection, state) {
  // Snapshot
  selection.append('div')
      .classed('mb-3', true)
    .append('div')
      .classed('snapshot', true)
      .call(box.buttonBox, 'snapshot', 'Save snapshot', 'primary');
  // Zoom
  selection.append('div')
      .classed('mb-3', true)
    .append('div')
      .classed('fit', true)
      .call(box.buttonBox, 'fit-to-screen', 'Fit to screen', 'primary');
  // Focused view
  selection.append('div')
      .classed('mb-3', true)
    .append('div')
      .classed('focused', true)
      .call(box.checkBox, 'focused', 'Enable focused view', state.enableFocusedView);
  // Overlook view
  selection.append('div')
      .classed('mb-3', true)
    .append('div')
      .classed('overlook', true)
      .call(box.checkBox, 'overlook', 'Enable overlook view', state.enableOverlookView);
  // Network threshold
  const thldGroup = selection.append('div')
      .classed('mb-3', true);
  thldGroup.append('div')
      .classed('thld', true)
      .call(box.numberBox, 'thld', 'Network threshold',
            state.networkThresholdCutoff, 1.000, 0.01, state.networkThreshold);
  const logdBox = thldGroup.append('div')
      .classed('col-12', true);
  logdBox.append('span')
      .classed('form-label', true)
      .text('logD');
  logdBox.append('span')
      .classed('form-control-sm', true)
      .classed('logd', true);
  // Force layout
  const forceBox = selection.append('div')
      .classed('form-group', true)
      .classed('row', true);
  forceBox.append('div')
      .classed('col-6', true)
    .append('span')
      .classed('form-label', true)
      .classed('mb-1', true)
      .text('Temperature');
  forceBox.append('div')
      .classed('col-12', true)
    .append('div')
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
      .call(box.checkBox, 'stick-nodes', 'Stick nodes', !state.simulationOnLoad);
  forceBox.append('div')
      .classed('col-12', true)
    .append('div')
      .classed('restart', true)
      .call(box.buttonBox, 'restart-force', 'Activate', 'warning');

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
  selection.select('.thld')
      .call(box.updateNumberBox, state.networkThreshold)
      .on('change', function () {
        const value = box.numberBoxValue(d3.select(this));
        state.networkThreshold = value;
        state.updateComponentNotifier();
        state.setForceNotifier();
        const numEdges = state.edges.filter(e => e.weight >= value).length;
        const n = state.nodes.length;
        const combinations = n * (n - 1) / 2;
        const logD = d3.format('.2f')(Math.log10(numEdges / combinations));
        selection.select('.logd').text(logD);
      })
      .dispatch('change');
  // Force layout
  selection.select('.stick')
      .call(box.updateCheckBox, !state.simulationOnLoad)
      .on('change', function () {
        const value = box.checkBoxValue(d3.select(this));
        if (value) {
          state.stickNotifier();
          selection.select('.progress')
            .style('background-color', '#a3e4d7');
        } else {
          state.relaxNotifier();
          selection.select('.progress')
            .style('background-color', '#e9ecef');
        }
      });
  selection.select('.restart')
      .on('click', function () { state.restartNotifier(); });
}



function nodeColorControlBox(selection, state) {
  selection.append('div')
      .classed('mb-3', true)
      .classed('field', true)
      .call(
        box.selectBox, 'color-field', 'Field',
        state.nodeFields.filter(e => def.sortType(e.format) !== 'none'),
        state.nodeColor.field || ''
      );
  selection.append('div')
      .classed('range', true)
      .call(
        group.colorRangeGroup, 'color', scaledef.colorPalettes,
        scaledef.colorRangeTypes, state.nodeColor.range
      );
  selection.append('div')
      .classed('scale', true)
      .call(
        group.scaleBoxGroup, 'color', scaledef.presets,
        scaledef.types.filter(e => e.key !== 'ordinal'),
        state.nodeColor.scale, state.nodeColor.domain
      );

  selection.call(updateNodeColorControlBox, state);
}


function updateNodeColorControlBox(selection, state) {
  selection.select('.field')
    .call(box.updateSelectBox, state.nodeColor.field)
    .on('change', function () {
      state.nodeColor.field = box.selectBoxValue(d3.select(this));
      state.updateNodeAttrNotifier();
    });
  selection.select('.range')
    .call(group.updateColorRangeGroup, state.nodeColor.range)
    .on('change', function () {
      const values = group.colorRangeGroupValue(d3.select(this));
      state.nodeColor.range = values;
      if (values.length > 3) {
        state.nodeColor.scale = 'ordinal';
        selection.select('.scale').selectAll('select,input')
          .property('disabled', true)
          .style('opacity', 0.3);
      } else {
        selection.select('.scale').selectAll('select,input')
          .property('disabled', false)
          .style('opacity', null);
      }
      state.updateNodeAttrNotifier();
    }
  );
  selection.select('.scale')
    .call(group.updateScaleBoxGroup, state.nodeColor.scale, state.nodeColor.domain)
    .on('change', function () {
      const values = group.scaleBoxGroupValue(d3.select(this));
      state.nodeColor.scale = values.scale;
      state.nodeColor.domain = values.domain;
      state.updateNodeAttrNotifier();
    }
  );
}


function nodeSizeControlBox(selection, state) {
  selection.append('div')
    .classed('mb-3', true)
    .classed('field', true)
    .call(
      box.selectBox, 'size-field', 'Field',
      state.nodeFields.filter(e => def.sortType(e.format) === 'numeric'),
      state.nodeSize.field || ''
    );
  selection.append('div')
    .classed('range', true)
    .call(box.rangeBox, 'size-range', 'Range', state.nodeSize.range);
  selection.append('div')
    .classed('scale', true)
    .call(
      group.scaleBoxGroup, 'size',
      scaledef.presets.filter(e => e.scale !== 'ordinal'),
      scaledef.types.filter(e => e.key !== 'ordinal'),
      state.nodeSize.scale, state.nodeSize.domain
    );
  selection.call(updateNodeSizeControlBox, state);
}


function updateNodeSizeControlBox(selection, state) {
  selection.select('.field')
    .call(box.updateSelectBox, state.nodeSize.field)
    .on('change', function () {
      state.nodeSize.field = box.selectBoxValue(d3.select(this));
      state.updateNodeAttrNotifier();
    });
  selection.select('.range')
    .call(box.updateRangeBox, state.nodeSize.range)
    .on('change', function () {
      state.nodeSize.range = box.rangeBoxValue(d3.select(this));
      state.updateNodeAttrNotifier();
    });
  selection.select('.scale')
    .call(group.updateScaleBoxGroup, state.nodeSize.scale, state.nodeSize.domain)
    .on('change', function () {
      const values = group.scaleBoxGroupValue(d3.select(this));
      state.nodeSize.scale = values.scale;
      state.nodeSize.domain = values.domain;
      state.updateNodeAttrNotifier();
    }
  );
}


function nodeLabelControlBox(selection, state) {
  // nodeLabel.visible
  selection.append('div')
      .classed('mb-3', true)
    .append('div')
      .classed('visible', true)
      .call(box.checkBox, 'label-visible', 'Show node labels', state.nodeLabel.visible);
  // nodeLabel
  const labelGroup = selection.append('div')
      .classed('mb-3', true);
  labelGroup.append('div')
      .classed('text', true)
      .call(
        box.selectBox, 'label-text', 'Text field',
        state.nodeFields.filter(e => def.sortType(e.format) !== 'none'),
        state.nodeLabel.text || ''
      );
  labelGroup.append('div')
      .classed('size', true)
      .call(
        box.numberBox, 'label-size', 'Font size', 6, 100, 1, state.nodeLabel.size
      );
  // nodeLabelColor
  selection.append('div')
      .classed('mb-3', true)
      .classed('field', true)
      .call(
        box.selectBox, 'label-field', 'Color field',
        state.nodeFields.filter(e => def.sortType(e.format) !== 'none'),
        state.nodeLabelColor.field || ''
      );
  selection.append('div')
      .classed('range', true)
      .call(
        group.colorRangeGroup, 'label', scaledef.colorPalettes,
        scaledef.colorRangeTypes, state.nodeLabelColor.range
      );
  selection.append('div')
      .classed('scale', true)
      .call(
        group.scaleBoxGroup, 'label', scaledef.presets,
        scaledef.types.filter(e => e.key !== 'ordinal'),
        state.nodeLabelColor.scale, state.nodeLabelColor.domain
      );
  selection.call(updateNodeLabelControlBox, state);
}


function updateNodeLabelControlBox(selection, state) {
  // nodeLabel.visible
  selection.select('.visible')
      .call(box.updateCheckBox, state.nodeLabel.visible)
      .on('change', function () {
        state.nodeLabel.visible = box.checkBoxValue(d3.select(this));
        state.updateNodeAttrNotifier();
      });
  // nodeLabel
  selection.select('.text')
      .call(box.updateSelectBox, state.nodeLabel.text)
      .on('change', function () {
        state.nodeLabel.text = box.selectBoxValue(d3.select(this));
        state.updateNodeAttrNotifier();
      });
  selection.select('.size')
      .call(box.updateNumberBox, state.nodeLabel.size)
      .on('change', function () {
        state.nodeLabel.size = box.numberBoxValue(d3.select(this));
        state.updateNodeAttrNotifier();
      });
  // nodeLabelColor
  selection.select('.field')
      .call(box.updateSelectBox, state.nodeLabelColor.field)
      .on('change', function () {
        state.nodeLabelColor.field = box.selectBoxValue(d3.select(this));
        state.updateNodeAttrNotifier();
      });
  selection.select('.range')
      .call(group.updateColorRangeGroup, state.nodeLabelColor.range)
      .on('change', function () {
        const values = group.colorRangeGroupValue(d3.select(this));
        state.nodeLabelColor.range = values;
        if (values.length > 3) {
          state.nodeLabelColor.scale = 'ordinal';
          selection.select('.scale').selectAll('select,input')
            .property('disabled', true)
            .style('opacity', 0.3);
        } else {
          state.nodeLabelColor.scale = box.selectBoxValue(selection.select('.range'));
          selection.select('.scale').selectAll('select,input')
            .property('disabled', false)
            .style('opacity', null);
        }
        state.updateNodeAttrNotifier();
      });
  selection.select('.scale')
      .call(
        group.updateScaleBoxGroup, state.nodeLabelColor.scale,
        state.nodeLabelColor.domain
      )
      .on('change', function () {
        const values = group.scaleBoxGroupValue(d3.select(this));
        state.nodeLabelColor.scale = values.scale;
        state.nodeLabelColor.domain = values.domain;
        state.updateNodeAttrNotifier();
      }
    );
}


function edgeControlBox(selection, state) {
  // edgeLabel
  const labelGroup = selection.append('div')
      .classed('mb-3', true);
  labelGroup.append('div')
      .classed('label', true)
      .call(
        box.checkBox, 'edge-label-visible', 'Show edge weight label',
        state.edgeLabel.visible
      );
  labelGroup.append('div')
      .classed('size', true)
      .call(
        box.numberBox, 'edge-label-size', 'Weight label font size',
        6, 100, 1, state.edgeLabel.size
      );
  // edgeWidth
  const widthGroup = selection.append('div')
      .classed('mb-3', true);
  widthGroup.append('div')
      .classed('range', true)
      .call(box.rangeBox, 'edge-width-range', 'Range', state.edgeWidth.range);
  widthGroup.append('div')
      .classed('scale', true)
      .call(
        box.selectBox, 'edge-width-scale', 'Scale type',
        scaledef.types.filter(e => e.key !== 'ordinal'), state.edgeWidth.scale
      );
  widthGroup.append('div')
      .classed('domain', true)
      .call(box.rangeBox, 'edge-width-domain', 'Domain', state.edgeWidth.domain);
}

function updateEdgeControlBox(selection, state) {
  // edgeLabel
  selection.select('.label')
      .call(box.updateCheckBox, state.edgeLabel.visible)
      .on('change', function () {
        state.edgeLabel.visible = box.checkBoxValue(d3.select(this));
        state.updateEdgeAttrNotifier();
      });
  selection.select('.size')
      .call(box.updateNumberBox, state.edgeLabel.size)
      .on('change', function () {
        state.edgeLabel.size = box.numberBoxValue(d3.select(this));
        state.updateEdgeAttrNotifier();
      });
  // edgeWidth
  selection.select('.range')
      .call(box.updateRangeBox, state.edgeWidth.range)
      .on('change', function () {
        state.edgeWidth.range = box.rangeBoxValue(d3.select(this));
        state.updateEdgeAttrNotifier();
      });
  selection.select('.scale')
      .call(box.updateSelectBox, state.edgeWidth.scale)
      .on('change', function () {
        state.edgeWidth.scale = box.selectBoxValue(d3.select(this));
        state.updateEdgeAttrNotifier();
      });
  selection.select('.domain')
      .call(box.updateRangeBox, state.edgeWidth.domain)
      .on('change', function () {
        state.edgeWidth.domain = box.rangeBoxValue(d3.select(this));
        state.updateEdgeAttrNotifier();
      });
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
      .attr('id', id)
      .attr('role', 'tabpanel')
      .attr('aria-labelledby', `${id}-tab`);
}


function controlBox(selection, state) {
  if (selection.select('nav').size()) {
    selection.select('nav').remove();
  }
  if (selection.select('.tab-content').size()) {
    selection.select('.tab-content').remove();
  }
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

  // Edge
  tabs.append('a')
      .call(controlBoxNav, 'control-edge', 'Edge');
  content.append('div')
      .classed('control-edge', true)
      .call(controlBoxItem, 'control-edge')
      .call(edgeControlBox, state);

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
  selection.select('.control-edge')
      .call(updateEdgeControlBox, state);
}


export default {
  controlBox
};
