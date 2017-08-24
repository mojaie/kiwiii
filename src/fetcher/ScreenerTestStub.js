
import {ScreenerFitting, ScreenerRawValue} from './Screener.js';


export class ScreenerFittingStub extends ScreenerFitting {
  constructor() {
    super();
    this.resourceFile = 'screener_fitting_stub.yaml';
  }

  fittingStub(q) {
    if (typeof q.qcsRefId !== 'string') throw `${q.qcsRefId} is not a string`;
    if (typeof q.layerIndex !== 'number') throw `${q.layerIndex} is not a number`;
    return [
      {ID: 'DB00189', drcPlot: 'dummy1', AC50: 2.1e-6, hill: 1.1, source: 'target1_validation'},
      {ID: 'DB00193', drcPlot: 'dummy2', AC50: 4.2e-6, hill: null, source: 'target1_validation'},
      {ID: 'DB00203', drcPlot: 'dummy3', AC50: 1.0e-5, hill: 0.9, source: 'target1_validation'},
      {ID: 'DB00865', drcPlot: 'dummy4', AC50: 8.8e-8, hill: 2.1, source: 'target1_validation'},
      {ID: 'DB01143', drcPlot: 'dummy5', AC50: 'n.d.', hill: null, source: 'target1_validation'},
      {ID: 'DB01240', drcPlot: 'dummy6', AC50: null, hill: null, source: 'target1_validation'}
    ];
  }

  getRecords(q) {
    return Promise.resolve({ records: this.fittingStub(q) });
  }

  getRecordsByCompound(compound) {
    const rcds = this.fittingStub({qcsRefId: 'QCS-YYYY', layerIndex: 1})
      .filter(e => e.ID === compound);
    return Promise.resolve({ records: rcds });
  }

  qcsInfoStub(ids) {
    if (!Array.isArray(ids)) throw `${ids} is not a string`;
    const layers = [
      {layerIndex: 0, name: 'Activity%'},
      {layerIndex: 1, name: 'Background%'},
      {layerIndex: 2, name: 'Correction'}
    ];
    return [
      {qcsRefId: 'QCS-XXX0', name: 'hoge', layers: layers},
      {qcsRefId: 'QCS-XXX1', name: 'fuga', layers: layers},
      {qcsRefId: 'QCS-XXX2', name: 'piyo', layers: layers}
    ];
  }

  getQcsInfo(qcsRefIds) {
    return Promise.resolve(this.qcsInfoStub(qcsRefIds));
  }
}


export class ScreenerRawValueStub extends ScreenerRawValue {
  constructor() {
    super();
    this.resourceFile = 'screener_rawvalue_stub.yaml';
  }

  rawValueStub(q) {
    if (typeof q.qcsRefId !== 'string') throw `${q.qcsRefId} is not a string`;
    if (typeof q.layerIndex !== 'number') throw `${q.layerIndex} is not a number`;
    return [
        {ID: 'DB00189', rawValue: 12.7, source: 'target1_screen'},
        {ID: 'DB00193', rawValue: 43.6, source: 'target1_screen'},
        {ID: 'DB00203', rawValue: 102.6, source: 'target1_screen'},
        {ID: 'DB00865', rawValue: -0.6, source: 'target1_screen'},
        {ID: 'DB01143', rawValue: 50, source: 'target1_screen'},
        {ID: 'DB01240', rawValue: null, source: 'target1_screen'}
    ];
  }

  getRecords(q) {
    return Promise.resolve({ records: this.rawValueStub(q) });
  }

  getRecordsByCompound(compound) {
    const rcds = this.rawValueStub({qcsRefId: 'QCS-XXXX', layerIndex: 1})
      .filter(e => e.ID === compound);
    return Promise.resolve({ records: rcds });
  }
}
