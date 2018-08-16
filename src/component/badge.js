
/** @module component/badge */

import d3 from 'd3';

const assetBaseURL = '../assets/';
const iconBaseURL = '../assets/icon/';


function badge(selection) {
  selection.classed('badge', true);
  selection.append('img')
      .classed('icon', true)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  selection.append('span')
      .classed('text', true);
}


function updateBadge(selection, text, type, icon) {
  selection.classed(`badge-${type}`, true);
  selection.select('.icon')
      .attr('src', icon ? `${iconBaseURL}${icon}.svg` : null);
  selection.select('.text')
      .text(text);
}


function notify(selection) {
  selection
    .style('opacity', 0)
    .style('display', 'inline')
    .transition()
      .duration(500)
      .ease(d3.easeLinear)
      .style("opacity", 1.0)
    .transition()
      .delay(3000)
      .duration(1000)
      .ease(d3.easeLinear)
      .style("opacity", 0)
      .on('end', function () {
        selection.style('display', 'none');
      });
}


function loadingCircle(selection) {
  selection
      .style('display', 'none')
    .append('img')
      .attr('src', `${assetBaseURL}loading1.gif`)
      .style('width', '2rem')
      .style('height', '2rem');
}


function alert(selection) {
  selection.classed('alert', true)
      .classed('px-1', true)
      .classed('py-0', true);
  selection.append('img')
      .classed('icon', true)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  selection.append('span')
      .classed('text', true)
      .style('font-size', '75%');
}


function updateAlert(selection, text, type, icon) {
  selection.classed(`alert-${type}`, true);
  selection.select('.icon')
      .attr('src', icon ? `${iconBaseURL}${icon}.svg` : null);
  selection.select('.text')
      .text(text);
}


function invalidFeedback(selection) {
  selection.classed('invalid-feedback', true)
      .style('display', 'none');
  selection.append('img')
      .classed('icon', true)
      .attr('src', `${iconBaseURL}caution-salmon.svg`)
      .style('width', '1rem')
      .style('height', '1rem');
  selection.append('span')
      .classed('invalid-msg', true);
}

function updateInvalidMessage(selection, msg) {
  selection.select('.invalid-msg')
      .text(msg);
}


export default {
  badge, updateBadge, notify, loadingCircle,
  alert, updateAlert, invalidFeedback, updateInvalidMessage
};
