
/** @module dialog/struct */

import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';
import {default as group} from './formGroup.js';


const id = 'struct-dialog';
const title = 'Search by structure';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'searchchem');
}


function body(selection, resources, rdk) {
  const dialog = selection.call(modal.submitDialog, id, title);
  // Query molecule
  dialog.select('.modal-body').append('div')
      .classed('qmol', true)
      .call(group.queryMolGroup, resources);
  // Search type
  const methodList = [
    {key: 'exact', name: 'Exact match'},
    {key: 'substr', name: 'Substructure'},
    {key: 'supstr', name: 'Superstructure'},
    {key: 'gls', name: 'MCS-DR/GLS'}
  ];
  if (rdk) {
    methodList.push({key: 'rdmorgan', name: 'RDKit Morgan similarity'});
    methodList.push({key: 'rdfmcs', name: 'RDKit FMCS'});
  }
  dialog.select('.modal-body').append('div')
      .classed('method', true)
      .call(lbox.selectBox, 'Method', methodList, 'exact');
  // Measure
  dialog.select('.modal-body').append('div')
      .classed('measure', true)
      .call(lbox.selectBox, 'Measure',
            [
              {key: 'sim', name: 'Similarity'},
              {key: 'edge', name: 'Edge count'}
            ], 'sim');
  // Threshold
  dialog.select('.modal-body').append('div')
      .classed('thld', true)
      .call(box.numberBox, 'Threshold', 0.5, 1, 0.01, 0.5);
  // Similarity search options
  dialog.select('.modal-body').append('div')
      .classed('option', true)
      .call(group.simOptionGroup, 'struct');
  // Targets
  const res = resources.map(d => ({key: d.id, name: d.name}));
  dialog.select('.modal-body').append('div')
      .classed('target', true)
      .call(lbox.checklistBox, 'Target databases', res, null)
      .on('change', function() {
        d3.select(this).dispatch('validate');
      });

  // Events
  dialog.select('.method')
      .on('change', function () {
        const value = lbox.selectBoxValue(d3.select(this));
        const mcs = ['gls', 'rdfmcs'].includes(value);
        dialog.select('.measure')
          .select('select')
            .property('value', mcs ? undefined : 'sim')
            .property('disabled', !mcs);
        dialog.selectAll('.thld')
          .select('input')
            .property('disabled', ['exact', 'substr', 'supstr'].includes(value));
        dialog.selectAll('.diam')
          .select('input')
            .property('disabled', value !== 'gls');
        dialog.select('.timeout')
          .select('input')
            .property('disabled', !mcs);
      })
      .dispatch('change');
  // Input validation
  dialog.selectAll('.qmol,.target')
      .on('validate', function () {
        const qmolValid = group.queryMolGroupValid(dialog.select('.qmol'));
        const target = lbox.checklistBoxValue(dialog.select('.target'));
        dialog.select('.submit')
          .property('disabled', !qmolValid || !target.length);
      })
      .dispatch('validate');
}


function execute(selection) {
  const params = group.simOptionGroupValue(selection.select('.option'));
  const measure = selection.select('.measure');
  const thld = selection.select('.thld');
  if (!measure.select('select').property('disabled')) {
    params.measure = lbox.selectBoxValue(measure);
  }
  if (!thld.select('input').property('disabled')) {
    params.threshold = box.numberBoxFloatValue(thld);
  }
  const query = {
    workflow: lbox.selectBoxValue(selection.select('.method')),
    targets: lbox.checklistBoxValue(selection.select('.target')),
    queryMol: group.queryMolGroupValue(selection.select('.qmol')),
    params: params
  };
  return fetcher.get(query.workflow, query)
    .then(fetcher.json);
}


export default {
  menuLink, body, execute
};
