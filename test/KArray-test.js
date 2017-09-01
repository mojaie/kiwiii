
const tape = require("tape");
const KArray = require("../_build/main.js").KArray;

tape("unique", function(t) {
  const data = new KArray(
    {name: 'Norio'},
    {name: 'Tatsuo'},
    {name: 'Tatsuo'},
    {name: 'Mitsuo'},
    {name: 'Toshio'}
  );
  const result = data.unique('name');
  t.equal(result instanceof KArray, true);
  t.equal(result.length, 4);
  t.end();
});

tape("extend", function(t) {
  const result = new KArray([1, 2], [3, 4]).extend();
  t.equal(result instanceof KArray, true);
  t.deepEqual(result, [1, 2, 3, 4]);
  t.end();
});

tape("extendAsync", function(t) {
  new KArray([1, 2], [3, 4]).extendAsync().then(result => {
  t.equal(result instanceof KArray, true);
    t.deepEqual(result, [1, 2, 3, 4]);
    t.end();
  });
});
