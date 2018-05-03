
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
  const menubar = d3.select('#menubar');
  menubar.selectAll('div,span,a').remove();  // Clean up
  const dialogs = d3.select('#dialogs');
  dialogs.selectAll('div').remove();  // Clean up

  // New datagrid menu
  const menu = menubar.append('div')
      .call(button.dropdownMenuButton, 'Datagrid', 'primary', 'plus-white')
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
      .call(button.dropdownMenuFile, 'Import JSON', '.ndc,.ndr,.json,.gz', 'import')
      .on('change', function () {
        const file = button.dropdownMenuFileValue(d3.select(this));
        hfile.loadJSON(file)
          .then(item => datagridApp.app(item, serverStatus, schema));
      });
  // Control panel
  menubar.append('a')
      .call(button.menuButtonLink, 'Store', 'outline-secondary', 'db-gray')
      .attr('href', 'control.html')
      .attr('target', '_blank');

  // disable on-line commands
  if (!serverStatus.instance) {
    menu.selectAll('.searchd, .structd, .filterd, .sdfd')
      .attr('data-target', null)
      .classed('disabled', true);
  }

  // Dialogs
  const chemrsrc = schema.resources.filter(e => e.domain === 'chemical');
  // ID search
  dialogs.append('div')
      .call(searchDialog.body, schema.compoundIDPlaceholder)
      .on('submit', function () {
        const targets = chemrsrc.map(e => e.id);
        const query = searchDialog.query(d3.select(this), targets);
        return fetcher.get(query.workflow, query)
          .then(registerWorkflow);  // TODO: if err -> show err img
      });
  // Structure search
  dialogs.append('div')
      .call(structDialog.body, chemrsrc, serverStatus.rdkit)
      .on('submit', function () {
        const query = structDialog.query(d3.select(this));
        return fetcher.get(query.workflow, query)
          .then(registerWorkflow);
      });
  // Filter
  dialogs.append('div')
      .call(filterDialog.body, chemrsrc)
      .on('submit', function () {
        const query = filterDialog.query(d3.select(this));
        return fetcher.get(query.workflow, query)
          .then(registerWorkflow);
      });
  // Import SDFile
  dialogs.append('div')
      .call(sdfDialog.body, chemrsrc)
      .on('submit', function () {
        const formData = sdfDialog.queryFormData(d3.select(this));
        return fetcher.post('sdfin', formData)
          .then(registerWorkflow);
      });
}


export default {
  app
};
