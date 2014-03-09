

app.directive('loadingDialog', function(){
  function link(scope, el, attr){
    var len = 24
      , dur = 1000
      , bar_height = 5
      , w = 200
      , h = 200
      , svg = d3.select(el[0]).select('div').append('svg')
      , root = svg.append('g')
      , g = root.append('g')
    
    svg.attr({width: w, height: h})
      .style({
        position: 'absolute'
        , left: - w / 2 + 'px'
        , top: - h / 2 + 'px'
        , width: w + 'px'
        , height: h + 'px'
      })

    root
      .attr('transform', 'translate(' + [w/2,h/2] + ')')
      .append('text').text('loading...')
      .attr('y', 3)

    var slices = g.selectAll('g.slice').data(d3.range(len))
      .enter().append('g').attr('class', 'slice')
        .attr('transform', function(d, i){
          return 'rotate(' + (i / (len) * 360) + ')'
        })

    slices.append('rect')
      .attr({width: 14, height: bar_height, y: - bar_height / 2, x: 35})

    function loop(sel){
      var dur = 4000
      sel.attr('transform', 'rotate(0)')
        .transition().duration(dur).ease('linear')
        .attr('transform', 'rotate(180)')
        .transition().duration(dur).ease('linear')
        .attr('transform', 'rotate(359)')
        .each('end', function(){ d3.select(this).call(loop) })
    }

    scope.$watch('ngShow', function(show){
      if(show) g.call(loop)
      else g.transition().duration(0).each('end', null)
    })
  }
  return {
      link: link
    , scope: { ngShow: '=' }
    , restrict: 'E'
    , template: '<div style="width:1px; height:1px;position:relative;overflow:visible"></div>'
  }
})