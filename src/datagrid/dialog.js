
import d3 from 'd3';

import {default as store} from '../store/StoreConnection.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';
import {default as fetcher} from '../fetcher.js';
import {default as group} from './formBoxGroup.js';


function searchDialog(selection) {
  const textarea = selection
      .call(modal.submitDialog, 'search-dialog', 'Search by compound ID')
    .select('.modal-body').append('div')
      .call(box.textareaBox, 'search-query', 'Query', 20, null, '')
      .classed('ids', true);
  store.getAppSetting('compoundIDPlaceholder').then(ids => {
    textarea.select('textarea').attr('placeholder', ids);
  });
}


function structDialog(selection, resources) {
  const dialog = selection
      .call(modal.submitDialog, 'struct-dialog', 'Search by structure');
  // Query molecule
  dialog.select('.modal-body')
      .classed('.qmol', true)
      .call(group.queryMolGroup, 'struct', resources, null);
  // Search type
  const method = dialog.select('.modal-body').append('div')
      .classed('.method', true)
      .call(box.selectBox, 'struct-method', 'Method', null, null);
  const methodList = [
    {key: 'exact', name: 'Exact match'},
    {key: 'substr', name: 'Substructure'},
    {key: 'supstr', name: 'Superstructure'},
    {key: 'gls', name: 'MCS-DR/GLS'}
  ];
  store.getAppSetting('rdkit')
    .then(rdk => {
      if (rdk) {
        methodList.push({key: 'rdmorgan', name: 'RDKit Morgan similarity'});
        methodList.push({key: 'rdfmcs', name: 'RDKit FMCS'});
      }
      method.call(box.updateSelectBoxItems, methodList);
  });
  // Measure
  dialog.select('.modal-body').append('div')
      .classed('.measure', true)
      .call(box.selectBox, 'struct-measure', 'Threshold type',
            [
              {key: 'sim', name: 'Similarity'},
              {key: 'edge', name: 'Edge count'}
            ], 'sim');
  // Threshold
  dialog.select('.modal-body').append('div')
      .classed('.thld', true)
      .call(box.numberBox, 'struct-thld', 'Threshold type',
            0.5, 1, 0.01, 0.5);
  // Similarity search options
  dialog.select('.modal-body').append('div')
      .classed('.option', true)
      .call(group.simOptionGroup, 'struct', null, null);
  // Targets
  dialog.select('.modal-body').append('div')
      .classed('.target', true)
      .call(box.checklistBox, 'struct-target', 'Target database', resources, null);
}


function filterDialog(selection, resources) {
  const dialog = selection
    .call(modal.submitDialog, 'filter-dialog', 'Search by properties');
  dialog.select('.modal-body').append('div')
    .call(box.selectBox, 'filter-field', 'Field', 40, resources, '');
  dialog.select('.modal-body').append('div')
    .call(box.selectBox, 'filter-op', 'Operator',
          [
            {key: 'eq', name: '='},
            {key: 'gt', name: '>'},
            {key: 'lt', name: '<'},
            {key: 'ge', name: '>='},
            {key: 'le', name: '>='},
            {key: 'lk', name: 'LIKE'}
          ], 'eq');
  dialog.select('.modal-body').append('div')
    .call(box.textBox, 'filter-value', 'Value', 40, null, '');
  // Targets
  dialog.select('.modal-body').append('div')
      .classed('.target', true)
      .call(box.checklistBox, 'struct-target', 'Target database', resources, null);
}


function sdfDialog(selection, resources) {
  const dialog = selection
    .call(modal.submitDialog, 'filter-dialog', 'Search by properties');
  const textarea = dialog.select('.modal-body').append('div')
    .call(box.textareaBox, 'search-query', 'Query', 40, null, '');
  store.getAppSetting('compoundIDPlaceholder').then(ids => {
    textarea.select('textarea').attr('placeholder', ids);
  });
}


export default {
  searchDialog, structDialog, filterDialog, sdfDialog
};
