
/** @module datagrid/view */

import {default as component} from './component.js';


function resize(selection, state) {
  const viewport = selection.select('.dg-viewport');
  const viewportTop = viewport.node().getBoundingClientRect().top;
  state.viewportHeight = window.innerHeight - viewportTop - 5;
  state.previousNumViewportRows = state.numViewportRows;
  state.numViewportRows = Math.ceil(state.viewportHeight / state.rowHeight) + 1;
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
    selection.call(component.updateContents, state);
  };
  selection.call(component.updateContents, state);

}


export default {
  resize, datagrid
};
