

var request = require('request')
var cheerio = require('cheerio')
var csv = require('csv')
var fs = require('fs')
var async = require('async')

// this url provides the capacity information
request.get({
  url: 'http://cdec.water.ca.gov/cgi-progs/current/RES'
}, function(err, res, body){
  if(err) throw err
  if(res.statusCode !== 200) throw body
  var $ = cheerio.load(body)
  var table = $('table') // station table
  var headers = []
  var header_row = table.find('tr:nth-child(2) td').each(function(i, el){
    headers.push($(el).text().replace(/\s+$/g, ''))
  })
  var stations = []
  table.find('tr').each(function(i, el){
    if(i === 0 || i === 1) return // skip the headers
    var r = {}
    var props = ['station', 'id', 'capacity', 'elev', 'storage', 'percent_change', 'avg_storage', 'percent_average', 'outflow', 'inflow', 'storage_year_ago_this_date']
    var td = $(el).find('td')
    td.each(function(i, el, arr){
      if(!props[i]) return
      r[props[i]] = $(el).text()
    })
    stations.push(r)
  })
  var num_prop = ['capacity', 'elev', 'storage', 'percent_change']
    .concat(['avg_storage', 'percent_average', 'outflow', 'inflow'])
    .concat(['storage_year_ago_this_date'])
  
  stations = stations.filter(function(d){
    if(!d.id) return
    d.id = d.id.replace(/^\s+/g, '').replace(/\s+$/g, '')
    if(!d.id.length || !d.id.match(/[A-Za-z]/)) return
    num_prop.forEach(function(field){
      d[field] = Number(d[field].replace(/,/g, '')) || 'NA'
    })
    return d.id.length
  })
  var reservoirs_with_capacities = stations
  var path = __dirname + '/../public/data/reservoirs.csv'
  var contents = fs.readFileSync(path).toString()
  csv().from(contents, {columns: true}).to.array(function(reservoirs){
    var reservoirs = Array.prototype.filter.call(reservoirs, function(reservoir){
      var station = reservoirs_with_capacities.filter(function(station){
        return station.id === reservoir.id
      })[0]
      if(!station) return // some stations not have capcity info. ie., "RTD"
      // add in the capacity data. a reservoir is a station and vis versa
      // we just needed a different name
      reservoir.capacity = station.capacity
      return reservoir
    })
    var opts = { columns: Object.keys(reservoirs[0]), header: true}
    csv().from.array(reservoirs, {columns: true})
      .to.path(__dirname + '/../public/data/reservoirs.capacities.csv', opts)
    // results is now an array of stats for each file
  })
})