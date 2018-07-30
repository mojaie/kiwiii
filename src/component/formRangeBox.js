
/** @module component/formRangeBox */

import d3 from 'd3';


/**
 * Render range box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function rangeBox(selection, label) {
  selection
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .classed('mb-1', true)
      .text(label);
  const f = selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-4', true)
      .classed('mb-1', true);
  f.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .text('min');
  f.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('min', true)
      .attr('type', 'text');
  const t = selection.append('div')
      .classed('form-group', true)
      .classed('col-4', true)
      .classed('mb-1', true);
  t.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .text('max');
  t.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('max', true)
      .attr('type', 'text');
}


function updateRangeBox(selection, range) {
  selection.select('.min').property('value', range[0]);
  selection.select('.max').property('value', range[1]);
  selection.selectAll('.min,.max')
    .on('input', function () {
      if (!rangeBoxValid(selection)) {
        d3.event.stopPropagation();
      }
    })
    .dispatch('input', {bubbles: true});
}


function rangeBoxValid(selection) {
  const min = selection.select('.min').property('value');
  const max = selection.select('.max').property('value');
  const valid = v => v !== '' && !isNaN(v);
  selection.select('.min')
      .style('background-color', valid(min) ? '#ffffff' : '#ffcccc');
  selection.select('.max')
      .style('background-color', valid(max) ? '#ffffff' : '#ffcccc');
  return valid(min) && valid(max);
}


function rangeBoxValues(selection) {
  return [
    parseFloat(selection.select('.min').property('value')),
    parseFloat(selection.select('.max').property('value'))
  ];
}


/**
 * Render color scale box components
 * @param {d3.selection} selection - selection of box container (div element)
 */
function colorRangeBox(selection, label) {
  selection
      .classed('form-row', true)
      .classed('align-items-center', true);
  selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-3', true)
      .classed('mb-1', true)
      .text(label);
  const f = selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-3', true)
      .classed('mb-1', true);
  f.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .text('min');
  f.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('min', true)
      .attr('type', 'color');
  const m = selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-3', true)
      .classed('mb-1', true);
  m.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .text('mid');
  m.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('mid', true)
      .attr('type', 'color');
  const t = selection.append('div')
      .classed('form-group', true)
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('col-3', true)
      .classed('mb-1', true);
  t.append('label')
      .classed('col-form-label', true)
      .classed('col-form-label-sm', true)
      .classed('py-0', true)
      .text('max');
  t.append('input')
      .classed('form-control', true)
      .classed('form-control-sm', true)
      .classed('max', true)
      .attr('type', 'color');
  selection
      .on('change', () => {
        // avoid update by mousemove on the colorpicker
        d3.event.stopPropagation();
      });
}


function updateColorRangeBox(selection, range) {
  selection.select('.min').property('value', range[0]);
  selection.select('.mid').property('value', range[1]);
  selection.select('.max').property('value', range[2]);
}


function colorRangeBoxValues(selection) {
  return [
    selection.select('.min').property('value'),
    selection.select('.mid').property('value'),
    selection.select('.max').property('value')
  ];
}


export default {
  rangeBox, updateRangeBox, rangeBoxValues, rangeBoxValid,
  colorRangeBox, updateColorRangeBox, colorRangeBoxValues
};
