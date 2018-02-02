
/** @module component/modal */


function dialogBase(selection, id) {
  if (selection.select('.modal-dialog').size()) {
    selection.select('.modal-dialog').remove();
  }
  selection
      .classed('modal', true)
      .attr('tabindex', -1)
      .attr('role', 'dialog')
      .attr('aria-labelledby', '')
      .attr('aria-hidden', true)
      .attr('id', id)
    .append('div')
      .classed('modal-dialog', true)
      .attr('role', 'document')
    .append('div')
      .classed('modal-content', true);
}


function confirmDialog(selection, id, message) {
  const base = selection.call(dialogBase, id)
      .select('.modal-content');
  // body
  base.append('div')
      .classed('modal-body', true)
    .append('div')
      .classed('message', true)
      .text(message);
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
      .attr('data-target', `${id}-submit`)
      .text('OK');
  // TODO: dispatch submit event on click
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
      .attr('data-target', `${id}-submit`)
      .text('Submit');
  // TODO: dispatch submit event on click
}


export default {
  confirmDialog, submitDialog
};
