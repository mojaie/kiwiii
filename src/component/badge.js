
/** @module component/badge */

import d3 from 'd3';

const assetBaseURL = '../assets/';
const iconBaseURL = '../assets/icon/';


function badge(selection) {
  const body = selection
      .classed('badge', true)
      .append('span');
  body.append('img')
      .classed('icon', true)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  body.append('span')
      .classed('text', true);
}

function updateBadge(selection, text, type, icon) {
  selection.classed(`badge-${type}`, true);
  selection.select('.icon')
      .attr('src', icon ? `${iconBaseURL}${icon}.svg` : null);
  selection.select('.text')
      .text(text);
}

function hide(selection) {
  selection.style('display', 'none');
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
        hide(selection);
      });
}


function loadingCircle(selection) {
  selection.append('img')
      .attr('src', `${assetBaseURL}loading1.gif`)
      .style('width', '2rem')
      .style('height', '2rem');
  selection.style('display', 'none');
}


export default {
  badge, updateBadge, hide, notify, loadingCircle
};
