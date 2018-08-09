
/** @module component/badge */

import d3 from 'd3';

const iconBaseURL = '../assets/icon/';


function badge(selection, text, type, icon) {
  const body = selection
      .classed('badge', true)
      .classed(`badge-${type}`, true)
      .append('span');
  body.append('img')
      .attr('src', icon ? `${iconBaseURL}${icon}.svg` : null)
      .style('width', '1.25rem')
      .style('height', '1.25rem');
  body.append('span')
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


export default {
  badge, hide, notify
};
