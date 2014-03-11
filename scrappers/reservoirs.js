

var request = require('request')
var cheerio = require('cheerio')
var csv = require('csv')
var async = require('async')

// this url provides the lat and long data for each of the reservoirs
function resinfo(){
  request.get({
    url: 'http://cdec.water.ca.gov/misc/resinfo.html'
  }, function(err, res, body){
    if(err) throw err
    var $ = cheerio.load(body)
    var table = $('table') // station table
    var headers = []
    table.find('th').each(function(i, el){
      headers.push($(el).text().replace(/\s+$/,'').toLowerCase())
    })
    var rows = []
    table.find('tr').each(function(i, el){
      var td = $(el).find('td')
        , row = Object.create(null)
        , skip = false
      td.each(function(i, el){
        var val = $(el).text().replace(/\s+$/,'').replace(/^\s+/,'')
        var key = headers[i]
        if(key === 'capacity (af)') val = Number(val.replace(/,/g,''))
        row[key] = val
      })
      if(row.id === 'EDS') skip = true
      // EDS station has no data
      // http://cdec.water.ca.gov/cgi-progs/stationInfo?station_id=EDS
      if(!skip && Object.keys(row).length !== 0) rows.push(row)
    })
    async.mapSeries(rows, function(station, cb){
      get_station_detail(station.id, function(err, more){
        if(err) throw err
        // extend station with more info
        Object.keys(more).forEach(function(key){ station[key] = more[key] })
        return cb(null, station)
      })
    }, function(err, res){
      if(err) throw err
      csv().from(res).to.stream(process.stdout, {header: true, columns: Object.keys(rows[0])})
    })
  })
}

resinfo()

// get_station_detail('SHA', function(err, obj){ console.log(obj) })

function get_station_detail(id, cb){
  request.get({
    url: 'http://cdec.water.ca.gov/cgi-progs/stationInfo?station_id=' + id
  }, function(err, res, body){
    if(err) return cb(err)
    var $ = cheerio.load(body)
    var table = $('table').first()
    var rows = []
    if(!table.length) cb(new Error('no TABLE in HTML document for id: ' + id))
    var obj = {}
    table.find('tr').each(function(i, el){
      var row = []
      var td = $(el).find('td')
      td.each(function(i, el){
        var val = $(el).text().replace(/\s+$/,'').replace(/^\s+/,'')
        row.push(val)
      })
      row.forEach(function(cell, i){
        if(cell === 'Elevation') obj.elevation = row[i+1]
        if(cell === 'River Basin') obj.river_basin = row[i+1]
        if(cell === 'County') obj.county = row[i+1]
        if(cell === 'Hydrologic Area') obj.hydrologic_area = row[i+1]
        if(cell === 'Nearby City') obj.nearby_city = row[i+1]
        if(cell === 'Latitude') obj.latitude = row[i + 1] && parse_coord(row[i+1])
        if(cell === 'Longitude') obj.longitude = row[i + 1] && parse_coord(row[i+1])
        if(cell === 'Operator') obj.operator = row[i+1]
      })
    })
    return cb(null, obj)
  })
}

function parse_coord(str){
  var num = str.match(/\d*\.*\d*/)[0]
  if(!num) throw new Error('Invalid Lat Lon: ' + str)
  num = Number(num)
  if(str.match(/([Ww]|[Ss])/g)) num = - num
  return num
}