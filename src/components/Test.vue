<script setup>
// Based on
// https://bl.ocks.org/agnjunio/fd86583e176ecd94d37f3d2de3a56814

import { computed, watchEffect, onMounted, ref, watch, onBeforeMount } from 'vue'
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
let graph = null
let grid = null
let thisZoom = null
let svg = null

const data = ref(initData)
const forceProperties = ref(initForceProperties)
const height = ref(768)
const width = ref(1024)
const gridSize = ref(100)

watch(data, (currentValue, oldValue) => {
  updateData(currentValue.nodes, currentValue.links)
})
watch(forceProperties, (currentValue, oldValue) => {
  updateForces(currentValue)
})

function tick () {

  // If no data is passed to the Vue component, do nothing
  if (!data.value) { return }
  const transform = d => {
    return 'translate(' + d.x + ',' + d.y + ')'
  }

  const link = d => {
    // Self-link support
    if (d.source.index === d.target.index) {
      return `M${d.source.x - 1},${d.source.y - 1}A30,30 -10,1,0 ${d.target.x + 1},${d.target.y + 1}`
    } else {
      return 'M' + d.source.x + ',' + d.source.y + ' L' + d.target.x + ',' + d.target.y
    }
  }

  graph.selectAll('path').attr('d', link)
  graph.selectAll('circle').attr('transform', transform)
  graph.selectAll('text').attr('transform', transform)
  // graph.selectAll('link-text').attr('translate', transform)
}

function updateData (nodes, links) {
  simulation.nodes(nodes)
  simulation.force('link').links(links)

  // Links should only exit if not needed anymore
  graph.selectAll('path')
      .data(links)
      .exit().remove()


  graph.selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('marker-end', 'url(#triangle)')
      .attr('class', d => 'link ' + d.type)

  // Nodes should always be redrawn to avoid lines above them
  graph.selectAll('nodes').remove()
  graph.selectAll('nodes')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 30)
      .attr('class', d => d.class)
      .call(drag()
          .on('start', nodeDragStarted)
          .on('drag', nodeDragged)
          .on('end', nodeDragEnded))
      .on('mouseover', nodeMouseOver)
      .on('mouseout', nodeMouseOut)
      .on('click', nodeClick)

  //       <text x="1000" y="1000" class="Rrrrr">Grumpy!</text>

  graph.selectAll('text').remove()
  graph.selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('class', 'node-text')
      .attr('x', 0)
      .attr('y', '.31em')
      .attr('text-anchor', 'middle')
      .text(d => d.name)


  // graph.selectAll('link-text').remove()
  // graph.selectAll('link-text')
  //     .data(links)
  //     .enter().append('text')
  //     .attr('class', 'link-text')
  //     .text(d => d.type)


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

function nodeMouseOver (event, d) {
  const circle = graph.selectAll('circle')
  const path = graph.selectAll('path')
  const text = graph.selectAll('text')

  const related = []
  const relatedLinks = []
  related.push(d)
  simulation.force('link').links().forEach((link) => {
    if (link.source === d || link.target === d) {
      relatedLinks.push(link)
      if (related.indexOf(link.source) === -1) { related.push(link.source) }
      if (related.indexOf(link.target) === -1) { related.push(link.target) }
    }
  })
  circle.classed('faded', true)
  circle
      .filter((df) => related.indexOf(df) > -1)
      .classed('highlight', true)
  path.classed('faded', true)
  path
      .filter((df) => df.source === d || df.target === d)
      .classed('highlight', true)
  text.classed('faded', true)
  text
      .filter((df) => related.indexOf(df) > -1)
      .classed('highlight', true)
  // This ensures that tick is called so the node count is updated
  simulation.alphaTarget(0.0001).restart()
}

function nodeMouseOut (event, d) {
  const circle = graph.selectAll('circle')
  const path = graph.selectAll('path')
  const text = graph.selectAll('text')

  circle.classed('faded', false)
  circle.classed('highlight', false)
  path.classed('faded', false)
  path.classed('highlight', false)
  text.classed('faded', false)
  text.classed('highlight', false)
  // This ensures that tick is called so the node count is updated
  simulation.restart()
}

function nodeClick (event, d) {
  const circle = graph.selectAll('circle')
  circle.classed('selected', false)
  circle.filter((td) => td === d)
      .classed('selected', true)
}

function updateForces (fp) {

  simulation.force('center')
      .x(width.value * fp.center.x)
      .y(height.value * fp.center.y)
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
      .x(width.value * fp.forceX.x)
  simulation.force('forceY')
      .strength(fp.forceY.strength * fp.forceY.enabled)
      .y(height.value * fp.forceY.y)
  simulation.force('link')
      .distance(fp.link.distance)
      .iterations(fp.link.iterations)

  // updates ignored until this is run
  // restarts the simulation (important if simulation has already slowed down)
  simulation.alpha(1).restart()
}

onBeforeMount(() => {
  width.value = window.innerWidth
  height.value = window.innerHeight

  simulation = forceSimulation()
      .force('link', forceLink())
      .force('charge', forceManyBody())
      .force('collide', forceCollide())
      .force('center', forceCenter())
      .force('forceX', forceX())
      .force('forceY', forceY())
      .on('tick', tick)

  updateForces(forceProperties.value)
})

onMounted(() => {
  svg = select(svgRef.value)

  // Add zoom and panning triggers
  thisZoom = zoom()
      .scaleExtent([1 / 4, 4])
      .on('zoom', zoomed)
  svg.call(thisZoom)

  // A background grid to help user experience
  // The width and height depends on the minimum scale extent and
  // the + 10% and negative index to create an infinite grid feel
  // The precedence of this element is important since you'll have
  // click events on the elements above the grid
  grid = svg.append('rect')
      .attr('x', '-10%')
      .attr('y', '-10%')
      .attr('width', '410%')
      .attr('height', '410%')
      .attr('fill', 'url(#grid)')

  graph = svg.append('g')

  updateData(data.value.nodes, data.value.links)
})

</script>

<template>
  <div :style="{ width: width + 'px', height: height + 'px', border: '1px solid black' }">
    <svg ref="svgRef">
      <defs>
        <marker id="triangle" markerHeight="8"
                markerUnits="strokeWidth" markerWidth="8"
                orient="auto"
                refX="32" refY="5"
                viewBox="0 0 10 10">
          <path d="M 0 0 L 7 5 L 0 10 z" fill="#000000"/>
        </marker>
      </defs>
      <pattern id="grid" :height="gridSize" :width="gridSize" patternUnits="userSpaceOnUse">
        <rect fill="url(#innerGrid)" height="100%" stroke="#CCCCCC7A" stroke-width="1.5" width="100%"/>
      </pattern>
    </svg>
  </div>
</template>

<style>
.node-text {
  pointer-events: none;
  font:  10px serif;
  fill: #121010;
  text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;
}

.link-text {
  pointer-events: none;
  font:  10px serif;
  fill: #121010;
  text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;
}

.faded {
  opacity: 0.1;
  transition: 0.3s opacity;
}

.highlight {
  opacity: 1;
}

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

circle.selected {
  stroke: #ff6666FF !important;
  stroke-width: 3px;
  animation: selected 2s infinite alternate ease-in-out;
}

@keyframes selected {
  from {
    stroke-width: 5px;
    r: 26;
  }
  to {
    stroke-width: 1px;
    r: 30;
  }
}

</style>