
/** @module dialog/community */

import d3 from 'd3';

import {default as badge} from '../component/badge.js';
import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';


const id = 'community-dialog';
const title = 'Comunity detection';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'menu-painting');
}


function body(selection) {
  const mbody = selection.call(modal.submitDialog, id, title)
      .select('.modal-body');

  // Name
  mbody.append('div')
      .classed('name', true)
      .call(box.textBox, 'New name')
    .select('.form-control')
      .attr('required', 'required');

  // Assign null to isolated nodes
  mbody.append('div')
      .classed('nulliso', true)
      .call(box.checkBox, 'Assign null to isolated nodes');
}


function updateBody(selection, fields) {
  selection.select('.name')
      .call(box.formValue, null)
      .on('input', function() {
        const value = box.formValue(d3.select(this));
        const noDup = !fields.map(e => e.key).includes(value);
        if (!noDup) box.setValidity(d3.select(this), false);
        const invmsg = noDup ? 'Please provide valid field name'
          : `Key '${value}' already exsists`;
        d3.select(this).call(badge.updateInvalidMessage, invmsg);
        const valid = noDup && box.formValid(d3.select(this));
        selection.select('.submit').property('disabled', !valid);
      });

  selection.select('.nulliso')
      .call(box.updateCheckBox, true);
  selection.select('.submit').property('disabled', true);
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
