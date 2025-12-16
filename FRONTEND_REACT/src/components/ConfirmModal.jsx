import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md transform overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-2xl transition-all animate-in zoom-in-95 duration-200 rugged-box">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-none bg-red-900/20 border-2 border-red-900/50">
                                <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
                            </div>
                        </div>
                        <div className="ml-3 w-full">
                            <h3 className="text-lg font-bold leading-6 text-slate-100 uppercase tracking-wider">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-slate-400 font-mono whitespace-pre-line">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-800/50 px-4 py-3 pb-4 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-700">
                    <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-none bg-red-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto uppercase tracking-wide border border-transparent hover:scale-105 transition-transform"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        확인 (Confirm)
                    </button>
                    <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-none bg-slate-800 px-3 py-2 text-sm font-bold text-slate-300 shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-700 sm:mt-0 sm:w-auto uppercase tracking-wide transition-colors"
                        onClick={onClose}
                    >
                        취소 (Cancel)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
