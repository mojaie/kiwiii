
/** @module datagrid/component */

import d3 from 'd3';


function headerCellRenderer(header) {
  header.style('display', 'inline-block')
    .style('width', d => `${d.width}%`)
    .text(d => d.name);
}


function updateHeader(selection, state) {
  const header = selection.select('.dg-header');
  header.selectAll('.dg-hcell').remove();
  header.selectAll('.dg-hcell').data(state.visibleFields)
    .enter().append('div')
      .classed('dg-hcell', true)
      .call(state.headerCellRenderer);
}


function updateRows(selection, state) {
  const rows = selection.select('.dg-body')
    .selectAll('.dg-row')
      .data(state.recordsToShow(), state.keyFunc);
  rows.exit().remove();
  rows.selectAll('.dg-cell').remove();
  rows.enter()
    .append('div')
      .attr('class', 'dg-row')
      .style('position', 'absolute')
      .style('width', '100%')
    .merge(rows)
      .style('height', `${state.rowHeight}px`)
      .each(function (d, i) {
        const rowIndex = state.viewportTop + i;
        const rowPos = rowIndex * state.rowHeight;
        d3.select(this)
          .style('transform', `translate(0px, ${rowPos}px)`)
          .classed('odd', (rowIndex) % 2 === 0)
          .call(state.rowFactory(), d);
      });
}


function updateViewport(selection, state, scrollPos) {
  selection.select('.dg-body').style('height', `${state.bodyHeight}px`);
  state.setScrollPosition(scrollPos);
  selection.call(updateRows, state, scrollPos);
  selection.select('.dg-viewport').node().scrollTop = scrollPos * state.rowHeight;
}


function resize(selection, state) {
  const viewport = selection.select('.dg-viewport');
  const viewportTop = viewport.node().getBoundingClientRect().top;
  state.resizeViewport(window.innerHeight - viewportTop - 5);
  viewport.style('height', `${state.viewportHeight}px`);
}


function datagrid(selection, state) {
  selection.append('div')
      .classed('dg-header', true);
  selection.append('div')
      .classed('dg-viewport', true)
      .style('overflow-y', 'auto')
      .on('scroll', function () {
        const pos = Math.floor(this.scrollTop / state.rowHeight);
        if (pos !== state.previousViewportTop) {
          state.setScrollPosition(pos);
          selection.call(updateRows, state, pos);
        }
      })
    .append('div')
      .classed('dg-body', true)
      .style('position', 'relative');
  state.updateContentsNotifier = () => {
    state.applyHeader();
    selection.call(updateHeader, state);
    selection.call(resize, state);
    state.applyData();
    selection.call(updateViewport, state, state.viewportTop);
  };
  state.updateFilterNotifier = value => {
    state.setFilterText(value);
    selection.call(updateViewport, state, 0);
  };
  state.updateContentsNotifier();  // TODO: remove
}



export default {
  headerCellRenderer, updateHeader, updateRows, updateViewport,
  resize, datagrid
};
