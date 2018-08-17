
/** @module component/dropdown */


import {default as misc} from '../common/misc.js';


function dropdownFormGroup(selection, label) {
  const id = misc.uuidv4().slice(0, 8);
  selection.classed('mb-3', true)
    .append('div')
      .classed('form-group', true)
      .classed('form-row', true)
      .classed('justify-content-end', true)
    .append('button')
      .classed('btn', true)
      .classed('btn-sm', true)
      .classed('btn-outline-primary', true)
      .classed('dropdown-toggle', true)
      .attr('data-toggle', 'collapse')
      .attr('data-target', `#${id}-collapse`)
      .attr('aria-expanded', 'false')
      .attr('aria-controls', `${id}-collapse`)
      .text(label);
  selection.append('div')
      .classed('collapse', true)
      .attr('id', `${id}-collapse`)
    .append('div')
      .classed('card', true)
      .classed('card-body', true);
}


export default {
  dropdownFormGroup
};
