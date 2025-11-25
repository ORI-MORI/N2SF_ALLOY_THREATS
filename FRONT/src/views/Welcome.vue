<template>
  <div class="welcome-container">
    <h1>OTD with Alloy</h1>
    <p>N2SF Intelligent Audit System</p>
    <div class="actions">
      <button @click="newDiagram" class="btn primary">New Diagram</button>
      <button @click="triggerLoad" class="btn secondary">Load JSON</button>
      <input type="file" ref="fileInput" accept=".json" style="display: none" @change="loadJson" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const fileInput = ref(null)

const newDiagram = () => {
  localStorage.removeItem('otd_model')
  router.push('/editor')
}

const triggerLoad = () => {
  fileInput.value.click()
}

const loadJson = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target.result)
      localStorage.setItem('otd_model', JSON.stringify(json))
      router.push('/editor')
    } catch (err) {
      alert('Invalid JSON file')
    }
  }
  reader.readAsText(file)
}
</script>

<style scoped>
.welcome-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.actions {
  margin-top: 2rem;
}

.btn {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  margin: 0 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.primary {
  background-color: #3498db;
  color: white;
}

.secondary {
  background-color: #95a5a6;
  color: white;
}
</style>
