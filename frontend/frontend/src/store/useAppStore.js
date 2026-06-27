import { create } from 'zustand';
import { setToken, getToken } from '../services/api';

// Rehydrate auth from localStorage on load so refreshes keep the session.
const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem('accessroute_user')) || null;
  } catch {
    return null;
  }
})();

const useAppStore = create((set) => ({
  // ── Auth ──────────────────────────────────────────────
  token: getToken(),
  user: storedUser,
  isAuthenticated: !!getToken(),

  setAuth: ({ token, user }) => {
    setToken(token);
    localStorage.setItem('accessroute_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  setUser: (user) => {
    localStorage.setItem('accessroute_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    setToken(null);
    localStorage.removeItem('accessroute_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  // ── Search funnel state (Search → Confirm → Options → Routes → Compare) ─
  origin: null, // { label, address, lat, lng }
  destination: null,
  transportMode: 'walk_only',
  priority: 'safety', // safety | time | cost | accessibility
  selectedRoute: null, // RouteOption carried into Compare/Detail
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setTransportMode: (transportMode) => set({ transportMode }),
  setPriority: (priority) => set({ priority }),
  setSelectedRoute: (selectedRoute) => set({ selectedRoute }),
  resetTrip: () =>
    set({ origin: null, destination: null, transportMode: 'walk_only', priority: 'safety', selectedRoute: null }),
}));

export default useAppStore;
