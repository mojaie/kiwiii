
/** @module testAPI */

import d3 from 'd3';

import {default as client} from './common/client.js';
import {default as fetcher} from './common/fetcher.js';
import {default as image} from './common/image.js';


/*
  Flashflood server tests
*/

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
          const query = {id: res.workflowID, command: 'abort'};
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
          const query = {id: res.workflowID, command: 'abort'};
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
          threshold: 0.25, ignoreHs: true, diameter: 8, timeout: 1
        };
        const formData = new FormData();
        formData.append('contents', new Blob([JSON.stringify(res.records)]));
        formData.append('params', JSON.stringify(params));
        fetcher.post('glsnet', formData)
          .then(fetcher.json)
          .then(res => {
            setTimeout(() => {
              const query = {id: res.workflowID, command: 'abort'};
              fetcher.get('progress', query).then(fetcher.json).then(rows => r([res, rows]));
            }, 2000);
          });
      }).then(res => ({output: res, test: 'glsnet', pass: true}))
        .catch(err => ({output: err, test: 'glsnet', pass: false}))
    )
);




/*
  Screener API tests (testAPI.html?type=screener)
*/

const screenerTestCases = () => fetcher.serverStatus().then(response => {
  const cases = [];
  const mod = response.server.externalModules
    .find(e => e.module === 'contrib.screenerapi');
  if (!mod) throw 'Invalid test "screener"';
  const baseURL = mod.base_url;

  cases.push(() => {
    const q = JSON.stringify({ qcsRefIds: "QCS-1504" });
    const header = { credentials: 'include' };
    return fetch(`../screener/compound?query=${q}`, header)
      .then(res => {
        if (res.status !== 200) {
          return Promise.reject(new Error(res.statusText));
        }
        return Promise.resolve(res);
      })
      .then(fetcher.json)
      .then(res => ({output: res, test: 'compound', pass: true}))
      .catch(err => ({output: err, test: 'compound', pass: false}));
  });


  cases.push(() => {
    const q = JSON.stringify({ qcsRefIds: "QCS-105" });
    const header = { credentials: 'include'};
    return fetch(`../screener/platevalue?query=${q}`, header)
      .then(res => {
        if (res.status !== 200) {
          return Promise.reject(new Error(res.statusText));
        }
        return Promise.resolve(res);
      })
      .then(fetcher.json)
      .then(res => ({output: res, test: 'platevalue', pass: true}))
      .catch(err => ({output: err, test: 'platevalue', pass: false}));
  });


  cases.push(() => {
    const q = JSON.stringify({ qcsRefIds: "QCS-105" });
    const header = { credentials: 'include' };
    return fetch(`../screener/platestats?query=${q}`, header)
      .then(res => {
        if (res.status !== 200) {
          return Promise.reject(new Error(res.statusText));
        }
        return Promise.resolve(res);
      })
      .then(fetcher.json)
      .then(res => ({output: res, test: 'platestats', pass: true}))
      .catch(err => ({output: err, test: 'platestats', pass: false}));
  });


  cases.push(() => {
    const q = JSON.stringify({});
    const header = { credentials: 'include' };
    return fetch(`../screener/qcsession?query=${q}`, header)
      .then(res => {
        if (res.status !== 200) {
          return Promise.reject(new Error(res.statusText));
        }
        return Promise.resolve(res);
      })
      .then(fetcher.json)
      .then(res => ({output: res, test: 'qcsession', pass: true}))
      .catch(err => ({output: err, test: 'qcsession', pass: false}));
  });


  cases.push(() => {
    const plotId = 'Qj1ley0xNk9vWm4b';
    const q = {
      width: 300,
      height: 300,
      title: 'title',
      activityRangeMin: -20,
      activityRangeMax: 110,
      color: 'green'
    };
    const qs = Object.entries(q).map(e => `${e[0]}=${e[1]}`);
    const qstr = qs.join('&');
    const header = { credentials: 'include' };
    return fetch(`${baseURL}drcPlots/${plotId}?${qstr}`, header)
      .then(res => {
        if (res.status !== 200) {
          return Promise.reject(new Error(res.statusText));
        }
        return Promise.resolve(res);
      })
      .then(fetcher.blob)
      .then(res => image.binaryToDataURI(res))
      .then(res => ({output: `<img src=${res}`, test: 'drcplot', pass: true}))
      .catch(err => ({output: err, test: 'drcplot', pass: false}));
  });

  return cases;
});

/*
  Run
*/
const testType = client.URLQuery().type || 'flashflood';
const tests = {
  flashflood: () => Promise.resolve(testCases),
  screener: screenerTestCases
}[testType];
if (!tests) { throw `Invalid test "${testType}"`; }


function run() {
  const table = d3.select('#results').append('table');
  const header = table.append('thead').append('tr');
  header.append('th').text('Test');
  header.append('th').text('Result');
  const body = table.append('tbody');
  tests().then(t => {
    t.reduce((ps, curr) => {
      return () => ps()
        .then(curr)
        .then(res => {
          console.info(res.test);
          console.info(res.output);
          const pass = res.pass ? 'OK' : '<span class="text-danger">NG<span>';
          const row = body.append('tr');
          row.append('td').text(res.test);
          row.append('td').text(pass);
        });
    }, () => Promise.resolve())();
  });
}
run();
