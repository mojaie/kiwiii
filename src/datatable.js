
import d3 from 'd3';

import {formValue} from './helper/d3Selection.js';
import {fetchable} from './helper/definition.js';
import {fetchJSON, loadJSON, downloadJSON, downloadDataFile} from './helper/file.js';
import {loader} from './Loader.js';
import {
  getGlobalConfig, getFetcher, getResources, getDataSourceColumns,
  localChemInstance, insertTable, updateTable, joinColumn,
  getCurrentTable, getCurrentRecords, updateTableAttribute
} from './store/StoreConnection.js';
import {pickDialog, structDialog, propDialog, sdfDialog,
  columnDialog, importColDialog, joinDialog, graphDialog
} from './component/Dialog.js';
import {renderStatus, initialize, initializeWithData} from './component/Header.js';
import {
  createDataGrid, dataGridRecords, addSort
} from './component/DataGrid.js';
const localServer = localChemInstance();


function idLink(rcds, idKey) {
  rcds.filter(e => e.hasOwnProperty(idKey))
    .forEach(e => {
      e[idKey] = `<a href="profile.html?compound=${e[idKey]}" target="_blank">${e[idKey]}</a>`;
    });
}


function renderTableContents(tbl) {
  return getCurrentRecords().then(rcds => {
    const copied = JSON.parse(JSON.stringify(rcds));  // deep copy
    idLink(copied, 'ID');
    d3.select('#datatable')
      .call(createDataGrid, tbl)
      .call(dataGridRecords, copied, d => d._index)
      .call(addSort, copied, d => d._index);
    if (!getGlobalConfig('onLine')) return Promise.resolve();
    graphDialog(tbl, rcds, res => {
      res.networkThreshold = res.query.threshold;
      return insertTable(res).then(() => {
        d3.select('#loading-circle').style('display', 'none');
        window.open(`graph.html?id=${res.id}`, '_blank');
      });
    });
    joinDialog(tbl, rcds, mappings => {
      return Promise.all(mappings.map(e => joinColumn(e))).then(render);
    });
  });
}


function render() {
  return getCurrentTable().then(tbl => {
    columnDialog(tbl, render);
    importColDialog(tbl, colMaps => {
      const joined = colMaps.map(mp => joinColumn(mp));
      return Promise.all(joined).then(render);
    });
    renderStatus(tbl, refresh, abort);
    d3.select('#rename')
      .on('click', () => {
        d3.select('#prompt-title').text('Rename table');
        d3.select('#prompt-label').text('New name');
        d3.select('#prompt-input').attr('value', tbl.name);
        d3.select('#prompt-submit')
          .on('click', () => {
            const name = formValue('#prompt-input');
            return updateTableAttribute(tbl.id, 'name', name)
              .then(getCurrentTable)
              .then(t => renderStatus(t, refresh, abort));
          });
      });
    d3.select('#export')
      .on('click', () => downloadJSON(tbl, tbl.name, true));
    if (getGlobalConfig('onLine')) {
      d3.select('#excel')
        .on('click', () => {
          const query = {json: new Blob([JSON.stringify(tbl)])};
          return localServer.exportExcel(query)
            .then(xhr => downloadDataFile(xhr, `${tbl.name}.xlsx`));
        });
      d3.select('#sdfile')
        .on('click', () => {
          const query = {json: new Blob([JSON.stringify(tbl)])};
          return localServer.exportSDFile(query)
            .then(xhr => downloadDataFile(xhr, `${tbl.name}.sdf`));
        });
    }
    return renderTableContents(tbl);
  });
}


d3.select('#import-json')
  .on('click', () => document.getElementById('select-file').click());
d3.select('#select-file')
  .on('change', () => {
    const file = document.getElementById('select-file').files[0];
    loadJSON(file).then(loadNewTable);
  });


function loadNewTable(data) {
  return insertTable(data).then(() => {
    window.location = `datatable.html?id=${data.id}`;
  });
}


function fetch_(command) {
  return getCurrentTable().then(data => {
    if (!fetchable(data)) return;
    const queries = {id: data.id, command: command};
    return localServer.getRecords(queries)
      .then(res => {
        return getDataSourceColumns(res.domain, res.dataSource)
          .then(cols => getFetcher(res.domain).formatResult(cols, res));
      }).then(updateTable);
  });
}


function refresh() {
  if (!getGlobalConfig('onLine')) return Promise.resolve();
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
  if (getGlobalConfig('urlQuery').hasOwnProperty('location')) {
    const url = getGlobalConfig('urlQuery').location;
    return fetchJSON(url)
      .then(tbl => insertTable(tbl).then(() => tbl.id))
      .then(id => {
        window.location = `datatable.html?id=${id}`;
      });
  }
  return loader().then(() => {
    if (!getGlobalConfig('onLine')) {
      d3.selectAll('.online-command')
        .style('color', '#cccccc')
        .classed('disabled', true)
        .on('click', () => d3.event.stopPropagation());
    }
    if (getGlobalConfig('urlQuery').hasOwnProperty('id')) {
      initializeWithData();
      return fetch_('update').then(render);
    } else {
      initialize();
      sdfDialog(loadNewTable);
      if (!getGlobalConfig('onLine')) return Promise.resolve();
      return getResources('chemical').then(rsrc => {
        pickDialog(rsrc, loadNewTable);
        structDialog(rsrc, loadNewTable);
        propDialog(rsrc, loadNewTable);
      });
    }
  });
}
run();
