
/** @module common/scale */

import d3 from 'd3';


const colorScales = [
  {key: 'monoblack', type: 'monocolor', colors: ['#333333'], unknown: '#333333'},
  {key: 'monogray', type: 'monocolor', colors: ['#cccccc'], unknown: '#cccccc'},
  {key: 'nodeDefault', type: 'monocolor', colors: ['#7fffd4'], unknown: '#7fffd4'},
  {key: 'aquamarine', type: 'bicolor',
   colors: ['#778899', '#7fffd4'], unknown: '#f0f0f0'},
  {key: 'chartreuse', type: 'bicolor',
   colors: ['#778899', '#7fff00'], unknown: '#f0f0f0'},
  {key: 'salmon', type: 'bicolor',
   colors: ['#778899', '#fa8072'], unknown: '#f0f0f0'},
  {key: 'violet', type: 'bicolor',
   colors: ['#778899', '#ee82ee'], unknown: '#f0f0f0'},
  {key: 'temperature', type: 'tricolor',
   colors: ['#87ceeb', '#fff5ee', '#fa8072'], unknown: '#f0f0f0'},
  {key: 'spectrum', type: 'tricolor',
   colors: ['#6495ed', '#ccff66', '#ffa500'], unknown: '#f0f0f0'},
  {key: 'category10', type: 'categorical',
   colors: ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462',
    '#b3de69','#fccde5','#bc80bd','#ccebc5'], unknown: '#f0f0f0'},
  {key: 'cbsafe', type: 'categorical',
   colors: ['#543005','#8c510a','#bf812d','#dfc27d','#f6e8c3','#c7eae5',
   '#80cdc1','#35978f','#01665e','#003c30'], unknown: '#f0f0f0'},
  {key: 'category20', type: 'categorical',
   colors: d3.schemePaired.concat(d3.schemeSet2), unknown: '#f0f0f0'},
  {key: 'category40', type: 'categorical',
   colors: d3.schemePaired.concat(d3.schemePastel2, d3.schemeSet2, d3.schemeSet3),
   unknown: '#f0f0f0'},
  {key: 'custom', type: 'custom', colors: ['#ffffff'], text: 'custom'}
];


const types = [
  {key: 'linear', name: 'Linear', func: d3.scaleLinear},
  {key: 'log', name: 'Log', func: d3.scaleLog},
  {key: 'quantize', name: 'Quantize', func: d3.scaleQuantize},
  {key: 'ordinal', name: 'Ordinal', func: d3.scaleOrdinal}
];


function scaleFunction(state) {
  const cscale = colorScales.find(e => e.key === state.color);
  let range;
  let unknown;
  if (cscale && cscale.key !== 'custom') {
      range = cscale.colors;
      unknown = cscale.unknown;
  } else {
    range = state.range;
    unknown = state.unknown;
  }
  let domain = null;
  if (range.length === 3) {
    const mid = (parseFloat(state.domain[0]) + parseFloat(state.domain[1])) / 2;
    domain = [state.domain[0], mid, state.domain[1]];
  } else {
    domain = state.domain;
  }
  // Build
  let scaleFunc = types.find(e => e.key === state.scale).func();
  scaleFunc = scaleFunc.domain(domain);
  scaleFunc = scaleFunc.range(range);
  if (['linear', 'log'].includes(state.scale)) {
    scaleFunc = scaleFunc.clamp(true);
  }

  return d => {
    // Sanitize
    if (d === '' || typeof d === 'undefined' || d === null) {
      return unknown;  // invalid values
    }
    if (['linear', 'log'].includes(state.scale) && parseFloat(d) != d) {
      return unknown;  // texts
    }
    if (state.scale === 'log' && d <= 0) {
      return unknown;  // negative values in log scale
    }
    // Apply function
    const result = scaleFunc(d);
    if (result === undefined) {
      return unknown;  // TODO: specify unexpected behavior
    }
    return result;
  };
}


function isD3Format(notation) {
  try {
    d3.format(notation);
  } catch (err) {
    return false;
  }
  return true;
}


export default {
  colorScales, types, scaleFunction, isD3Format
};
