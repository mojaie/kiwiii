
kiwiii-client
================

Kiwiii is a chemical data analysis and visualization platform based on HTTP server-client model.


Screen shots
--------------

[<img src="img/table-view.png" width="260" height="160" alt="Table view" style="margin: 5px"/>](img/table-view.png)
[<img src="img/network-view.png" width="260" height="160" alt="Network view" style="margin: 5px"/>](img/network-view.png)
[<img src="img/control-panel.png" width="260" height="160" alt="Control panel" style="margin: 5px"/>](img/control-panel.png)



Demo
--------------

A 1046 approved drug data extracted from [DrugBank](https://www.drugbank.ca/) dataset (permitted to use under [Creative Common’s by-nc 4.0 License](https://creativecommons.org/licenses/by-nc/4.0/legalcode))

- [Table view (DrugBank Approved drugs)](https://mojaie.github.io/kiwiii-client/datatable.html?location=resources/ApprovedFiltered.json.gz)
  - Sortable chemical structure table with fast scrolling.


- [Network view (DrugBank Approved drugs)](https://mojaie.github.io/kiwiii-client/graph.html?location=resources/ApprovedFiltered_GLS10.json.gz)
  - Network of chemical structure nodes connected with structure similarity relationship (known as Chemical Space Network).
  - Force-directed layout implemented with d3-force.


If you already have kiwiii dataset file (.json.gz), use the following link and then load the data.

- [Table view](https://mojaie.github.io/kiwiii-client/datatable.html)

- [Network view](https://mojaie.github.io/kiwiii-client/graph.html)



Keywords
--------------

Drug discovery, Cheminformatics, Data visualization



License
--------------

[MIT license](http://opensource.org/licenses/MIT)



Copyright
--------------

(C) 2014-2017 Seiji Matsuoka
