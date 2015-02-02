var csv = require('csv')
var fs = require('fs')
var async = require('async')


var date = process.argv[2];
if(!date) throw new Error('missing date. format: 07/29/2014');

var date = date.split('/');
// zero pad
if(date[0].length === 1) date[0] = '0' + date[0]

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
  var row = {}
  var isLast = false
  if (last_row.date === date[2] + '-' + date[0]) {
    row = last_row
    isLast = true
  }
  Object.keys(last_row).map(function(key){ row[key] = last_row[key] })
  row.date = date[2] + '-' + date[0] // '/07/29/2014' -> '2014-7'
  row.month = String(+date[0]); // '07' -> '7'
  latest_capacities.forEach(function(cap){
    row[cap.id] = cap.val || last_row[cap.id]
  })
  if(!isLast) rows.push(row)
  csv().from(rows).to(process.stdout, { header: true, columns: Object.keys(last_row) })
})
