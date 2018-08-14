
const tape = require("tape");
const mapper = require("../docs/_build/main.js").mapper;

tape("singleToMulti", function(t) {
  const data = {
    created: 'date',
    fields: {key: 'a', value: 'b'},
    key: 'key',
    mapping: {a: 1, b: 2, c: 3}
  };
  const result = mapper.singleToMulti(data);
  t.equal(result.fields instanceof Array, true);
  t.equal(result.mapping.c.length, 1);
  t.end();
});
