
/** @module tile/component */

import {default as scale} from '../common/scale.js';
import {default as misc} from '../common/misc.js';


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
  const items = selection.selectAll('.item')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
  items.select('.tile')
      .style('fill',
        d => scale.scaleFunction(state.tileColor)(d[state.tileColor.field]));
  items.select('.tile-value')
      .text(d => {
        if (state.tileValue.field === null) return '';
        const field = state.items.fields.find(e => e.key === state.tileValue.field);
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
        d => scale.scaleFunction(state.tileValueColor)(d[state.tileValueColor.field]));
}


function resizeViewBox(selection, width, height) {
  selection.attr('viewBox', `0 0 ${width} ${height}`);
  selection.select('.tl-view-boundary')
    .attr('width', width)
    .attr('height', height);
}


function tileViewFrame(selection, state) {
  selection
    .style('width', '100%')
    .style('height', '100%');
  selection.select('.tl-view').remove(); // Clean up
  selection.append('svg')
    .classed('tl-view', true);
  selection.call(resize, state);
}


function resize(selection, state) {
  const area = selection.node();
  state.setViewBox(area.offsetWidth, area.offsetHeight);
  selection.select('.tl-view')
    .call(resizeViewBox, area.offsetWidth, area.offsetHeight);
}


function tileView(selection, state) {
  selection
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('pointer-events', 'all')
    .attr('viewBox', `0 0 ${state.viewBox.right} ${state.viewBox.bottom}`)
    .style('width', '100%')
    .style('height', '100%');

  // Clean up
  selection.select('.tl-view-boundary').remove();
  selection.select('.tl-field').remove();

  // Render
  selection.append('rect')
      .classed('tl-view-boundary', true)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', state.viewBox.right)
      .attr('height', state.viewBox.bottom)
      .attr('fill', '#ffffff')
      .attr('stroke-width', 1)
      .attr('stroke', '#cccccc');
  const field = selection.append('g')
      .classed('tl-field', true);
  const items = field.append('g').classed('tl-items', true);
  // Set notifiers
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
  updateItems, updateItemAttrs, tileViewFrame, tileView, resize
};
