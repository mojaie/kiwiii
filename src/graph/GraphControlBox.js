
import d3 from 'd3';
import {
  colorPresets, sizePresets, edgeWidthPresets,
  colorPalette, scaleTypes, sizeScaleTypes, scaleFunction
} from '../helper/d3Scale.js';
import {formValue, formChecked, selectedOptionData} from '../helper/d3Selection.js';
import {formatNum} from '../helper/formatValue.js';
import {selectOptions} from '../component/Component.js';



// Get data

function colorControlInput(id) {
  const data = {
    id: id,
    column: selectedOptionData(`#${id}-col`)
  };
  const preset = selectedOptionData(`#${id}-preset`);
  if (preset.scale.scale === 'ordinal') {
    data.scale = preset.scale;
    return data;
  }
  data.scale = {
    scale: formValue(`#${id}-scaletype`),
    domain: [
      formValue(`#${id}-domain-from`),
      formValue(`#${id}-domain-to`)
    ],
    unknown: '#696969'
  };
  const range = [formValue(`#${id}-range-from`)];
  if (formChecked(`#${id}-range-enable-mid`)) {
    range.push(formValue(`#${id}-range-mid`));
  }
  range.push(formValue(`#${id}-range-to`));
  data.scale.range = range;
  return data;
}


function labelControlInput() {
  const data = colorControlInput('label');
  data.text = formValue('#label-text');
  data.size = formValue('#label-size');
  data.visible = formChecked('#label-visible');
  return data;
}


function sizeControlInput(id) {
  return {
    id: id,
    scale: {
      scale: formValue(`#${id}-scaletype`),
      domain: [
        formValue(`#${id}-domain-from`),
        formValue(`#${id}-domain-to`)
      ],
      range: [
        formValue(`#${id}-range-from`),
        formValue(`#${id}-range-to`)
      ],
      unknown: 10
    }
  };
}


function nodeSizeControlInput() {
  const data = sizeControlInput('size');
  data.column = selectedOptionData('#size-col');
  return data;
}


function nodeContentInput() {
  return {
    structure: {
      visible: formChecked('#show-struct')
    }
  };
}


function edgeControlInput() {
  const data = sizeControlInput('edge');
  data.visible = formChecked('#edge-visible');
  data.label = {
    size: formValue('#edge-label-size'),
    visible: formChecked('#edge-label-visible')
  };
  return data;
}


// Update DOM attributes

function updateNodeColor(data) {
  d3.selectAll('.node').select('.node-symbol')
    .style('fill', d => scaleFunction(data.scale)(d[data.column.key]));
}


function updateNodeSize(data) {
  d3.selectAll('.node').select('.node-symbol')
    .attr('r', d => scaleFunction(data.scale)(d[data.column.key]));
}


function updateNodeLabelVisibility(visible) {
  d3.selectAll('.node').select('.node-label')
    .attr('visibility', visible ? 'inherit' : 'hidden');
}


function updateNodeLabel(data) {
  d3.selectAll('.node').select('.node-label')
    .text(d => {
      if (!d.hasOwnProperty(data.text)) return '';
      if (!data.column.hasOwnProperty('digit') || data.column.digit === 'raw') return d[data.text];
      return formatNum(d[data.text], data.column.digit);
    })
    .attr('font-size', data.size)
    .attr('visibility', data.visible ? 'inherit' : 'hidden')
    .style('fill', d => scaleFunction(data.scale)(d[data.column.key]));
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
    .style('stroke-width', d => scaleFunction(data.scale)(d.weight));
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
  d3.select(`#${id}-text`).property('value', data.text);
  d3.select(`#${id}-size`).property('value', data.size);
  if (data.hasOwnProperty('column')) {
    d3.select(`#${id}-col`).property('value', data.column.key);
  }
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


function colorControlBox(columns, id) {
  d3.select(`#${id}-col`)
    .call(selectOptions, columns, d => d.key, d => d.name);
  d3.select(`#${id}-preset`)
    .call(selectOptions, colorPresets, d => d.name, d => d.name)
    .on('change', function() {
      updateScale(selectedOptionData(this).scale, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-palette`)
    .call(selectOptions, colorPalette, d => d.name, d => d.name)
    .on('change', function() {
      updateRange(selectedOptionData(this).range, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-scaletype`)
    .call(selectOptions, scaleTypes, d => d.name, d => d.name);
}


function nodeColorControlBox(columns) {
  const textCols = columns.filter(e => e.sort !== 'none');
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


function nodeLabelControlBox(columns) {
  const textCols = columns.filter(e => e.sort !== 'none');
  d3.select('#label-text')
    .call(selectOptions, textCols, d => d.key, d => d.name);
  colorControlBox(textCols, 'label');
  d3.select('#label-visible')
    .on('change', function() {
      updateNodeLabelVisibility(formChecked(this), 'label');
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
    .call(selectOptions, presets, d => d.name, d => d.name)
    .on('change', function() {
      updateScale(selectedOptionData(this).scale, id);
      d3.select(`.${id}-update`).dispatch('change');
    });
  d3.select(`#${id}-scaletype`)
    .call(selectOptions, sizeScaleTypes, d => d.name, d => d.name);
}


function nodeSizeControlBox(columns) {
  const numCols = columns.filter(e => e.sort === 'numeric');
  d3.select(`#size-col`)
    .call(selectOptions, numCols, d => d.key, d => d.name);
  sizeControlBox(sizePresets, 'size');
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
  sizeControlBox(edgeWidthPresets, 'edge');
  d3.select('#edge-visible')
    .on('change', function() {
      updateEdgeVisibility(formChecked(this));
      updateEdgeLabelVisibility(formChecked(this));
      d3.select(`.edge-update`).dispatch('change');
    });
  d3.select('#edge-label-visible')
    .on('change', function() {
      updateEdgeLabelVisibility(formChecked(this));
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
  updateNodeStructure, updateNodeImage, updateControl,
  mainControlBox, nodeColorControlBox, nodeLabelControlBox, nodeSizeControlBox, edgeControlBox
};
