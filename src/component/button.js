
/** @module component/button */

import d3 from 'd3';

const iconBaseURL = '../assets/icon/';


function buttonBox(selection, label, type) {
  selection
      .classed('form-group', true)
      .classed('mb-1', true)
    .append('button')
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed('btn-sm', true)
      .text(label);
}


function menuButton(selection, label, type) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .text(label);
}


function menuButtonLink(selection, label, type, icon) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('role', 'button')
      .attr('href', '#');
  selection.append('img')
      .attr('src', icon ? `${iconBaseURL}${icon}.svg` : null)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  selection.append('span')
      .style('vertical-align', 'middle')
      .text(label);
}


function menuModalLink(selection, target, label, type, icon) {
  selection
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed(`btn-sm`, true)
      .classed('mr-1', true)
      .attr('href', '#')
      .attr('role', 'button')
      .attr('data-toggle', 'modal')
      .attr('data-target', `#${target}`);
  selection.append('img')
      .attr('src', icon ? `${iconBaseURL}${icon}.svg` : null)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  selection.append('span')
      .classed('label', true)
      .style('vertical-align', 'middle')
      .text(label);
}


function dropdownMenuButton(selection, label, type, icon) {
  selection
      .classed('btn-group', true)
      .classed('mr-1', true);
  const button = selection.append('button')
      .classed('btn', true)
      .classed(`btn-${type}`, true)
      .classed('btn-sm', true)
      .classed('dropdown-toggle', true)
      .attr('data-toggle', 'dropdown');
  button.append('img')
      .attr('src', icon ? `${iconBaseURL}${icon}.svg` : null)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  button.append('span')
      .style('vertical-align', 'middle')
      .text(label);
  selection.append('div')
      .classed('dropdown-menu', true);
}


function dropdownMenuItem(selection, label, icon) {
  selection.classed('dropdown-item', true)
      .attr('href', '#');
  selection.append('img')
      .attr('src', icon ? `${iconBaseURL}${icon}.svg` : null)
      .classed('mr-1', true)
      .style('width', '2rem')
      .style('height', '2rem');
  selection.append('span')
      .text(label);
}

function dropdownMenuModal(selection, label, target, icon) {
  selection.classed('dropdown-item', true)
      .attr('href', '#')
      .attr('data-toggle', 'modal')
      .attr('data-target', `#${target}`);
  selection.append('img')
      .attr('src', `${iconBaseURL}${icon}.svg`)
      .classed('mr-1', true)
      .style('width', '2rem')
      .style('height', '2rem');
  selection.append('span')
      .text(label);
}


function dropdownMenuFile(selection, label, accept, icon) {
  selection.classed('dropdown-item', true)
      .attr('href', '#')
      .on('click', function () {
        d3.select(this).select('input').node().click();
      });
  selection.append('form')
      .style('display', 'none')
    .append('input')
      .attr('type', 'file')
      .attr('accept', accept);
  selection.append('img')
      .attr('src', `${iconBaseURL}${icon}.svg`)
      .classed('mr-1', true)
      .style('width', '2rem')
      .style('height', '2rem');
  selection.append('span')
      .text(label);
}


function dropdownMenuFileValue(selection) {
  return selection.select('input').node().files[0];
}


export default {
  iconBaseURL, buttonBox, menuButton, menuButtonLink, menuModalLink,
  dropdownMenuButton, dropdownMenuItem, dropdownMenuModal,
  dropdownMenuFile, dropdownMenuFileValue
};
