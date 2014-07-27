

var request = require('request')
var csv = require('csv')
var fs = require('fs')
var async = require('async')

// this url provides the storage information

var reservoirs = []

csv()
.from
.stream(fs.createReadStream(__dirname+'/../public/data/reservoirs.csv'), {columns: true})
.on('record', function(row, i){
  reservoirs.push(row)
})
.on('end', function(){
  // console.log(reservoirs)
  get_storages()
})

var pad = function(d, n){
  var s = d.toString()
  while(s.length < n) s = '0' + s
  return s
}

function get_storages(){
  // reservoirs = reservoirs.slice(0, 2)
  var months = {}
  async.mapSeries(reservoirs, function(reservoir, cb){
    storage(reservoir.id, function(err, res_years){
      // if(err) throw err
      if(err) return cb(null)
      // console.log('res_years')
      console.log('reservoir.id', reservoir.id)
      // console.log(res_years)
      res_years.forEach(function(r){
        var date, i, month
        for(i = 1; i <= 12; i++){
          date = r.year + '-' + pad(i, 2)
          if(!months[date]) months[date] = { date: date, month: i, year: +r.year }
          month = months[date]
          month[r.id] = r[i]
        }
      })
      cb(null)
    })
  }, function(err){
    if(err) throw err
    var dates = Object.keys(months).sort()
    dates = dates.filter(function(d){ return d <= '2014-07' })
    months = dates.map(function(d){ return months[d] })
    var opts = { columns: Object.keys(months[0]), header: true }
    csv().from.array(months, {columns: true})
      .to.path(__dirname + '/../public/data/capacities.csv', opts)
  })
}
// // results is now an array of stats for each file

function storage(id, cb){
  request.get({
    url: 'http://cdec.water.ca.gov/cgi-progs/getMonthlyCSV?station_id='
      + id
      + '&dur_code=M' // monthly
      + '&sensor_num=15' // sensor 15 is storage
      + '&start_date=2000/01/01'
      + '&end_date=2014/07/27'
  }, function(err, res, body){
    if(err && cb) return cb(err)
    if(res.statusCode !== 200) return cb(new Error(body))
    if(body.indexOf('Sorry') !== -1) // lol
        return cb(new Error('Data unavailable for reservoir: ' + id))

    var headers = ['id', 'sensor', 'year', 'month', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    var rows
    csv()
    .from.string( body, { comment: "'" })
    .to.array( function(rows){
      rows = rows.map(function(row){
        var obj = {}
        headers.forEach(function(h, i){
          var val = row[i] || ''
          if(val === 'm') val = ''
          if(i > 3 && val !== '') val = Number(row[i])
          obj[h] = val
        })
        if(obj['1'] !== '') return obj
      }).filter(function(d){ return d })
      if(cb) return cb(null, rows)
    })
  })
}

// storage('SHA')
