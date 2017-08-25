const tape = require("tape");
const jsdom = require("jsdom");
const f = require("../_build/main.js").fmt;

tape("formatNum", function(t) {
  t.equal(f.formatNum(420, 'si'), '420');
  t.equal(f.formatNum('42.0', 'si'), '42.0');
  t.equal(f.formatNum(420000, 'si'), '420k');
  t.equal(f.formatNum(0.0042, 'si'), '4.20m');
  t.equal(f.formatNum('not a number', 'si'), 'not a number');
  t.equal(f.formatNum(undefined, 'si'), '');
  t.equal(f.formatNum('', 'si'), '');
  t.equal(f.formatNum(null, 'si'), '');
  t.equal(f.formatNum(NaN, 'si'), '');
  t.equal(f.formatNum(420, 'scientific'), '4.200e+2');
  t.equal(f.formatNum('42.0', 'scientific'), '4.200e+1');
  t.equal(f.formatNum(420000, 'scientific'), '4.200e+5');
  t.equal(f.formatNum(0.0042, 'scientific'), '4.200e-3');
  t.equal(f.formatNum('not a number', 'scientific'), 'not a number');
  t.equal(f.formatNum(420, 'rounded'), '420');
  t.equal(f.formatNum('42.0', 'rounded'), '42.0');
  t.equal(f.formatNum(420000195, 'rounded'), '420000000');
  t.equal(f.formatNum(0.0042195, 'rounded'), '0.00422');
  t.equal(f.formatNum('not a number', 'rounded'), 'not a number');
  t.end();
});


tape("partial match", function(t) {
  t.equal(f.partialMatch('kombu', 'siokombu'), true);
  t.equal(f.partialMatch('touhu', 'touhubutterdon'), true);
  t.equal(f.partialMatch('imokempi', 'siokombu'), false);
  t.equal(f.partialMatch('fury', 'Mad Max Fury Load'), true);  // case insensitive
  t.equal(f.partialMatch(42, 'yukarin42yearsold'), true);
  // empty query will results true unless target is empty
  t.equal(f.partialMatch('', 'siokombu'), true);
  t.equal(f.partialMatch(0, 'siokombu'), false);  // not empty query
  // empty target will results false
  t.equal(f.partialMatch('', ''), false);
  t.equal(f.partialMatch('', null), false);
  t.equal(f.partialMatch('', undefined), false);
  t.end();
});


tape("sort functions", function(t) {
  t.equal(f.numericAsc(120, 121) > 0, true);
  t.equal(f.numericAsc(120.1, 120.01) > 0, false);
  t.equal(f.numericAsc(120, 120.00) === 0, true);
  t.equal(f.numericAsc(120, 'hoge') > 0, true);
  t.equal(f.numericAsc('first', 'second') > 0, true);
  // Empty values
  t.equal(f.numericAsc('', 120) > 0, true);
  t.equal(f.numericAsc(120, null) > 0, true);
  t.equal(f.numericAsc(120, undefined) > 0, true);
  t.equal(f.numericAsc(120, NaN) > 0, true);
  // Desc
  t.equal(f.numericDesc(120, 121) > 0, false);
  t.equal(f.numericDesc('first', 'second') > 0, false);
  // Text
  t.equal(f.textAsc('first', 'second') > 0, true);
  t.equal(f.textAsc(12, 110) > 0, false);  // Note: dictionary order
  t.equal(f.textAsc(120, 'hoge') > 0, true);
  t.equal(f.textAsc('', 'first') > 0, true);
  // Empty values
  t.equal(f.textAsc('', 'first') > 0, true);
  t.equal(f.textAsc('first', null) > 0, true);
  t.equal(f.textAsc('first', undefined) > 0, true);
  t.equal(f.textAsc('first', NaN) > 0, true);
  // Desc
  t.equal(f.textDesc('first', 'second') > 0, false);
  t.equal(f.textDesc(12, 110) > 0, true);
  t.end();
});
