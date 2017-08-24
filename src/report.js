
import d3 from 'd3';
import {
  formValue, checkboxValues, textareaLines
} from './helper/d3Selection.js';
import {downloadDataFile} from './helper/file.js';
import {loader} from './Loader.js';
import {getGlobalConfig, getFetcher} from './store/StoreConnection.js';
import {
  selectOptions, createTable, updateTableRecords
} from './component/Component.js';


function updateTemplates() {
  const tmpls = getGlobalConfig('templates');
  d3.select('#templates')
    .call(selectOptions, [{ name: '<No template>' }].concat(tmpls),
          d => d.sourceFile, d => d.name);
}


d3.select('#refids-submit').on('click', () => {
  const qcsIds = textareaLines('#refids');
  let fetcher;
  if (getFetcher('screenerfitting').available === true) {
    fetcher = getFetcher('screenerfitting');
  } else {
    fetcher = getFetcher('screenerfittingstub');
  }
  fetcher.getQcsInfo(qcsIds).then(qcsInfo => {
    const qcsData = {
      columns: [
        {key: "QCSRefId"},
        {key: "Name"}
      ],
      records: []
    };
    const layerSize = [];
    qcsInfo.forEach(q => {
      const row = {QCSRefId: q.qcsRefId, Name: q.name};
      q.layers.forEach(y => {
        // const type = y.type;
        // layerIndex starts with 0, but Index shown in Analyser starts with 1.
        row[`Layer${y.layerIndex + 1}`] = y.name;
      });
      layerSize.push(q.layers.length);
      qcsData.records.push(row);
    });
    const layerMax = Math.max.apply(null, layerSize);
    const valueSelector = {Name: '<b>Values</b>'};
    const statSelector = {Name: '<b>Statistics</b>'};
    for (let i = 0; i < layerMax; i++) {
      qcsData.columns.push({key: `Layer${i + 1}`});
      valueSelector[`Layer${i + 1}`] = `<span class="vidx"><input type="checkbox" value="${i}"></span>`;
      statSelector[`Layer${i + 1}`] = `<span class="sidx"><input type="checkbox" value="${i}"></span>`;
    }
    qcsData.records.push(valueSelector);
    qcsData.records.push(statSelector);
    return qcsData;
  }).then(qcsData => {
    d3.select('#qcs-table').call(createTable, qcsData)
      .call(updateTableRecords, qcsData.records, d => d.QCSRefId);
    d3.select('#qcs-table').selectAll('input')
      .on('click', () => {
        const vsel = checkboxValues(".vidx");
        const ssel = checkboxValues(".sidx");
        const anyChecked = vsel.length + ssel.length > 0 ? null : 'disabled';
        d3.select('#preview-submit').attr('disabled', anyChecked);
        d3.select('#report-submit').attr('disabled', anyChecked);
      });
  });
});


d3.select('#preview-submit')
  .on('click', () => {
    const query = {
      qcsid: d3.select('#qcs-table tbody').selectAll('tr').data()[0].QCSRefId,
      template: formValue('#templates'),
      vsel: checkboxValues(".vidx")
    };
    return getFetcher('chemical').reportPreview(query).then(res => {
      d3.select('#preview-desc').style('display', 'block');
      d3.select('#preview-table').call(createTable, res)
        .call(updateTableRecords, res.records, d => d.compoundId);
    });
  });


d3.select('#report-submit')
  .on('click', () => {
    const query = {
      qcsid: d3.select('#qcs-table tbody').selectAll('tr').data()[0].QCSRefId,
      template: formValue('#templates'),
      vsel: checkboxValues(".vidx"),
      ssel: checkboxValues(".sidx")
    };
    return getFetcher('chemical').report(query).then(xhr => {
      downloadDataFile(xhr, `${query.qcsid}.xlsx`);
    });
  });


d3.select('#refids')
  .on('input', () => {
    d3.select('#refids-submit').attr('disabled',
      formValue('#refids').length === 0 ? 'disabled' : null
    );
  });
d3.select('#refids-submit').attr('disabled',
  formValue('#refids').length === 0 ? 'disabled' : null
);


function run() {
  return loader().then(updateTemplates);
}
run();
