
// https://developers.arcgis.com/javascript/jsapi/extent-amd.html

// http://help.arcgis.com/en/arcgisserver/10.0/apis/rest/pcs.html

var request = require('request')
var fs = require('fs')
var qs = require('querystring')
var url = require('url')
var _ = require('underscore')
var u

// u = url.parse('http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/exportImage?f=image&format=jpg&renderingRule=%7B%7D&mosaicRule=%7B%22mosaicMethod%22%3A%22esriMosaicLockRaster%22%2C%22ascending%22%3Atrue%2C%22lockRasterIds%22%3A%5B2059824%2C2059825%2C2060892%5D%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&bbox=-13638912.713249283%2C4967807.382263688%2C-13612847.686604073%2C4998611.504662573&imageSR=102100&bboxSR=102100&size=682%2C806')
// console.log(qs.parse(u.search))

// u = url.parse('http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/exportImage?f=image&format=jpg&renderingRule=%7B%7D&mosaicRule=%7B%22mosaicMethod%22%3A%22esriMosaicLockRaster%22%2C%22ascending%22%3Atrue%2C%22lockRasterIds%22%3A%5B2041137%2C2043148%2C2043149%5D%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&bbox=-13638912.713249283%2C4967807.382263688%2C-13612847.686604073%2C4998611.504662573&imageSR=102100&bboxSR=102100&size=682%2C806')
// console.log(qs.parse(u.search))

u = url.parse('http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/query?f=json&where=(acquisitionDate%20%3E%3D%20date%271999-01-01%27%20AND%20%20acquisitionDate%20%3C%3D%20date%272014-12-31%27)%20AND%20(dayOfYear%20%3E%3D1%20AND%20%20dayOfYear%20%3C%3D%20366)%20AND%20(sensor%20%3D%20%27TM%27%20OR%20sensor%20%3D%20%27ETM%27%20OR%20sensor%20%3D%20%27LANDSAT_ETM%27%20OR%20sensor%20%3D%20%27OLI%27)%20AND%20(cloudCover%20%3C%3D%2020)&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A-13634288.273038037%2C%22ymin%22%3A4958520.283327038%2C%22xmax%22%3A-13582158.219747618%2C%22ymax%22%3A5020128.5281248065%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=sceneID%2Csensor%2CacquisitionDate%2CdateUpdated%2Cpath%2Crow%2CPR%2CcloudCover%2CsunElevation%2CsunAzimuth%2CreceivingStation%2CsceneStartTime%2Cmonth%2Cyear%2COBJECTID%2CdayOfYear%2CdayOrNight%2CbrowseURL&orderByFields=dayOfYear&outSR=102100')
// console.log(qs.parse(u.search))

var metadata_base = 'http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/query'
function envelopeParams(bbox){
  return {
      f: 'json'
    , where: '(acquisitionDate >= date\'2000-01-01\' '
        + 'AND  acquisitionDate <= date\'2014-12-31\') '
        + 'AND (dayOfYear >=1 AND  dayOfYear <= 366) '
        + 'AND ('
        + ' sensor = \'TM\''
        + ' OR sensor = \'ETM\' '
        + ' OR sensor = \'LANDSAT_ETM\''
        + ' OR sensor = \'OLI\''
        + ') '
        + 'AND (cloudCover <= 100)'
    , returnGeometry: 'true'
    , spatialRel: 'esriSpatialRelIntersects'
    , geometry: JSON.stringify({
          xmin: bbox.xmin
        , ymin: bbox.ymin
        , xmax: bbox.xmax
        , ymax: bbox.ymax
        // see: https://developers.arcgis.com/javascript/jsapi/spatialreference-amd.html
        , spatialReference: { wkid: 102100 }
      })
    // '{"xmin":-13634288.273038037,"ymin":4958520.283327038,"xmax":-13582158.219747618,"ymax":5020128.5281248065,"spatialReference":{"wkid":102100}}'
    , geometryType: 'esriGeometryEnvelope'
    , inSR: '102100'
    , outFields: 'sceneID,sensor,acquisitionDate,dateUpdated,path,row,PR,cloudCover,sunElevation,sunAzimuth,receivingStation,sceneStartTime,month,year,OBJECTID,dayOfYear,dayOrNight,browseURL'
    , orderByFields: 'dayOfYear'
    , outSR: '102100'
  }
}

// this person is awesome!!!
// http://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/
function webMercatorToLatLong(x, y){
  var lon = (x / 20037508.34) * 180
  var lat = (y / 20037508.34) * 180
  lat = 180 / Math.PI * ( 2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2)
  return [lat, lon]
}

function latLonToWebMercator(lat, lon){
  var x = lon * 20037508.34 / 180
  var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180)
  y = y * 20037508.34 / 180
  return [x, y]
}

// example metdata query

var bbox = {
    xmin: 39.4901659
  , ymin: -121.5659697
  , xmax: 39.6292649
  , ymax: -121.2919672
}


// bbox = {"xmin":40.68718067164527,"ymin":-123.00225521850587,"xmax":41.08274917314995,"ymax":-122.47903134155274}

// var bbox = {"xmin":40.03632367438269,"ymin":-80.53305889892579,"xmax":40.832808685888764,"ymax":-79.48661114501954}

bbox = {"xmin":40.39104591240121,"ymin":-80.05858685302735,"xmax":40.48459361209049,"ymax":-79.93567730712891}

// var bbox = {"xmin":37.63357345981025,"ymin":-122.5780799560547,"xmax":37.84046332807191,"ymax":-122.31646801757813}


// convert to web mercator coordinate system
bbox = {
    xmin: latLonToWebMercator(bbox.xmin, bbox.ymin)[0]
  , ymin: latLonToWebMercator(bbox.xmin, bbox.ymin)[1]
  , xmax: latLonToWebMercator(bbox.xmax, bbox.ymax)[0]
  , ymax: latLonToWebMercator(bbox.xmax, bbox.ymax)[1]
}


// latLonToWebMercator(bbox.xmin, bbox.ymin)
// latLonToWebMercator(bbox.xmax, bbox.ymax)


function request_metadata(cb){
  request.get({
    url: metadata_base + '?' + qs.stringify(envelopeParams(bbox))
    , json: true
  }, function(err, res, body){
    if(err) throw err
    if(res.statusCode !== 200) throw body
    fs.writeFileSync('example_query.json', JSON.stringify(body, null, 2))
    cb(bbox, body.features)
  })
}


// var body = require('./example_query.json')
// got_features(bbox, body.features)
// debug_features(body.features)


request_metadata(got_features)

// // var rasterIds = filterFeaturesByTimestamp(1392940800000, 1, body.features)

function got_features(bbox, features){
  var dates = [
    //  new Date("1/01/2011 GMT-0800 (PST)")
    // , new Date("2/01/2011 GMT-0800 (PST)")
    // , new Date("3/01/2011 GMT-0800 (PST)")
    // , new Date("4/01/2011 GMT-0800 (PST)")
    // , new Date("5/01/2011 GMT-0800 (PST)")
    // , new Date("6/01/2011 GMT-0800 (PST)")
    // , new Date("7/01/2011 GMT-0800 (PST)")
    // , new Date("8/01/2011 GMT-0800 (PST)")
    // , new Date("9/01/2011 GMT-0800 (PST)")
    // , new Date("10/01/2011 GMT-0800 (PST)")
    // , new Date("11/01/2011 GMT-0800 (PST)")
    // , new Date("12/01/2011 GMT-0800 (PST)")

    // , new Date("1/01/2012 GMT-0800 (PST)")
    // , new Date("2/01/2012 GMT-0800 (PST)")
    // , new Date("3/01/2012 GMT-0800 (PST)")
    // , new Date("4/01/2012 GMT-0800 (PST)")
    // , new Date("5/01/2012 GMT-0800 (PST)")
    // , new Date("6/01/2012 GMT-0800 (PST)")
    // , new Date("7/01/2012 GMT-0800 (PST)")
    // , new Date("8/01/2012 GMT-0800 (PST)")
    // , new Date("9/01/2012 GMT-0800 (PST)")
    // , new Date("10/01/2012 GMT-0800 (PST)")
    // , new Date("11/01/2012 GMT-0800 (PST)")
    // , new Date("12/01/2012 GMT-0800 (PST)")

     new Date("1/01/2013 GMT-0800 (PST)")
    , new Date("2/01/2013 GMT-0800 (PST)")
    , new Date("3/01/2013 GMT-0800 (PST)")
    , new Date("4/01/2013 GMT-0800 (PST)")
    , new Date("5/01/2013 GMT-0800 (PST)")
    , new Date("6/01/2013 GMT-0800 (PST)")
    , new Date("7/01/2013 GMT-0800 (PST)")
    , new Date("8/01/2013 GMT-0800 (PST)")
    , new Date("9/01/2013 GMT-0800 (PST)")
    , new Date("10/01/2013 GMT-0800 (PST)")
    , new Date("11/01/2013 GMT-0800 (PST)")
    , new Date("12/01/2013 GMT-0800 (PST)")

    , new Date("01/01/2014 GMT-0800 (PST)")
    , new Date('02/01/2014 GMT-0800 (PST)')
    , new Date('03/01/2014 GMT-0800 (PST)')
  ];
  dates = dates.map(function(date){
    date = Number(date)
    return {
      // find all the closest ids by date without going over
      ids: filter_features_by_timestamp(date, 1, features)
      , date: date
      , bbox: bbox
    }
  })
  // console.log(JSON.stringify(dates, null, 2))
  dates.map(function(d){
    save_image_from_date(d, 'test-' + d.date)
  })
}

// var uniq_raster_pr_ids = _.uniq(body.features.map(function(feature){
//   return feature.attributes.PR
// }))
// console.log(uniq_raster_pr_ids)
// body.features.forEach(function(feature){
//   var attr = feature.attributes
//   var date = attr.acquisitionDate
//   var pr = attr.PR
//   var id = attr.OBJECTID
//   console.log(date, pr, id)
//   var filename = 'test-' + pr + '-' + date + '-' + id + '.jpg' 
//   save_image_from_dates({ bbox: bbox, ids: [id] }, filename)
// })

// var filename = 'test.jpg'
// // save_image_from_dates({ bbox: bbox, ids: [2025805,2838059] }, filename)

function save_image_from_date(date, filename){
  console.log('saving for ids: ', date.ids)
  var base = 'http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/exportImage'
  var bbox = date.bbox
  // // example params:
  var params = {
      f: 'image'
    , format: 'jpg'
    , renderingRule: '{}'
    , mosaicRule: JSON.stringify({
        mosaicMethod: "esriMosaicLockRaster"
      , ascending: true
      , lockRasterIds: date.ids // [1921787] // [1921787,1921786,1925686] // rasterIds
      , mosaicOperation:"MT_FIRST"
    })
    , bbox: [bbox.xmin, bbox.ymin, bbox.xmax, bbox.ymax].toString()
    , imageSR: 102100
    , bboxSR: 102100
    , size: '1024,1024'
  }
  request.get({
    url: base + '?' + qs.stringify(params)
    , encoding: null
  // }, function(err, res, body){
  //   if(err) throw err
  //   if(res.statusCode !== 200) throw body
  //   // console.log(Buffer.isBuffer(body))
  //   // fs.writeFileSync('./test.jpg', body)
  // })
  })
  .pipe(fs.createWriteStream(filename))
  // .pipe(fs.createWriteStream('test.jpg'))
}

// // http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/exportImage?f=image&format=jpg&renderingRule=%7B%7D&mosaicRule=%7B%22mosaicMethod%22%3A%22esriMosaicLockRaster%22%2C%22ascending%22%3Atrue%2C%22lockRasterIds%22%3A%5B1921787%2C1921786%2C1925686%5D%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&bbox=-13638912.713249283%2C4967807.382263688%2C-13611357.164552515%2C4998611.504662573&imageSR=102100&bboxSR=102100&size=721%2C806


function debug_features(features){
  features = features.slice()
    .sort(function(a, b){ 
      return b.attributes.acquisitionDate - a.attributes.acquisitionDate })
  features.forEach(function(feature){
    console.log(new Date(feature.attributes.acquisitionDate))
  })
}


/* type=0 for only one, 1 for older */
function filter_features_by_timestamp(timestamp, type, features) {
  // console.log("Inside filterDisplayFeatures > time: " + timestamp + " - type: " + type)
  var ids = []
    , uniquePR = []
    , acqDates = []

  console.log(new Date(timestamp))
  var uniquePRs = _.uniq(features.map(function(feature){ return feature.attributes.PR }))
  
  if(type !== 0 && type !== 1) throw new Error('filterDisplayFeatures: unsupported type: ' + type)
  if(!features) throw new Error('filterDisplayFeatures: features is not defined!')
  
  // pre sort the features by acquisition date
  features = features.slice()
    // all the newer dates, first
    .sort(function(a, b){ return b.attributes.acquisitionDate - a.attributes.acquisitionDate })
  
  // find all the clostes PRs by date

  var prs = _.groupBy(features, function(feature){
    return feature.attributes.PR
  })

  uniquePRs.forEach(function(pr){
    console.log('pr', pr)
    prs[pr].forEach(function(feature){
      console.log(new Date(feature.attributes.acquisitionDate))
    })
  })

  var closestPRs = uniquePRs.map(function(pr){
    var best, min_diff = null
    features.forEach(function(feature){
      if(feature.attributes.PR !== pr) return
      var diff = Math.abs(feature.attributes.acquisitionDate - timestamp)
      if(!min_diff || diff < min_diff){
        min_diff = diff
        best = feature
      }
    })
    return best
  })

  function best_feature(){
    var best, min_diff = null
    features.forEach(function(feature){
      var diff = Math.abs(feature.attributes.acquisitionDate - timestamp)
      if(!min_diff || diff < min_diff){
        min_diff = diff
        best = feature
      }
    })
    return best
  }

  // var best = best_feature().attributes

  // console.log('best', best, 'for timestamp', timestamp)

  // return [best.OBJECTID]

  var closests = closestPRs.sort(function(a, b){
    return Math.abs(b.attributes.acquisitionDate - timestamp)
     - Math.abs(a.attributes.acquisitionDate - timestamp)
  })
  console.log('closests', closests.map(function(feature){ return feature.attributes.acquisitionDate }), 'for', timestamp)
  return closests.map(function(feature){
    console.log('clostest for pr', new Date(feature.attributes.acquisitionDate))
    return feature.attributes.OBJECTID
  })

  // for (var i = 0; i < features.length; i++) {
  //   if(features[i].attributes.acquisitionDate > timestamp) continue
  //   var idx = uniquePR.indexOf(features[i].attributes.PR)
  //   if(idx !== -1) continue
  //   acqDates.push(features[i].attributes.acquisitionDate)
  //   uniquePR.push(features[i].attributes.PR)
  //   ids.push(features[i].attributes.OBJECTID)
  // }

  // if (type === 0) {
  //   ids.splice(1, ids.length - 1)
  //   uniquePR.splice(1, uniquePR.length - 1)
  // }

  // console.log('acqDates', acqDates)

  // return ids
}



