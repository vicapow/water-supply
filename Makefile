

reservoirs: public/data/reservoirs.csv public/data/reservoirs.capacities.csv

public/data/reservoirs.csv: scrappers/reservoirs.js
	node scrappers/reservoirs.js > public/data/reservoirs.csv

shapefiles: public/data/counties.topojson


California\ County\ Shape\ Files/: shapefiles.tar.gz
	tar zxvf shapefiles.tar.gz

California\ County\ Shape\ Files/County/CaliforniaCounty.shp: California\ County\ Shape\ Files/

public/data/counties.json: California\ County\ Shape\ Files/County/CaliforniaCounty.shp
	ogr2ogr -f GeoJSON public/data/counties.json \
	California\ County\ Shape\ Files/County/CaliforniaCounty.shp

public/data/states.json: State\ Boundaries/statesp020.shp
	ogr2ogr -f GeoJSON public/data/states.json State\ Boundaries/statesp020.shp

public/data/states.topojson: public/data/states.json
	topojson public/data/states.json -p -o public/data/states.topojson

public/data/counties.topojson: public/data/counties.json
	topojson --ignore-shapefile-properties -o public/data/counties.topojson public/data/counties.json

public/data/reservoirs.capacities.csv: public/data/reservoirs.csv scrappers/capacities.js
	node scrappers/capacities.js

uglify: js/main.min.js

js/main.min.js:
	uglifyjs public/js/d3.js > public/js/main.min.js
	uglifyjs public/js/angular.js >> public/js/main.min.js
	uglifyjs public/js/topojson.v1.js >> public/js/main.min.js
	uglifyjs public/js/main.js >> public/js/main.min.js
	uglifyjs public/js/directives/bar-chart.js >> public/js/main.min.js
	uglifyjs public/js/directives/water-map.js >> public/js/main.min.js
	uglifyjs public/js/directives/loading-dialog.js >> public/js/main.min.js
	uglifyjs public/js/directives/reservoir-detail.js >> public/js/main.min.js
	uglifyjs public/js/directives/scale-slider.js >> public/js/main.min.js


uglifycss: public/style.min.css

public/style.min.css: public/style.css
	uglifycss public/style.css > public/style.min.css

