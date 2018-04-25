
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


function menuButton(selection, label, type, id) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('id', id)
      .text(label);
}


function menuButtonLink(selection, label, type, icon, id) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('role', 'button')
      .attr('href', '#')
      .attr('id', id);
  selection.append('span')
      .classed(`oi oi-${icon}`, true)
      .classed('mr-1', true)
      .attr('aria-hidden', true);
  selection.append('span')
      .text(label);
}


function menuModalLink(selection, target, label, type, icon, id) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('id', id)
      .attr('href', '#')
      .attr('role', 'button')
      .attr('data-toggle', 'modal')
      .attr('data-target', `#${target}`);
  selection.append('span')
      .classed(`oi oi-${icon}`, true)
      .classed('mr-1', true)
      .attr('aria-hidden', true);
  selection.append('span')
      .classed('label', true)
      .text(label);
}


function dropdownMenuButton(selection, label, type, icon, id) {
  selection
      .classed('btn-group', true)
      .classed('mr-1', true)
      .attr('id', id);
  const button = selection.append('button')
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed('btn-sm', true)
      .classed('dropdown-toggle', true)
      .attr('data-toggle', 'dropdown');
  button.append('span')
      .classed(`oi oi-${icon}`, true)
      .classed('mr-1', true)
      .attr('aria-hidden', true);
  button.append('span')
      .text(label);
  selection.append('div')
      .classed('dropdown-menu', true);
}


function dropdownMenuItem(selection, label, icon, id) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .attr('href', '#');
  selection.append('span')
      .classed(`oi oi-${icon}`, true)
      .classed('mr-1', true)
      .attr('aria-hidden', true);
  selection.append('span')
      .text(label);
}

function dropdownMenuModal(selection, label, target, icon, id) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .attr('href', '#')
      .attr('data-toggle', 'modal')
      .attr('data-target', `#${target}`);
  selection.append('span')
      .classed(`oi oi-${icon}`, true)
      .classed('mr-1', true)
      .attr('aria-hidden', true);
  selection.append('span')
      .text(label);
}


function dropdownMenuFile(selection, label, accept, icon, id) {
  selection.classed('dropdown-item', true)
      .attr('id', id)
      .attr('href', '#')
      .on('click', function () {
        d3.select(this).select('input').node().click();
      });
  selection.append('form')
      .style('display', 'none')
    .append('input')
      .attr('type', 'file')
      .attr('accept', accept);
  selection.append('span')
      .classed(`oi oi-${icon}`, true)
      .classed('mr-1', true)
      .attr('aria-hidden', true);
  selection.append('span')
      .text(label);
}


function dropdownMenuFileValue(selection) {
  return selection.select('input').node().files[0];
}


export default {
  buttonBox, menuButton, menuButtonLink, menuModalLink,
  dropdownMenuButton, dropdownMenuItem, dropdownMenuModal,
  dropdownMenuFile, dropdownMenuFileValue
};
