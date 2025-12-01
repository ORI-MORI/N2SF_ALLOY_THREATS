import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ZoneNode = ({ data, selected }) => {
    return (
        <div className={`min-w-[200px] min-h-[200px] border-2 border-dashed rounded-lg bg-gray-50/50 p-4 transition-colors ${selected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-400'}`}>
            <div className="font-bold text-gray-500 uppercase text-xs mb-2">{data.label}</div>
            <div className="text-xs text-gray-400">Grade: {data.grade || 'Open'}</div>
            {/* Zones typically don't have handles in this model, but we can add them if needed for zone-to-zone connections */}
        </div>
    );
};

export default memo(ZoneNode);
