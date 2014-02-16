

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

public/data/counties.topojson: public/data/counties.json
	topojson -o public/data/counties.topojson public/data/counties.json

public/data/reservoirs.capacities.csv: public/data/reservoirs.csv scrappers/capacities.js
	node scrappers/capacities.js