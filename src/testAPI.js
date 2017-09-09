
import d3 from 'd3';

import {default as cmp} from './component/Component.js';
import {default as def} from './helper/definition.js';
import {default as fetcher} from './fetcher.js';


const testCases = [];

testCases.push(() =>
  fetcher.get('server').then(fetcher.json)
    .then(res => ({output: res, test: 'server', pass: true}))
    .catch(err => ({output: err, test: 'server', pass: false}))
);

testCases.push(() =>
  fetcher.get('schema').then(fetcher.json)
    .then(res => ({output: res, test: 'schema', pass: true}))
    .catch(err => ({output: err, test: 'schema', pass: false}))
);

testCases.push(() =>
  fetcher.get('run', {
    type: 'chemsearch',
    targets: ['drugbankfda'],
    key: 'compound_id',
    values: ['DB00189', 'DB00193', 'DB00203', 'DB00865', 'DB01143']
  }).then(fetcher.json)
    .then(res => ({output: res, test: 'chemsearch', pass: true}))
    .catch(err => ({output: err, test: 'chemsearch', pass: false}))
);

testCases.push(() =>
  fetcher.get('run', {
    type: 'filter',
    targets: ['exp_results'],
    key: 'compound_id',
    values: ['DB00189', 'DB00193', 'DB00203', 'DB00865', 'DB01143'],
    operator: 'in'
  }).then(fetcher.json)
    .then(res => ({output: res, test: 'filter', pass: true}))
    .catch(err => ({output: err, test: 'filter', pass: false}))
);

testCases.push(() =>
  fetcher.get('run', {
    type: 'profile',
    compoundID: 'DB00189'
  }).then(fetcher.json)
    .then(res => ({output: res, test: 'profile', pass: true}))
    .catch(err => ({output: err, test: 'profile', pass: false}))
);

testCases.push(() =>
  fetcher.get('strprev', {
    format: 'dbid',
    source: 'drugbankfda',
    value: 'DB00115'
  }).then(fetcher.text)
    .then(res => ({
      output: new DOMParser().parseFromString(res, "image/svg+xml"),
      test: 'strprev', pass: true
    }))
    .catch(err => ({output: err, test: 'strprev', pass: false}))
);

testCases.push(() =>
  new Promise(r => {
    fetcher.get('async', {
      type: 'substr',
      targets: ['drugbankfda'],
      queryMol: {
        format: 'dbid',
        source: 'drugbankfda',
        value: 'DB00115'
      },
      params: {
        ignoreHs: true
      }
    }).then(fetcher.json)
      .then(res => {
        setTimeout(() => {
          const query = {id: res.id, command: 'abort'};
          fetcher.get('res', query).then(fetcher.json).then(rows => r([res, rows]));
        }, 2000);
      });
  }).then(res => ({output: res, test: 'substr', pass: true}))
    .catch(err => ({output: err, test: 'substr', pass: false}))
);

testCases.push(() =>
  new Promise(r => {
    fetcher.get('async', {
      type: 'chemprop',
      targets: ['drugbankfda'],
      key: '_mw',
      values: [1000],
      operator: 'gt'
    }).then(fetcher.json)
      .then(res => {
        setTimeout(() => {
          const query = {id: res.id, command: 'abort'};
          fetcher.get('res', query).then(fetcher.json).then(rows => r([res, rows]));
        }, 2000);
      });
  }).then(res => ({output: res, test: 'prop', pass: true}))
    .catch(err => ({output: err, test: 'prop', pass: false}))
);

testCases.push(() =>
  fetcher.get('run', {
    type: 'chemsearch',
    targets: ['drugbankfda'],
    key: 'id',
    values: ['DB00186', 'DB00189', 'DB00193', 'DB00203', 'DB00764', 'DB00863',
             'DB00865', 'DB00868', 'DB01143', 'DB01240', 'DB01242', 'DB01361',
             'DB01366', 'DB02638', 'DB02959']
  }).then(fetcher.json)
    .then(res =>
      new Promise(r => {
        const params = {
          measure: 'gls', threshold: 0.25, ignoreHs: true,
          diameter: 8, maxTreeSize: 40, molSizeCutoff: 500
        };
        const formData = new FormData();
        formData.append('contents', new Blob([JSON.stringify(res)]));
        formData.append('params', JSON.stringify(params));
        fetcher.post('simnet', formData)
          .then(fetcher.json)
          .then(res => {
            setTimeout(() => {
              const query = {id: res.id, command: 'abort'};
              fetcher.get('res', query).then(fetcher.json).then(rows => r([res, rows]));
            }, 2000);
          });
      }).then(res => ({output: res, test: 'simnet', pass: true}))
        .catch(err => ({output: err, test: 'simnet', pass: false}))
    )
);

function run() {
  const tbl = {
      fields: def.defaultFieldProperties([
        {key: 'test', valueType: 'text'},
        {key: 'result', valueType: 'text'}
      ]),
      records: []
  };
  d3.select('#test').call(cmp.createTable, tbl);
  testCases.reduce((ps, curr) => {
    return () => ps()
      .then(curr)
      .then(res => {
        console.info(res.test);
        console.info(res.output);
        const pass = res.pass ? 'OK' : '<span class="text-danger">NG<span>';
        const row = [{'test': res.test, 'result': pass}];
        cmp.appendTableRows(d3.select('#test'), row, d => d.key);
      })
      ;
  }, () => Promise.resolve())();
}
run();
