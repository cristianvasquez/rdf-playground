<script setup>
import Test from '../components/Bars.vue'
import { ref } from 'vue'

const data = ref([10, 40, 15, 25, 50])

function addData () {
  data.value = [...data.value, Math.round(Math.random() * 50)]
}

function filterData () {
  data.value = data.value.filter((v) => v <= 35)
}
</script>

<template>
  <div id="app">
    <test :data="data"/>
    <div class="buttons">
      <button @click="addData">Add data</button>
      <button @click="filterData">Filter data</button>
    </div>
  </div>
</template>


<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  max-width: 720px;
  margin: 100px auto;
  padding: 0 20px;
}

svg {
  /* important for responsiveness */
  display: block;
  fill: none;
  stroke: none;
  width: 100%;
  height: 100%;
  overflow: visible;
  background: #eee;
}

.buttons {
  margin-top: 2rem;
}
</style>
