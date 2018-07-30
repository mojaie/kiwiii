
/** @module dialog/networkgen */

import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';

import {default as group} from './formGroup.js';


const id = 'networkgen-dialog';
const title = 'Generate similarity network';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-network');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-body').append('div')
      .classed('measure', true)
      .call(lbox.selectBox, 'Measure');
  // Threshold
  dialog.select('.modal-body').append('div')
      .classed('thld', true)
      .call(box.numberBox, 'Threshold', 0.5, 1, 0.01);
  // Similarity search options
  dialog.select('.modal-body').append('div')
      .classed('option', true)
      .call(group.simOptionGroup);
}


function updateBody(selection, rdk) {
  // Similarity measure
  const measures = [
    {key: 'gls', name: 'Graph-based local similarity(GLS)'}
  ];
  if (rdk) {
    measures.push({key: 'rdmorgan', name: 'RDKit Morgan similarity'});
    measures.push({key: 'rdfmcs', name: 'RDKit FMCS'});
  }
  selection.select('.measure')
      .call(lbox.selectBoxItems, measures)
      .call(lbox.updateSelectBox, 'gls')
      .on('change', function () {
        const value = lbox.selectBoxValue(d3.select(this));
        selection.select('.diam')
          .select('input')
            .property('disabled', value !== 'gls');
        selection.select('.timeout')
          .select('input')
            .property('disabled', !['gls', 'rdfmcs'].includes(value));
      });
  selection.select('.thld')
      .call(box.updateNumberBox, 0.5);
  selection.select('.option')
      .call(group.updateSimOptionGroup);
}


function execute(selection, rcds) {
  const measure = selection.select('.measure');
  const thld = selection.select('.thld');
  const params = group.simOptionGroupValue(selection.select('.option'));
  if (!measure.select('select').property('disabled')) {
    params.measure = lbox.selectBoxValue(measure);
  }
  if (!thld.select('input').property('disabled')) {
    params.threshold = box.numberBoxFloatValue(thld);
  }
  const formData = new FormData();
  // TODO: need updates in flashflood query schema
  formData.append('params', JSON.stringify(params));
  formData.append('contents', new Blob([JSON.stringify(rcds)]));
  return fetcher.post(`${params.measure}net`, formData)
    .then(fetcher.json);
}


export default {
  menuLink, body, updateBody, execute
};
