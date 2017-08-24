
import d3 from 'd3';

const categoryMany = d3.schemeSet1
  .concat(d3.schemeSet3, d3.schemePastel2, d3.schemeSet2);
const defaultSizeRange = [20, 80];

export const colorPresets = [
  {
    name: 'Activity',
    scale: {
      scale: 'log',
      domain: [1e-4, 1e-6],
      range: ['#708090', '#7fffd4'],
      unknown: '#696969'
    }
  },
  {
    name: 'Percent',
    scale: {
      scale: 'linear',
      domain: [0, 100],
      range: ['#708090', '#7fffd4'],
      unknown: '#696969'
    }
  },
  {
    name: 'True or False',
    scale: {
      scale: 'quantize',
      domain: [1, 0],
      range: ['#708090', '#7fffd4'],
      unknown: '#696969'
    }
  },
  {
    name: 'LogP',
    scale: {
      scale: 'linear',
      domain: [-2, 8],
      range: ['#6495ed', '#ccff66', '#ffa500'],
      unknown: '#696969'
    }
  },
  {
    name: 'Categories',
    scale: {
      scale: 'ordinal',
      range: d3.schemeCategory20,
      unknown: '#dedede'
    }
  },
  {
    name: 'ManyCategories',
    scale: {
      scale: 'ordinal',
      range: categoryMany,
      unknown: '#dedede'
    }
  }
];

export const sizePresets = [
  {
    name: 'Activity',
    scale: {
      scale: 'log',
      domain: [1e-4, 1e-6],
      range: defaultSizeRange,
      unknown: defaultSizeRange[0]
    }
  },
  {
    name: 'Percent',
    scale: {
      scale: 'linear',
      domain: [0, 100],
      range: defaultSizeRange,
      unknown: defaultSizeRange[0]
    }
  },
  {
    name: 'True or False',
    scale: {
      scale: 'quantize',
      domain: [1, 0],
      range: defaultSizeRange,
      unknown: defaultSizeRange[0]
    }
  },
  {
    name: 'LogP',
    scale: {
      scale: 'linear',
      domain: [-2, 6],
      range: defaultSizeRange,
      unknown: defaultSizeRange[0]
    }
  }
];

export const edgeWidthPresets = [
  {
    name: 'Universal',
    scale: {
      scale: 'linear',
      domain: [0.3, 1],
      range: [0.5, 5],
      unknown: 1
    }
  },
  {
    name: 'Thin',
    scale: {
      scale: 'linear',
      domain: [0.5, 1],
      range: [0.5, 3],
      unknown: 1
    }
  },
  {
    name: 'Amplified',
    scale: {
      scale: 'linear',
      domain: [0.5, 1],
      range: [1, 10],
      unknown: 1
    }
  }
];

export const colorPalette = [
  {name: 'Aquamarine', range: ['#778899', '#7fffd4'], unknown: '#696969'},
  {name: 'Chartreuse', range: ['#778899', '#7fff00'], unknown: '#696969'},
  {name: 'Salmon', range: ['#778899', '#fa8072'], unknown: '#696969'},
  {name: 'Violet', range: ['#778899', '#ee82ee'], unknown: '#696969'},
  {name: 'blue-red', range: ['#87ceeb', '#fff5ee', '#fa8072'], unknown: '#696969'},
  {name: 'Spectrum', range: ['#6495ed', '#ccff66', '#ffa500'], unknown: '#696969'}
];

export const scaleTypes = [
  {name: 'linear', func: d3.scaleLinear()},
  {name: 'log', func: d3.scaleLog()},
  {name: 'quantize', func: d3.scaleQuantize()},
  {name: 'ordinal', func: d3.scaleOrdinal()}
];

export const sizeScaleTypes = [
  {name: 'linear', func: d3.scaleLinear()},
  {name: 'log', func: d3.scaleLog()},
  {name: 'quantize', func: d3.scaleQuantize()}
];

export function scaleFunction(scale) {
  let sf = scaleTypes.find(e => e.name === scale.scale).func;
  let domain = scale.domain;
  if (scale.range.length === 3) {
    const mid = (parseFloat(scale.domain[0]) + parseFloat(scale.domain[1])) / 2;
    domain = [scale.domain[0], mid, scale.domain[1]];
  }
  if (scale.scale !== 'ordinal') {
    sf = sf.domain(domain);
  }
  sf = sf.range(scale.range);
  if (['linear', 'log'].includes(scale.scale)) {
    sf = sf.clamp(true);
  }
  return d => {
    if (d === '' || typeof d === 'undefined' || d === null) {
      return scale.unknown;
    }
    if (scale.scale !== 'ordinal' && parseFloat(d) != d) {
      return scale.unknown;
    }
    if (scale.scale === 'log' && d <= 0) {
      return scale.unknown;
    }
    const result = sf(d);
    if (result === undefined) {
      return scale.unknown;
    }
    return result;
  };
}
