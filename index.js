var url = "http://cdec.water.ca.gov/cgi-progs/queryDaily?CLE&d=17-Mar-2014+10:00&span=30days"

var request = require('request')

request.get({
  url: url
  , headers: {
    'Accept': 'application/json'
  }
}, function(err, res, body){
  if(err) throw err
  console.log('body', body)
})