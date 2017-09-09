
import Fetcher from './Fetcher.js';
import KArray from '../helper/KArray.js';

export class ScreenerFitting extends Fetcher {
  constructor() {
    super();
    this.resourceFile = 'screener_fitting.yaml';
    this.domain = null;
    this.baseURL = null;
  }

  getResources() {
    const formData = new FormData();
    formData.set('filename', this.resourceFile);
    return fetch('source', {method: 'post', body: formData, credentials: 'include'})
      .then(res => res.json())
      .then(json => {
        this.available = true;
        this.domain = json.domain;
        this.baseURL = json.url;
        return json.resources;
    });
  }

  request(queryString) {
    return fetch(`${this.baseURL}${queryString}`, {
      method: 'GET',
      credentials : 'include'
    }).then(res => res.json());
  }

  requestRecords(queryString) {
    return this.request(queryString)
      .then(json => {
        const rcds = json.compounds.map(c => {
          return {
            ID: c.compoundId,
            qcsRefId: c.qcsRefId,
            layerIndex: c.layerIndex,
            drcPlot: c.fitting.drcPlot,
            AC50: c.fitting.linearAC50,
            hill: Math.round(c.fitting.hillCoefficient * 100) / 100
          };
        });
        return { records: rcds };
      });
  }

  getRecords(q) {
    const joinedIds = q.qcsRefIds.join('%2C');
    const queryString = `/compounds?qcsRefIds=${joinedIds}\
&layerIndices=${q.layerIndex - 1}\
&fields=compoundId%2Cfitting.drcPlot%2Cfitting.linearAC50%2Cfitting.hillCoefficient`;
    return this.requestRecords(queryString);
  }

  getRecordsByCompound(compound) {
    const queryString = `/compounds?q=compoundId%3A${compound}\
&fields=compoundId%2CqcsRefId%2ClayerIndex\
%2Cfitting.drcPlot%2Cfitting.linearAC50%2Cfitting.hillCoefficient`;
    return this.requestRecords(queryString);
  }

  getMapping(ids, column) {
    const refid_layer = column.entity.split(':');
    const query = {
      qcsRefId: refid_layer[0],
      layerIndex: parseInt(refid_layer[1])
    };
    return this.getRecords(query).then(res => {
      const mapping = {};
      res.records.filter(row => ids.includes(row.ID))
        .forEach(row => { mapping[row.ID] = row[column.dataColumn]; });
      return {
        key: 'ID',
        column: column,
        mapping: mapping,
        lastUpdated: this.now()
      };
    });
  }

  getDrcPlot(compoundId, plotId, min = -20, max = 120) {
    // compoundResult.fitting.drcPlot -> drcPlots/idstring
    // returns image/png
    const queryString = `/${plotId}?width=180&height=180&title=compoundId\
&activityRangeMin=${min}&activityRangeMax=${max}`;
    return this.request(queryString);
  }

  getQcsInfo(qcsRefIds) {
    const ids = qcsRefIds.map(e => `qcsRefId:${e}`).join(' OR ');
    const queryString = `/qcSessions?q=${ids}`;
    return this.request(queryString).then(res => res.qcSessions);
  }
}


export class ScreenerRawValue extends ScreenerFitting{
  constructor() {
    super();
    this.resourceFile = 'screener_rawvalue.yaml';
  }

  getResources() {
    const formData = new FormData();
    formData.set('filename', this.resourceFile);
    return fetch('source', {method: 'post', body: formData, credentials: 'include'})
      .then(res => res.json())
      .then(json => {
        this.available = true;
        this.domain = json.domain;
        this.baseURL = json.url;
        return json.resources;
      });
  }

  requestRecords(queryString, pred) {
    return this.request(queryString).then(res => {
      const rcds = KArray.from(res.plates)
        .filter(plt => plt.wells.hasOwnProperty('compoundIds'))
        .map(plt => {
          return plt.wells.compoundIds.map((c, i) => {
            return {
              ID: c,
              qcsRefId: plt.qcsRefId,
              layerIndex: plt.layerIndex,
              rawValue: plt.wells.rawValues[i]
            };
          }).filter(pred);
        }).extend();
      return { records: rcds };
    });
  }

  getRecords(q) {
    const joinedIds = q.qcsRefIds.join('%2C');
    const queryString = `/plates?qcsRefIds=${joinedIds}\
&layerIndices=${q.layerIndex - 1}\
&limit=200\
&fields=wells.rawValues%2Cwells.compoundIds`;
    return this.requestRecords(queryString, e => e.ID !== null);
  }

  getRecordsByCompound(compound) {
    const queryString = `/plates?q=wells.compoundIds%3A${compound}\
&fields=wells.rawValues%2Cwells.compoundIds`;
    return this.requestRecords(queryString, e => e.ID === compound);
  }
}


/*
function request(query) {
  return store.getDBResources('activity')
    .then(rsrc => {
      const url = `${rsrc.find(e => e.id === 'screenerapi').url}${query}`;
      return server.request(url, null, {
        method: 'GET',
        responseType: 'json',
        withCredentials : true
      });
    });
}


function getRawValuesByQcs(qcsRefIds, layerIndex) {
  const joined = qcsRefIds.join('%2C');
  const query = `/plates?qcsRefIds=${joined}\
&layerIndices=${layerIndex - 1}\
&limit=200\
&fields=wells.rawValues%2Cwells.compoundIds`;
  return request(query).then(res => {
    const rcds = [];
    res.plates.forEach(plt => {
      if (!plt.wells.hasOwnProperty('compoundIds')) return;  // unmapped
      const values = plt.wells.compoundIds.map((c, i) => {
        if (c !== null) return { ID: c, rawValue: plt.wells.rawValues[i]};
      }).filter(e => e !== undefined);
      Array.prototype.push.apply(rcds, values);
    });
    const now = new Date();
    return {
      created: now.toString(),
      records: rcds
    };
  });
}
exports.getRawValuesByQcs = getRawValuesByQcs;


function getRawValuesMappingColumn(qcsRefIds, layerIndex, compoundIds) {
  const joined = qcsRefIds.join('%2C');
  const query = `/plates?qcsRefIds=${joined}\
&layerIndices=${layerIndex - 1}\
&limit=200\
&fields=wells.rawValues%2Cwells.compoundIds`;
  return request(query).then(res => {
    const mapping = {};
    res.plates.forEach(plt => {
      if (!plt.wells.hasOwnProperty('compoundIds')) return;  // unmapped
      plt.wells.compoundIds.forEach((c, i) => {
        if (compoundIds.includes(c)) {
          mapping[c] = plt.wells.rawValues[i];
        }
      });
    });
    const now = new Date();
    return {
      created: now.toString(),
      mapping: mapping
    };
  });
}
exports.getRawValuesMappingColumn = getRawValuesMappingColumn;


function getRawValuesByCompound(compoundId) {
  const query = `/plates?q=wells.compoundIds%3A${compoundId}\
&fields=wells.rawValues%2Cwells.compoundIds`;
  return request(query).then(res => {
    const rcds = [];
    res.plates.forEach(plt => {
      if (!plt.wells.hasOwnProperty('compoundIds')) return;  // unmapped
      const i = plt.wells.compoundIds.findIndex(c => c === compoundId);
      rcds.push({
        qcsRefId: plt.qcsRefId,
        layerIndex: plt.layerIndex,
        rawValue: plt.wells.rawValues[i]
      });
    });
    const now = new Date();
    return {
      created: now.toString(),
      records: rcds
    };
  });
}
exports.getRawValuesByCompound = getRawValuesByCompound;


function getFittingByQcs(qcsRefIds, layerIndex) {
  const joined = qcsRefIds.join('%2C');
  const query = `/compounds?qcsRefIds=${joined}\
&layerIndices=${layerIndex - 1}\
&fields=compoundId%2Cfitting.drcPlot%2Cfitting.linearAC50%2Cfitting.hillCoefficient`;
  return request(query).then(res => {
    const rcds = res.compounds.map(c => {
      return {
        ID: c.compoundId,
        drcPlot: c.fitting.drcPlot,
        AC50: c.fitting.linearAC50,
        hill: Math.round(c.fitting.hillCoefficient * 100) / 100
      };
    });
    const now = new Date();
    return {
      created: now.toString(),
      records: rcds
    };
  });
}
exports.getFittingByQcs = getFittingByQcs;


function getAC50MappingColumn(qcsRefIds, layerIndex, compoundIds) {
  const joined = qcsRefIds.join('%2C');
  const query = `/compounds?qcsRefIds=${joined}\
&layerIndices=${layerIndex - 1}\
&fields=compoundId%2Cfitting.linearAC50`;
  return request(query).then(res => {
    const mapping = {};
    res.compounds.forEach(c => {
      if (compoundIds.includes(c.compoundId)) {
        mapping[c] = c.fitting.linearAC50;
      }
    });
    const now = new Date();
    return {
      created: now.toString(),
      mapping: mapping
    };
  });
}
exports.getAC50MappingColumn = getAC50MappingColumn;


function getFittingByCompound(compoundId) {
  const query = `/compounds?q=compoundId%3A${compoundId}\
&fields=compoundId%2CqcsRefId%2ClayerIndex\
%2Cfitting.drcPlot%2Cfitting.linearAC50%2Cfitting.hillCoefficient`;
  return request(query).then(res => {
    const rcds = res.compounds.map(c => {
      return {
        ID: c.compoundId,
        drcPlot: c.fitting.drcPlot,
        AC50: c.fitting.linearAC50,
        hill: Math.round(c.fitting.hillCoefficient * 100) / 100,
        qcsRefId: c.qcsRefId,
        layerIndex: c.layerIndex
      };
    });
    const now = new Date();
    return {
      created: now.toString(),
      records: rcds
    };
  });
}
exports.getFittingByCompound = getFittingByCompound;


function getDrcPlot(compoundId, plotId, min = -20, max = 120) {
  const query = `/${plotId}?width=180&height=180&title=compoundId\
&activityRangeMin=${min}&activityRangeMax=${max}`;
  return request(query);
}
exports.getDrcPlot = getDrcPlot;


function getQcsInfo(qcsRefIds) {
  const ids = qcsRefIds.map(e => `qcsRefId:${e}`).join(' OR ');
  const query = `/qcSessions?q=${ids}`;
  return request(query).then(res => res.qcSessions);
}
exports.getQcsInfo = getQcsInfo;

function getAllResults(qcsRefId, layerIdx) {
  const query = `/plates?qcsRefIds=${qcsRefId}\
&layerIndices=${layerIdx}\
&limit=200\
&fields=barcode%2CzPrime%2CwellTypes%2Cwells.rawValues%2Cwells.compoundIds`;
  return request(query, res => res);
}
exports.getAllResults = getAllResults;


function getPlateStats(allResults) {
  const plates = allResults.plates;
  const parsed = plates.map(p => {
    const lowMean = p.wellTypes.NEUTRAL_CONTROL.mean;
    const lowStdDev = p.wellTypes.NEUTRAL_CONTROL.sd;
    const highMean = p.wellTypes.INHIBITOR_CONTROL.mean;
    const highStdDev = p.wellTypes.INHIBITOR_CONTROL.sd;
    return {
      barcode: p.barcode,
      lowCtrlMean: lowMean,
      lowCtrlStdDev: lowStdDev,
      lowCtrlCV: lowStdDev / lowMean * 100,
      highCtrlMean: highMean,
      highCtrlStdDev: highStdDev,
      highCtrlCV: highStdDev / highMean * 100,
      SignalBackground: lowMean / highMean,
      zPrime: p.zPrime
    };
  });
  return parsed;
}
exports.getPlateStats = getPlateStats;


function getWellValues(allResults) {
  const plates = allResults.plates;
  const results = {};
  plates.forEach(p => {
    p.wells.compoundIds.forEach((value, i) => {
      if (value !== null) {
        results[value] = p.wells.rawValues[i];
      }
    });
  });
  return results;
}
exports.getWellValues = getWellValues;


function getFirstPlateValues(qcsRefId, layerIdxs) {
  const query = `/plates?qcsRefIds=${qcsRefId}\
&layerIndices=${layerIdxs}\
&q=plateIndex%3A0\
&fields=layerIndex%2CzPrime%2CwellTypes%2Cwells.rawValues%2Cwells.compoundIds`;
  return request(query, res => {
    const results = {};
    res.plates.forEach(p => {
      const idx = p.layerIndex;
      p.wells.compoundIds.forEach(value => {
        if (value !== null) {
          if (!results.hasOwnProperty(value)) {
            results[value] = {};
          }
          results[value][idx] = p.wells.rawValues[idx];
        }
      });
    });
  });
}
exports.getFirstPlateValues = getFirstPlateValues;
*/
