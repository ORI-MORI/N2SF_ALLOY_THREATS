import { create } from 'zustand';

const useStore = create((set) => ({
    selectedElement: null,
    setSelectedElement: (element) => set({ selectedElement: element }),
}));

export default useStore;
