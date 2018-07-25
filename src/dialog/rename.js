
/** @module dialog/rename */

import d3 from 'd3';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';


const id = 'rename-dialog';
const title = 'Rename';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'edittext');
}


function body(selection, name) {
  selection.call(modal.submitDialog, id, title)
    .select('.modal-body').append('div')
      .classed('rename', true)
      .call(box.textBox, 'New name', name);
}


function updateBody(selection, name) {
  selection.select('.rename')
      .call(box.updateTextBox, name)
      .on('input', function () {  // Validation
        const keyValid = box.textBoxValue(d3.select(this)) !== '';
        selection.select('.submit').property('disabled', !keyValid);
      })
      .dispatch('input');
}


function value(selection) {
  return box.textBoxValue(selection.select('.rename'));
}


export default {
  menuLink, body, updateBody, value
};
