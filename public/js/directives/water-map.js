app.directive('waterMap', function(){
  function link(scope, el, attr){
    el = el[0]
    var width, height
      , pi = Math.PI
      , max_r = 30
      , generate_map_png = false
      , color = d3.scale.linear().range(['red', 'blue'])
      , png_not_canvas = true
      , duration = 650
      , map_bg = d3.select(el).append('canvas')
      , map_img = d3.select(el).append('img').attr('class', 'fill-map')
          .style('display', png_not_canvas ? 'block' : 'none')
      , svg = d3.select(el).append('svg').attr('class', 'fill-map')
      , zoomGroup = svg.append('g')
      , proj = d3.geo.albers()
      , shapefile
      , calloutComing = zoomGroup.append('path').attr('class', 'callout coming')
      , calloutGoing = zoomGroup.append('path').attr('class', 'callout going')
      , landmarks = zoomGroup.append('g').attr('class', 'landmarks')
      , reservoirs = zoomGroup.append('g').attr('class', 'reservoirs')
        .selectAll('g.reservoir')
      , clickRegions = svg.append('g').attr('class', 'click-region')
      , radiusToArea = function(r){ return Math.PI * Math.pow(r, 2) }
      , areaToRadius = function(area){ return Math.sqrt(area / Math.PI) }

    map_img.attr('src', 'map_bg.png')

    // aka, [0, 1] -> [0, pi]
    var capacityScale = d3.scale.linear().range([1, max_r])
    var voronoi = d3.geom.voronoi()
      .x(function(d){ return proj([d.longitude, d.latitude])[0] })
      .y(function(d){ return proj([d.longitude, d.latitude])[1] })

    // window.poly = []
    // svg.on('click', function(d){
    //   var p = d3.mouse(this)
    //   window.poly.push(p)
    //   svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 5)
    //   console.log(p)
    //   console.log(window.poly)
    // })

    var points = svg.append('g')
    var coords = []
    var hovered_reservoir = null

    // add some landmarks for reference
    var landmark = landmarks.selectAll('g').data([
      {
          name: 'San Francisco'
        , lon: -122.68
        , lat: 37.75
      }
      , {
          name: 'San Diego'
        , lon: -116.98
        , lat: 32.57
      }
      , {
          name: 'Los Angeles'
        , lon: -118.40
        , lat: 33.93
      }
      , {
        name: 'San Jose'
        , lon: -121.92
        , lat: 37.37
      }
      , {
        name: 'Fresno'
        , lon: -119.72
        , lat: 36.77
      }
      , {
          name: 'Sacramento'
        , lon: -121.50
        , lat: 38.52
      }
    ]).enter().append('g')
    landmark.append('circle').attr('r', 3)
    landmark.append('text')
      .attr('x', function(d){ return -5 })
      .text(function(d){ return d.name })
      .style('text-anchor', function(d){ return d.anchor || 'end' })

    // resize()
    function resize(){
      width = el.clientWidth, height = el.clientHeight
      map_bg.attr({width: width, height: height})
      svg.attr({width: width, height: height})
      proj.translate([width / 2 - 20, height / 2])
        .rotate([117.9, 1.3, 1])
        .scale(3000)
      voronoi.clipExtent([[0, 0], [width, height]])
      map_img.attr({width: width, height: height})
      landmarks.selectAll('g')
        .attr('transform', function(d){
          return 'translate(' +  proj([d.lon, d.lat]) + ')'
        })
    }
    scope.$watch(function(){ return el.clientWidth + el.clientHeight }, resize)
    scope.$watch('reservoirs', function(data){
      if(!data || !data.length) return
      var max = d3.max(data, function(d){ return Number(d.capacity) })
      capacityScale.domain([0, max])
      reservoirs = reservoirs.data(data, function(d){ return d.id })
      reservoirs.exit().remove()
      var reservoir = reservoirs.enter().append('g')
        .attr('class', 'reservoir')
        .attr('transform', function(d){
          return 'translate(' + proj([d.longitude, d.latitude]) + ')' 
        }).append('g').attr('class', 'scale')
      reservoir.call(set_reservoir_scale, 0)
      .transition().duration(1000)
      .call(set_reservoir_scale_to_capacity)
      reservoir.append('circle')
        .attr('class', 'capacity')
        .attr('r', function(d){ return areaToRadius(pi) })
      reservoir.append('circle').attr('class', 'level')
      var join = clickRegions.selectAll('path').data(voronoi(data))
      join.exit().remove()
      join.enter().append('path')
      // clipping polygon for voronoi region
      var poly = [[23,49],[123,40],[165,43],[202,71],[375,424],[353,570]
        ,[313,581],[162,501],[11,183]].reverse()
      join.style('fill', function(d, i){ return 'rgba(0, 0, 0, 0)' })
        .attr('d', function(d, i){
          if(!d) return null
          if(d.length === 0) return ''
          // d3.geom.polygon(poly).clip(d).join('L')
          return 'M' + d.join('L') + 'Z' 
        })
        .on('click', function(d, i){
          first_active = true
          shrink_hovered_reservoir()
          scope.$apply(function(){ scope.selectedReservoir = data[i] })
        })
        .on('mouseover', function(_, i){
          if(first_active) return set_hovered_reservoir(data[i])
          shrink_hovered_reservoir()
          scope.$apply(function(){ scope.selectedReservoir = data[i] })
        })
      clickRegions.on('mouseout', function(){
        shrink_hovered_reservoir()
        first_active = true
      })
    })

    var first_active = true

    function shrink_hovered_reservoir(){
      if(!hovered_reservoir) return
      var sel = d3.select(hovered_reservoir)
      var d = sel.datum()
      if(sel.classed('selected')) return
      sel.classed('hover', false).select('.scale')
        .transition()
        .call(set_reservoir_scale, capacityScale(d.capacity))
    }

    function set_hovered_reservoir(d){
      shrink_hovered_reservoir()
      var sel = d3.select(reservoir_el_given_d(d))
      if(sel.classed('selected')) return
      sel.classed('hover', true).select('.scale')
        .transition().call(set_reservoir_scale, max_r)
      // replace old hovered reservoir
      hovered_reservoir = sel.node()
      // sort the reservoirs so that the hovered reservoir is on top
      reservoirs.sort(function(a, b){
        return a === d ? 1 : 0 - b === d ? 1 : 0 })
    }
  
    function set_reservoir_scale(g_scale, scale){
      g_scale.attr('transform', function(d){
        var _scale
        if(scale instanceof Function) _scale = scale(d)
        else _scale = scale
        return 'scale(' + _scale + ')'
      })
    }
    function set_reservoir_scale_to_capacity(g_scale){
      // g_scale.call(set_reservoir_scale, 5)
      g_scale.call(set_reservoir_scale, function(d){ 
        return capacityScale(d.capacity) })
    }

    scope.$watch('history', draw_levels)

    scope.$watch('now', draw_levels)

    function draw_levels(){
      if(scope.history === undefined || scope.now === undefined) return
      if(!scope.history.length) return
      reservoirs.select('.level')
        .transition().duration(duration)
        .ease('linear')
        .attr('r', function(d){
          var val = scope.history[scope.now].reservoirs[d.id] || 0
          var ratio = val / d.capacity
          return areaToRadius(ratio * pi)
        })
        // .style('fill', function(d){
        //   var val = scope.history[scope.now].reservoirs[d.id] || 0
        //   var ratio = val / d.capacity
        //   return color(ratio)
        // })
    }

    scope.$watch('shapefile', update_shapefile)
    function update_shapefile(_){
      if(!_) return
      shapefile = _
      if(png_not_canvas) return
      var counties = topojson.feature(shapefile, shapefile.objects.counties)
      draw_map_to_canvas(counties)
    }

    function draw_map_to_canvas(counties){
      var context = map_bg.node().getContext("2d")
      var path = d3.geo.path().projection(proj).context(context)
      context.beginPath()
      path(counties)
      context.lineWidth = 4
      context.strokeStyle = '#ddd'
      context.stroke()
      context.fillStyle = '#f5f5f5'
      context.fill()
      context.lineWidth = 1
      context.strokeStyle = '#ddd'
      context.stroke()
      // F it. just save it as an image and load the image
      if(generate_map_png) window.location = map_bg.node().toDataURL("image/png")
    }

    var prev_sel
    function update_selected_reservoir(d){
      if(!d) return
      var sel = d3.select(reservoir_el_given_d(d))
      if(prev_sel && sel.node() === prev_sel.node()) return
      var p1 = proj([d.longitude, d.latitude])
        , callout_loc = [270, 073]
        , p2 = callout_loc
      scope.selectedReservoir = d
      p1 = proj([d.longitude, d.latitude])
      var thick = 20
      var c = [p2[0] - p1[0], p2[1] - p1[1]]
      var l = Math.sqrt(c[0]*c[0]+c[1]*c[1])
      c[0] = c[0] / l * (l - 40), c[1] = c[1] / l * (l - 40)
      p2 = [p1[0] + c[0], p1[1] + c[1]]
      sel.classed('selected', true)
        .transition().duration(duration).delay(!prev_sel ? 1000 : 0)
        .attr('transform', 'translate(' + callout_loc + ')')
        .select('.scale').attr('transform', 'scale(' + max_r + ')')
      calloutComing.attr('d', 'M' + [p1, p1].join('L') + 'Z')
        .style('opacity', 0)
        .style('stroke-width', thick)
        .transition().duration(duration).delay(!prev_sel ? 1000 : 0)
        .attr('d', 'M' + [p1, p2].join('L') + 'Z')
        .style('opacity', 1)
        .style('stroke-width', 1)
        .transition().duration(duration).delay((!prev_sel ? 1000 : 0) + duration)
        .style('stroke-width', thick)
        .attr('d', 'M' + [p2, p2].join('L') + 'Z')
      if(!prev_sel || !prev_sel.node())
        return prev_sel = sel, hovered_reservoir = null
      // put away the previously selected reservoir
      d = prev_sel.datum()
      p1 = proj([d.longitude, d.latitude])
      p2 = callout_loc
      c = [p2[0] - p1[0], p2[1] - p1[1]]
      l = Math.sqrt(c[0]*c[0]+c[1]*c[1])
      c[0] = c[0] / l * (l - 40), c[1] = c[1] / l * (l - 40)
      p2 = [p1[0] + c[0], p1[1] + c[1]]
      calloutGoing.attr('d', 'M' + [p1, p2].join('L') + 'Z')
        .style('stroke-width', 1)
        .style('opacity', 1)
        .transition().duration(duration)
        .attr('d', 'M' + [p1, p1].join('L') + 'Z')
        .style('stroke-width', thick)
        .style('opacity', 0)
      prev_sel.classed('selected', false)
        .transition().duration(duration)
        .attr('transform', function(d){
        return 'translate(' + p1 + ')'
      }).select('.scale').call(set_reservoir_scale_to_capacity)
      hovered_reservoir = null, prev_sel = sel
    }

    function reservoir_el_given_d(d){
      return reservoirs.filter(function(d_){ return d_ === d }).node()
    }

    scope.$watch('selectedReservoir', update_selected_reservoir)

  }
  return {
      link: link
    , restrict: 'E'
    , scope: {
        reservoirs: '='
      , shapefile: '='
      , history: '='
      , now: '='
      , selectedReservoir: '=?'
    }
  }
})