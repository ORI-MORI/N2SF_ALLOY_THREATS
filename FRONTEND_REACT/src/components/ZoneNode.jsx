import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { Globe, Cloud, Building } from 'lucide-react';

const ZoneNode = ({ data, selected }) => {
    return (
        <>
            <NodeResizer
                minWidth={100}
                minHeight={100}
                isVisible={selected}
                lineClassName="border-indigo-400"
                handleClassName="h-3 w-3 bg-white border-2 border-indigo-400 rounded shadow-sm"
            />
            <div className={`h-full w-full min-w-[100px] min-h-[100px] border-2 border-dashed rounded-2xl transition-all duration-300 group ${selected ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 bg-slate-50/30 hover:border-slate-400'}`}>

                {/* Floating Label Pill */}
                <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 transition-all ${selected ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-500 border border-slate-200'}`}>
                    {data.type === 'Internet' && <Globe size={12} />}
                    {data.type === 'Cloud' && <Cloud size={12} />}
                    {data.type === 'PPP' && <Building size={12} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{data.label}</span>
                </div>

                {/* Content Area */}
                <div className="p-4 h-full flex flex-col justify-end items-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] font-medium text-slate-400 bg-white/50 px-2 py-1 rounded-md backdrop-blur-sm">
                        {data.grade || 'Open'}
                    </div>
                </div>
            </div>
        </>
    );
};

export default memo(ZoneNode);
