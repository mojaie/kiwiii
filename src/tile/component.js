
/** @module tile/component */

import {default as scale} from '../common/scale.js';
import {default as misc} from '../common/misc.js';

import {default as transform} from '../component/transform.js';


function updateItems(selection, state) {
  const itemsToRender = state.itemsToRender();
  const items = selection.selectAll('.item')
    .data(itemsToRender, d => d.index);
  items.exit().remove();
  const entered = items.enter()
    .append('g')
      .attr('class', 'item');
  entered.append('rect')
      .attr('class', 'tile')
      .attr('x', 0)
      .attr('y', 0)
      .style('stroke-width', 1)
      .style('stroke', '#cccccc');
  entered.append('g')
      .attr('class', 'tile-content');
  entered.append('text')
      .attr('class', 'tile-value');
  const merged = entered.merge(items);
  merged.select('.tile')
      .attr('width', state.columnWidth)
      .attr('height', state.rowHeight);
  if (state.enableFocusedView) {
    state.focusedView = itemsToRender.length < state.focusedViewThreshold;
  }
  if (state.focusedView && state.tileContent.visible) {
    merged.select('.tile-content').html(d => d.structure);
    merged.select('.tile-content')
      .select('svg')
        .attr('width', state.columnWidth)
        .attr('height', state.rowHeight);
  } else {
    merged.select('.tile-content').select('svg').remove();
  }
  selection.call(updateItemAttrs, state);
}


function updateItemAttrs(selection, state) {
  const colorConv = scale.scaleFunction(state.tileColor);
  const valueColorConv = scale.scaleFunction(state.tileValueColor);
  const items = selection.selectAll('.item')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
  items.select('.tile')
      .style('fill', d => colorConv(d[state.tileColor.field]));
  items.select('.tile-value')
      .text(d => {
        if (state.tileValue.field === null) return '';
        const field = state.items.fields
          .find(e => e.key === state.tileValue.field);
        if (field.format === 'd3_format') {
          return misc.formatNum(d[state.tileValue.field], field.d3_format);
        }
        return d[state.tileValue.field];
      })
      .attr('x', state.columnWidth * 0.05)
      .attr('y', state.rowHeight * 0.75)
      .attr('font-size', state.rowHeight * 0.5)
      .attr('textLength', state.columnWidth * 0.9)
      .attr('lengthAdjust', 'spacingAndGlyphs')
      .attr('visibility', state.tileValue.visible ? 'inherit' : 'hidden')
      .style('fill',
        d => valueColorConv(d[state.tileValueColor.field]));
}


function tileView(selection, state) {
  selection.call(transform.view, state);
  const items = selection.select('.field')
    .append('g').classed('tl-items', true);
  state.updateFieldNotifier = () => {
    state.setFieldSize();
    items.call(updateItems, state);
  };
  state.updateItemNotifier = () => {
    items.call(updateItems, state);
  };
  state.updateItemAttrNotifier = () => {
    items.call(updateItemAttrs, state);
  };
  state.updateFieldNotifier();
}


export default {
  updateItems, updateItemAttrs, tileView
};
