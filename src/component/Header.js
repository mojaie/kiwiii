
/** @module component/Header */

import d3 from 'd3';
import {default as def} from '../helper/definition.js';


function renderStatus(tbl, refresh_callback, abort_callback) {
  d3.select('#loading-circle').style('display', 'none');
  if (!tbl.hasOwnProperty('status')) tbl.status = 'Completed';
  d3.select('title').text(tbl.name);
  d3.select('#title').text(tbl.name);
  d3.select('#refresh')
    .text(tbl.status === 'Aborting' ? 'Abort requested' : 'Refresh')
    .style('display', def.fetchable(tbl) ? 'inline-block' : 'none');
  d3.select('#abort')
    .style('display', def.abortRequestable(tbl) ? 'inline-block' : 'none');
  const doneText = {
    'datatable': 'entries found',
    'connection': 'connections created'
  };
  const dtx = doneText[tbl.format];
  d3.select('#progress')
    .text(`(${tbl.status} - ${tbl.recordCount} ${dtx} in ${tbl.execTime} sec.)`);
  if (tbl.status === 'In progress') {
    d3.select('#progress').append('div').append('progress')
      .attr('max', 100)
      .attr('value', tbl.progress)
      .text(`${tbl.progress}%`);
  }
  d3.select('#refresh').on('click', refresh_callback);
  d3.select('#abort')
    .on('click', () => {
      d3.select('#confirm-message')
        .text('Are you sure you want to abort this calculation job?');
      d3.select('#confirm-submit')
        .classed('btn-primary', false)
        .classed('btn-warning', true)
        .on('click', () => {
          abort_callback();
        });
    });
  console.info('Query');
  console.info(tbl.query);  // query datails are available on browser console.
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
