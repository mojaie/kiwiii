
Kiwiii
================

[<img src="assets/screenshots/network-view.png" width="260" height="160" alt="Network view" style="margin: 5px"/>](assets/screenshots/network-view.png)
[<img src="assets/screenshots/network-potency.png" width="260" height="160" alt="Network potency" style="margin: 5px"/>](assets/screenshots/network-potency.png)
[<img src="assets/screenshots/tile-heatmap.png" width="260" height="160" alt="Tile view" style="margin: 5px"/>](assets/screenshots/tile-heatmap.png)
[<img src="assets/screenshots/table-view.png" width="260" height="160" alt="Table view" style="margin: 5px"/>](assets/screenshots/table-view.png)
[<img src="assets/screenshots/spr-plot-example.png" width="260" height="160" alt="Plot example" style="margin: 5px"/>](assets/screenshots/spr-plot-example.png)
[<img src="assets/screenshots/dashboard.png" width="260" height="160" alt="Dashboard" style="margin: 5px"/>](assets/screenshots/dashboard.png)
[<img src="assets/screenshots/profile-view.png" width="260" height="160" alt="Profile view" style="margin: 5px"/>](assets/screenshots/profile-view.png)


Kiwiii is a web application package for chemical data analysis and visualization.

Datagrid module, which is mainly designed for drug candidate data profiling, has sortable smooth scroll table with chemical structure SVG data and plot columns. [Flashflood](https://github.com/mojaie/flashflood)  web server will help continuous data integration by offering workflow pipeline and parallel computation job scheduling via HTTP.

Network module offers a platform for network-based structure-activity relationship (SAR) analysis. This network consists of chemical structure similarity connections among each chemical entity nodes. General graph analysis methods are applied to the network to find meaningful relationship in the chemical space.

As the dataset specifications of them are based on JSON, many of available data resources on the internet can be easily imported for the integrated data analysis. The visualized analysis results can be exported to compressed JSON reversibly (also SDFile and Excel but irreversibly). Their fine portability also accelerates data exchange for collaborations.

Supported browsers
--------------------

- Google Chrome 57+
- Mozilla Firefox 50+



Try instant data view examples (Observable)
------------------------------------------------

[<img src="https://static.observableusercontent.com/thumbnail/b4859341f456ac329799b35f0394e976ed1f0198fc334b134853537be7ff8d53.jpg" width="260" height="160" alt="Table view" style="margin: 5px"/>](https://beta.observablehq.com/@mojaie/drug-dataset-table-demo)
[<img src="https://static.observableusercontent.com/thumbnail/367584488cbc326ac7e2e4cf28ccacba6c11a05d44c6253221e0dfa711d70e45.jpg" width="260" height="160" alt="Table view" style="margin: 5px"/>](https://beta.observablehq.com/@mojaie/chemical-structure-similarity-network-demo)



Try demo applications
---------------------------------

### 1. Launch the demo application

[https://mojaie.github.io/kiwiii/app/dashboard.html](https://mojaie.github.io/kiwiii/app/dashboard.html)

[<img src="assets/screenshots/dashboard.png" width="260" height="160" alt="Dashboard" style="margin: 5px"/>](assets/screenshots/dashboard.png)


### 2. Open test data files (Start Menu -> Open file)

- [Structure-activity map of EGFR Tyrosine kinase Inhibitors (PubChem AID 578)](https://mojaie.github.io/kiwiii/assets/resources/AID578_EGFRTyr.apc)
- [Drug clustering by structure similarity (DrugBank 5.0.5 FDA Approved)](https://mojaie.github.io/kiwiii/assets/resources/DrugBank5.0.5_FDA_Approved_GLS08.gfc)
- [SPR sensorgram plot table](https://mojaie.github.io/kiwiii/assets/resources/SPR_results_demo.ndc)

Opened file will be automatically stored into local web storage (IndexedDB). Click "Reset local datastore" button to clean up it. Be careful not to leave confidential data on a public access PC.)


### 3. Select a view


#### Datagrid view

[<img src="assets/screenshots/table-view.png" width="260" height="160" alt="Table view" style="margin: 5px"/>](assets/screenshots/table-view.png)
[<img src="assets/screenshots/spr-plot-example.png" width="260" height="160" alt="Plot example" style="margin: 5px"/>](assets/screenshots/spr-plot-example.png)


##### Features

- [SlickGrid](https://github.com/mleibman/SlickGrid)-like smooth scroll datatable
- Sortable
- Row filter by keyword
- User input column (checkbox and comment)
- PNG, SVG image column (ex. chemical structure column)
- Plot column ([Vega version 3](https://vega.github.io/vega/) plot data)


#### Network view

[<img src="assets/screenshots/network-view.png" width="260" height="160" alt="Network view" style="margin: 5px"/>](assets/screenshots/network-view.png)
[<img src="assets/screenshots/network-potency.png" width="260" height="160" alt="Network potency" style="margin: 5px"/>](assets/screenshots/network-potency.png)


##### Features

- Visualized network of chemical structure nodes connected with structure similarity relationship (known as [Chemical Space Network](https://doi.org/10.1007/s10822-014-9760-0))
- Force-directed layout implemented with d3-force
- Interactive zoom and drag
- Community detection ([jLouvain](https://github.com/upphiminn/jLouvain))


#### Tile view (Experimental)

[<img src="assets/screenshots/tile-heatmap.png" width="260" height="160" alt="Tile view" style="margin: 5px"/>](assets/screenshots/tile-heatmap.png)


##### Features

- Heatmap
- Microplate assay data interpretation



Client-server environment
------------------------------------

- Kiwiii and [Flashflood](https://github.com/mojaie/flashflood) forms client-server environment for chemical data analysis

### Flashflood APIs

- Database search
- Chemical structure search
- [Genedata Screener](https://www.genedata.com/products/screener/) access via REST API
- Chemical structure similarity network generation
- Export datagrid to SDFile and Excel


### Profile view

[<img src="assets/screenshots/profile-view.png" width="260" height="160" alt="Profile view" style="margin: 5px"/>](assets/screenshots/profile-view.png)

- An overview of the chemical data entry (chemical structure, properties, aliases and related assay results)



API Documentation (WIP)
------------------------

https://mojaie.github.io/kiwiii/app/docs



License
--------------

[MIT license](http://opensource.org/licenses/MIT)



Copyright
--------------

(C) 2014-2018 Seiji Matsuoka
