<script setup>
import { computed, watchEffect, onMounted, ref, watch } from 'vue'
import { select } from 'd3-selection'
import { drag } from 'd3-drag'
import {
  forceSimulation,
  forceLink, forceManyBody,
  forceCollide, forceCenter,
  forceX, forceY
} from 'd3-force'
import { zoom } from 'd3-zoom'
import { initData, initForceProperties } from './data'

const svgRef = ref(null)

let simulation = null
let svg = null
let graph = null
let grid = null
let thisZoom = null

const data = ref(initData)
const forceProperties = ref(initForceProperties)
const widthPx = ref(1024)
const heightPx = ref(768)
const gridSize = ref(100)

watch(data, (currentValue, oldValue) => {
  updateData(currentValue.nodes, currentValue.links)
})
watch(forceProperties, (currentValue, oldValue) => {
  updateForces(currentValue)
})

function tick () {
  const transform = d => {
    return 'translate(' + d.x + ',' + d.y + ')'
  }
  const link = d => {
    return 'M' + d.source.x + ',' + d.source.y + ' L' + d.target.x + ',' + d.target.y
  }
  graph.selectAll('path').attr('d', link)
  graph.selectAll('circle').attr('transform', transform)
  graph.selectAll('text').attr('transform', transform)
}

function updateData (nodes, links) {
  simulation.nodes(nodes)
  simulation.force('link').links(links)

  graph.selectAll('path')
      .data(simulation.force('link').links())
      .enter().append('path')
      .attr('class', d => 'link ' + d.type)
      .exit().remove()

  graph.selectAll('circle')
      .data(simulation.nodes())
      .enter().append('circle')
      .attr('r', 30)
      .attr('class', d => d.class)
      .call(drag()
          .on('start', nodeDragStarted)
          .on('drag', nodeDragged)
          .on('end', nodeDragEnded))
      .exit().remove()

  graph.selectAll('text')
      .data(simulation.nodes())
      .enter().append('text')
      .attr('x', 0)
      .attr('y', '.31em')
      .attr('text-anchor', 'middle')
      .text(d => d.name)

  simulation.alpha(1).restart()
}

function zoomed (event) {
  const transform = event.transform
  // The trick here is to move the grid in a way that the user doesn't perceive
  // that the axis aren't really moving
  // The actual movement is between 0 and gridSize only for x and y
  const translate = transform.x % (gridSize.value * transform.k) + ',' +
      transform.y % (gridSize.value * transform.k)
  grid.attr('transform', 'translate(' +
      translate + ') scale(' + transform.k + ')')
  graph.attr('transform', transform)

  // Define some world boundaries based on the graph total size
  // so we don't scroll indefinitely
  const graphBox = graph.node().getBBox()
  const margin = 200
  const worldTopLeft = [graphBox.x - margin, graphBox.y - margin]
  const worldBottomRight = [
    graphBox.x + graphBox.width + margin,
    graphBox.y + graphBox.height + margin
  ]
  thisZoom.translateExtent([worldTopLeft, worldBottomRight])
}

function nodeDragStarted (event, d) {
  if (!event.active) { simulation.alphaTarget(0.3).restart() }
  d.fx = d.x
  d.fy = d.y
}

function nodeDragged (event, d) {
  d.fx = event.x
  d.fy = event.y
}

function nodeDragEnded (event, d) {
  if (!event.active) { simulation.alphaTarget(0.0001) }
  d.fx = null
  d.fy = null
}

function updateForces (fp) {

  simulation.force('center')
      .x(widthPx.value * fp.center.x)
      .y(heightPx.value * fp.center.y)
  simulation.force('charge')
      .strength(fp.charge.strength * fp.charge.enabled)
      .distanceMin(fp.charge.distanceMin)
      .distanceMax(fp.charge.distanceMax)
  simulation.force('collide')
      .strength(fp.collide.strength * fp.collide.enabled)
      .radius(fp.collide.radius)
      .iterations(fp.collide.iterations)
  simulation.force('forceX')
      .strength(fp.forceX.strength * fp.forceX.enabled)
      .x(widthPx.value * fp.forceX.x)
  simulation.force('forceY')
      .strength(fp.forceY.strength * fp.forceY.enabled)
      .y(heightPx.value * fp.forceY.y)
  simulation.force('link')
      .distance(fp.link.distance)
      .iterations(fp.link.iterations)

  // updates ignored until this is run
  // restarts the simulation (important if simulation has already slowed down)
  simulation.alpha(1).restart()
}

onMounted(() => {
  svg = select(svgRef.value)

  thisZoom = zoom()
      .scaleExtent([1 / 4, 4])
      .on('zoom', zoomed)
  svg.call(thisZoom)

  grid = svg.append('rect')
      .attr('x', '-10%')
      .attr('y', '-10%')
      .attr('width', '400%')
      .attr('height', '400%')
      .attr('fill', 'url(#grid)')
  graph = svg.append('g')

  widthPx.value = window.innerWidth
  heightPx.value = window.innerHeight

  simulation = forceSimulation()
      .force('link', forceLink())
      .force('charge', forceManyBody())
      .force('collide', forceCollide())
      .force('center', forceCenter())
      .force('forceX', forceX())
      .force('forceY', forceY())
      .on('tick', tick)

  updateForces(forceProperties.value)
  updateData(data.value.nodes, data.value.links)

})

</script>

<template>
  <div :style="{ width: widthPx + 'px', height: heightPx + 'px', border: '1px solid red' }">
    <svg ref="svgRef" height="100%" width="100%">
      <pattern id="innerGrid" :height="widthPx" :width="heightPx" patternUnits="userSpaceOnUse">
        <rect fill="none" height="100%" stroke="#CCCCCC7A" stroke-width="0.5" width="100%"/>
      </pattern>
      <pattern id="grid" :height="gridSize" :width="gridSize" patternUnits="userSpaceOnUse">
        <rect fill="url(#innerGrid)" height="100%" stroke="#CCCCCC7A" stroke-width="1.5" width="100%"/>
      </pattern>
    </svg>
  </div>
</template>

<style>
path.link {
  fill: none;
  stroke: #666;
  stroke-width: 1.5px;
}

path.link.depends {
  stroke: #005900;
  stroke-dasharray: 5, 2;
}

path.link.needs {
  stroke: #7f3f00;
}

circle {
  fill: #ffff99;
  stroke: #191900;
  stroke-width: 1.5px;
}

circle.system {
  fill: #cce5ff;
  stroke: #003366;
}

circle.mount {
  fill: #ffe5e5;
  stroke: #660000;
}

circle.init {
  fill: #b2e8b2;
  stroke: #001900;
}

text {
  font: 10px sans-serif;
  pointer-events: none;
  text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;
}
</style>