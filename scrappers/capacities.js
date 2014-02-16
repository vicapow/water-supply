

var request = require('request')
var cheerio = require('cheerio')
var csv = require('csv')
var fs = require('fs')
var async = require('async')

var contents = fs.readFileSync(__dirname + '/../public/data/reservoirs.csv')
  .toString()

csv().from(contents, {columns: true}).to.array(function(reservoirs){
  async.map(reservoirs, capacity, function(err, reservoirs){
    if(err) throw err
    var opts = { columns: Object.keys(reservoirs[0]), header: true}
    csv().from.array(reservoirs, {columns: true})
      .to.path(__dirname + '/../public/data/reservoirs.capacities.csv', opts)
    // results is now an array of stats for each file
  })
})

function capacity(reservoir, cb, retries){
  if(arguments.length === 2) retries = 3
  request.post({
    url: 'http://cdec.water.ca.gov/cdecapp/resapp/resDetailByDate.action'
    , form: {
        resid: reservoir.id
      , querydate: '20140101'
    }
  }, function(err, res, body){
    if(err) return cb(err)
    var cap = body.match(/Total Capacity: ([\d|,]+) AF/)
    if(res.statusCode !== 200) {
      // try again!
      console.warn('none 200 status code:\n ' + res.statusCode + '\nfor id: ' + reservoir.id + '\n' + body)
      reservoir.capacity = ''
      console.log('retries', retries)
      if(retries <= 0) return cb(null, reservoir)
      return setTimeout(function(){
        capacity(reservoir, cb, --retries)
      }, 0)
      
    }
    if(!cap) return cb("no capacity for id: " + reservoir.id + '\n' + body)
    cap = cap[1].replace(/,/g,'')
    if(!cap) return cb("no capacity for id. format?" + reservoir.id)
    reservoir.capacity = cap
    return cb(null, reservoir)
  })
}