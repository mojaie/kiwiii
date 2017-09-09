
/** @module component/Header */

import d3 from 'd3';
import {default as def} from '../helper/definition.js';


function renderStatus(data, refresh_callback, abort_callback) {
  d3.select('#loading-circle').style('display', 'none');
  d3.select('title').text(data.name);
  d3.select('#title').text(data.name);
  d3.select('#refresh')
    .style('display', def.ongoing(data) ? 'inline-block' : 'none');
  d3.select('#abort')
    .style('display', def.ongoing(data) ? 'inline-block' : 'none');
  const doneText = {
    'nodes': 'entries found',
    'edges': 'connections created'
  };
  const dtx = doneText[data.dataType];
  d3.select('#progress')
    .text(`(${data.status} - ${data.resultCount} ${dtx} in ${data.execTime} sec.)`);
  if (def.ongoing(data)) {
    d3.select('#progress').append('div').append('progress')
      .attr('max', 100)
      .attr('value', data.progress)
      .text(`${data.progress}%`);
  }
  d3.select('#refresh').on('click', refresh_callback);
  d3.select('#abort')
    .on('click', () => {
      d3.select('#confirm-message')
        .text('Are you sure you want to abort this calculation job?');
      d3.select('#confirm-submit')
        .classed('btn-primary', false)
        .classed('btn-warning', true)
        .on('click', abort_callback);
    });
  console.info('Query');
  console.info(data.query);  // query datails are available on browser console.
}


function initializeWithData() {
  d3.select('#new-data').style('display', 'none');
  d3.select('#loading-circle').style('display', 'none');
}


function initialize() {
  d3.select('#data-control').style('display', 'none');
  d3.select('#nodedata').style('display', 'none');
  d3.select('#refresh').style('display', 'none');
  d3.select('#abort').style('display', 'none');
  d3.select('#loading-circle').style('display', 'none');
  d3.select('#status').selectAll('li').style('display', 'none');
}


export default {
  renderStatus, initializeWithData, initialize
};
