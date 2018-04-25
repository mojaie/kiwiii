
/** @module dialog/community */


import {default as button} from '../component/button.js';
import {default as box} from '../component/formBox.js';
import {default as modal} from '../component/modal.js';


const id = 'community-dialog';
const title = 'Comunity detection';


function menuLink(selection) {
  selection.call(button.dropdownMenuModal, title, id, 'aperture');
}


function body(selection) {
  const dialog = selection.call(modal.submitDialog, id, title);
  // Name
  dialog.select('.modal-body').append('div')
      .classed('name', true)
      .call(box.textBox, 'comm-name', 'New name', 40, 'comm_');
  // Assign null to isolated nodes
  dialog.select('.modal-body').append('div')
      .classed('nulliso', true)
      .call(box.checkBox, 'comm-nulliso', 'Assign null to isolated nodes', true);
}


function value(selection) {
  return {
    name: box.textBoxValue(selection.select('.name')),
    nulliso: box.checkBoxValue(selection.select('.nulliso'))
  };
}


export default {
  menuLink, body, value
};
