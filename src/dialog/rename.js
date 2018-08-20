
/** @module dialog/rename */

import d3 from 'd3';

import {default as badge} from '../component/badge.js';
import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';


const id = 'rename-dialog';
const title = 'Rename';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-edittext');
}


function body(selection) {
  const renameBox = selection.call(modal.submitDialog, id, title)
    .select('.modal-body').append('div')
      .classed('rename', true)
      .call(box.textBox, 'New name');
  renameBox.select('.form-control')
      .attr('required', 'required');
  renameBox.select('.invalid-feedback')
      .call(badge.updateInvalidMessage, 'Please provide a valid name');
}


function updateBody(selection, name) {
  selection.select('.rename')
      .call(box.updateFormValue, name)
      .on('input', function () {
        const valid = box.formValid(d3.select(this));
        selection.select('.submit').property('disabled', !valid);
      })
      .dispatch('input');
}


function value(selection) {
  return box.formValue(selection.select('.rename'));
}


export default {
  menuLink, body, updateBody, value
};
