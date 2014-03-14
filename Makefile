

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

reservoirs: public/data/reservoirs.capacities.csv

public/data/latest-capacities.json: scrappers/latest-capacities.js
	node scrappers/latest-capacities.js > public/data/latest-capacities.json

public/data/latest-capacities.csv: public/data/latest-capacities.json scrappers/join-capacities-latest.js
	node scrappers/join-capacities-latest.js > public/data/latest-capacities.csv

uglifyjs:
	uglifyjs public/js/d3.js > public/js/main.min.js
	uglifyjs public/js/angular.js >> public/js/main.min.js
	uglifyjs public/js/topojson.v1.js >> public/js/main.min.js
	uglifyjs public/js/main.js >> public/js/main.min.js
	uglifyjs public/js/directives/bar-chart.js >> public/js/main.min.js
	uglifyjs public/js/directives/water-map.js >> public/js/main.min.js
	uglifyjs public/js/directives/loading-dialog.js >> public/js/main.min.js
	uglifyjs public/js/directives/reservoir-detail.js >> public/js/main.min.js
	uglifyjs public/js/directives/scale-slider.js >> public/js/main.min.js


uglifycss:
	uglifycss public/css/style.css > public/css/style.min.css


uglify: uglifycss uglifyjs

.PHONY: uglifycss uglifycjs

