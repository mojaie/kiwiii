
kiwiii-client
================

Kiwiii is a web-based client-server application for chemical data analysis and visualization.



Screen shots
--------------

[<img src="img/table-view.png" width="260" height="160" alt="Table view" style="margin: 5px"/>](img/table-view.png)
[<img src="img/network-view.png" width="260" height="160" alt="Network view" style="margin: 5px"/>](img/network-view.png)
[<img src="img/control-panel.png" width="260" height="160" alt="Control panel" style="margin: 5px"/>](img/control-panel.png)



Supported browsers
--------------------

- Google Chrome 57+
- Mozilla Firefox 50+ (may have some layout issues)



Demo
--------------

A 1046 approved drug data extracted from [DrugBank](https://www.drugbank.ca/) dataset (permitted to use under [Creative Common’s by-nc 4.0 License](https://creativecommons.org/licenses/by-nc/4.0/legalcode))

- [Table view (DrugBank Approved drugs)](https://mojaie.github.io/kiwiii-client/datatable.html?location=resources/ApprovedFiltered.json.gz)
  - Sortable chemical structure table


- [Network view (DrugBank Approved drugs)](https://mojaie.github.io/kiwiii-client/graph.html?location=resources/ApprovedFiltered_GLS10.json.gz)
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
