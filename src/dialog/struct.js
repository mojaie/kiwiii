
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
  selection.call(button.dropdownMenuModal, title, id, 'menu-searchchem');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  // Query molecule
  dialog.select('.modal-body').append('div')
      .classed('qmol', true)
      .call(group.queryMolGroup);
  dialog.select('.modal-body').append('div')
      .classed('method', true)
      .call(lbox.selectBox, 'Method');
  // Measure
  dialog.select('.modal-body').append('div')
      .classed('measure', true)
      .call(lbox.selectBox, 'Measure')
      .call(lbox.selectBoxItems, [
              {key: 'sim', name: 'Similarity'},
              {key: 'edge', name: 'Edge count'}
            ]);
  // Threshold
  dialog.select('.modal-body').append('div')
      .classed('thld', true)
      .call(box.numberBox, 'Threshold', 0.5, 1, 0.01);
  // Similarity search options
  dialog.select('.modal-body').append('div')
      .classed('option', true)
      .call(group.simOptionGroup);
  // Targets
  dialog.select('.modal-body').append('div')
      .classed('target', true)
      .call(lbox.checklistBox, 'Target databases');
}


function updateBody(selection, resources, rdk) {
  selection.select('.qmol')
      .call(group.updateQueryMolGroup, resources);
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
  selection.select('.method')
      .call(lbox.selectBoxItems, methodList)
      .call(lbox.updateSelectBox, 'exact')
      .on('change', function () {
        const value = lbox.selectBoxValue(d3.select(this));
        const mcs = ['gls', 'rdfmcs'].includes(value);
        selection.select('.measure')
          .select('select')
            .property('value', mcs ? undefined : 'sim')
            .property('disabled', !mcs);
        selection.selectAll('.thld')
          .select('input')
            .property('disabled', ['exact', 'substr', 'supstr'].includes(value));
        selection.selectAll('.diam')
          .select('input')
            .property('disabled', value !== 'gls');
        selection.select('.timeout')
          .select('input')
            .property('disabled', !mcs);
      })
      .dispatch('change');
  selection.select('.measure')
      .call(lbox.updateSelectBox, 'sim');
  selection.select('.thld')
      .call(box.updateNumberBox, 0.5);
  selection.select('.option')
      .call(group.updateSimOptionGroup, 'struct');
  const res = resources.map(d => ({key: d.id, name: d.name}));
  selection.select('.target')
      .call(lbox.checklistBoxItems, res)
      .call(lbox.updateChecklistBox, null)
      .on('change', function() {
        d3.select(this).dispatch('validate');
      });
  // Input validation
  selection.selectAll('.qmol,.target')
      .on('validate', function () {
        const qmolValid = group.queryMolGroupValid(selection.select('.qmol'));
        const targetChecked = lbox.anyChecked(selection.select('.target'));
        selection.select('.submit')
          .property('disabled', !(qmolValid && targetChecked));
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
  menuLink, body, updateBody, execute
};
