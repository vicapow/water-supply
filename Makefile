

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