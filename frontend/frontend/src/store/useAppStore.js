import { create } from 'zustand';

const useAppStore = create((set) => ({
  origin: null,
  destination: null,
  accessibilityFilters: [],
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setFilters: (filters) => set({ accessibilityFilters: filters }),
}));

export default useAppStore;
