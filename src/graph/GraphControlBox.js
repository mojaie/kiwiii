
import d3 from 'd3';
import {default as d3scale} from '../helper/d3Scale.js';
import {default as d3form} from '../helper/d3Form.js';
import {default as fmt} from '../helper/formatValue.js';
import {default as cmp} from '../component/Component.js';



// Get data

function colorControlInput(id) {
  const data = {
    id: id,
    field: d3form.optionData(`#${id}-col`)
  };
  const preset = d3form.optionData(`#${id}-preset`);
  if (preset.scale.scale === 'ordinal') {
    data.scale = preset.scale;
    return data;
  }
  data.scale = {
    scale: d3form.value(`#${id}-scaletype`),
    domain: [
      d3form.value(`#${id}-domain-from`),
      d3form.value(`#${id}-domain-to`)
    ],
    unknown: '#696969'
  };
  const range = [d3form.value(`#${id}-range-from`)];
  if (d3form.checked(`#${id}-range-enable-mid`)) {
    range.push(d3form.value(`#${id}-range-mid`));
  }
  range.push(d3form.value(`#${id}-range-to`));
  data.scale.range = range;
  return data;
}


function labelControlInput() {
  const data = colorControlInput('label');
  data.text = d3form.optionData('#label-text');
  data.size = d3form.value('#label-size');
  data.visible = d3form.checked('#label-visible');
  return data;
}


function sizeControlInput(id) {
  return {
    id: id,
    scale: {
      scale: d3form.value(`#${id}-scaletype`),
      domain: [
        d3form.value(`#${id}-domain-from`),
        d3form.value(`#${id}-domain-to`)
      ],
      range: [
        d3form.value(`#${id}-range-from`),
        d3form.value(`#${id}-range-to`)
      ],
      unknown: 10
    }
  };
}


function nodeSizeControlInput() {
  const data = sizeControlInput('size');
  data.field = d3form.optionData('#size-col');
  return data;
}


function nodeContentInput() {
  return {
    structure: {
      visible: d3form.checked('#show-struct')
    }
  };
}


function edgeControlInput() {
  const data = sizeControlInput('edge');
  data.visible = d3form.checked('#edge-visible');
  data.label = {
    size: d3form.value('#edge-label-size'),
    visible: d3form.checked('#edge-label-visible')
  };
  return data;
}


// Update DOM attributes

function updateNodeColor(data) {
  d3.selectAll('.node').select('.node-symbol')
    .style('fill', d =>
      d3scale.scaleFunction(data.scale)(data.field ? d[data.field.key] : null)
    );
}


function updateNodeSize(data) {
  d3.selectAll('.node').select('.node-symbol')
    .attr('r', d =>
      d3scale.scaleFunction(data.scale)(data.field ? d[data.field.key] : null));
}


function updateNodeLabelVisibility(visible) {
  d3.selectAll('.node').select('.node-label')
    .attr('visibility', visible ? 'inherit' : 'hidden');
}


function updateNodeLabel(data) {
  if (!data.hasOwnProperty(data.text)) return;
  d3.selectAll('.node').select('.node-label')
    .text(d => {
      if (!d.hasOwnProperty(data.text.key)) return '';
      if (data.text.digit === 'raw') return d[data.text.key];
      return fmt.formatNum(d[data.text.key], data.text.digit);
    })
    .attr('font-size', data.size)
    .attr('visibility', data.visible ? 'inherit' : 'hidden')
    .style('fill', d =>
      d3scale.scaleFunction(data.scale)(data.field ? d[data.field.key] : null));
}


function updateNodeStructure(data) {
  d3.selectAll('.node').select('.node-struct')
    .attr('visibility', data.structure.visible ? 'inherit' : 'hidden')
    .each((d, i, nds) => {
      const w = d3.select(nds[i]).select('svg').attr('width');
      const h = d3.select(nds[i]).select('svg').attr('height');
      d3.select(nds[i]).attr('transform', `translate(${-w / 2},${-h / 2})`);
    });
}


function updateNodeImage(data) {
  updateNodeSize(data.nodeSize);
  updateNodeColor(data.nodeColor);
  updateNodeLabel(data.nodeLabel);
  updateNodeStructure(data.nodeContent);
}


function updateEdgeVisibility(visible) {
  d3.selectAll('.link').select('.edge-line')
    .attr('visibility', visible ? 'inherit' : 'hidden');
}


function updateEdgeLabelVisibility(visible) {
  d3.selectAll('.link').select('.edge-label')
    .attr('visibility', visible ? 'inherit' : 'hidden');
}


function updateEdge(data) {
  d3.selectAll('.link').select('.edge-line')
    .style('stroke-width', d => d3scale.scaleFunction(data.scale)(d.weight));
  d3.selectAll('.link').select('.edge-label')
    .attr('font-size', data.label.size);
  updateEdgeVisibility(data.visible);
  updateEdgeLabelVisibility(data.label.visible);
}


function updateRange(range, id) {
  if (range.length === 2) {
    d3.select(`#${id}-range-from`).property('value', range[0]);
    d3.select(`#${id}-range-enable-mid`).attr('checked', null);
    d3.select(`#${id}-range-mid`).attr('disabled','disabled');
    d3.select(`#${id}-range-to`).property('value', range[1]);
    d3.selectAll(`#${id}-range input`).attr('disabled', null);
  } else if (range.length === 3) {
    d3.select(`#${id}-range-from`).property('value', range[0]);
    d3.select(`#${id}-range-enable-mid`).attr('checked', 'checked');
    d3.select(`#${id}-range-mid`).property('value', range[1]);
    d3.select(`#${id}-range-to`).property('value', range[2]);
    d3.selectAll(`#${id}-range input`).attr('disabled', null);
  } else {
    d3.selectAll(`#${id}-range input`).attr('disabled', 'disabled');
  }
}


function updateScale(scale, id) {
  d3.select(`#${id}-scaletype`).property('value', scale.scale);
  const hasDomain = scale.hasOwnProperty('domain');
  d3.selectAll(`#${id}-domain input`)
    .attr('disabled', hasDomain ? null : 'disabled');
  if (hasDomain) {
    d3.select(`#${id}-domain-from`).property('value', scale.domain[0]);
    d3.select(`#${id}-domain-to`).property('value', scale.domain[1]);
  }
  updateRange(scale.range, id);
}


function updateControl(data) {
  const id = data.id;
  d3.select(`#${id}-visible`).attr('checked', data.visible ? 'checked' : null);
  d3.select(`#${id}-size`).property('value', data.size);
  d3.select(`#${id}-text`).property('value', data.text ? data.text.key : null);
  d3.select(`#${id}-col`).property('value', data.field ? data.field.key : null);
  if (data.hasOwnProperty('label')) {
    d3.select(`#${id}-label-visible`)
      .attr('checked', data.label.visible ? 'checked' : null);
    d3.select(`#${id}-label-size`).property('value', data.label.size);
  }
  updateScale(data.scale, data.id);
}



// Generate controlBox elements

function mainControlBox() {
  d3.select('#show-struct')
    .on('change', function () {
      const data = nodeContentInput();
      d3.select('#main-control').datum(data);
      updateNodeStructure(data);
    })
    .dispatch('change');
}


function colorControlBox(fields, id) {
  d3.select(`#${id}-col`)
    .call(cmp.selectOptions, fields, d => d.key, d => d.name);
  d3.select(`#${id}-preset`)
    .call(cmp.selectOptions, d3scale.colorPresets, d => d.name, d => d.name)
    .on('change', function() {
      updateScale(d3form.optionData(this).scale, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-palette`)
    .call(cmp.selectOptions, d3scale.colorPalette, d => d.name, d => d.name)
    .on('change', function() {
      updateRange(d3form.optionData(this).range, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-scaletype`)
    .call(cmp.selectOptions, d3scale.scaleTypes, d => d.name, d => d.name);
}


function nodeColorControlBox(fields) {
  const textCols = fields.filter(e => e.sortType !== 'none');
  colorControlBox(textCols, 'color');
  d3.selectAll('.color-update')
    .on('change', () => {
      const data = colorControlInput('color');
      d3.select('#color-control').datum(data);
      updateControl(data);
      updateNodeColor(data);
    })
    .dispatch('change');
}


function nodeLabelControlBox(fields) {
  const textCols = fields.filter(e => e.sortType !== 'none');
  d3.select('#label-text')
    .call(cmp.selectOptions, textCols, d => d.key, d => d.name);
  colorControlBox(textCols, 'label');
  d3.select('#label-visible')
    .on('change', function() {
      updateNodeLabelVisibility(d3form.checked(this), 'label');
      d3.select(`.label-update`).dispatch('change');
    });
  d3.selectAll('.label-update')
    .on('change', () => {
      const data = labelControlInput();
      d3.select('#label-control').datum(data);
      updateControl(data);
      updateNodeLabel(data);
    })
    .dispatch('change');
}


function sizeControlBox(presets, id) {
  d3.select(`#${id}-preset`)
    .call(cmp.selectOptions, presets, d => d.name, d => d.name)
    .on('change', function() {
      updateScale(d3form.optionData(this).scale, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-scaletype`)
    .call(cmp.selectOptions, d3scale.sizeScaleTypes, d => d.name, d => d.name);
}


function nodeSizeControlBox(fields) {
  const numCols = fields.filter(e => e.sortType === 'numeric');
  d3.select(`#size-col`)
    .call(cmp.selectOptions, numCols, d => d.key, d => d.name);
  sizeControlBox(d3scale.sizePresets, 'size');
  d3.selectAll('.size-update')
    .on('change', () => {
      const data = nodeSizeControlInput('size');
      d3.select('#size-control').datum(data);
      updateControl(data);
      updateNodeSize(data);
    })
    .dispatch('change');
}


function edgeControlBox() {
  sizeControlBox(d3scale.edgeWidthPresets, 'edge');
  d3.select('#edge-visible')
    .on('change', function() {
      updateEdgeVisibility(d3form.checked(this));
      updateEdgeLabelVisibility(d3form.checked(this));
      d3.select(`.edge-update`).dispatch('change');
    });
  d3.select('#edge-label-visible')
    .on('change', function() {
      updateEdgeLabelVisibility(d3form.checked(this));
      d3.select(`.edge-update`).dispatch('change');
    });
  d3.selectAll('.edge-update')
    .on('change', () => {
      const data = edgeControlInput('edge');
      d3.select('#edge-control').datum(data);
      updateControl(data);
      updateEdge(data);
    })
    .dispatch('change');
}


export default {
  updateNodeStructure, updateNodeImage, updateEdge, updateControl,
  mainControlBox, nodeColorControlBox, nodeLabelControlBox, nodeSizeControlBox, edgeControlBox
};
