var csv = require('csv')
var fs = require('fs')
var async = require('async')


var latest_capacities = require(__dirname + '/../public/data/latest-capacities.json')

// console.log(latest_capacities)

var last_row, rows = []
csv()
.from
.stream(fs.createReadStream(__dirname + '/../public/data/capacities.csv'), {columns: true})
.on('record', function(row, i){
  last_row = row
  rows.push(row)
})
.on('end', function(){
  // copy and last row and update all the values for march
  var copy = {}
  Object.keys(last_row).map(function(key){ copy[key] = last_row[key] })
  copy.date = '2014-07'
  copy.month = '7'
  latest_capacities.forEach(function(cap){
    copy[cap.id] = cap.val || last_row[cap.id]
  })
  rows.push(copy)
  csv().from(rows).to(process.stdout, { header: true, columns: Object.keys(last_row) })
})
