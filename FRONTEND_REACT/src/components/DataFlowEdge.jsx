import React from 'react';
import { BaseEdge, useNodes, getBezierPath } from 'reactflow';
import { FileText, Cpu, Image as ImageIcon, Database } from 'lucide-react';

// Helper to get icon component based on file type
const getIcon = (type) => {
    switch (type) {
        case 'Document': return <FileText size={14} color="#2563eb" fill="white" />;
        case 'Executable': return <Cpu size={14} color="#dc2626" fill="white" />;
        case 'Media': return <ImageIcon size={14} color="#16a34a" fill="white" />;
        default: return <Database size={14} color="#9333ea" fill="white" />;
    }
};

export default function DataFlowEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    source,
    target,
    data,
    animated,
    selected,
}) {
    // Use useNodes for reactive updates
    const nodes = useNodes();
    const sourceNode = nodes.find(n => n.id === source);

    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Parse carries data
    const carriesStr = data?.carries || '';
    let carriedIds = [];
    if (Array.isArray(carriesStr)) {
        carriedIds = carriesStr;
    } else if (typeof carriesStr === 'string' && carriesStr.trim() !== '') {
        carriedIds = carriesStr.split(',').map(x => parseInt(x.trim())).filter(x => !isNaN(x));
    }

    // Find carried data details from source node
    const carriedData = [];
    if (sourceNode && sourceNode.data && sourceNode.data.storedData) {
        carriedIds.forEach(id => {
            const dataItem = sourceNode.data.storedData.find(d => d.id === id);
            if (dataItem) {
                carriedData.push(dataItem);
            }
        });
    }

    // Ensure style includes animation if animated prop is true
    const edgeStyle = {
        ...style,
        strokeWidth: selected ? 3 : (style.strokeWidth || 2),
        stroke: selected ? '#2563eb' : (style.stroke || '#b1b1b7'),
        strokeDasharray: animated ? 5 : undefined,
        animation: animated ? 'dashdraw 0.5s linear infinite' : undefined,
        filter: selected ? 'drop-shadow(0 0 4px rgba(37, 99, 235, 0.5))' : undefined,
    };

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={edgeStyle}
            />

            {animated && (
                <style>
                    {`
                        @keyframes dashdraw {
                            from { stroke-dashoffset: 10; }
                        }
                    `}
                </style>
            )}

            {carriedData.length > 0 && (
                <g>
                    {carriedData.map((item, index) => {
                        // Stagger animations if multiple items
                        const duration = 3; // seconds
                        const delay = index * (duration / carriedData.length);

                        return (
                            <g key={`${id}-data-${item.id}`}>
                                {/* Invisible circle to guide the animation along the path */}
                                <circle r="0" fill="none">
                                    <animateMotion
                                        dur={`${duration}s`}
                                        repeatCount="indefinite"
                                        path={edgePath}
                                        begin={`-${delay}s`}
                                        rotate="auto"
                                    >
                                        <mpath href={`#${id}`} />
                                    </animateMotion>
                                </circle>

                                {/* The actual moving content */}
                                <foreignObject
                                    width={20}
                                    height={20}
                                    x={-10}
                                    y={-10}
                                    style={{ overflow: 'visible', pointerEvents: 'none' }} // Ensure it doesn't block clicks
                                >
                                    <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-sm border border-gray-200">
                                        {getIcon(item.fileType)}
                                    </div>
                                </foreignObject>

                                {/* Apply the motion to the foreignObject directly as fallback/ensure */}
                                <animateMotion
                                    dur={`${duration}s`}
                                    repeatCount="indefinite"
                                    path={edgePath}
                                    begin={`-${delay}s`}
                                    rotate="auto"
                                />
                            </g>
                        );
                    })}
                </g>
            )}
        </>
    );
}
