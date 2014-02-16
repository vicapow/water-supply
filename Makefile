

reservoirs: public/data/reservoirs.csv

public/data/reservoirs.csv: scrappers/reservoirs.js
	node scrappers/reservoirs.js > public/data/reservoirs.csv