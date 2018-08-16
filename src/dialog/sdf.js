
/** @module dialog/sdf */

import d3 from 'd3';

import {default as fetcher} from '../common/fetcher.js';
import {default as hfile} from '../common/file.js';

import {default as badge} from '../component/badge.js';
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
  selection.call(button.dropdownMenuModal, title, id, 'menu-importsdf');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);

  // File input
  dialog.select('.modal-body').append('div')
      .classed('file', true)
      .call(box.fileInputBox, 'File', '.mol,.sdf')
      .on('change', function () {
        const valid = box.fileInputValid(d3.select(this));
        selection.select('.submit').property('disabled', !valid);
        if (!valid) return;
        const file = box.fileInputValue(d3.select(this));
        // Scan only first 100mb of the file due to memory limit.
        return hfile.readFile(file, 100 * 1024 * 1024, false)
          .then(data => {
            const fields = getSDFPropList(data)
              .map(e => ({key: e, name: e}));
            selection.select('.field')
              .call(lbox.updateChecklistItems, fields)
              .call(lbox.updateChecklistValues, [])
              .call(lbox.checkRequired);
            selection.select('.submit').property('disabled', true);
          });
      })
    .select('.invalid-feedback')
      .call(badge.updateInvalidMessage, 'Please choose a file');

  // Select fields to import
  dialog.select('.modal-body').append('div')
      .classed('field', true)
      .call(lbox.checklistBox, 'Fields')
      .on('input', function () {
        const fieldChecked = lbox.anyChecked(selection.select('.field'));
        selection.select('.submit').property('disabled', !fieldChecked);
      })
    .select('.invalid-feedback')
      .call(badge.updateInvalidMessage, 'Please select at least one item');

  // Options
  dialog.select('.modal-body').append('div')
      .classed('implh', true)
      .call(box.checkBox, 'Make hydrogens implicit');
  dialog.select('.modal-body').append('div')
      .classed('recalc', true)
      .call(box.checkBox, 'Recalculate 2D coords');
}


function updateBody(selection) {
  selection.select('.file')
      .call(box.clearFileInput);
  selection.select('.field')
      .call(lbox.updateChecklistItems, [])
      .call(lbox.updateChecklistValues, []);
  selection.select('.implh')
      .call(box.updateCheckBox, true);
  selection.select('.recalc')
      .call(box.updateCheckBox, false);
  selection.select('.submit').property('disabled', true);
}


function execute(selection) {
  const params = {
    fields: lbox.checklistValues(selection.select('.field')),
    implh: box.checkBoxValue(selection.select('.implh')),
    recalc: box.checkBoxValue(selection.select('.recalc'))
  };
  const formData = new FormData();
  formData.append('contents', box.fileInputValue(selection.select('.file')));
  formData.append('params', JSON.stringify(params));
  return fetcher.post('sdfin', formData)
    .then(fetcher.json);
}



export default {
  menuLink, body, updateBody, execute
};
