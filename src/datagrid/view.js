
/** @module datagrid/view */

import {default as component} from './component.js';


function resize(selection, state) {
  const viewport = selection.select('.dg-viewport');
  const viewportTop = viewport.node().getBoundingClientRect().top;
  state.setViewportSize(window.innerHeight - viewportTop - 5);
  selection.call(component.resizeViewport, state);
}


function datagrid(selection, state) {
  selection.selectAll('div').remove();
  selection.on('resize', () => selection.call(resize, state));
  selection.append('div')
      .classed('dg-header', true);
  selection.append('div')
      .classed('dg-viewport', true)
      .style('overflow-y', 'auto')
      .on('scroll', function () {
        const pos = Math.floor(this.scrollTop / state.rowHeight);
        state.currentScrollTop = this.scrollTop;
        if (pos !== state.previousViewportTop) {
          state.setScrollPosition(pos);
          selection.call(component.updateRows, state);
        }
      })
    .append('div')
      .classed('dg-body', true)
      .style('position', 'relative');
  state.updateContentsNotifier = () => {
    state.applyData();
    selection.call(component.updateHeader, state);
  };
  state.updateFilterNotifier = value => {
    state.setFilterText(value);
    state.setScrollPosition(0);
    selection.call(component.updateRows, state);
    selection.select('.dg-viewport').node().scrollTop = 0;
  };
  state.updateContentsNotifier();
}


export default {
  resize, datagrid
};
