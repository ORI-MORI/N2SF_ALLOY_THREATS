import React from 'react';

export default function Sidebar() {
    const onDragStart = (event, nodeType, label) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-gray-100 border-r border-gray-200 p-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold mb-2">Palette</h2>

            <div className="text-sm font-semibold text-gray-500 uppercase">Zones</div>
            <div
                className="bg-white p-3 border border-gray-300 rounded cursor-grab shadow-sm hover:shadow-md transition-shadow"
                onDragStart={(event) => onDragStart(event, 'zone', 'New Zone')}
                draggable
            >
                Zone (Group)
            </div>

            <div className="text-sm font-semibold text-gray-500 uppercase mt-4">Systems</div>
            <div
                className="bg-white p-3 border border-gray-300 rounded cursor-grab shadow-sm hover:shadow-md transition-shadow"
                onDragStart={(event) => onDragStart(event, 'system', 'Server')}
                draggable
            >
                Server
            </div>
            <div
                className="bg-white p-3 border border-gray-300 rounded cursor-grab shadow-sm hover:shadow-md transition-shadow"
                onDragStart={(event) => onDragStart(event, 'system', 'PC')}
                draggable
            >
                PC
            </div>
            <div
                className="bg-white p-3 border border-gray-300 rounded cursor-grab shadow-sm hover:shadow-md transition-shadow"
                onDragStart={(event) => onDragStart(event, 'system', 'Gateway')}
                draggable
            >
                Gateway
            </div>
        </aside>
    );
}
