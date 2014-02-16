'use strict'

app.directive('stackedBarChart', function(){
  function link(scope, el, attrs){
    el = el[0]
    var width, height
    var x = d3.scale.ordinal(), y = d3.scale.linear()
    var max, min, data, stack = d3.layout.stack()
    var svg = d3.select(el).append('svg')
    var layers = svg.append('g').selectAll('g.layer')
    var colors = d3.scale.category20()
    var layerData = []

    stack.values(scope.values || function(d){ return d.values })
      .order('inside-out')

    // watch for resize changes
    scope.$watch(function(){
      return el.clientWidth * el.clientHeight
    },function(){
      width = el.clientWidth
      height = el.clientHeight
      resize()
    })

    function resize(){
      svg.attr({width: width, height: height})
      if(!layerData || !layerData.length) return
      var layer = layerData[0]
      var xvalues = layer.values.map(function(d){ return d.x })
      x.domain(xvalues).rangeBands([0, width], 0, 0)
      y.range([0, height])
      // update the bars for each group
      layers.style('fill', function(d){ return colors(d.name) })

      layers.selectAll('rect').attr({
          x: function(d, i){ return x(d.x) }
        , y: function(d){ return height - y(d.y0) - y(d.y) }
        , height: function(d){ return y(d.y) }
        , width: x.rangeBand()
      }).on('mouseover', function(d){
        console.log(d.x)
      })
    }

    scope.$watch('data', update, true)
    // update the `values` accessor
    scope.$watch('values', function(values){
      if(!values) return
      stack.values(values)
      update()
    })
    // update the `x` accessor
    scope.$watch('x', function(x){ if(!x) return; stack.x(x); update() })
    scope.$watch('y', function(y){ if(!y) return; stack.y(y); update() })
    // TODO: optimization - combine these three accessor watches into a single 
    // watch.
    function update(){
      if(!scope.data || !scope.data.length) return
      layerData = stack(scope.data)
      var last = layerData[layerData.length - 1]
      var max = scope.max || d3.max(layerData, function(layer){
        return d3.max(layer.values, function(d){ return d.y + d.y0 })
      })
      y.domain([0, max])
      // add the necessary groups
      layers = layers.data(layerData)
      layers.exit().remove()
      layers.enter().append('g').attr('class','layer')
      var rects = layers.selectAll('rect').data(function(d){ return d.values })
      rects.exit().remove()
      rects.enter().append('rect')
      resize()
    }
  }

  return {
      link: link
    , restrict: 'E'
    , scope: { data: '=', x: '=', y: '=', values: '=', max: '=' }
  }
})