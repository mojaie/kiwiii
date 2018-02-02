
/** @module component/formBoxGroup */

import d3 from 'd3';

import {default as lbox} from '../component/formListBox.js';
import {default as rbox} from '../component/formRangeBox.js';
import {default as scaledef} from '../common/scale.js';


/**
 * Render color range control box group
 * @param {d3.selection} selection - selection of box container (div element)
 */
function colorRangeGroup(selection, id, palettes, rangeTypes, range) {
  selection
      .classed('mb-3', true);
  selection.append('div')
      .classed('palette', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, `${id}-palette`, 'Color palette', palettes, 'hoge');
  selection.append('div')
      .classed('rangetype', true)
      .classed('mb-1', true)
      .call(
        lbox.selectBox, `${id}-rangetype`, 'Range type', rangeTypes,
        scaledef.colorRangeTypes.find(e => e.size === range.length).key
      );
  selection.append('div')
      .classed('range', true)
      .classed('mb-1', true)
      .call(rbox.colorScaleBox, `${id}-range`, 'Range', range);
  selection.call(updateColorRangeGroup, range);
}


function updateColorRangeGroup(selection, range) {
  selection.select('.palette')
      .call(
        lbox.updateSelectBox,
        scaledef.colorRangeTypes.find(e => e.size === range.length).key
      )
      .on('change', function () {
        const value = lbox.selectBoxValue(d3.select(this));
        const p = scaledef.colorPalettes.find(e => e.key === value);
        const t = scaledef.colorRangeTypes.find(e => e.size === p.range.length);
        selection.select('.rangetype').call(lbox.updateSelectBox, t.key);
        selection.select('.range').call(rbox.updateColorScaleBox, p.range);
      });
  selection.select('.rangetype')
      .on('change', function () {
        const value = lbox.selectBoxValue(d3.select(this));
        const size = scaledef.colorRangeTypes.find(e => e.key === value).size;
        selection.select('.range').select('.min')
            .property('disabled', size > 3)
            .style('opacity', size <= 3 ? null : 0.3);
        selection.select('.range').select('.mid')
            .property('disabled', size !== 3)
            .style('opacity', size === 3 ? null : 0.3);
        selection.select('.range').select('.max')
            .property('disabled', size > 3)
            .style('opacity', size <= 3 ? null : 0.3);
      });
  selection.select('.range')
      .call(rbox.updateColorScaleBox, range)
      .on('focusin', () => {
        selection.dispatch('change');
      });
}


function colorRangeGroupValue(selection) {
  const type = lbox.selectBoxValue(selection.select('.rangetype'));
  const values = rbox.colorScaleBoxValue(selection.select('.range'));
  if (!values.length) {
    return scaledef.colorRangeTypes.find(e => e.key === type).range;
  } else {
    return values;
  }
}


/**
 * Render scale and domain control box group
 * @param {d3.selection} selection - selection of box container (div element)
 */
function scaleBoxGroup(selection, id, presets, scaleTypes, scale, domain) {
  selection
      .classed('mb-3', true);
  selection.append('div')
      .classed('preset', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, `${id}-preset`, 'Scale preset', presets, '');
  selection.append('div')
      .classed('scale', true)
      .classed('mb-1', true)
      .call(lbox.selectBox, `${id}-scale`, 'Scale type', scaleTypes, scale);
  selection.append('div')
      .classed('domain', true)
      .classed('mb-1', true)
      .call(rbox.rangeBox, `${id}-domain`, 'Domain', domain);
  selection.call(updateScaleBoxGroup, scale, domain);
}


function updateScaleBoxGroup(selection, scale, domain) {
  selection.select('.preset')
    .on('change', function () {
      const value = lbox.selectBoxValue(d3.select(this));
      const p = scaledef.presets.find(e => e.key == value);
      selection.select('.scale').call(lbox.updateSelectBox, p.scale);
      selection.select('.domain').call(rbox.updateRangeBox, p.domain);
    });
  selection.select('.scale')
      .call(lbox.updateSelectBox, scale)
      .on('change', () => {
        selection.select('.domain').dispatch('change');
      });
  selection.select('.domain')
      .call(rbox.updateRangeBox, domain)
      .on('change', function () {
        const isLog = lbox.selectBoxValue(selection.select('.scale')) === 'log';
        const domain = rbox.rangeBoxValue(d3.select(this));
        const invalid = d => isNaN(d) || (isLog && d <= 0);
        d3.select(this).select('.min')
            .style('background-color', invalid(domain[0]) ? '#ffcccc' : '#ffffff');
        d3.select(this).select('.max')
            .style('background-color', invalid(domain[1]) ? '#ffcccc' : '#ffffff');
      });
}


function scaleBoxGroupValue(selection) {
  const scale = lbox.selectBoxValue(selection.select('.scale'));
  const domain = rbox.rangeBoxValue(selection.select('.domain'));
  return {scale: scale, domain: domain};
}


export default {
  colorRangeGroup, updateColorRangeGroup, colorRangeGroupValue,
  scaleBoxGroup, updateScaleBoxGroup, scaleBoxGroupValue
};
