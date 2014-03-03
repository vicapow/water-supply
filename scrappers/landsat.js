var request = require('request')
var fs = require('fs')
var qs = require('querystring')
var url = require('url')
var u

// u = url.parse('http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/exportImage?f=image&format=jpg&renderingRule=%7B%7D&mosaicRule=%7B%22mosaicMethod%22%3A%22esriMosaicLockRaster%22%2C%22ascending%22%3Atrue%2C%22lockRasterIds%22%3A%5B2059824%2C2059825%2C2060892%5D%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&bbox=-13638912.713249283%2C4967807.382263688%2C-13612847.686604073%2C4998611.504662573&imageSR=102100&bboxSR=102100&size=682%2C806')
// console.log(qs.parse(u.search))

// u = url.parse('http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/exportImage?f=image&format=jpg&renderingRule=%7B%7D&mosaicRule=%7B%22mosaicMethod%22%3A%22esriMosaicLockRaster%22%2C%22ascending%22%3Atrue%2C%22lockRasterIds%22%3A%5B2041137%2C2043148%2C2043149%5D%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&bbox=-13638912.713249283%2C4967807.382263688%2C-13612847.686604073%2C4998611.504662573&imageSR=102100&bboxSR=102100&size=682%2C806')
// console.log(qs.parse(u.search))

u = url.parse('http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/query?f=json&where=(acquisitionDate%20%3E%3D%20date%271999-01-01%27%20AND%20%20acquisitionDate%20%3C%3D%20date%272014-12-31%27)%20AND%20(dayOfYear%20%3E%3D1%20AND%20%20dayOfYear%20%3C%3D%20366)%20AND%20(sensor%20%3D%20%27TM%27%20OR%20sensor%20%3D%20%27ETM%27%20OR%20sensor%20%3D%20%27LANDSAT_ETM%27%20OR%20sensor%20%3D%20%27OLI%27)%20AND%20(cloudCover%20%3C%3D%2020)&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A-13634288.273038037%2C%22ymin%22%3A4958520.283327038%2C%22xmax%22%3A-13582158.219747618%2C%22ymax%22%3A5020128.5281248065%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=sceneID%2Csensor%2CacquisitionDate%2CdateUpdated%2Cpath%2Crow%2CPR%2CcloudCover%2CsunElevation%2CsunAzimuth%2CreceivingStation%2CsceneStartTime%2Cmonth%2Cyear%2COBJECTID%2CdayOfYear%2CdayOrNight%2CbrowseURL&orderByFields=dayOfYear&outSR=102100')
// console.log(qs.parse(u.search))

var metadata_base = 'http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/query'
var metadata_example_params = {
    f: 'json'
  , where: '(acquisitionDate >= date\'1999-01-01\' AND  acquisitionDate <= date\'2014-12-31\') AND (dayOfYear >=1 AND  dayOfYear <= 366) AND (sensor = \'TM\' OR sensor = \'ETM\' OR sensor = \'LANDSAT_ETM\' OR sensor = \'OLI\') AND (cloudCover <= 20)'
  , returnGeometry: 'true'
  , spatialRel: 'esriSpatialRelIntersects'
  , geometry: '{"xmin":-13634288.273038037,"ymin":4958520.283327038,"xmax":-13582158.219747618,"ymax":5020128.5281248065,"spatialReference":{"wkid":102100}}'
  , geometryType: 'esriGeometryEnvelope'
  , inSR: '102100'
  , outFields: 'sceneID,sensor,acquisitionDate,dateUpdated,path,row,PR,cloudCover,sunElevation,sunAzimuth,receivingStation,sceneStartTime,month,year,OBJECTID,dayOfYear,dayOrNight,browseURL'
  , orderByFields: 'dayOfYear'
  , outSR: '102100'
}

// example metdata query

// request.get({
//   url: metadata_base + '?' + qs.stringify(metadata_params)
//   , json: true
// }, function(err, res, body){
//   if(err) throw err
//   if(res.statusCode !== 200) throw body
//   console.log(JSON.stringify(body, null, 2))
//   // console.log(filterDisplayFeatures('1392940800000', 1, body.features))
// })

var body = require('./example_query.json')
// var rasterIds = filterFeaturesByTimestamp(1392940800000, 1, body.features)

var dates = [
   new Date("3/01/2013 GMT-0800 (PST)")
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
];

dates = dates.map(function(date){
  date = Number(date)
  return {
    ids: filterFeaturesByTimestamp(date, 1, body.features)
    , date: date
  }
})

console.log(dates)

dates.map(save_image_from_dates)

function save_image_from_dates(date){
  var base = 'http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/exportImage'

  // // example params:
  var params = {
      f: 'image'
    , format: 'jpg'
    , renderingRule: '{}'
    , mosaicRule: JSON.stringify({
        mosaicMethod: "esriMosaicLockRaster"
      , ascending:true
      , lockRasterIds: date.ids // [1921787] // [1921787,1921786,1925686] // rasterIds
      , mosaicOperation:"MT_FIRST"
    })
    , bbox: '-13638912.713249283,4967807.382263688,-13611357.164552515,4998611.504662573'
    , imageSR: 102100
    , bboxSR: 102100
    , size: '721,806'
  }
  request.get({
    url: base + '?' + qs.stringify(params)
    , encoding: null
  // }, function(err, res, body){
  //   if(err) throw err
  //   if(res.statusCode !== 200) throw body
  //   // console.log(Buffer.isBuffer(body))
  //   fs.writeFileSync('./test.jpg', body)
  // })
  }).pipe(fs.createWriteStream('test-' + date.date + '.jpg'))
}

// http://landsatlook.usgs.gov/arcgis/rest/services/LandsatLook/ImageServer/exportImage?f=image&format=jpg&renderingRule=%7B%7D&mosaicRule=%7B%22mosaicMethod%22%3A%22esriMosaicLockRaster%22%2C%22ascending%22%3Atrue%2C%22lockRasterIds%22%3A%5B1921787%2C1921786%2C1925686%5D%2C%22mosaicOperation%22%3A%22MT_FIRST%22%7D&bbox=-13638912.713249283%2C4967807.382263688%2C-13611357.164552515%2C4998611.504662573&imageSR=102100&bboxSR=102100&size=721%2C806





/* type=0 for only one, 1 for older */
function filterFeaturesByTimestamp(timestamp, type, features) {
  // console.log("Inside filterDisplayFeatures > time: " + timestamp + " - type: " + type)
  var ids = []
    , uniquePR = []
    , acqDates = []
    , acqdatesAndIds = []
  
  if(type !== 0 && type !== 1) throw new Error('filterDisplayFeatures: unsupported type: ' + type)
  if(!features) throw new Error('filterDisplayFeatures: features is not defined!')
  
  // pre sort the features by acquisition date
  features = features.slice()
    .sort(function(a, b){ return b.attributes.acquisitionDate - a.attributes.acquisitionDate })
  
  for (var i = 0; i < features.length; i++) {
    if(features[i].attributes.acquisitionDate > timestamp) continue
    var idx = uniquePR.indexOf(features[i].attributes.PR)
    if(idx !== -1) continue 
    uniquePR.push(features[i].attributes.PR)
    ids.push(features[i].attributes.OBJECTID)
    acqDates.push(features[i].attributes.acquisitionDate)
    acqdatesAndIds.push(features[i].attributes.acquisitionDate + "," + features[i].attributes.OBJECTID)
  }

  if (type === 0) {
    ids.splice(1, ids.length - 1)
    uniquePR.splice(1, uniquePR.length - 1)
  }

  return ids
}



