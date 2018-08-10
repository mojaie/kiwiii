
/** @module component/modal */

import d3 from 'd3';


function dialogBase(selection, id) {
  selection
      .classed('modal', true)
      .attr('tabindex', -1)
      .attr('role', 'dialog')
      .attr('aria-labelledby', '')
      .attr('aria-hidden', true)
      .attr('id', id);
  selection.append('div')
      .classed('modal-dialog', true)
      .attr('role', 'document')
    .append('div')
      .classed('modal-content', true);
}


function confirmDialog(selection, id) {
  const base = selection.call(dialogBase, id)
      .select('.modal-content');
  // body
  base.append('div')
      .classed('modal-body', true)
    .append('div')
      .classed('message', true);
  // footer
  const footer = base.append('div')
      .classed('modal-footer', true);
  footer.append('button')
      .classed('btn', true)
      .classed('btn-outline-secondary', true)
      .classed('cancel', true)
      .attr('type', 'button')
      .attr('data-dismiss', 'modal')
      .text('Cancel');
  footer.append('button')
      .classed('btn', true)
      .classed('btn-warning', true)
      .classed('ok', true)
      .attr('type', 'button')
      .attr('data-dismiss', 'modal')
      .text('OK')
      .on('click', () => {
        selection.dispatch('submit');
      });
}


function updateConfirmDialog(selection, message) {
  selection.select('.message').text(message);
}


function submitDialog(selection, id, title) {
  const base = selection.call(dialogBase, id)
      .select('.modal-content');
  // header
  const header = base.append('div')
      .classed('modal-header', true);
  header.append('h4')
      .classed('modal-title', true)
      .text(title);
  header.append('button')
      .attr('type', 'button')
      .attr('data-dismiss', 'modal')
      .attr('aria-label', 'Close')
      .classed('close', true)
    .append('span')
      .attr('aria-hidden', true)
      .html('&times;');
  // body
  base.append('div')
      .classed('modal-body', true);
  // footer
  base.append('div')
      .classed('modal-footer', true)
    .append('button')
      .classed('btn', true)
      .classed('btn-primary', true)
      .classed('submit', true)
      .attr('type', 'button')
      .attr('data-dismiss', 'modal')
      .text('Submit')
      .on('click', () => {
        // Dismiss before submit
        // Submit event can update the modal itself
        // (ex. disable submit button before onSubmit call has completed)
        $(`#${id}`).modal('hide');
        selection.dispatch('submit');
      });
}


export default {
  confirmDialog, updateConfirmDialog, submitDialog
};
