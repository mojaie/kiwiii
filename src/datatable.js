
/** @module datatable */

import d3 from 'd3';

import {default as d3form} from './helper/d3Form.js';
import {default as hfile} from './helper/file.js';
import {default as win} from './helper/window.js';
import {default as fetcher} from './fetcher.js';
import {default as common} from './common.js';
import {default as store} from './store/StoreConnection.js';
import {default as dialog} from './component/Dialog.js';
import {default as header} from './component/Header.js';
import {default as grid} from './component/DataGrid.js';


function idLink(rcds, idKey) {
  rcds.filter(e => e.hasOwnProperty(idKey))
    .forEach(e => {
      e[idKey] = `<a href="profile.html?compound=${e[idKey]}" target="_blank">${e[idKey]}</a>`;
    });
}


function render() {
  return store.getTable(win.URLQuery().id)
    .then(data => {
      dialog.columnDialog(data.fields, render);
      dialog.fieldFileDialog(mapping => {
        return store.joinFields(win.URLQuery().id, mapping).then(render);
      });
      header.renderStatus(
        data, () => common.fetchResults().then(render),
        () => common.fetchResults('abort').then(render));
      d3.select('#rename')
        .on('click', () => {
          d3.select('#prompt-title').text('Rename table');
          d3.select('#prompt-label').text('New name');
          d3.select('#prompt-input').attr('value', data.name);
          d3.select('#prompt-submit')
            .on('click', () => {
              const name = d3form.value('#prompt-input');
              return store.updateTableAttribute(data.id, 'name', name)
                .then(() => store.getTable(win.URLQuery().id)) // updateTableAttribute returns 1
                .then(t => header.renderStatus(
                  t, () => common.fetchResults().then(render),
                  () => common.fetchResults('abort').then(render))
                );
            });
        });
      // Following operations use data.records
      const copied = JSON.parse(JSON.stringify(data.records));  // deep copy
      idLink(copied, 'id');
      d3.select('#datatable')
        .call(grid.createDataGrid, data)
        .call(grid.dataGridRecords, copied, d => d._index)
        .call(grid.addSort, copied, d => d._index);
      store.getResources().then(rsrc => {
        const actres = rsrc.filter(e => e.domain === 'activity');
        const compoundIDs = data.records.map(e => e.id);
        dialog.fieldFetchDialog(compoundIDs, data.fields, actres, mapping => {
          return store.joinFields(win.URLQuery().id, mapping).then(render);
        });


      });
      dialog.graphDialog(params => {
        const formData = new FormData();
        formData.append('contents', new Blob([JSON.stringify(data)]));
        formData.append('params', JSON.stringify(params));
        return fetcher.post('simnet', formData)
          .then(fetcher.json)
          .then(json => {
            json.networkThreshold = json.query.threshold;
            return common.interactiveInsert(json)
              .then(id => {
                d3.select('#loading-circle').style('display', 'none');
                window.open(`graph.html?id=${id}`, '_blank');
              });
          }, fetcher.error);
      });
      d3.select('#export')
        .on('click', () => hfile.downloadJSON(data, data.name, true));
      d3.select('#excel')
        .on('click', () => {
          const formData = new FormData();
          formData.append('contents', new Blob([JSON.stringify(data)]));
          return fetcher.post('xlsx', formData)
            .then(fetcher.blob)
            .then(blob => hfile.downloadDataFile(blob, `${data.name}.xlsx`),
                  fetcher.error);
        });
      d3.select('#sdfile')
        .on('click', () => {
          const formData = new FormData();
          formData.append('contents', new Blob([JSON.stringify(data)]));
          return fetcher.post('sdfout', formData)
            .then(fetcher.text)
            .then(text => hfile.downloadDataFile(text, `${data.name}.sdf`),
                  fetcher.error);
        });
    });
}


function loadNewTable(data) {
  return common.interactiveInsert(data)
    .then(id => {
      // window.open(`datatable.html?id=${id}`);
      window.location = `datatable.html?id=${id}`;
    });
}


function run() {
  d3.select('#import-json')
    .on('click', () => document.getElementById('select-file').click());
  d3.select('#select-file')
    .on('change', () => {
      const file = document.getElementById('select-file').files[0];
      hfile.loadJSON(file).then(loadNewTable);
    });
  // location parameter enables direct access to datatable JSON via HTTP
  if (win.URLQuery().hasOwnProperty('location')) {
    const url = win.URLQuery().location;
    return hfile.fetchJSON(url)
      .then(common.interactiveInsert)
      .then(id => {
        window.location = `datatable.html?id=${id}`;
      });
  }
  return common.loader().then(serverStatus => {
    if (!serverStatus) {
      // Disable offline comannds
      d3.selectAll('.online-command')
        .style('color', '#cccccc')
        .classed('disabled', true)
        .on('click', () => d3.event.stopPropagation());
    }
    // Loading tables
    if (win.URLQuery().hasOwnProperty('id')) {
      header.initializeWithData();
      return common.fetchResults().then(render);
    } else {
      header.initialize();
      dialog.sdfDialog(loadNewTable);
      if (!serverStatus) return Promise.resolve();
      return store.getResources().then(rsrc => {
        const chemres = rsrc.filter(e => e.domain === 'chemical');
        dialog.pickDialog(chemres, loadNewTable);
        dialog.structDialog(chemres, loadNewTable);
        dialog.propDialog(chemres, loadNewTable);
      });
    }
  });
}


export default {
  grid, render, run
};
