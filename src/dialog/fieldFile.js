
/** @module dialog/fieldFile */

import d3 from 'd3';

import {default as mapper} from '../common/mapper.js';
import {default as misc} from '../common/misc.js';
import {default as hfile} from '../common/file.js';
import {default as himg} from '../common/image.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';

import {default as table} from '../datagrid/table.js';


const id = 'fieldfile-dialog';
const title = 'Append JSON fields';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'addfile');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  const body = dialog.select('.modal-body');
  body.append('div')
      .classed('file', true)
      .call(box.fileInputBox, 'File', '.json,.csv');
  body.append('div')
      .classed('left', true)
      .call(lbox.selectBox, 'Datagrid ID');
  body.append('div')
      .classed('right', true)
      .call(lbox.selectBox, 'File ID')
    .select('select')
      .property('disabled', true);
  body.append('h5')
      .classed('mt-2', true)
      .text('Preview');
  body.append('div')
      .classed('preview', true)
      .call(table.table, [], [], null, 210);
}


function updateBody(selection, fields) {
  const leftFields = fields.filter(e => misc.sortType(e.format) !== 'none');
  const leftDefault = leftFields
    .find(e => e.format === 'compound_id') || leftFields[0];
  selection.select('.left')
    .call(lbox.selectBoxItems, leftFields)
    .call(lbox.updateSelectBox, leftDefault.key);
  selection.select('.file')
      .on('change', function () {
        const file = box.fileInputBoxValue(d3.select(this));
        d3.select(this).dispatch('validate');
        const isCsv = file.name.split('.').pop() === 'csv';
        hfile.readFile(file)
          .then(res => {
            const mapping = isCsv ? mapper.csvToMapping(res) : JSON.parse(res);
            const tbl = mapper.mappingToTable(mapping);
            selection.select('.right')
              .call(lbox.selectBoxItems,
                    [{key: mapping.key, name: mapping.key}])
              .call(lbox.updateSelectBox, mapping.key);
            selection.select('.preview')
              .call(table.update, tbl.fields, tbl.records.slice(0, 5));
          });
      })
      .on('validate', function () { // Input validation
        const fileSelected = box.fileInputBoxValue(d3.select(this));
        selection.select('.submit')
          .property('disabled', !fileSelected);
      })
      .dispatch('validate');
}


function readFile(selection) {
  const left = lbox.selectBoxValue(selection.select('.left'));
  const file = box.fileInputBoxValue(selection.select('.file'));
  const isCsv = file.name.split('.').pop() === 'csv';
  return hfile.readFile(file)
    .then(res => {
      let mapping = isCsv ? mapper.csvToMapping(res) : JSON.parse(res);
      if (mapping.hasOwnProperty('field')) {
        mapping = mapper.singleToMulti(mapping);
      }
      mapping.key = left;
      // TODO; refactor
      const plotCols = [];
      mapping.fields.forEach((e, i) => {
        if (e.format === 'plot') {
          mapping.fields[i].format = 'image';
          plotCols.push(i);
        }
      });
      if (plotCols.length > 0) {
        const ps = [];
        Object.entries(mapping.mapping).forEach(m => {
          plotCols.forEach(e => {
            const p = himg.plotThumbnail(m[1][e])
              .then(img => {
                mapping.mapping[m[0]][e] = img;
              });
            ps.push(p);
          });
        });
        return Promise.all(ps).then(() => mapping);
      } else {
        return mapping;
      }
    });
}


export default {
  menuLink, body, updateBody, readFile
};
