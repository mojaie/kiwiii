
/** @module component/controlBoxGroup */

import d3 from 'd3';

import {default as box} from '../component/formBox.js';
import {default as scaledef} from '../helper/scale.js';


/**
 * Render color range control box group
 * @param {d3.selection} selection - selection of box container (div element)
 */
function colorRangeGroup(selection, id, palettes, rangeTypes, range) {
  selection
      .classed('mb-4', true);
  selection.append('div')
      .classed('palette', true)
      .call(box.selectBox, `${id}-palette`, 'Color palette', palettes, 'hoge');
  selection.append('div')
      .classed('rangetype', true)
      .call(
        box.selectBox, `${id}-rangetype`, 'Range type', rangeTypes,
        scaledef.colorRangeTypes.find(e => e.size === range.length).key
      );
  selection.append('div')
      .classed('range', true)
      .call(box.colorScaleBox, `${id}-range`, 'Range', range);
  selection.call(updateColorRangeGroup, range);
}


function updateColorRangeGroup(selection, range) {
  selection.select('.palette')
      .call(
        box.updateSelectBox,
        scaledef.colorRangeTypes.find(e => e.size === range.length).key
      )
      .on('change', function () {
        const value = box.selectBoxValue(d3.select(this));
        const p = scaledef.colorPalettes.find(e => e.key === value);
        const t = scaledef.colorRangeTypes.find(e => e.size === p.range.length);
        selection.select('.rangetype').call(box.updateSelectBox, t.key);
        selection.select('.range').call(box.updateColorScaleBox, p.range);
      });
  selection.select('.rangetype')
      .on('change', function () {
        const value = box.selectBoxValue(d3.select(this));
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
      .call(box.updateColorScaleBox, range)
      .on('focusin', () => {
        selection.dispatch('change');
      });
}


function colorRangeGroupValue(selection) {
  const type = box.selectBoxValue(selection.select('.rangetype'));
  const values = box.colorScaleBoxValue(selection.select('.range'));
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
      .classed('mb-4', true);
  selection.append('div')
      .classed('preset', true)
      .call(box.selectBox, `${id}-preset`, 'Scale preset', presets, '');
  selection.append('div')
      .classed('scale', true)
      .call(box.selectBox, `${id}-scale`, 'Scale type', scaleTypes, scale);
  selection.append('div')
      .classed('domain', true)
      .call(box.rangeBox, `${id}-domain`, 'Domain', domain);
  selection.call(updateScaleBoxGroup, scale, domain);
}


function updateScaleBoxGroup(selection, scale, domain) {
  selection.select('.preset')
    .on('change', function () {
      const value = box.selectBoxValue(d3.select(this));
      const p = scaledef.presets.find(e => e.key == value);
      selection.select('.scale').call(box.updateSelectBox, p.scale);
      selection.select('.domain').call(box.updateRangeBox, p.domain);
    });
  selection.select('.scale')
      .call(box.updateSelectBox, scale)
      .on('change', () => {
        selection.select('.domain').dispatch('change');
      });
  selection.select('.domain')
      .call(box.updateRangeBox, domain)
      .on('change', function () {
        const isLog = box.selectBoxValue(selection.select('.scale')) === 'log';
        const domain = box.rangeBoxValue(d3.select(this));
        const invalid = d => isNaN(d) || (isLog && d <= 0);
        d3.select(this).select('.min')
            .style('background-color', invalid(domain[0]) ? '#ffcccc' : '#ffffff');
        d3.select(this).select('.max')
            .style('background-color', invalid(domain[1]) ? '#ffcccc' : '#ffffff');
      });
}


function scaleBoxGroupValue(selection) {
  const scale = box.selectBoxValue(selection.select('.scale'));
  const domain = box.rangeBoxValue(selection.select('.domain'));
  return {scale: scale, domain: domain};
}


export default {
  colorRangeGroup, updateColorRangeGroup, colorRangeGroupValue,
  scaleBoxGroup, updateScaleBoxGroup, scaleBoxGroupValue
};
