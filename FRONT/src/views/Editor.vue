<template>
  <div class="editor-container">
    <div class="toolbar">
      <span class="title">Diagram Editor</span>
      <button @click="analyze" class="analyze-btn">
        Analyze with Alloy
      </button>
    </div>
    <div class="main-area">
      <div ref="stencilContainer" class="stencil"></div>
      <div ref="graphContainer" class="graph-container"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Graph, Shape } from '@antv/x6'
import { Stencil } from '@antv/x6-plugin-stencil'
import { Transform } from '@antv/x6-plugin-transform'
import { Selection } from '@antv/x6-plugin-selection'
import { Snapline } from '@antv/x6-plugin-snapline'
import { Keyboard } from '@antv/x6-plugin-keyboard'
import { History } from '@antv/x6-plugin-history'
import { Export } from '@antv/x6-plugin-export'
import axios from 'axios'

const graphContainer = ref(null)
const stencilContainer = ref(null)
let graph = null

onMounted(() => {
  graph = new Graph({
    container: graphContainer.value,
    grid: true,
    mousewheel: {
      enabled: true,
      zoomAtMousePosition: true,
      modifiers: 'ctrl',
      minScale: 0.5,
      maxScale: 3,
    },
    connecting: {
      router: 'manhattan',
      connector: {
        name: 'rounded',
        args: {
          radius: 8,
        },
      },
      anchor: 'center',
      connectionPoint: 'anchor',
      allowBlank: false,
      snap: {
        radius: 20,
      },
      createEdge() {
        return new Shape.Edge({
          attrs: {
            line: {
              stroke: '#A2B1C3',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
          zIndex: 0,
        })
      },
      validateConnection({ targetMagnet }) {
        return !!targetMagnet
      },
    },
    highlighting: {
      magnetAdsorbed: {
        name: 'stroke',
        args: {
          attrs: {
            fill: '#5F95FF',
            stroke: '#5F95FF',
          },
        },
      },
    },
  })

  graph
    .use(
      new Transform({
        resizing: true,
        rotating: true,
      }),
    )
    .use(
      new Selection({
        rubberband: true,
        showNodeSelectionBox: true,
      }),
    )
    .use(new Snapline())
    .use(new Keyboard())
    .use(new History())
    .use(new Export())

  const stencil = new Stencil({
    title: 'Components',
    target: graph,
    stencilGraphWidth: 200,
    stencilGraphHeight: 180,
    collapsable: true,
    groups: [
      {
        title: 'Network Elements',
        name: 'group1',
      },
    ],
    layoutOptions: {
      columns: 1,
      columnWidth: 150,
      rowHeight: 100,
    },
  })

  stencilContainer.value.appendChild(stencil.container)

  // Define Shapes
  const pc = new Shape.Circle({
    width: 60,
    height: 60,
    label: 'PC',
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
      },
      label: {
        text: 'PC',
        fill: '#333333',
      }
    },
    data: { type: 'tm.Process' } // Mapping to OTD type
  })

  const server = new Shape.Rect({
    width: 80,
    height: 60,
    label: 'Server',
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
      },
      label: {
        text: 'Server',
        fill: '#333333',
      }
    },
    data: { type: 'tm.Store' } // Mapping to OTD type
  })

  const internet = new Shape.Rect({
    width: 100,
    height: 60,
    label: 'Internet',
    attrs: {
      body: {
        fill: '#f5f5f5',
        stroke: '#333333',
        strokeWidth: 2,
        strokeDasharray: '5 5',
      },
      label: {
        text: 'Internet',
        fill: '#333333',
      }
    },
    data: { type: 'tm.Actor' } // Mapping to OTD type
  })

  stencil.load([pc, server, internet], 'group1')

  // Load existing model if any
  const savedModel = localStorage.getItem('otd_model')
  if (savedModel) {
    try {
      const json = JSON.parse(savedModel)
      if (json.detail && json.detail.diagrams && json.detail.diagrams.length > 0) {
        // Simple loading: just take the cells
        // Note: OTD cells might need conversion if they are different from x6 default
        // But since we are building a new tool, we assume 'New Diagram' mostly.
        // For 'Load', we try to load cells directly.
        const cells = json.detail.diagrams[0].diagramJson.cells
        graph.fromJSON({ cells })
      }
    } catch (e) {
      console.error('Failed to load model', e)
    }
  }
})

const analyze = async () => {
  const cells = graph.toJSON().cells
  
  // Transform cells to match OTD structure expected by backend
  // The backend expects 'type' to be 'tm.Store', etc.
  // Our shapes have data.type set, but x6 toJSON puts it in 'data'.
  // We need to map it back or ensure backend handles it.
  // OTDParser checks 'type' at top level of cell.
  
  const mappedCells = cells.map(cell => {
    // If it's an edge
    if (cell.shape === 'edge') {
      return {
        ...cell,
        type: 'tm.Flow',
        labels: [{ attrs: { text: { text: cell.labels?.[0]?.attrs?.text?.text || '' } } }]
      }
    }
    // If it's a node
    return {
      ...cell,
      type: cell.data?.type || 'tm.Process', // Default fallback
      attrs: {
        text: {
          text: cell.attrs?.label?.text || cell.attrs?.text?.text || ''
        }
      }
    }
  })

  const payload = {
    detail: {
      diagrams: [
        {
          diagramJson: {
            cells: mappedCells
          }
        }
      ]
    }
  }

  try {
    const response = await axios.post('http://localhost:5000/analyze', payload)
    const result = response.data
    
    if (result.status === 'success') {
      const violations = result.violations
      if (violations.length > 0) {
        alert(`Found ${violations.length} violations!\nCheck console for details.`)
        console.table(violations)
      } else {
        alert('No violations found. System is secure.')
      }
    } else {
      alert('Analysis failed: ' + result.error)
    }
  } catch (error) {
    console.error(error)
    alert('Network error connecting to backend.')
  }
}
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.toolbar {
  height: 50px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;
}

.title {
  font-weight: bold;
  font-size: 1.2rem;
}

.analyze-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.analyze-btn:hover {
  background-color: #c0392b;
}

.main-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.stencil {
  width: 200px;
  border-right: 1px solid #ddd;
  position: relative;
}

.graph-container {
  flex: 1;
  background-color: #fff;
}
</style>
