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
    const [violations, setViolations] = useState([]);

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

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

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

            const newNode = {
                id: getId(),
                type,
                position,
                data: { label, grade: 'Open', type: label },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [project, setNodes]
    );

    const handleAnalyze = async () => {
        // Reset styles
        setNodes((nds) => nds.map((n) => ({ ...n, style: {} })));
        setEdges((eds) => eds.map((e) => ({ ...e, style: {} })));
        setViolations([]);

        const payload = convertGraphToJSON(nodes, edges);
        console.log('Payload:', payload);

        const result = await analyzeGraph(payload);
        console.log('Result:', result);

        if (result.success && result.result.length > 0) {
            setViolations(result.result);

            const violatingIds = new Set();

            result.result.forEach(v => {
                // Parse details for SystemX or ConnectionX
                // Example: StorageViolation[System100$0, Data101$0]
                const matches = v.details.match(/(System|Connection)(\d+)/g);
                if (matches) {
                    matches.forEach(m => {
                        const type = m.startsWith('System') ? 'systems' : 'connections';
                        const id = parseInt(m.replace(/(System|Connection)/, ''));

                        // Find real ID
                        const item = payload._mapping[type].find(i => i.id === id);
                        if (item) {
                            violatingIds.add(item.realId);
                        }
                    });
                }
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
        } else if (result.success) {
            alert('No violations found!');
        } else {
            alert('Analysis failed: ' + result.error);
        }
    };

    return (
        <div className="flex flex-row h-screen w-screen">
            <Sidebar />
            <div className="flex-grow h-full relative" ref={reactFlowWrapper}>
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={handleAnalyze}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Play size={16} /> Analyze
                    </button>
                </div>

                {violations.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4 z-10 bg-white p-4 rounded shadow-lg border-l-4 border-red-500 max-h-48 overflow-y-auto">
                        <h3 className="font-bold text-red-600 mb-2">Violations Detected ({violations.length})</h3>
                        <ul className="text-sm space-y-2">
                            {violations.map((v, i) => (
                                <li key={i} className="border-b pb-1 last:border-0">
                                    <span className="font-semibold">{v.rule}</span>
                                    <p className="text-gray-600 text-xs truncate">{v.details}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

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
            <PropertyPanel />
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
