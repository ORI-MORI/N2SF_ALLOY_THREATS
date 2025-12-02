import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    useReactFlow,
    useOnSelectionChange,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play } from 'lucide-react';

import Sidebar from './Sidebar';
import ZoneNode from './ZoneNode';
import SystemNode from './SystemNode';
import PropertyPanel from './PropertyPanel';
import useStore from '../store';
import { convertGraphToJSON } from '../utils/graphConverter';
import { analyzeGraph } from '../api/analyze';

const nodeTypes = {
    zone: ZoneNode,
    system: SystemNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const EditorContent = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { project } = useReactFlow();
    const { setSelectedElement } = useStore();
    const [analysisResult, setAnalysisResult] = useState(null);

    useOnSelectionChange({
        onChange: ({ nodes, edges }) => {
            if (nodes.length > 0) {
                setSelectedElement(nodes[0]);
            } else if (edges.length > 0) {
                setSelectedElement(edges[0]);
            } else {
                setSelectedElement(null);
            }
        },
    });

    const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), []);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/reactflow-label');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            let defaultType = label;
            if (type === 'zone') {
                defaultType = 'Internet'; // Default Zone Type
            } else if (type === 'system') {
                if (label === 'PC') defaultType = 'Terminal';
                else if (label === 'Gateway') defaultType = 'NetworkDevice';
                else if (label === 'Server') defaultType = 'Server';
                else defaultType = 'Terminal';
            }

            const newNode = {
                id: getId(),
                type,
                position,
                data: { label, grade: 'Open', type: defaultType },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [project, setNodes]
    );

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [idMapping, setIdMapping] = useState(null);
    const [focusedPath, setFocusedPath] = useState(new Set());

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        // Reset styles
        setNodes((nds) => nds.map((n) => ({ ...n, style: {} })));
        setEdges((eds) => eds.map((e) => ({ ...e, style: {} })));
        setAnalysisResult(null);
        setFocusedPath(new Set());

        try {
            const payload = convertGraphToJSON(nodes, edges);
            setIdMapping(payload._mapping); // Save mapping for later use
            console.log('Payload:', payload);

            const result = await analyzeGraph(payload);
            console.log('Result:', result);

            if (result.success) {
                setAnalysisResult(result.result);

                // Highlighting Logic (Initial Red for all violations)
                const violatingIds = new Set();
                const threats = result.result.threats;

                Object.values(threats).flat().forEach(violation => {
                    Object.values(violation).forEach(val => {
                        const match = val.match(/(System|Connection)(\d+)/);
                        if (match) {
                            const type = match[1] === 'System' ? 'systems' : 'connections';
                            const id = parseInt(match[2]);
                            const item = payload._mapping[type].find(i => i.id === id);
                            if (item) {
                                violatingIds.add(item.realId);
                            }
                        }
                    });
                });

                // Highlight nodes
                setNodes((nds) => nds.map((n) => {
                    if (violatingIds.has(n.id)) {
                        return { ...n, style: { ...n.style, border: '2px solid red', boxShadow: '0 0 10px red' } };
                    }
                    return n;
                }));

                // Highlight edges
                setEdges((eds) => eds.map((e) => {
                    if (violatingIds.has(e.id)) {
                        return { ...e, style: { ...e.style, stroke: 'red', strokeWidth: 2 } };
                    }
                    return e;
                }));

            } else {
                alert('Analysis failed: ' + result.error);
            }
        } catch (error) {
            console.error("Analysis error:", error);
            alert("An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleThreatClick = (violation) => {
        if (!idMapping) return;

        const newFocusedPath = new Set();

        Object.values(violation).forEach(val => {
            const match = val.match(/(System|Connection)(\d+)/);
            if (match) {
                const type = match[1] === 'System' ? 'systems' : 'connections';
                const id = parseInt(match[2]);
                const item = idMapping[type].find(i => i.id === id);

                if (item) {
                    newFocusedPath.add(item.realId);

                    // If it's a connection, also highlight the source and target nodes to show the "Path"
                    if (type === 'connections') {
                        const fromSys = idMapping.systems.find(s => s.id === item.from);
                        const toSys = idMapping.systems.find(s => s.id === item.to);
                        if (fromSys) newFocusedPath.add(fromSys.realId);
                        if (toSys) newFocusedPath.add(toSys.realId);
                    }
                }
            }
        });

        setFocusedPath(newFocusedPath);

        // Update styles to reflect focus
        // We need to re-apply the base "Red" for violations, and "Blue" for the focused path
        // Since we don't want to lose the "Red" info of other threats, we need to know all violations again?
        // Actually, the current nodes already have Red style applied. We can just override on top.
        // But to be clean, let's re-run the style logic if possible, or just apply focus on top of existing.
        // Simpler: Just update based on current state, adding Blue to focused.

        setNodes((nds) => nds.map((n) => {
            const isFocused = newFocusedPath.has(n.id);
            // Check if it was already red (violation)
            const isViolation = n.style?.border?.includes('red');

            let newStyle = { ...n.style };

            if (isFocused) {
                newStyle.border = '3px solid #3b82f6'; // Blue-500
                newStyle.boxShadow = '0 0 15px #3b82f6';
            } else if (isViolation) {
                // Keep Red
                newStyle.border = '2px solid red';
                newStyle.boxShadow = '0 0 10px red';
            } else {
                // Reset if neither (though we usually don't clear violation unless re-analyzed)
                // But if we clicked a different threat, we might want to un-focus previous one.
                // So we should revert to Red if it was Red.
                // This is tricky without keeping track of "base violation state".
                // Hack: If it has a border and NOT focused, make it Red. If no border, keep none.
                if (newStyle.border) {
                    newStyle.border = '2px solid red';
                    newStyle.boxShadow = '0 0 10px red';
                }
            }
            return { ...n, style: newStyle };
        }));

        setEdges((eds) => eds.map((e) => {
            const isFocused = newFocusedPath.has(e.id);
            const isViolation = e.style?.stroke === 'red';

            let newStyle = { ...e.style };

            if (isFocused) {
                newStyle.stroke = '#3b82f6';
                newStyle.strokeWidth = 4;
                newStyle.zIndex = 999; // Bring to front
            } else if (isViolation) {
                newStyle.stroke = 'red';
                newStyle.strokeWidth = 2;
                newStyle.zIndex = 1;
            } else {
                if (newStyle.stroke) {
                    newStyle.stroke = 'red';
                    newStyle.strokeWidth = 2;
                }
            }
            return { ...e, style: newStyle };
        }));
    };

    const handleClosePanel = () => {
        setAnalysisResult(null);
        setFocusedPath(new Set());
    };

    return (
        <div className="flex flex-row h-screen w-screen">
            <Sidebar />
            <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className={`px-4 py-2 rounded shadow flex items-center gap-2 text-white transition-colors ${isAnalyzing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isAnalyzing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Play size={16} /> Analyze
                            </>
                        )}
                    </button>
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Controls />
                    <Background variant="dots" gap={12} size={1} />
                </ReactFlow>
            </div>
            <PropertyPanel
                analysisResult={analysisResult}
                onThreatClick={handleThreatClick}
            />
        </div>
    );
};

export default function Editor() {
    return (
        <ReactFlowProvider>
            <EditorContent />
        </ReactFlowProvider>
    );
}
