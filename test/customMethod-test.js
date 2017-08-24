const tape = require("tape");
const main = require("../_build/main.js");

tape("String.prototype.capitalize", function(t) {
  t.equal('upper case'.capitalize(), 'Upper Case');
  t.end();
});

tape("Array.prototype.unique", function(t) {
  const data = [
    {name: 'Norio'},
    {name: 'Tatsuo'},
    {name: 'Tatsuo'},
    {name: 'Mitsuo'},
    {name: 'Toshio'},
  ];
  t.equal(data.unique('name').length, 4);
  t.end();
});

tape("Array.prototype.extend", function(t) {
  t.deepEqual([[1, 2], [3, 4]].extend(), [1, 2, 3, 4]);
  t.end();
});

tape("Array.prototype.extendAsync", function(t) {
  [[1, 2], [3, 4]].extendAsync().then(res => {
    t.deepEqual(res, [1, 2, 3, 4]);
    t.end();
  });
});
