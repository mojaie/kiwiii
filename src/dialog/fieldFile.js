
/** @module dialog/fieldFile */

import {default as mapper} from '../common/mapper.js';
import {default as hfile} from '../common/file.js';
import {default as himg} from '../common/image.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';
import {default as table} from '../component/table.js';


const id = 'fieldfile-dialog';
const title = 'Import fields from file';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, 'fieldfile', title, id);
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  const fileInput = dialog.select('.modal-body').append('div')
      .classed('file', true)
      .call(box.fileInputBox, 'fieldfile-file', 'File', '.json,.csv');
  const preview = dialog.select('.modal-body').append('div')
      .classed('preview', true)
      .call(table.render);
  fileInput
      .on('change', () => {
        const file = box.fileInputBoxValue(fileInput);
        const isCsv = file.name.split('.').pop() === 'csv';
        hfile.readFile(file)
          .then(res => {
            const mapping = isCsv ? mapper.csvToMapping(res) : JSON.parse(res);
            const tbl = mapper.mappingToTable(mapping);
            preview.call(table.updateHeader, tbl.fields, tbl.records.slice(0, 5));
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
  menuLink, body, readFile
};
