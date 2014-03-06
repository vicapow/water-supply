app.directive('reservoirDetail', function(){
  var months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
       .concat(['Oct', 'Nov', 'Dec'])
  var percent = d3.format('.0%')
  function link(scope, el, attr){
    el = el[0]
    var w, h, innerHeight
    var x = d3.scale.ordinal().domain(d3.range(1, 13)), y = d3.scale.linear()
    var colors = d3.scale.category10()
    // var colors = d3.scale.linear().domain([0, 1]).range(['#31a354', '#addd8e'])
    var xAxis = d3.svg.axis().tickFormat(function(d){ return months[d] })
    var yAxis = d3.svg.axis().tickFormat(function(d){ return percent(d) })
    var svg = d3.select(el).append('svg')
    var line = d3.svg.line()
      .x(function(d){ return x(d.month) })
      .y(function(d){ return y(d.value) })

    var graph = svg.append('g').attr('class', 'graph')
      .attr('transform', 'translate(' + [65, 20] + ')')
    var years = graph.append('g').attr('class', 'years')

    var xAxisG = years.append('g').attr('class', 'axis-x')
    var yAxisG = years.append('g').attr('class', 'axis-y')

    years.append('g').attr('class', 'axis-y-label')
      .attr('transform', 'translate(-30, 100) rotate(-90)')
      .append('text').text('percent of capacity')

    // var nob = graph.append('g').attr('class', 'nob')
    // nob.append('circle').attr('r', 4)


    scope.$watch(function(){
      w = el.clientWidth, h = el.clientHeight
      innerHeight = h - 100
      return w + h
    }, resize)
    function resize(){
      yAxis.orient('left')
      svg.attr({width: w, height: h})
      var data = [[0, 0], [w, 0], [w, h], [0, h]]
      svg.selectAll('circle').data(data)
        .attr('cx', function(d){ return d[0] })
        .attr('cy', function(d){ return d[1] })
      x.rangeRoundBands([0, 230], 0, 0), y.range([innerHeight, 0])
      xAxisG.call(xAxis.scale(x).innerTickSize(-innerHeight))
        .attr('transform', 'translate(' + [0, innerHeight] + ')')
      yAxisG.call(yAxis.scale(y).innerTickSize(-230))
        .attr('transform', 'translate(' + [0, 0] + ')')
    }

    scope.$watch('reservoir.data', function(data){
      if(!data || !scope.reservoir) return
      colors.domain([0, data.length - 1])
      y.domain([0, scope.reservoir.capacity])
      
      var join = years.selectAll('g.year').data(data)
      
      join.exit().remove()
      
      join.enter().append('g').attr('class', 'year')
        .call(function(year){
          year.append('text').attr('class', 'label')
        })
        .call(function(year){
          year.append('line').attr('x1', -5).attr('x2', 230 + 5)
            .attr('y1', innerHeight).attr('y2', innerHeight) })
        .call(function(year){
          year.append('line').attr('x1', 0).attr('x2', 0)
            .attr('y1', 0).attr('y2', innerHeight) })
        .append('path')

      var spacing = 10

      join.select('.label').text(function(d){ return d.key })
        .attr('x', 240)
        .attr('y', function(d, i){ return 30 * i + 10 })
        .style('fill', function(d, i){ return colors(i) })
      
      // `data` is an array of each year, in { key: '1992', values: [...] } form
      join.select('path')
        .transition()
        .attr('d', function(d){ return line(d.values) })
        .style('stroke', function(d, i){ return colors(i) })
    })
    
    // scope.$watch('month * year', function(){ })

  }
  return {
    link: link, restrict: 'E', scope: { reservoir: '=', year: '=', month: '=' }
  }
})