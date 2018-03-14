
/** @module testAPI */

import d3 from 'd3';

import {default as misc} from './common/misc.js';
import {default as fetcher} from './common/fetcher.js';

import {default as table} from './component/table.js';


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
  fetcher.get('search', {
    targets: ['drugbankfda'],
    key: 'compound_id',
    values: ['DB00189', 'DB00193', 'DB00203', 'DB00865', 'DB01143']
  }).then(fetcher.json)
    .then(res => ({output: res, test: 'chemsearch', pass: true}))
    .catch(err => ({output: err, test: 'chemsearch', pass: false}))
);

testCases.push(() =>
  fetcher.get('profile', {
    targets: ['exp_results'],
    compound_id: 'DB00189'
  }).then(fetcher.json)
    .then(res => ({output: res, test: 'profile', pass: true}))
    .catch(err => ({output: err, test: 'profile', pass: false}))
);

testCases.push(() =>
  fetcher.get('activity', {
    targets: ['exp_results'],
    assay_id: 'Test1',
    condition: {
      compounds: ['DB00189', 'DB00193', 'DB00203', 'DB00865', 'DB01143'],
      value_types: ['IC50', 'inh5uM']
    }
  }).then(fetcher.json)
    .then(res => ({output: res, test: 'activity', pass: true}))
    .catch(err => ({output: err, test: 'activity', pass: false}))
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
    fetcher.get('substr', {
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
          const query = {id: res.reference.workflow, command: 'abort'};
          fetcher.get('progress', query).then(fetcher.json).then(rows => r([res, rows]));
        }, 2000);
      });
  }).then(res => ({output: res, test: 'substr', pass: true}))
    .catch(err => ({output: err, test: 'substr', pass: false}))
);

testCases.push(() =>
  new Promise(r => {
    fetcher.get('filter', {
      targets: ['drugbankfda'],
      key: '_mw',
      value: 1000,
      operator: 'gt'
    }).then(fetcher.json)
      .then(res => {
        setTimeout(() => {
          const query = {id: res.reference.workflow, command: 'abort'};
          fetcher.get('progress', query).then(fetcher.json).then(rows => r([res, rows]));
        }, 2000);
      });
  }).then(res => ({output: res, test: 'chemprop', pass: true}))
    .catch(err => ({output: err, test: 'chemprop', pass: false}))
);

testCases.push(() =>
  fetcher.get('search', {
    targets: ['drugbankfda'],
    key: 'compound_id',
    values: ['DB00186', 'DB00189', 'DB00193', 'DB00203', 'DB00764', 'DB00863',
             'DB00865', 'DB00868', 'DB01143', 'DB01240', 'DB01242', 'DB01361',
             'DB01366', 'DB02638', 'DB02959']
  }).then(fetcher.json)
    .then(res =>
      new Promise(r => {
        const params = {
          threshold: 0.25, ignoreHs: true,
          diameter: 8, maxTreeSize: 40, molSizeCutoff: 500
        };
        const formData = new FormData();
        formData.append('contents', new Blob([JSON.stringify(res)]));
        formData.append('params', JSON.stringify(params));
        fetcher.post('glsnet', formData)
          .then(fetcher.json)
          .then(res => {
            setTimeout(() => {
              const query = {id: res.reference.workflow, command: 'abort'};
              fetcher.get('progress', query).then(fetcher.json).then(rows => r([res, rows]));
            }, 2000);
          });
      }).then(res => ({output: res, test: 'glsnet', pass: true}))
        .catch(err => ({output: err, test: 'glsnet', pass: false}))
    )
);

function run() {
  const fields = misc.defaultFieldProperties([
    {key: 'test'},
    {key: 'result', format: 'html'}
  ]);
  const records = [];
  const results = d3.select('#results')
    .append('table')
      .call(table.render, null, null, fields, records);
  testCases.reduce((ps, curr) => {
    return () => ps()
      .then(curr)
      .then(res => {
        console.info(res.test);
        console.info(res.output);
        const pass = res.pass ? 'OK' : '<span class="text-danger">NG<span>';
        records.push({'test': res.test, 'result': pass});
        results.call(table.updateHeader, fields, records);
      })
      ;
  }, () => Promise.resolve())();
}
run();
