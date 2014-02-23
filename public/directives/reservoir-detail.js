app.directive('reservoirDetail', function(){
  var months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
       .concat(['Oct', 'Nov', 'Dec'])
  function link(scope, el, attr){
    el = el[0]
    var w, h, yearHeight = 30
    var x = d3.scale.ordinal().domain(d3.range(1, 13)), y = d3.scale.linear()
    var axis = d3.svg.axis().tickFormat(function(d){ return months[d] })
    var svg = d3.select(el).append('svg')
    
    // for debugging
    // svg.selectAll('circle').data(d3.range(4)).enter()
    //   .append('circle').attr('r', 10)

    var years = svg.append('g').attr('class', 'years')
      .attr('transform', 'translate(' + [65, 0] + ')')

    var axisG = years.append('g').attr('class', 'axis-x')


    scope.$watch(function(){
      return w = el.clientWidth, h = el.clientHeight, w + h
    }, resize)
    function resize(){
      svg.attr({width: w, height: h})
      var data = [[0, 0], [w, 0], [w, h], [0, h]]
      svg.selectAll('circle').data(data)
        .attr('cx', function(d){ return d[0] })
        .attr('cy', function(d){ return d[1] })
      x.rangeRoundBands([0, 230], 0, 0), y.range([yearHeight, 0])
      axisG.call(axis.scale(x))
        .attr('transform', 'translate(' + [0, 190] + ')')
    }

    scope.$watch('reservoir', function(reservoir){
      if(!reservoir) return
      y.domain([0, reservoir.capacity])
    })

    scope.$watch('reservoir.data', function(data){
      if(!data) return
      var year = years.selectAll('g.year').data(data.slice(0).reverse())
      year.exit().remove()
      year.enter().append('g').attr('class', 'year')
        .call(function(year){
          year.append('text').attr('class', 'label')
            .attr('x', 250).attr('y', 35)
        })
        .call(function(year){
          year.append('line').attr('x1', -5).attr('x2', 230 + 5)
            .attr('y1', yearHeight).attr('y2', yearHeight)
        })
      var spacing = 10
      year.attr('transform', function(d, i){
        return 'translate(' + [0, (yearHeight + spacing) * i] + ')'
      }).select('.label').text(function(d){ return d.key })
      var rect = year.selectAll('rect').data(function(d){ return d.values })
      rect.exit().remove()
      rect.enter().append('rect')
      // `data` is an array of each year, in { key: '1992', values: [...] } form
      rect
        .transition()
        .attr('x', function(d, i){ return x(d.month) })
        .attr('y', function(d, i){ return y(d.value) })
        .attr('width', x.rangeBand())
        .attr('height', function(d){ return y(0) - y(d.value) })
    })
    
    scope.$watch('month * year', function(){
      years.selectAll('.year').selectAll('rect')
        .style('opacity', function(d){
          if(d.year === scope.year) return d.month <= scope.month ? 1 : 0.5
          return d.year < scope.year ? 1 : 0.5
        })
    })

  }
  return {
    link: link, restrict: 'E', scope: { reservoir: '=', year: '=', month: '=' }
  }
})