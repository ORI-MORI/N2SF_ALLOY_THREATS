import React, { useEffect, useState, useMemo } from 'react';
import { useReactFlow } from 'reactflow';
import { CheckCircle, Shield } from 'lucide-react';
import useStore from '../store';

export default function PropertyPanel({ analysisResult, onThreatClick, selectedThreatId }) {
    const { selectedElement, setSelectedElement } = useStore();
    const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('properties'); // 'properties' | 'threats'

    useEffect(() => {
        if (selectedElement) {
            setFormData(selectedElement.data || {});
            setActiveTab('properties');
        } else {
            setFormData({});
        }
    }, [selectedElement]);

    // Automatically switch to threats tab if there are violations OR analysis errors (like empty diagram)
    useEffect(() => {
        if (analysisResult) {
            setActiveTab('threats');
        }
    }, [analysisResult]);

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
        setSelectedElement({ ...selectedElement, data: newData });
    };

    const handleBatchChange = (updates) => {
        const newData = { ...formData, ...updates };
        setFormData(newData);

        if (selectedElement.source) {
            setEdges((edges) => edges.map((e) => e.id === selectedElement.id ? { ...e, data: newData } : e));
        } else {
            setNodes((nodes) => nodes.map((n) => n.id === selectedElement.id ? { ...n, data: newData } : n));
        }
        setSelectedElement({ ...selectedElement, data: newData });
    };

    const applyProfile = (profile) => {
        if (profile === 'GeneralPC') {
            handleBatchChange({
                profile: 'GeneralPC',
                type: 'Terminal',
                grade: 'Open',
                patchStatus: 'UpToDate',
                lifeCycle: 'Active',
                hasAuditLogging: false,
                authType: 'Single_Factor',
                isRegistered: true,
                sessionPolicy: 'Timeout_Only'
            });
        } else if (profile === 'ClassifiedServer') {
            handleBatchChange({
                profile: 'ClassifiedServer',
                type: 'Server',
                grade: 'Classified',
                patchStatus: 'UpToDate',
                lifeCycle: 'Active',
                hasAuditLogging: true,
                hasSecureClock: true,
                isStorageEncrypted: true,
                authType: 'Multi_Factor',
                isRegistered: true,
                sessionPolicy: 'Strict_Timeout_Concurrency'
            });
        } else {
            handleBatchChange({ profile: 'Custom' });
        }
    };

    // Helper to update stored data list
    const addData = () => {
        const currentData = formData.storedData || [];
        const newId = currentData.length > 0 ? Math.max(...currentData.map(d => d.id)) + 1 : 1;
        const newDataItem = { id: newId, grade: 'Sensitive', fileType: 'Document' };

        // 1. Update the Node's storedData
        handleChange('storedData', [...currentData, newDataItem]);

        // 2. Auto-propagate to outgoing edges
        // Find all edges where source is this node
        setEdges((edges) => edges.map((edge) => {
            if (edge.source === selectedElement.id) {
                // Parse current carries
                const currentCarries = (edge.data?.carries || '')
                    .toString()
                    .split(',')
                    .map(x => parseInt(x.trim()))
                    .filter(x => !isNaN(x));

                // Add new ID if not present (it shouldn't be)
                const newCarries = [...currentCarries, newId];

                return {
                    ...edge,
                    data: {
                        ...edge.data,
                        carries: newCarries.join(', ')
                    }
                };
            }
            return edge;
        }));
    };

    const removeData = (id) => {
        const currentData = formData.storedData || [];
        handleChange('storedData', currentData.filter(d => d.id !== id));
    };

    const updateData = (id, field, value) => {
        const currentData = formData.storedData || [];
        handleChange('storedData', currentData.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const handleDelete = () => {
        if (!selectedElement) return;

        if (window.confirm('이 요소를 삭제하시겠습니까?')) {
            if (selectedElement.source) {
                // It's an edge
                setEdges((edges) => edges.filter((edge) => edge.id !== selectedElement.id));
            } else {
                // It's a node
                setNodes((nodes) => nodes.filter((node) => node.id !== selectedElement.id));
            }
            setSelectedElement(null);
        }
    };

    const renderPropertiesTab = () => {
        if (!selectedElement) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                            <path d="M13 13l6 6"></path>
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600">선택된 요소 없음</p>
                    <p className="text-xs text-gray-400 mt-1">속성을 보려면 노드나 연결선을 선택하세요.</p>
                </div>
            );
        }

        const isNode = !selectedElement.source;
        const isZone = isNode && selectedElement.type === 'zone';
        const isSystem = isNode && selectedElement.type === 'system';
        const isEdge = !!selectedElement.source;

        const inputClass = "mt-1 block w-full rounded-none border-2 border-slate-700 bg-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 transition-all hover:border-slate-500 text-slate-200 placeholder-slate-400";
        const labelClass = "block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1";

        return (
            <div className="flex flex-col gap-5">
                <div className="text-[10px] font-mono text-slate-200 bg-slate-900 p-1.5 rounded border border-slate-700 inline-block self-start shadow-sm">ID: {selectedElement.id}</div>

                {/* Common Label/Name */}
                {isNode && (
                    <div>
                        <label className={labelClass}>이름</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={formData.label || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                            placeholder="이름 입력..."
                        />
                    </div>
                )}

                {/* Zone Specific */}
                {isZone && (
                    <>
                        <div>
                            <label className={labelClass}>등급</label>
                            <select
                                className={inputClass}
                                value={formData.grade || 'Open'}
                                onChange={(e) => handleChange('grade', e.target.value)}
                            >
                                <option value="Classified">기밀 (Classified)</option>
                                <option value="Sensitive">민감 (Sensitive)</option>
                                <option value="Open">공개 (Open)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>유형</label>
                            <select
                                className={inputClass}
                                value={formData.type || 'Internet'}
                                onChange={(e) => handleChange('type', e.target.value)}
                            >
                                <option value="Internet">인터넷망</option>
                                <option value="Intranet">업무망(내부망)</option>
                                <option value="DMZ">DMZ</option>
                                <option value="Wireless">무선망</option>
                                <option value="PPP">폐쇄망(PPP)</option>
                                <option value="Cloud">클라우드</option>
                            </select>
                        </div>
                    </>
                )}

                {/* System Specific */}
                {isSystem && (
                    <>
                        <div className="bg-indigo-900/20 p-2 border border-indigo-500/30 mb-2">
                            <label className={labelClass}>보안 프로파일 (자동 입력)</label>
                            <select
                                className="w-full text-xs bg-slate-900 border-slate-700 text-slate-200 rounded-none p-1.5 focus:ring-indigo-500 focus:border-indigo-500"
                                value={formData.profile || 'Custom'}
                                onChange={(e) => applyProfile(e.target.value)}
                            >
                                <option value="Custom">사용자 정의 (Custom)</option>
                                <option value="GeneralPC">일반 PC (공개/자동)</option>
                                <option value="ClassifiedServer">기밀 서버 (보안)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>위치 (구역)</label>
                            <select
                                className={inputClass}
                                value={formData.loc || ''}
                                onChange={(e) => handleChange('loc', e.target.value)}
                            >
                                <option value="">(없음)</option>
                                {getNodes().filter(n => n.type === 'zone').map(zone => (
                                    <option key={zone.id} value={zone.id}>
                                        {zone.data.label || `Zone ${zone.id}`}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1 italic">자동 배치를 재정의합니다.</p>
                        </div>

                        <div>
                            <label className={labelClass}>등급 (비어있으면 상속)</label>
                            <select
                                className={inputClass}
                                value={formData.grade || 'Open'}
                                onChange={(e) => handleChange('grade', e.target.value)}
                            >
                                <option value="Classified">기밀 (Classified)</option>
                                <option value="Sensitive">민감 (Sensitive)</option>
                                <option value="Open">공개 (Open)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>유형</label>
                            <select
                                className={inputClass}
                                value={formData.type || 'Server'}
                                onChange={(e) => handleChange('type', e.target.value)}
                            >
                                <option value="Terminal">단말(PC)</option>
                                <option value="Server">서버</option>
                                <option value="SecurityDevice">보안 장비</option>
                                <option value="NetworkDevice">네트워크 장비</option>
                                <option value="Mobile">모바일</option>
                                <option value="WirelessAP">무선 AP</option>
                                <option value="SaaS">SaaS</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>인증 방식</label>
                            <select
                                className={inputClass}
                                value={formData.authType || 'Single_Factor'}
                                onChange={(e) => handleChange('authType', e.target.value)}
                            >
                                <option value="Single_Factor">단일 인증 (1FA)</option>
                                <option value="Multi_Factor">다중 인증 (MFA)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>패치 상태</label>
                            <select
                                className={inputClass}
                                value={formData.patchStatus || 'UpToDate'}
                                onChange={(e) => handleChange('patchStatus', e.target.value)}
                            >
                                <option value="UpToDate">최신 (자동)</option>
                                <option value="Vulnerable">취약 (구버전)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>수명 주기</label>
                            <select
                                className={inputClass}
                                value={formData.lifeCycle || 'Active'}
                                onChange={(e) => handleChange('lifeCycle', e.target.value)}
                            >
                                <option value="Active">운영 중 (Active)</option>
                                <option value="EOL">단종 (EOL)</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>세션 정책</label>
                            <select
                                className={inputClass}
                                value={formData.sessionPolicy || 'Unsafe'}
                                onChange={(e) => handleChange('sessionPolicy', e.target.value)}
                            >
                                <option value="Unsafe">취약 (Unsafe)</option>
                                <option value="Timeout_Only">타임아웃 적용</option>
                                <option value="Strict_Timeout_Concurrency">엄격 (타임아웃 & 동시접속 제한)</option>
                            </select>
                        </div>

                        {formData.type === 'Terminal' && (
                            <div>
                                <label className={labelClass}>망분리 (VDI/RBI)</label>
                                <select
                                    className={inputClass}
                                    value={formData.isolation || 'None'}
                                    onChange={(e) => handleChange('isolation', e.target.value)}
                                >
                                    <option value="None">없음</option>
                                    <option value="VDI">VDI</option>
                                    <option value="RBI">RBI</option>
                                </select>
                            </div>
                        )}

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <input
                                    type="checkbox"
                                    id="isCDS"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isCDS || false}
                                    onChange={(e) => handleChange('isCDS', e.target.checked)}
                                />
                                <label htmlFor="isCDS" className="text-sm font-medium text-slate-300 cursor-pointer">이 시스템은 망연계(CDS) 장비입니까?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <input
                                    type="checkbox"
                                    id="hasAuditLogging"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.hasAuditLogging || false}
                                    onChange={(e) => handleChange('hasAuditLogging', e.target.checked)}
                                />
                                <label htmlFor="hasAuditLogging" className="text-sm font-medium text-slate-300 cursor-pointer">감사 로그를 기록합니까?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <input
                                    type="checkbox"
                                    id="hasSecureClock"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.hasSecureClock || false}
                                    onChange={(e) => handleChange('hasSecureClock', e.target.checked)}
                                />
                                <label htmlFor="hasSecureClock" className="text-sm font-medium text-slate-300 cursor-pointer">보안 클럭을 사용합니까?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <input
                                    type="checkbox"
                                    id="isRegistered"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isRegistered || false}
                                    onChange={(e) => handleChange('isRegistered', e.target.checked)}
                                />
                                <label htmlFor="isRegistered" className="text-sm font-medium text-slate-300 cursor-pointer">등록된 기기입니까?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <input
                                    type="checkbox"
                                    id="isStorageEncrypted"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isStorageEncrypted || false}
                                    onChange={(e) => handleChange('isStorageEncrypted', e.target.checked)}
                                />
                                <label htmlFor="isStorageEncrypted" className="text-sm font-medium text-slate-300 cursor-pointer">저장소가 암호화되어 있습니까?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                <input
                                    type="checkbox"
                                    id="isManagement"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isManagement || false}
                                    onChange={(e) => handleChange('isManagement', e.target.checked)}
                                />
                                <label htmlFor="isManagement" className="text-sm font-medium text-slate-300 cursor-pointer">관리자 전용 단말입니까?</label>
                            </div>

                            {formData.type === 'Mobile' && (
                                <div className="flex items-center gap-2 p-2 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700">
                                    <input
                                        type="checkbox"
                                        id="hasMDM"
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={formData.hasMDM || false}
                                        onChange={(e) => handleChange('hasMDM', e.target.checked)}
                                    />
                                    <label htmlFor="hasMDM" className="text-sm font-medium text-slate-300 cursor-pointer">MDM을 사용합니까?</label>
                                </div>
                            )}
                        </div>

                        {/* Data Assets Management */}
                        <div className="border-t border-gray-200/50 pt-4 mt-2">
                            <div className="flex justify-between items-center mb-3">
                                <label className={labelClass}>저장된 데이터 자산</label>
                                <button
                                    onClick={addData}
                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1.5 rounded-md hover:bg-indigo-100 font-medium transition-colors"
                                >
                                    + 데이터 추가
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(formData.storedData || []).map((data) => (
                                    <div key={data.id} className="bg-slate-900 p-3 border-2 border-slate-700 text-xs shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-indigo-400">Data #{data.id}</span>
                                            <button
                                                onClick={() => removeData(data.id)}
                                                className="text-red-400 hover:text-red-300 font-medium"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-slate-400 mb-1">등급</label>
                                                <select
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-none text-xs p-1.5 focus:ring-indigo-500 focus:border-indigo-500 text-slate-200"
                                                    value={data.grade}
                                                    onChange={(e) => updateData(data.id, 'grade', e.target.value)}
                                                >
                                                    <option value="Open">공개</option>
                                                    <option value="Sensitive">민감</option>
                                                    <option value="Classified">기밀</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-400 mb-1">유형</label>
                                                <select
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-none text-xs p-1.5 focus:ring-indigo-500 focus:border-indigo-500 text-slate-200"
                                                    value={data.fileType}
                                                    onChange={(e) => updateData(data.id, 'fileType', e.target.value)}
                                                >
                                                    <option value="Document">문서</option>
                                                    <option value="Executable">실행 파일</option>
                                                    <option value="Media">미디어</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(formData.storedData || []).length === 0 && (
                                    <div className="text-xs text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-lg">
                                        저장된 데이터 없음.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Edge Specific */}
                {isEdge && (
                    <>
                        <div>
                            <label className={labelClass}>프로토콜</label>
                            <select
                                className={inputClass}
                                value={formData.protocol || 'HTTPS'}
                                onChange={(e) => handleChange('protocol', e.target.value)}
                            >
                                <option value="HTTPS">HTTPS</option>
                                <option value="SSH">SSH</option>
                                <option value="VPN_Tunnel">VPN Tunnel</option>
                                <option value="ClearText">ClearText (HTTP/Telnet)</option>
                                <option value="SQL">SQL</option>
                            </select>
                        </div>

                        {(() => {
                            const sourceNode = getNodes().find(n => n.id === selectedElement.source);
                            const targetNode = getNodes().find(n => n.id === selectedElement.target);
                            const sourceLabel = sourceNode?.data?.label || sourceNode?.id || 'Source';
                            const targetLabel = targetNode?.data?.label || targetNode?.id || 'Target';

                            return (
                                <div className="flex flex-col gap-3 border-t border-gray-200/50 pt-4 mt-2">
                                    <h4 className={labelClass}>연결 설정</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">전송 방식</label>
                                        <select
                                            className={inputClass}
                                            value={formData.isBidirectional !== false ? 'bidirectional' : 'unidirectional'}
                                            onChange={(e) => handleChange('isBidirectional', e.target.value === 'bidirectional')}
                                        >
                                            <option value="bidirectional">양방향 (Bidirectional)</option>
                                            <option value="unidirectional">단방향 (Unidirectional)</option>
                                        </select>
                                    </div>

                                    {formData.isBidirectional === false && (
                                        <div className="mt-2">
                                            <label className="block text-sm font-medium text-slate-400 mb-1">방향</label>
                                            <div className="flex items-center justify-between p-2 bg-slate-900 rounded-none border border-slate-700">
                                                <span className="text-xs text-slate-300 font-medium truncate max-w-[150px]" title={`${sourceLabel} → ${targetLabel}`}>
                                                    {sourceLabel} → {targetLabel}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const oldEdge = getEdges().find(e => e.id === selectedElement.id);
                                                        if (oldEdge) {
                                                            const mapToSourceHandle = (handleId) => {
                                                                if (!handleId) return 'right-source';
                                                                if (handleId.includes('-target')) return handleId.replace('-target', '-source');
                                                                if (handleId.includes('-source')) return handleId;
                                                                return `${handleId}-source`;
                                                            };

                                                            const mapToTargetHandle = (handleId) => {
                                                                if (!handleId) return 'left-target';
                                                                if (handleId.includes('-source')) return handleId.replace('-source', '-target');
                                                                if (handleId.includes('-target')) return handleId;
                                                                return `${handleId}-target`;
                                                            };

                                                            const newEdge = {
                                                                ...oldEdge,
                                                                id: `e-${Date.now()}`,
                                                                source: oldEdge.target,
                                                                target: oldEdge.source,
                                                                sourceHandle: mapToSourceHandle(oldEdge.targetHandle),
                                                                targetHandle: mapToTargetHandle(oldEdge.sourceHandle),
                                                                data: { ...oldEdge.data, isBidirectional: false }
                                                            };

                                                            setEdges((eds) => eds.filter(e => e.id !== oldEdge.id).concat(newEdge));
                                                            setSelectedElement(newEdge);
                                                        }
                                                    }}
                                                    className="px-2 py-1 text-xs bg-slate-800 border-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white shadow-none flex items-center gap-1 transition-colors"
                                                    title="방향 전환"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>
                                                    교체
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-300 mt-1">
                                                방향을 반대로 바꾸려면 교체 버튼을 클릭하세요.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="isEncrypted"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.isEncrypted || false}
                                    onChange={(e) => handleChange('isEncrypted', e.target.checked)}
                                />
                                <label htmlFor="isEncrypted" className="text-sm font-medium text-slate-300 cursor-pointer">데이터를 암호화하여 전송합니까?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="hasCDR"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.hasCDR || false}
                                    onChange={(e) => handleChange('hasCDR', e.target.checked)}
                                />
                                <label htmlFor="hasCDR" className="text-sm font-medium text-slate-300 cursor-pointer">CDR 솔루션을 사용합니까?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="hasDLP"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.hasDLP || false}
                                    onChange={(e) => handleChange('hasDLP', e.target.checked)}
                                />
                                <label htmlFor="hasDLP" className="text-sm font-medium text-slate-300 cursor-pointer">DLP 솔루션을 사용합니까?</label>
                            </div>

                            <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors">
                                <input
                                    type="checkbox"
                                    id="hasAntiVirus"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.hasAntiVirus || false}
                                    onChange={(e) => handleChange('hasAntiVirus', e.target.checked)}
                                />
                                <label htmlFor="hasAntiVirus" className="text-sm font-medium text-slate-300 cursor-pointer">백신 프로그램을 사용합니까?</label>
                            </div>
                        </div>

                        <div className="pt-4 mt-2 border-t border-gray-200/50">
                            <label className={labelClass}>Carries Data</label>

                            {(() => {
                                const sourceNode = getNodes().find(n => n.id === selectedElement.source);
                                const availableData = sourceNode?.data?.storedData || [];

                                const currentCarries = (formData.carries || '')
                                    .toString()
                                    .split(',')
                                    .map(x => x.trim())
                                    .filter(x => x !== '');

                                const handleAddData = () => {
                                    if (availableData.length === 0) return;
                                    const firstAvailable = availableData[0].id;
                                    const newCarries = [...currentCarries, firstAvailable];
                                    handleChange('carries', newCarries.join(', '));
                                };

                                const handleRemoveData = (indexToRemove) => {
                                    const newCarries = currentCarries.filter((_, idx) => idx !== indexToRemove);
                                    handleChange('carries', newCarries.join(', '));
                                };

                                const handleUpdateData = (indexToUpdate, newValue) => {
                                    const newCarries = [...currentCarries];
                                    newCarries[indexToUpdate] = newValue;
                                    handleChange('carries', newCarries.join(', '));
                                };

                                if (availableData.length === 0) {
                                    return (
                                        <div className="text-xs text-orange-300 italic bg-slate-900 p-3 border border-dashed border-slate-700 text-center shadow-sm">
                                            소스 노드에 데이터가 없습니다.
                                            <br />"저장된 데이터 자산"에 먼저 추가하세요.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-2">
                                        {currentCarries.map((dataId, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <select
                                                    className="block w-full rounded-md bg-slate-900 border-slate-700 text-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs border p-1.5"
                                                    value={dataId}
                                                    onChange={(e) => handleUpdateData(idx, e.target.value)}
                                                >
                                                    {availableData.map(d => (
                                                        <option key={d.id} value={d.id}>
                                                            Data #{d.id} ({d.fileType})
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleRemoveData(idx)}
                                                    className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                                                    title="Remove"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            onClick={handleAddData}
                                            className="w-full py-2 text-xs border border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 font-medium"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                            데이터 흐름 추가
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </>
                )}

                {/* Delete Button */}
                <div className="border-t-2 border-slate-700 pt-4 mt-4 pb-4">
                    <button
                        onClick={handleDelete}
                        className="w-full bg-red-900/20 text-red-500 border-2 border-red-900/50 py-2.5 rounded-none hover:bg-red-900/40 hover:text-red-400 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        삭제
                    </button>
                </div>
            </div>
        );
    };

    // --- Helper to merge threats by context and remediation (Moved to component scope) ---
    const mergeThreatItems = (items) => {
        const merged = [];
        const processedIndices = new Set();

        items.forEach((item, index) => {
            if (processedIndices.has(index)) return;

            const group = {
                primary: item,
                indices: [index],
                allData: item.data ? [item.data] : []
            };

            for (let i = index + 1; i < items.length; i++) {
                if (processedIndices.has(i)) continue;
                const other = items[i];

                const sameSystem = item.system === other.system;
                const sameConnection = item.connection === other.connection;
                const sameRemediation = item.remediation === other.remediation;

                const isMatch = sameRemediation && (
                    (item.system && sameSystem) ||
                    (item.connection && sameConnection)
                );

                if (isMatch) {
                    group.indices.push(i);
                    if (other.data && !group.allData.includes(other.data)) {
                        group.allData.push(other.data);
                    }
                    processedIndices.add(i);
                }
            }

            merged.push(group);
            processedIndices.add(index);
        });
        return merged;
    };

    // Calculate merged count for Tab Badge
    const mergedTotalCount = useMemo(() => {
        if (!analysisResult || !analysisResult.threats) return 0;
        let count = 0;
        Object.values(analysisResult.threats).forEach(items => {
            count += mergeThreatItems(items).length;
        });
        return count;
    }, [analysisResult]);


    const renderThreatsTab = () => {
        if (!analysisResult) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4 text-center">
                    <div className="w-16 h-16 rounded shadow-lg bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4">
                        <Shield size={32} className="text-slate-600" />
                    </div>
                    <p className="text-base font-bold text-slate-300 uppercase tracking-widest">분석 결과 없음</p>
                    <p className="text-xs mt-2 text-slate-500 font-mono">상단 '위협 분석' 버튼을 클릭하세요.</p>
                </div>
            );
        }

        // [Feature] Handle Empty Diagram Case
        if (analysisResult.error === 'NO_DIAGRAM') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4 text-center">
                    <div className="w-16 h-16 rounded shadow-lg bg-orange-900/10 border-2 border-orange-500/30 flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <p className="text-base font-bold text-orange-400 uppercase tracking-widest">다이어그램 없음</p>
                    <p className="text-xs text-slate-500 mt-2 font-mono">분석할 시스템을 추가해주세요.</p>
                </div>
            );
        }

        const threats = analysisResult.threats || {};
        const total_count = analysisResult.total_count !== undefined
            ? analysisResult.total_count
            : Object.values(threats).reduce((acc, items) => acc + items.length, 0);

        const hasViolations = total_count > 0;

        if (!hasViolations) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4 text-center">
                    <div className="w-16 h-16 rounded shadow-lg bg-emerald-900/10 border-2 border-emerald-500/30 flex items-center justify-center mb-4">
                        <CheckCircle size={32} className="text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-emerald-400 uppercase tracking-widest">안전함 (SECURE)</p>
                    <p className="text-xs text-slate-500 mt-2 font-mono">보안 위협이 발견되지 않았습니다.</p>
                </div>
            );
        }

        // --- Merging logic moved to component scope ---
        // We can use mergedTotalCount directly
        const visibleCount = mergedTotalCount;

        // Pre-calculate merged threats
        const mergedThreats = {};

        Object.entries(threats).forEach(([key, items]) => {
            const merged = mergeThreatItems(items);
            if (merged.length > 0) {
                mergedThreats[key] = merged;
            }
        });

        return (
            <div className="space-y-6 p-2">
                <div className="flex items-center gap-3 mb-4 bg-red-950/40 p-4 border-l-4 border-red-600 shadow-lg">
                    <div className="p-2 bg-red-900/20 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <div>
                        <span className="block text-xl font-black text-white">{visibleCount}</span>
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">위협 발견됨</span>
                    </div>
                </div>

                {Object.entries(mergedThreats).map(([key, mergedItems]) => {
                    return (
                        <div key={key} className="mb-6">
                            <h4 className="flex items-center gap-2 font-bold text-slate-200 text-sm uppercase tracking-wider mb-2 pb-1 border-b border-slate-700">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-none"></span>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>

                            <div className="space-y-3">
                                {mergedItems.map((group, idx) => {
                                    const item = group.primary;
                                    const compositeId = `${key}-${group.indices.join(',')}`;
                                    const isSelected = selectedThreatId === compositeId;

                                    // Resolve Context Label
                                    let contextLabel = '';
                                    if (item.system) {
                                        contextLabel = `SYS: ${item.system}`;
                                    } else if (item.connection) {
                                        const edge = getEdges().find(e => e.id === item.connection);
                                        if (edge) {
                                            const sourceNode = getNodes().find(n => n.id === edge.source);
                                            const targetNode = getNodes().find(n => n.id === edge.target);
                                            const sLabel = sourceNode?.data?.label || 'Source';
                                            const tLabel = targetNode?.data?.label || 'Target';
                                            contextLabel = `CONN: ${sLabel} → ${tLabel}`;
                                        } else {
                                            contextLabel = 'CONNECTION';
                                        }
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={`group relative transition-all duration-200 ease-in-out cursor-pointer hover:bg-slate-800 ${isSelected
                                                ? 'bg-orange-900/10'
                                                : 'bg-transparent'
                                                }`}
                                            onClick={() => onThreatClick && onThreatClick(compositeId)}
                                        >
                                            {/* Selection Indicator Line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isSelected ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-red-900/40 group-hover:bg-red-500'}`}></div>

                                            <div className="pl-4 pr-2 py-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm ${isSelected ? 'text-orange-200' : 'text-slate-200'}`}>
                                                            Violation #{idx + 1}
                                                        </span>
                                                        {group.indices.length > 1 && (
                                                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                                * {group.indices.length} merged items
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isSelected && (
                                                        <span className="text-[10px] font-bold text-orange-100 bg-orange-600 px-1.5 py-0.5 shadow-sm">
                                                            SELECTED
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Context Badge */}
                                                <div className="mb-3">
                                                    <span className="inline-block bg-slate-800 border border-slate-600 text-slate-300 text-[10px] px-2 py-0.5 font-mono uppercase tracking-tight">
                                                        {contextLabel}
                                                    </span>
                                                </div>

                                                {/* Remediation Block */}
                                                <div className={`bg-slate-900/50 p-2 border mb-3 transition-colors ${isSelected ? 'border-orange-500/30' : 'border-slate-700/50 hover:border-slate-600'}`}>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <div className="p-0.5 bg-emerald-500/20 rounded-full">
                                                            <CheckCircle size={10} className="text-emerald-400" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Remediation</span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                                        {item.remediation}
                                                    </p>
                                                </div>

                                                {/* Data List (Aggregated) */}
                                                {group.allData && group.allData.length > 0 && (
                                                    <div>
                                                        <div className="flex flex-wrap gap-1.5 items-center">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Assets:</span>
                                                            {group.allData.map((dataId, dIdx) => (
                                                                <span key={dIdx} className="bg-slate-800 text-indigo-300 border border-slate-600 px-1.5 py-0.5 text-[10px] font-mono hover:border-indigo-500 transition-colors">
                                                                    D-{dataId}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="absolute right-4 top-4 bottom-4 w-80 bg-slate-800 border-2 border-slate-700 flex flex-col transition-all duration-300 z-20 shadow-2xl rugged-box">
            {/* Tabs */}
            <div className="flex border-b-2 border-slate-700 bg-slate-900">
                <button
                    className={`flex-1 py-3 text-sm font-bold transition-colors uppercase tracking-wider ${activeTab === 'properties' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    onClick={() => setActiveTab('properties')}
                >
                    속성 (Properties)
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-bold transition-colors uppercase tracking-wider ${activeTab === 'threats' ? 'text-red-400 border-b-2 border-red-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    onClick={() => setActiveTab('threats')}
                >
                    위협 감지
                    {mergedTotalCount > 0 && (
                        <span className="ml-2 bg-red-900 text-red-200 text-xs px-2 py-0.5 rounded-none border border-red-700">
                            {mergedTotalCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-800">
                {activeTab === 'properties' ? renderPropertiesTab() : renderThreatsTab()}
            </div>
        </div>
    );

}
