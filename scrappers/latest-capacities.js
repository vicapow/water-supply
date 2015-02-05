
// get the most recent daily storage capacities and use these for the
// last month

var reservoirs = []
var csv = require('csv')
var fs = require('fs')
var async = require('async')
var request = require('request')
var date = process.argv[2]

// provide a date in the format `07/29/2014`
if (!date) throw new Error('no date provided')
var day = +date.split('/')[1]; // ie., 29

csv()
.from
.stream(fs.createReadStream(__dirname+'/../public/data/reservoirs.csv'), {columns: true})
.on('record', function(row, i){
  reservoirs.push(row)
})
.on('end', function(){
  async.map(reservoirs, function(reservoir, cb){
    request.get({
      url: 'http://cdec.water.ca.gov/cgi-progs/getDailyCSV?station_id='
        + reservoir.id
        + '&sensor_num=15&start_date=' + date
    }, function(err, res, body){
      if(err) return cb(err)
      if(res.statusCode !== 200 || body.indexOf('Sorry') !== -1)
        return cb(null, '')
      csv()
        .from.string( body, { comment: "'" })
        .to.array( function(rows){
          var row = rows[0]
          // 4th column (zero indexed) of the csv file is 1st day of the
          // month
          row.splice(0, 4); //remove the first 4 unused values.
          var val = row[day - 1]; // zero index
          return cb(null, { id: reservoir.id, val: val })
        })
    })
  }, function(err, results){
    if(err) throw err
    console.log(JSON.stringify(results.filter(function(d){ return !!d })))
  })
})
