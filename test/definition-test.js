const tape = require("tape");
const f = require("../_build/main.js").def;

tape("capitalized", function(t) {
  t.equal(f.capitalized('upper case'), 'Upper Case');
  t.end();
});
