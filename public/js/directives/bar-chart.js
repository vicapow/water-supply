'use strict'

app.directive('barChart', function(){
  function link(scope, el, attr){
    el = el[0]
    var w, h
      , svg = d3.select(el).append('svg')
      , rects = svg.append('g').selectAll('rect')
      , x = d3.scale.ordinal(), y = d3.scale.linear()

    scope.$watch(function(){
      return w = el.clientWidth, h = el.clientHeight, w + h
    }, resize)
    function resize(){
      svg.attr({width: w, height: h})
      x.rangeBands([0, w], 0, 0), y.range([h, 0])
    }
    scope.$watch('data', function(data){
      if(!data || !data.length) return
      if(scope.domainX) x.domain(scope.domainX({data: data}))
      // TOOD: use accessor
      if(scope.max) y.domain([0, scope.max])
      else y.domain(d3.extent(data, function(d){ return d.value }))
      var color = d3.scale.linear().domain([0, scope.max])
        .range(['red', 'blue'])
      rects = rects.data(data)
      rects.exit().remove()
      rects.enter().append('rect')
        .attr("class", 'bar')
      rects.attr({
          x: function(d){ return x(d.month) }
        , y: function(d){ return y(d.value) }
        // , y: function(d){ return y(y.domain()[1])  }
        , width: x.rangeBand()
        , height: function(d){ return y(0) - y(d.value) }
        // , height: function(d){ return y(y.domain()[0]) - y(y.domain()[1]) }
      })
    })
  }
  return {
      link: link
    , restrict: 'E'
    , scope: {
        data: '='
      , x: '&'
      , y: '&'
      , max: '='
      , domainX: '&'
    }
  }
})