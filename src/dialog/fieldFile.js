
/** @module dialog/fieldFile */

import d3 from 'd3';

import {default as mapper} from '../common/mapper.js';
import {default as hfile} from '../common/file.js';
import {default as himg} from '../common/image.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';

import {default as table} from '../datagrid/table.js';


const id = 'fieldfile-dialog';
const title = 'Append JSON fields';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'addfile');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-body').append('div')
      .classed('file', true)
      .call(box.fileInputBox, 'File', '.json,.csv');
  dialog.select('.modal-body').append('div')
      .classed('preview', true)
      .call(table.table, [], []);

}


function updateBody(selection) {
  selection.select('.file')
      .on('change', function () {
        const file = box.fileInputBoxValue(d3.select(this));
        const isCsv = file.name.split('.').pop() === 'csv';
        hfile.readFile(file)
          .then(res => {
            const mapping = isCsv ? mapper.csvToMapping(res) : JSON.parse(res);
            const tbl = mapper.mappingToTable(mapping);
            selection.select('.preview')
              .call(table.update, tbl.fields, tbl.records.slice(0, 5));
          });
      });
}


function readFile(selection) {
  const file = box.fileInputBoxValue(selection.select('.file'));
  const isCsv = file.name.split('.').pop() === 'csv';
  return hfile.readFile(file)
    .then(res => {
      let mapping = isCsv ? mapper.csvToMapping(res) : JSON.parse(res);
      if (mapping.hasOwnProperty('field')) {
        mapping = mapper.singleToMulti(mapping);
      }
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
