
/** @module tile/component */


function updateItems(selection, records, showContent, contentSize) {
  const items = selection.selectAll('.item')
    .data(records, d => d.index);
  items.exit().remove();
  const entered = items.enter()
    .append('g')
      .attr('class', 'item')
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
  entered.append('rect')
      .attr('class', 'tile');
  entered.append('g')
      .attr('class', 'tile-content')
      .attr('transform',
            `translate(${-contentSize[0] / 2},${-contentSize[1] / 2})`);
  const merged = entered.merge(items);
  if (showContent) {
    merged.select('.tile-content').html(d => d.structure);
  } else {
    merged.select('.tile-content').select('svg').remove();
  }
}


function tileView(selection, state) {
  selection
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('pointer-events', 'all')
    .attr('viewBox', `0 0 ${state.viewBox.right} ${state.viewBox.bottom}`)
    .style('width', '100%')
    .style('height', '100%');
  selection.append('g').classed('tl-items', true);
  const page = state.pageRecords(0);
  selection.call(updateItems, page, true, [state.columnWidth, state.rowHeight]);
}



export default {
  updateItems, tileView
};
