var app = angular.module('myApp', [])
app.filter('reverse', function() {
  return function(items) {
    if (!angular.isArray(items)) return false
    return items.slice().reverse()
  }
})
app.controller('MainCtrl', function($scope, $window, $interval){
  $scope.d3 = d3
  angular.element($window).on('resize', function(){ $scope.$apply() })
  $scope.reservoirs = []
  $scope.reservoir
  $scope.now = 0
  var capacity_format = d3.format('.3s')
  $scope.formatCapacity = function(capacity){
    if(isNaN(capacity)) return 'NA'
    return capacity_format(capacity)
  }
  $scope.months = ['', 'January', 'February', 'March', 'April', 'May']
    .concat(['June', 'July', 'August', 'September', 'October', 'November'])
    .concat(['December'])
  $scope.playing = false
  var interval
  $scope.sliderPosition = null
  $scope.$watch('playing', function(playing){
    if(window._gaq) _gaq.push(['_trackEvent', 'timeline', 'playing', playing])
    if(playing){
      var prev_now = $scope.now
      interval = $interval(function(){
        if($scope.now !== prev_now){
          // something other than this timer updated `now`. we should stop
          // auto playing
          $interval.cancel(interval)
          $scope.playing = false
          return
        }
        $scope.now++
        if($scope.now >= $scope.history.length) $scope.now = 0
        prev_now = $scope.now
      }, 650 )
    }else{
      $interval.cancel(interval)
    }
  })
  $scope.$watch('now', now_change)
  function now_change(){
    var now = $scope.now, history = $scope.history
    if(!history) return
    $scope.year = history[now].year
    $scope.month = history[now].month
    $scope.sliderPosition = new Date(history[now].date)
  }
  $scope.$watch('sliderPosition', function(date){
    if(!date) return
    var month = date.getUTCMonth() + 1 + ''
    if(month.length === 1) month = '0' + month
    date = date.getUTCFullYear() + '-' + month
    var now = 0, history = $scope.history
    while(history[now].date !== date && now < history.length) now++
    $scope.now = now
  })
  $scope.maxReservoir = function(reservoir){
    if(!reservoir) return
    return d3.max(reservoir.data, function(d){
      return d3.max(d.values, function(d){ return d.value })
    })
  }
  $scope.$watch('reservoir', function(reservoir){
    if(window._gaq) _gaq.push(['_trackEvent', 'reservoir', 'selected', reservoir.station])
  })
  d3.csv('data/reservoirs.capacities.csv', function(row){
    row.elev = Number(row.elev)
    row.latitude = Number(row.latitude)
    row.longitude = Number(row.longitude)
    row.capacity = Number(row.capacity)
    // convert station names to sentence case instead of all caps
    row.station = row.station.split(' ').map(function(word){
      return word.toLowerCase().split('').map(function(l, i){
        if(i === 0) return l.toUpperCase(); return l
      }).join('')
    }).join(' ')
    return row
  }, function(err, reservoirs){
    if(err) throw err
    $scope.$apply(function(){
      $scope.reservoirs = reservoirs
      $scope.reservoir = reservoirs[6]
    })
    d3.csv('data/drought.csv', function(row, i){
      delete row[''] // get rid of this empty column property
      row.year = Number(row.date.split('/')[1])
      row.month = Number(row.month)
      var month = row.month.toString()
      if(month.length === 1) month = '0' + month
      row.date = row.year + '-' + month
      var obj = {} // temp object to hold reservoir data
      Object.keys(row).forEach(function(header){
        var non_reservoir_headers = ['date', 'month', 'year', '', 'capacity']
        if(non_reservoir_headers.indexOf(header) !== -1) return
        // convert to numbers and namespace the reservoirs
        obj[header] = Number(row[header])
        delete row[header]
      })
      row.reservoirs = obj
      /*
      row === {
        date:, month:, year:, reservoirs: {sha:10, led:30, ...}
      }
      */
      return row
    }, function(err, history){
      if(err) throw err
      if(!$scope.$$phase) $scope.$apply(got_history)
      else got_history()
      function got_history(){
        $scope.now = 0
        $scope.playing = true
        // just just data for the last 5 years
        history = history.filter(function(d){ return d.year >= 2010 })
        $scope.history = history
        $scope.domain = [history[0].date, history[history.length - 1].date]
        now_change()
        $scope.reservoirs = reservoirs
          .map(function(reservoir){
            // get _all_ the historic data for this reservoir
            var data = []
            if(history[0].reservoirs[reservoir.id])
              data = history.map(function(step){
                return {
                    value: step.reservoirs[reservoir.id]
                  , year: step.year
                  , month: step.month
                }
              })
            // group the historic data by year
            var data = d3.nest().key(function(d){ return d.year }).entries(data)
            reservoir.data = data
            return reservoir
          }).filter(function(d){ return d.data.length })
        $scope.loaded = true
        if(window._gaq) _gaq.push(['_trackEvent', 'data', 'loading', 'finish'])
      }
    })
  })
  d3.json('data/counties.topojson', function(err, shapefile){
    if(err) throw err
    $scope.shapefile = shapefile
    $scope.$apply()
  })
})