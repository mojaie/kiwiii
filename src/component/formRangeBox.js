
/** @module component/formRangeBox */

import d3 from 'd3';

import {default as badge} from './badge.js';


/**
 * Render range box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function rangeBox(selection, label) {
  selection
      .classed('form-row', true)
      .classed('form-group', true)
      .classed('align-items-center', true)
    .append('div')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .text(label);

  const minBox = selection.append('div');
  minBox.append('label').text('min');
  minBox.append('input').classed('min', true);

  const maxBox = selection.append('div');
  maxBox.append('label').text('max');
  maxBox.append('input').classed('max', true);

  selection.selectAll('div')
      .classed('form-group', true)
      .classed('col-4', true)
      .classed('mb-0', true);

  selection.selectAll('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true);

  selection.selectAll('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .attr('type', 'number');

  selection.append('div')
      .classed('col-4', true);
  selection.append('div')
      .call(badge.invalidFeedback)
      .classed('col-8', true);
}


function linearRange(selection, min, max, step) {
  selection.selectAll('.min, .max')
      .attr('min', min || null)
      .attr('max', max || null)
      .attr('step', step || null)
      .attr('required', 'required')
      .on('input', function () {
        const valid = linearValid(this, step);
        d3.select(this)
          .style('background-color', valid ? null : '#ffcccc');
        selection.select('.invalid-feedback')
          .style('display', linearRangeValid(selection) ? 'none': 'inherit');
      })
      .dispatch('input');
}


function logRange(selection) {
  selection.selectAll('.min, .max')
      .attr('required', 'required')
      .on('input', function () {
        const valid = logValid(this);
        d3.select(this)
          .style('background-color', valid ? null : '#ffcccc');
        selection.select('.invalid-feedback')
          .style('display', logRangeValid(selection) ? 'none': 'inherit');
      })
      .dispatch('input');
}


function updateRangeValues(selection, range) {
  selection.select('.min').property('value', range[0]);
  selection.select('.max').property('value', range[1]);
  selection.selectAll('.min,.max')
      .dispatch('input', {bubbles: true});
}


function linearValid(node, step) {
  // If step is not specified, accept stepMismatch
  const stepm = step ? false : node.validity.stepMismatch;
  return  node.checkValidity() || stepm;
}


function linearRangeValid(selection) {
  const step = selection.select('.min').attr('step');
  const minValid = linearValid(selection.select('.min').node(), step);
  const maxValid = linearValid(selection.select('.max').node(), step);
  return minValid && maxValid;
}


function logValid(node) {
  // Accept stepMismatch
  const stepm = node.validity.stepMismatch;
  return (node.checkValidity() || stepm) && node.value > 0;
}


function logRangeValid(selection) {
  const minPos = logValid(selection.select('.min').node());
  const maxPos = logValid(selection.select('.max').node());
  return linearRangeValid(selection) && minPos && maxPos;
}


function rangeValues(selection) {
  return [
    selection.select('.min').property('value'),
    selection.select('.max').property('value')
  ];
}


/**
 * Render color scale box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function colorRangeBox(selection, label) {
  selection
      .classed('form-row', true)
      .classed('form-group', true)
      .classed('align-items-center', true);
  selection.append('div')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .text(label);

  const minBox = selection.append('div');
  minBox.append('label').text('min');
  minBox.append('input').classed('min', true);

  const midBox = selection.append('div');
  midBox.append('label').text('mid');
  midBox.append('input').classed('mid', true);

  const maxBox = selection.append('div');
  maxBox.append('label').text('max');
  maxBox.append('input').classed('max', true);

  selection.on('change', () => {
    // avoid update by mousemove on the colorpicker
    d3.event.stopPropagation();
  });

  selection.selectAll('div')
      .classed('form-group', true)
      .classed('col-3', true)
      .classed('mb-0', true);

  selection.selectAll('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true);

  selection.selectAll('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .attr('type', 'color');
}


function updateColorRangeValues(selection, range) {
  selection.select('.min').property('value', range[0]);
  selection.select('.mid').property('value', range[1]);
  selection.select('.max').property('value', range[2]);
}


function colorRangeValues(selection) {
  return [
    selection.select('.min').property('value'),
    selection.select('.mid').property('value'),
    selection.select('.max').property('value')
  ];
}


export default {
  rangeBox, linearRange, logRange, updateRangeValues,
  rangeValues, linearRangeValid, logRangeValid,
  colorRangeBox, updateColorRangeValues, colorRangeValues
};
