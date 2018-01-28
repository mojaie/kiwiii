
/** @module component/controlBox */

import d3 from 'd3';


function buttonBox(selection, id, label, type) {
  selection
      .classed('form-group', true)
      .classed('mb-1', true)
    .append('button')
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed('btn-sm', true)
      .attr('type', 'button')
      .attr('id', id)
      .text(label);
}


function menuButton(selection, id, label, type) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('role', 'button')
      .attr('id', id)
      .text(label);
}


function dropdownMenuButton(selection, id, label, type) {
  selection
      .classed('btn-group', true)
      .classed('mr-1', true)
      .attr('id', id);
  selection.append('button')
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed('btn-sm', true)
      .classed('dropdown-toggle', true)
      .attr('type', 'button')
      .attr('data-toggle', 'dropdown')
      .text(label);
  selection.append('div')
      .classed('dropdown-menu', true);
}


function dropdownMenuItem(selection, id, label) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .text(label);
}

function dropdownMenuModal(selection, id, label, target) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .attr('data-toggle', 'modal')
      .attr('data-target', `#${target}`)
      .text(label);
}


function dropdownMenuFile(selection, id, label) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .text(label)
      .on('click', function () {
        d3.select(this).select('input').node().click();
      })
    .append('form')
      .style('display', 'none')
    .append('input')
      .attr('type', 'file')
      .attr('accept', '.gfc,.gfr,.json,.gz');
}


function dropdownMenuFileValue(selection) {
  return selection.select('input').node().files[0];
}


export default {
  buttonBox, menuButton,
  dropdownMenuButton, dropdownMenuItem, dropdownMenuModal,
  dropdownMenuFile, dropdownMenuFileValue
};
