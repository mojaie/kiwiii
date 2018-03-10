
/** @module datagrid/view */

import {default as component} from './component.js';


function resize(selection, state) {
  const viewport = selection.select('.dg-viewport');
  const viewportTop = viewport.node().getBoundingClientRect().top;
  state.setViewportSize(window.innerHeight - viewportTop - 5);
  selection.call(component.resizeViewport, state);
}

function datagrid(selection, state) {
  if (selection.selectAll('div').size()) {
    selection.selectAll('div').remove();
  }
  selection.append('div')
      .classed('dg-header', true);
  selection.append('div')
      .classed('dg-viewport', true)
    .append('div')
      .classed('dg-body', true);
  selection.call(resize, state);
  state.updateContentsNotifier = () => {
    state.applyData();
    selection.call(component.updateContents, state);
  };
  state.updateFilterNotifier = value => {
    state.setFilterText(value);
    selection.call(
      component.updateRows, state, component.updateRowFunc(state.visibleFields)
    );
  };
  state.updateContentsNotifier();
}


export default {
  resize, datagrid
};
