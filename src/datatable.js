
/** @module datatable */

import d3 from 'd3';

import {default as d3form} from './helper/d3Form.js';
import {default as def} from './helper/definition.js';
import {default as hfile} from './helper/file.js';
import {default as loader} from './Loader.js';
import {default as store} from './store/StoreConnection.js';
import {default as dialog} from './component/Dialog.js';
import {default as header} from './component/Header.js';
import {default as grid} from './component/DataGrid.js';

const localServer = store.localChemInstance();


function idLink(rcds, idKey) {
  rcds.filter(e => e.hasOwnProperty(idKey))
    .forEach(e => {
      e[idKey] = `<a href="profile.html?compound=${e[idKey]}" target="_blank">${e[idKey]}</a>`;
    });
}


function renderTableContents(tbl) {
  return store.getCurrentRecords().then(rcds => {
    const copied = JSON.parse(JSON.stringify(rcds));  // deep copy
    idLink(copied, 'ID');
    d3.select('#datatable')
      .call(grid.createDataGrid, tbl)
      .call(grid.dataGridRecords, copied, d => d._index)
      .call(grid.addSort, copied, d => d._index);
    if (!store.getGlobalConfig('onLine')) return Promise.resolve();
    dialog.graphDialog(tbl, rcds, res => {
      res.networkThreshold = res.query.threshold;
      return store.insertTable(res).then(() => {
        d3.select('#loading-circle').style('display', 'none');
        window.open(`graph.html?id=${res.id}`, '_blank');
      });
    });
    dialog.joinDialog(tbl, rcds, mappings => {
      return Promise.all(mappings.map(e => store.joinColumn(e))).then(render);
    });
  });
}


function render() {
  return store.getCurrentTable().then(tbl => {
    dialog.columnDialog(tbl, render);
    dialog.importColDialog(tbl, colMaps => {
      const joined = colMaps.map(mp => store.joinColumn(mp));
      return Promise.all(joined).then(render);
    });
    header.renderStatus(tbl, refresh, abort);
    d3.select('#rename')
      .on('click', () => {
        d3.select('#prompt-title').text('Rename table');
        d3.select('#prompt-label').text('New name');
        d3.select('#prompt-input').attr('value', tbl.name);
        d3.select('#prompt-submit')
          .on('click', () => {
            const name = d3form.value('#prompt-input');
            return store.updateTableAttribute(tbl.id, 'name', name)
              .then(store.getCurrentTable)
              .then(t => header.renderStatus(t, refresh, abort));
          });
      });
    d3.select('#export')
      .on('click', () => hfile.downloadJSON(tbl, tbl.name, true));
    if (store.getGlobalConfig('onLine')) {
      d3.select('#excel')
        .on('click', () => {
          const query = {json: new Blob([JSON.stringify(tbl)])};
          return localServer.exportExcel(query)
            .then(xhr => hfile.downloadDataFile(xhr, `${tbl.name}.xlsx`));
        });
      d3.select('#sdfile')
        .on('click', () => {
          const query = {json: new Blob([JSON.stringify(tbl)])};
          return localServer.exportSDFile(query)
            .then(xhr => hfile.downloadDataFile(xhr, `${tbl.name}.sdf`));
        });
    }
    return renderTableContents(tbl);
  });
}



function loadNewTable(data) {
  return store.insertTable(data).then(() => {
    window.location = `datatable.html?id=${data.id}`;
  });
}


function fetch_(command) {
  return store.getCurrentTable().then(data => {
    if (!def.fetchable(data)) return;
    const queries = {id: data.id, command: command};
    return localServer.getRecords(queries)
      .then(res => {
        return store.getDataSourceColumns(res.domain, res.dataSource)
          .then(cols => store.getFetcher(res.domain).formatResult(cols, res));
      }).then(store.updateTable);
  });
}


function refresh() {
  if (!store.getGlobalConfig('onLine')) return Promise.resolve();
  return fetch_('update').then(isUpdated => {
    if (isUpdated !== undefined) return render();
  });
}


function abort() {
  return fetch_('abort').then(isUpdated => {
    if (isUpdated !== undefined) return render();
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
  if (store.getGlobalConfig('urlQuery').hasOwnProperty('location')) {
    const url = store.getGlobalConfig('urlQuery').location;
    return hfile.fetchJSON(url)
      .then(tbl => store.insertTable(tbl).then(() => tbl.id))
      .then(id => {
        window.location = `datatable.html?id=${id}`;
      });
  }
  return loader.loader().then(() => {
    if (!store.getGlobalConfig('onLine')) {
      d3.selectAll('.online-command')
        .style('color', '#cccccc')
        .classed('disabled', true)
        .on('click', () => d3.event.stopPropagation());
    }
    if (store.getGlobalConfig('urlQuery').hasOwnProperty('id')) {
      header.initializeWithData();
      return fetch_('update').then(render);
    } else {
      header.initialize();
      dialog.sdfDialog(loadNewTable);
      if (!store.getGlobalConfig('onLine')) return Promise.resolve();
      return store.getResources('chemical').then(rsrc => {
        dialog.pickDialog(rsrc, loadNewTable);
        dialog.structDialog(rsrc, loadNewTable);
        dialog.propDialog(rsrc, loadNewTable);
      });
    }
  });
}


export default {
  grid, render, run
};
