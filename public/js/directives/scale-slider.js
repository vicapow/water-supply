app.directive('scaleSlider', function(){
  function link(scope, el){
    el = el[0]
    var w, h, m = { top: 5, right: 20, bottom: 25, left: 20 }
    var svg = d3.select(el).append('svg')
    var axis = d3.svg.axis()
      .innerTickSize(5)
      .ticks(4)
      // .tickFormat(function(d, i){ return months[d.getUTCMonth()] })
    var axisG = svg.append('g')
    var progressBar = svg.append('rect').attr('class', 'progress-bar')
    var nobG = svg.append('g'), nob_pos = [0, 0]
    var clickRect = svg.append('rect')
    scope.scale = scope.scale || d3.time.scale.utc()
    var dragging = false
    nobG.append('circle').attr('r', 6).attr('cx', 1).attr('cy', 1).attr('class', 'shadow')
    nobG.append('circle').attr('r', 6).attr('class', 'nob')
    nobG.style('pointer-events', 'none')
    clickRect
      .on('click', function(){
        if(dragging) return
        d3.event.stopPropagation()
        position_playhead(d3.event.offsetX)
      })
      .call(d3.behavior.drag()
        .on('dragstart', function(){
          if(window._gaq) _gaq.push(['_trackEvent', 'slider', 'drag', 'start'])
          dragging = true
        })
        .on('dragend', function(){ dragging = false})
        .on('drag', function(){ position_playhead(d3.event.x) }))

    function position_playhead(x){
      var range = scope.scale.range(), last = range[range.length - 1]
      if(x < range[0]) x = range[0]
      if(x > last) x = last
      scope.$apply(function(){ scope.now = scope.scale.invert(x) })
      nobG.call(position_nob, {x: x})
    }

    function position_nob(sel, pos){
      if(pos.x !== undefined) nob_pos[0] = pos.x
      if(pos.y !== undefined) nob_pos[1] = pos.y
      sel.attr('transform', 'translate(' + nob_pos + ')')
    }

    scope.$watch(function(){
      return w = el.clientWidth, h = el.clientHeight, w + h
    }, update_size)
    function update_size(){
      svg.attr({width: w, height: h })
      // scope.scale.range([m.left, w - m.right])
      scope.scale.range([m.left, w - m.right])
      axisG.call(axis.scale(scope.scale))
      axisG.attr('transform', 'translate(' + [0, h - m.bottom] + ')')
      nobG.call(position_nob, {y: h - m.bottom})
      clickRect.attr('width', w).attr('height', h)
        .style('fill', 'rgba(0, 0, 0, 0)')
        .style('stroke', 'none')
      progressBar.attr({ x: scope.scale.range()[0], y: h - m.bottom, height: 1})
    }
    scope.$watch('domain', function(domain){
      if(domain === undefined) return
      domain = domain.map(function(d){ return new Date(d) })
      scope.scale.domain(domain)
      axisG.call(axis.scale(scope.scale))
    })
    scope.$watch('now', function(now){
      if(now === undefined) return
      var x = scope.scale(now), nob = nobG, progress = progressBar
      if(!dragging) nob = nob.transition().duration(500).ease('linear')
      nob.call(position_nob, {x: x})
      if(!dragging) progress = progress.transition().duration(500).ease('linear')
      progress.attr('width', x - scope.scale.range()[0])
    })
  }
  return {
      link: link
    , restrict: 'E'
    , scope : { now: '=', scope: '=?', domain: '=' }
  }
})