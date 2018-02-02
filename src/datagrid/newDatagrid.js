
/** @module datagrid/newDatagrid */

import d3 from 'd3';

import {default as misc} from '../common/misc.js';
import {default as idb} from '../common/idb.js';
import {default as fetcher} from '../common/fetcher.js';
import {default as hfile} from '../common/file.js';

import {default as button} from '../component/button.js';

import {default as searchDialog} from '../dialog/search.js';
import {default as structDialog} from '../dialog/struct.js';
import {default as filterDialog} from '../dialog/filter.js';
import {default as sdfDialog} from '../dialog/sdf.js';

import {default as datagridApp} from './datagridApp.js';


function registerWorkflow(fetched) {
  return fetcher.json(fetched)
    .then(data => {
      data.fields = misc.defaultFieldProperties(data.fields);
      return data;
    })
    .then(idb.putItem)
    .then(storeID => {
      window.location = `datagrid.html?id=${storeID}`;
    });
  }


function app(serverStatus, schema) {
  // Menubar
  const menubar = d3.select('#menubar');
  menubar.selectAll('div,span,a').remove();  // Clean up
  // New datagrid menu
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, null, '+ New datagrid', 'primary')
      .select('.dropdown-menu');
  menu.append('a')
      .classed('searchd', true)
      .call(searchDialog.menuLink);
  menu.append('a')
      .classed('structd', true)
      .call(structDialog.menuLink);
  menu.append('a')
      .classed('filterd', true)
      .call(filterDialog.menuLink);
  menu.append('a')
      .classed('sdfd', true)
      .call(sdfDialog.menuLink);
  menu.append('a')
      .classed('import', true)
      .call(button.dropdownMenuFile, 'import', 'Import view', '.ndc,.ndr,.json,.gz')
      .on('change', function () {
        const file = button.dropdownMenuFileValue(d3.select(this));
        hfile.loadJSON(file)
          .then(item => datagridApp.app(item, serverStatus, schema));
      });
  // Control panel
  menubar.append('a')
      .call(button.menuButtonLink, null, 'Control panel', 'outline-secondary')
      .attr('href', 'control.html')
      .attr('target', '_blank');

  // Dialogs
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up
  if (!schema) {
    menu.selectAll('.searchd, .structd, .filterd, .sdfd')
      .property('disabled', true);
    return;
  }
  const chemrsrc = schema.resources.filter(e => e.domain === 'chemical');
  // ID search
  const searchd = dialogs.append('div')
      .call(searchDialog.body, schema.compoundIDPlaceholder);
  searchd.select('.submit')
      .on('click', function () {
        d3.select('#loading-icon').style('display', 'inline');
        const targets = chemrsrc.map(e => e.id);
        const query = searchDialog.query(searchd, targets);
        return fetcher.get(query.workflow, query)
          .then(registerWorkflow);  // TODO: if err -> show err img
      });
  // Structure search
  const structd = dialogs.append('div')
      .call(structDialog.body, chemrsrc, serverStatus.rdkit);
  structd.select('.submit')
      .on('click', function () {
        d3.select('#loading-icon').style('display', 'inline');
        const query = structDialog.query(structd);
        return fetcher.get(query.workflow, query)
          .then(registerWorkflow);
      });
  // Filter
  const filterd = dialogs.append('div')
      .call(filterDialog.body, chemrsrc);
  filterd.select('.submit')
      .on('click', function () {
        d3.select('#loading-icon').style('display', 'inline');
        const query = filterDialog.query(filterd);
        return fetcher.get(query.workflow, query)
          .then(registerWorkflow);
      });
  // Import SDFile
  const sdfd = dialogs.append('div')
      .call(sdfDialog.body, chemrsrc);
  sdfd.select('.submit')
      .on('click', () => {
        d3.select('#loading-icon').style('display', 'inline');
        const formData = sdfDialog.queryFormData(sdfd);
        return fetcher.post('sdfin', formData)
          .then(registerWorkflow);
      });
}


export default {
  app
};
