import React, { useEffect, useState } from 'react';
import { useReactFlow } from 'reactflow';
import useStore from '../store';

export default function PropertyPanel() {
    const { selectedElement, setSelectedElement } = useStore();
    const { setNodes, setEdges } = useReactFlow();
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (selectedElement) {
            setFormData(selectedElement.data || {});
        } else {
            setFormData({});
        }
    }, [selectedElement]);

    const handleChange = (key, value) => {
        const newData = { ...formData, [key]: value };
        setFormData(newData);

        if (selectedElement.source) {
            // It's an edge
            setEdges((edges) =>
                edges.map((edge) =>
                    edge.id === selectedElement.id ? { ...edge, data: newData } : edge
                )
            );
        } else {
            // It's a node
            setNodes((nodes) =>
                nodes.map((node) =>
                    node.id === selectedElement.id ? { ...node, data: newData } : node
                )
            );
        }

        // Update local selected element state to reflect changes immediately if needed
        // But better to rely on React Flow updates. 
        // However, selectedElement in store is a snapshot. We might need to update it too or just rely on re-selection.
        // Let's update the store copy too so the UI doesn't flicker.
        setSelectedElement({ ...selectedElement, data: newData });
    };

    if (!selectedElement) {
        return (
            <div className="w-80 bg-white border-l border-gray-200 p-4">
                <div className="text-gray-500 text-sm">Select an element to edit properties.</div>
            </div>
        );
    }

    const isNode = !selectedElement.source;
    const isZone = isNode && selectedElement.type === 'zone';
    const isSystem = isNode && selectedElement.type === 'system';
    const isEdge = !!selectedElement.source;

    return (
        <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
            <h2 className="text-lg font-bold border-b pb-2">Properties</h2>

            <div className="text-xs text-gray-400">ID: {selectedElement.id}</div>

            {/* Common Label/Name */}
            {isNode && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                        value={formData.label || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                    />
                </div>
            )}

            {/* Grade (Common for Zone and System) */}
            {(isZone || isSystem) && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Grade</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                        value={formData.grade || 'Open'}
                        onChange={(e) => handleChange('grade', e.target.value)}
                    >
                        <option value="Open">Open</option>
                        <option value="Sensitive">Sensitive</option>
                        <option value="Classified">Classified</option>
                    </select>
                </div>
            )}

            {/* Zone Specific */}
            {isZone && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                        value={formData.type || 'Internet'}
                        onChange={(e) => handleChange('type', e.target.value)}
                    >
                        <option value="Internet">Internet</option>
                        <option value="Intranet">Intranet</option>
                        <option value="DMZ">DMZ</option>
                        <option value="Wireless">Wireless</option>
                    </select>
                </div>
            )}

            {/* System Specific */}
            {isSystem && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                            value={formData.type || 'Server'}
                            onChange={(e) => handleChange('type', e.target.value)}
                        >
                            <option value="Server">Server</option>
                            <option value="PC">PC</option>
                            <option value="Mobile">Mobile</option>
                            <option value="SecurityDevice">Security Device</option>
                            <option value="Gateway">Gateway</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isGateway"
                            checked={formData.isGateway || false}
                            onChange={(e) => handleChange('isGateway', e.target.checked)}
                        />
                        <label htmlFor="isGateway" className="text-sm font-medium text-gray-700">Is Gateway?</label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Stored Data (comma separated IDs)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                            value={formData.stores || ''}
                            onChange={(e) => handleChange('stores', e.target.value)}
                            placeholder="e.g. 101, 102"
                        />
                    </div>
                </>
            )}

            {/* Edge Specific */}
            {isEdge && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Protocol</label>
                        <select
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                            value={formData.protocol || 'HTTP'}
                            onChange={(e) => handleChange('protocol', e.target.value)}
                        >
                            <option value="HTTP">HTTP</option>
                            <option value="HTTPS">HTTPS</option>
                            <option value="SSH">SSH</option>
                            <option value="FTP">FTP</option>
                            <option value="SFTP">SFTP</option>
                            <option value="TCP">TCP</option>
                            <option value="UDP">UDP</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isEncrypted"
                            checked={formData.isEncrypted || false}
                            onChange={(e) => handleChange('isEncrypted', e.target.checked)}
                        />
                        <label htmlFor="isEncrypted" className="text-sm font-medium text-gray-700">Encrypted?</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="hasCDR"
                            checked={formData.hasCDR || false}
                            onChange={(e) => handleChange('hasCDR', e.target.checked)}
                        />
                        <label htmlFor="hasCDR" className="text-sm font-medium text-gray-700">Has CDR?</label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Carries Data (comma separated IDs)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-1"
                            value={formData.carries || ''}
                            onChange={(e) => handleChange('carries', e.target.value)}
                            placeholder="e.g. 101, 102"
                        />
                    </div>
                </>
            )}
        </div>
    );
}
