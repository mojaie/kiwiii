
/** @module component/button */

import d3 from 'd3';


function buttonBox(selection, id, label, type) {
  selection
      .classed('form-group', true)
      .classed('mb-1', true)
    .append('button')
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed('btn-sm', true)
      .attr('id', id)
      .text(label);
}


function menuButton(selection, id, label, type) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('id', id)
      .text(label);
}


function menuButtonLink(selection, id, label, type) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('role', 'button')
      .attr('href', '#')
      .attr('id', id)
      .text(label);
}


function menuModalLink(selection, id, label, type, target) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('id', id)
      .attr('href', '#')
      .attr('role', 'button')
      .attr('data-toggle', 'modal')
      .attr('data-target', `#${target}`)
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
      .attr('data-toggle', 'dropdown')
      .text(label);
  selection.append('div')
      .classed('dropdown-menu', true);
}


function dropdownMenuItem(selection, id, label) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .attr('href', '#')
      .text(label);
}

function dropdownMenuModal(selection, id, label, target) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .attr('href', '#')
      .attr('data-toggle', 'modal')
      .attr('data-target', `#${target}`)
      .text(label);
}


function dropdownMenuFile(selection, id, label, accept) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .attr('href', '#')
      .text(label)
      .on('click', function () {
        d3.select(this).select('input').node().click();
      })
    .append('form')
      .style('display', 'none')
    .append('input')
      .attr('type', 'file')
      .attr('accept', accept);
}


function dropdownMenuFileValue(selection) {
  return selection.select('input').node().files[0];
}


export default {
  buttonBox, menuButton, menuButtonLink, menuModalLink,
  dropdownMenuButton, dropdownMenuItem, dropdownMenuModal,
  dropdownMenuFile, dropdownMenuFileValue
};
