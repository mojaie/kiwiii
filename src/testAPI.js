
import d3 from 'd3';
import {default as cmp} from './component/Component.js';
import {LocalServerActivity, LocalServerChemical} from './fetcher/LocalServer.js';
import {ScreenerFitting, ScreenerRawValue} from './fetcher/Screener.js';
import {ScreenerFittingStub, ScreenerRawValueStub} from './fetcher/ScreenerTestStub.js';

const API = new Map(Object.entries({
  chemical: new LocalServerChemical(),
  activity: new LocalServerActivity(),
  screenerrawvalue: new ScreenerRawValue(),
  screenerfitting: new ScreenerFitting(),
  screenerrawvaluestub: new ScreenerRawValueStub(),
  screenerfittingstub: new ScreenerFittingStub()
}));

const testCases = [];
const localServer = API.get('chemical');
const localServerActivity = API.get('activity');

testCases.push({
  name: 'resources',
  testCase: () => {
    return Array.from(API.values()).map(api => {
      return api.getResources();
    }).extendAsync();
  }
});

testCases.push({
  name: 'status',
  testCase: () => {
    return localServer.status();
  }
});

testCases.push({
  name: 'sqlTest1',
  testCase: () => {
    const query = {
      method: 'chemsql',
      targets: [
        'sdf_demo:DRUGBANKFDA',
        'sdf_demo:DRUGBANKALL'
      ],
      key: 'ID',
      values: ['DB00189', 'DB00193', 'DB00203', 'DB00865', 'DB01143'],
      operator: 'fm'
    };
    return localServer.getRecords(query);
  }
});

testCases.push({
  name: 'sqlTest2',
  testCase: () => {
    const query = {
      method: 'sql',
      targets: [
        'text_demo:TEST1_LIB1',
        'text_demo:FREQHIT'
      ],
      key: 'ID',
      values: ['DB00189', 'DB00193', 'DB00203', 'DB00865', 'DB01143'],
      operator: 'in'
    };
    return localServerActivity.getRecords(query);
  }
});

testCases.push({
  name: 'computeTest1',
  testCase: () => {
    const query = {
      method: 'sub',
      targets: ['sdf_demo:DRUGBANKFDA'],
      format: 'dbid',
      querySource: 'sdf_demo:DRUGBANKFDA',
      value: 'DB00115'
    };
    return localServer.getRecords(query).then(res => {
      return new Promise(r => {
        setTimeout(() => {
          const query = {id: res.id, command: 'abort'};
          localServer.getRecords(query).then(rows => r([res, rows]));
        }, 5000);
      });
    });
  }
});

testCases.push({
  name: 'computeTest2',
  testCase: () => {
    const query = {
      method: 'chemcalc',
      targets: ['sdf_demo:DRUGBANKFDA'],
      key: '_mw',
      values: [1000],
      operator: 'gt'
    };
    return localServer.getRecords(query).then(res => {
      return new Promise(r => {
        setTimeout(() => {
          const query = {id: res.id, command: 'abort'};
          localServer.getRecords(query).then(rows => r([res, rows]));
        }, 5000);
      });
    });
  }
});

testCases.push({
  name: 'strprev',
  testCase: () => {
    const query = {
      format: 'dbid',
      query_source: 'sdf_demo:DRUGBANKFDA',
      value: 'DB00115'
    };
    return localServer.strprev(query)
      .then(res => new DOMParser().parseFromString(res, "image/svg+xml"));
  }
});


function run() {
  const tbl = {
      columns: [
        {key: 'test', sort: 'text', visible: true},
        {key: 'result', sort: 'text', visible: true}
      ],
      records: []
  };
  d3.select('#test').call(cmp.createTable, tbl);
  testCases.forEach(p => {
    p.testCase().then(res => {
      console.info(p.name);
      console.log(res);
      const row = [{'test': p.name, 'result': 'OK'}];
      cmp.appendTableRows(d3.select('#test'), row, d => d.key);
    }).catch(err => {
      console.error(err);
      const row = [{'test': p.name, 'result': '<span class="text-danger">NG<span>'}];
      cmp.appendTableRows(d3.select('#test'), row, d => d.key);
    });
  });
}
run();
