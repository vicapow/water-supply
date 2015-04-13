# Notes and data on California water supply

reservoir data (location, id, name)
http://cdec.water.ca.gov/misc/daily_res.html

reservoir data (capacities)
http://cdec.water.ca.gov/cgi-progs/current/RES

shapefiles cor california counties:
  http://scec.usc.edu/internships/useit/content/california-counties-shapefiles


historic capacity data

http://cdec.water.ca.gov/cgi-progs/getMonthlyCSV?station_id


not used in the visualization but still interesting data sources:

precipitation data
+ http://www.waterplan.water.ca.gov/waterpie/precip/precip.cfm
+ http://cdec.water.ca.gov/water_cond.html
+ http://cdec.water.ca.gov/misc/hourly_res.html
+ http://landsatlook.usgs.gov/

GIS projection reference:
http://help.arcgis.com/en/arcgisserver/10.0/apis/rest/pcs.html

to update capacities.csv
update `end_date` and `dates.filter` in scrappers/capacities.js
then run

  node scrappers/capacities.js

Next, delete public/data/latest-capacities.csv
and public/data/latest-capacities.json

Now just:

make latest-capacities
