
/** @module dialog/sdf */

import d3 from 'd3';

import {default as hfile} from '../common/file.js';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as lbox} from '../component/formListBox.js';
import {default as modal} from '../component/modal.js';


function getSDFPropList(str) {
  const re = />.*?<(\S+)>/g;
  const uniqCols = new Set();
  let arr;
  while ((arr = re.exec(str)) !== null) {
    uniqCols.add(arr[1]);
  }
  return Array.from(uniqCols);
}


const id = 'sdf-dialog';
const title = 'Import SDFile';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'importsdf');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  dialog.select('.modal-body').append('div')
      .classed('file', true)
      .call(box.fileInputBox, 'sdf-file', 'File', '.mol,.sdf');
  dialog.select('.modal-body').append('div')
      .classed('field', true)
      .call(lbox.checklistBox, 'sdf-fields', 'Fields', [], null);
  dialog.select('.modal-body').append('div')
      .classed('implh', true)
      .call(box.checkBox, 'sdf-implh', 'Make hydrogens implicit', true);
  dialog.select('.modal-body').append('div')
      .classed('recalc', true)
      .call(box.checkBox, 'sdf-recalc', 'Recalculate 2D coords', false);

  dialog.select('.file')
      .on('change', function () {
        const file = box.fileInputBoxValue(d3.select(this));
        // Scan only first 100mb of the file due to memory limit.
        return hfile.readFile(file, 100 * 1024 * 1024, false)
          .then(data => {
            const fields = getSDFPropList(data)
              .map(e => ({key: e, name: e}));
            dialog.select('.field')
              .call(lbox.checklistBoxItems, fields);
          });
      });
}


function queryFormData(selection) {
  const params = {
    fields: lbox.checklistBoxValue(selection.select('.field')),
    implh: box.checkBoxValue(selection.select('.implh')),
    recalc: box.checkBoxValue(selection.select('.recalc'))
  };
  const formData = new FormData();
  formData.append('contents', box.fileInputBoxValue(selection.select('.file')));
  formData.append('params', JSON.stringify(params));
  return formData;
}



export default {
  menuLink, body, queryFormData
};
