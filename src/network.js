
/** @module network */

import d3 from 'd3';

import {default as core} from './common/core.js';
import {default as hfile} from './common/file.js';
import {default as misc} from './common/misc.js';

import {default as button} from './component/button.js';

import NetworkState from './network/state.js';
import {default as view} from './network/view.js';
import {default as force} from './network/force.js';
import {default as interaction} from './network/interaction.js';
import {default as networkApp} from './network/networkApp.js';


function run() {
  // TODO: offline mode flags
  const localFile = document.location.protocol !== "file:";  // TODO
  const offLine = 'onLine' in navigator && !navigator.onLine;  // TODO
  const storeID = misc.URLQuery().id || null;
  const dataURL = misc.URLQuery().location || null;
  if (storeID) {
    // Load from IndexedDB store
    return core.fetchProgress(storeID, 'update')
      .then(() => networkApp.getGraph(storeID))
      .then(networkApp.app);
  } else if (dataURL) {
    // Fetch via HTTP
    return hfile.fetchJSON(dataURL)
      .then(networkApp.app);
  } else {
    // New network
    const menubar = d3.select('#menubar');
    menubar.selectAll('div,a').remove();
    const menu = menubar.append('div')
        .call(button.dropdownMenuButton, null, '+ New network', 'primary')
        .select('.dropdown-menu');
    menu.append('a')
        .call(button.dropdownMenuFile, 'import', 'Import view', '.gfc,.gfr,.json,.gz')
        .on('change', function () {
          const file = button.dropdownMenuFileValue(d3.select(this));
          hfile.loadJSON(file).then(networkApp.app);
        });
    menubar.append('a')
        .call(button.menuButton, null, 'Control panel', 'outline-secondary')
        .attr('href', 'control.html')
        .attr('target', '_blank');
  }
}


export default {
  NetworkState, view, force, interaction, run
};
