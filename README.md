
kiwiii-client
================

Kiwiii is a web-based client-server application for chemical data analysis and visualization.



Supported browsers
--------------------

- Google Chrome 57+
- Mozilla Firefox 50+ (may have some layout issues)



Screen shots
--------------

[<img src="img/table-view.png" width="260" height="160" alt="Table view" style="margin: 5px"/>](img/table-view.png)
[<img src="img/network-view.png" width="260" height="160" alt="Network view" style="margin: 5px"/>](img/network-view.png)
[<img src="img/control-panel.png" width="260" height="160" alt="Control panel" style="margin: 5px"/>](img/control-panel.png)



Bl.ocks samples
-----------------

[![thumbnail](https://gist.github.com/mojaie/a89c7ba0ba1ee5c91a387e3fd1e8ae4e/raw/7a8f8a11ce12674fe3b1e975e98e68a443a78c93/thumbnail.png)](https://bl.ocks.org/mojaie/a89c7ba0ba1ee5c91a387e3fd1e8ae4e)
[![thumbnail](https://gist.github.com/mojaie/89293ef2f946ecb43dd3cdd73fdd64ac/raw/396f5ca5969dce3812c4ecff17d3c923350dfbab/thumbnail.png)](https://bl.ocks.org/mojaie/89293ef2f946ecb43dd3cdd73fdd64ac)



Application
---------------


- [Table view demo (DrugBank Approved drugs)](https://mojaie.github.io/kiwiii-client/datatable.html?location=resources/ApprovedFiltered.json.gz)
  - Sortable chemical structure table


- [Network view demo (DrugBank Approved drugs)](https://mojaie.github.io/kiwiii-client/graph.html?location=resources/ApprovedFiltered_GLS10.json.gz)
  - Network of chemical structure nodes connected with structure similarity relationship (known as Chemical Space Network)
  - Force-directed layout implemented with d3-force


- [Control panel](https://mojaie.github.io/kiwiii-client/control.html)
  - This shows the list of dataset stored in the web browser. Click "Reset local datastore" button to clean up it.
  - The web application uses IndexedDB for the persistent storage. The dataset will remain in the browser local storage until it is deleted via control panel. Be careful not to leave confidential data on public access PC.


If you already have kiwiii dataset file (.json.gz), use the following link and then load the data.

- [Load new table view](https://mojaie.github.io/kiwiii-client/datatable.html)

- [Load new network view](https://mojaie.github.io/kiwiii-client/graph.html)



API Documentation (WIP)
------------------------

https://mojaie.github.io/kiwiii-client/docs




License
--------------

[MIT license](http://opensource.org/licenses/MIT)



Copyright
--------------

(C) 2014-2017 Seiji Matsuoka
