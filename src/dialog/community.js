
/** @module dialog/community */

import d3 from 'd3';

import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';


const id = 'community-dialog';
const title = 'Comunity detection';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-painting');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  // Name
  dialog.select('.modal-body').append('div')
      .classed('name', true)
      .call(box.textBox, 'New name');
  // Assign null to isolated nodes
  dialog.select('.modal-body').append('div')
      .classed('nulliso', true)
      .call(box.checkBox, 'Assign null to isolated nodes');
}


function updateBody(selection) {
  selection.select('.name')
      .call(box.formValue, null)
      .on('input', function () {  // Validation
        const keyValid = box.formValue(d3.select(this)) !== '';
        selection.select('.submit').property('disabled', !keyValid);
      })
      .dispatch('input');
  selection.select('.nulliso')
      .call(box.updateCheckBox, true);
}


function value(selection) {
  return {
    name: box.formValue(selection.select('.name')),
    nulliso: box.checkBoxValue(selection.select('.nulliso'))
  };
}


export default {
  menuLink, body, updateBody, value
};
