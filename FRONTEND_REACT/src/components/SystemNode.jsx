import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Server, Monitor, Shield, Smartphone, Globe } from 'lucide-react';

const icons = {
    Server: Server,
    PC: Monitor,
    Gateway: Globe,
    SecurityDevice: Shield,
    Mobile: Smartphone,
};

const SystemNode = ({ data, selected }) => {
    const Icon = icons[data.type] || Server;

    return (
        <div className={`shadow-md rounded-md bg-white border-2 p-2 min-w-[100px] flex flex-col items-center justify-center transition-all ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />

            <Icon className="w-8 h-8 text-gray-600 mb-2" />
            <div className="text-xs font-bold text-center">{data.label}</div>
            <div className="text-[10px] text-gray-400">{data.type}</div>

            {data.grade && (
                <div className={`mt-1 text-[10px] px-1 rounded ${data.grade === 'Classified' ? 'bg-red-100 text-red-800' :
                        data.grade === 'Sensitive' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                    }`}>
                    {data.grade}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
        </div>
    );
};

export default memo(SystemNode);
