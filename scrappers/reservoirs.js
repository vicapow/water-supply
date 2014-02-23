

var request = require('request')
var cheerio = require('cheerio')
var csv = require('csv')

// this url provides the lat and long data for each of the reservoirs
request.get({
  url: 'http://cdec.water.ca.gov/misc/daily_res.html'
}, function(err, res, body){
  if(err) throw err
  var $ = cheerio.load(body)
  var table = $('table') // station table
  var headers = []
  table.find('th').each(function(i, el){
    headers.push($(el).text().replace(/\s+$/,'').toLowerCase())
  })
  headers.push('River Basin')
  var region = ''
  var rows = []
  table.find('tr').each(function(i, el){
    var td = $(el).find('td')
    if(td.length === 1) return region = td.text()
    if(td.length !== 7) return // the header
    var row = [], skip = false
    td.each(function(i, el){
      var val = $(el).text().replace(/\s+$/,'').replace(/^\s+/,'')
      // cdec gives non-negative longitude...
      if(headers[i] === 'longitude') val = '-' + val
      // SJT. it's not a real station (UPPER SAN JOAQUIN TOTAL)
      if(headers[i] === 'id' && val === 'SJT') skip = true
      row.push(val)
    })
    row.push(region)
    if(!skip) rows.push(row)
  })
  // console.log(rows)
  rows.unshift(headers)
  csv().from(rows).to(process.stdout)
})