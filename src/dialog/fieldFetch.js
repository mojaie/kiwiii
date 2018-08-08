
/** @module dialog/fieldFetch */

import _ from 'lodash';
import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';
import {default as mapper} from '../common/mapper.js';

import {default as button} from '../component/button.js';
import {default as modal} from '../component/modal.js';

import {default as table} from '../datagrid/table.js';


const id = 'fieldfetch-dialog';
const title = 'Fetch assays';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-addassay');
}


function body(selection) {
  const fields = [
    {key: 'check', name: 'Check', format: 'checkbox',
     widthf: 0.5, height: 40, disabled: 'check_d'},
    {key: 'assay_id', name: 'Assay ID', format: 'assay_id'},
    {key: 'name', name: 'Name', format: 'text'},
    {key: 'value_type', name: 'Value type', format: 'text'},
    {key: 'tags', name: 'Tags', format: 'list', widthf: 2}
  ];
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-dialog').classed('modal-lg', true);
  dialog.select('.modal-body').append('div')
    .classed('assays', true)
    .call(table.filterTable, fields, []);
}


function updateBody(selection, schema, dgfields) {
  const assays = _.flatten(
    schema.resources.filter(e => e.domain === 'assay').map(e => e.data)
  );
  const items = _.flatMap(assays, assay => {
    return assay.value_types.map(e => {
      const copy = Object.assign({}, assay);
      copy.value_type = e.key;
      delete copy.value_types;
      return copy;
    });
  });
  const done = {};
  dgfields.filter(e => e.hasOwnProperty('__origin'))
    .map(e => e.__origin)
    .forEach(e => {
      if (!done.hasOwnProperty(e.assay_id)) {
        done[e.assay_id] = [];
      }
      done[e.assay_id].push(e.value_type);
    });
  const records = items.map(item => {
    const d = done.hasOwnProperty(item.assay_id)
        && done[item.assay_id].includes(item.value_type);
    item.check = d;
    item.check_d = d;
    return item;
  });
  selection.select('.assays')
    .call(table.updateRecords, records)
    .on('change', function () {  // Validation
      const anyChecked = table.tableRecords(d3.select(this))
        .filter(e => e.check && !e.check_d).length;
      selection.select('.submit').property('disabled', !anyChecked);
    })
    .dispatch('change');
}


function execute(selection, compounds, schema) {
  const targets = schema.resources
    .filter(e => e.domain === 'activity').map(e => e.id);
  const queries = table.tableRecords(selection.select('.assays'))
    .filter(e => e.check && !e.check_d)
    .map(e => {
      return {
        workflow: 'activity',
        targets: targets,
        assay_id: e.assay_id,
        condition: {
          compounds: compounds,
          value_types: [e.value_type]
        }
      };
    })
    .map(q => {
      return fetcher.get(q.workflow, q)
        .then(fetcher.json);
    });
    return Promise.all(queries).then(res => {
      const merged = res.shift();
      res.forEach(data => {
        const mp = mapper.tableToMapping(
          data, 'compound_id', ['index', 'assay_id']);
        mapper.apply(merged, mp);
      });
      return mapper.tableToMapping(
        merged, 'compound_id', ['index', 'assay_id']);
    });
}


export default {
  menuLink, body, updateBody, execute
};
