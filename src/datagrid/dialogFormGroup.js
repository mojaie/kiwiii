
/** @module datagrid/formBoxGroup */

import d3 from 'd3';

import {default as scaledef} from '../helper/scale.js';
import {default as store} from '../store/StoreConnection.js';
import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';
import {default as fetcher} from '../fetcher.js';


/**
 * Render color range control box group
 * @param {d3.selection} selection - selection of box container (div element)
 */
function queryMolGroup(selection, id, resources) {
  selection
      .classed('mb-3', true);
  selection.append('div')
      .classed('format', true)
      .classed('mb-1', true)
      .call(box.selectBox, 'struct-format', 'Format',
            [
              {key: 'molfile', name: 'MDL Molfile'},
              {key: 'dbid', name: 'Compound ID'}
            ], 'molfile');
  selection.append('div')
      .classed('source', true)
      .classed('mb-1', true)
      .call(box.selectBox, 'struct-source', 'Source', resources, null);
  selection.append('div')
      .classed('query', true)
      .classed('mb-1', true)
      .call(box.textareaBox, 'struct-query', 'Query', 10, null, '');
  // TODO: use tooltip ?
  selection.append('div')
      .classed('mb-1', true)
      .call(button.buttonBox, 'struct-preview', 'Structure preview', 'outline-primary');
  selection.call(updateQueryMolGroup);
}


function updateQueryMolGroup(selection) {

}


function simOptionGroup(selection) {

}


function updateSimOptionGroup(selection) {

}




export default {
  queryMolGroup, updateQueryMolGroup,
  simOptionGroup, updateSimOptionGroup
};
