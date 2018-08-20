
const d3 = require("d3");
const { JSDOM } = require("jsdom");
const tape = require("tape");

const box = require("../docs/_build/main.js").box;


tape("textBox", function(t) {
  const { document } = new JSDOM(`<body></body>`).window;
  const nameInput = d3.select(document.body).append('div')
      .call(box.textBox, 'Name');
  t.equal(nameInput.select('label').text(), 'Name');

  // Valid name
  nameInput.select('input').property('value', 'ok')
      .dispatch('input');
  t.equal(nameInput.select('.invalid-feedback').style('display'), 'none');

  // Requires input
  nameInput.select('input')
      .attr('required', 'required');
  nameInput.select('input').property('value', '')
      .dispatch('input');
  t.equal(nameInput.select('.invalid-feedback').style('display'), 'inherit');

  t.end();
});


tape("textareaBox", function(t) {
  const { document } = new JSDOM(`<body></body>`).window;
  const descInput = d3.select(document.body).append('div')
      .call(box.textareaBox, 'Description');
  t.equal(descInput.select('label').text(), 'Description');

  // Valid text
  descInput.select('textarea').property('value', 'Lorem ipsum')
      .dispatch('input');
  t.equal(descInput.select('.invalid-feedback').style('display'), 'none');

  // TODO: default textarea requires input
  descInput.select('textarea').property('value', '')
      .dispatch('input');
  t.equal(descInput.select('.invalid-feedback').style('display'), 'inherit');

  // Multiline text
  descInput.select('textarea')
      .property('value', '  Lorem\nipsum  \n\fdolor \n\rsit\namet,\t\n')
      .dispatch('input');
  // TODO: \r to \n found
  t.equal(box.formValue(descInput),
          '  Lorem\nipsum  \n\fdolor \n\nsit\namet,\t\n');
  // textareaBoxLines trims space characters
  t.equal(box.textareaBoxLines(descInput).toString(),
          ['Lorem', 'ipsum', 'dolor', 'sit', 'amet,'].toString());
  // Requires at least one non-space character
  descInput.select('textarea')
      .property('value', '\n\n\f\n\r\n\t\n')
      .dispatch('input');
  t.equal(descInput.select('.invalid-feedback').style('display'), 'inherit');
  descInput.select('textarea')
      .property('value', '\n\n\f\n\rhey\n\t\n')
      .dispatch('input');
  t.equal(descInput.select('.invalid-feedback').style('display'), 'none');

  t.end();
});
