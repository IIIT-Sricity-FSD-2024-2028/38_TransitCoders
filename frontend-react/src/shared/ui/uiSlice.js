import { createSlice } from '@reduxjs/toolkit';

const getDefaultSidebarExpanded = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(min-width: 768px)').matches;
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: () => ({
    sidebarExpanded: getDefaultSidebarExpanded(),
  }),
  reducers: {
    toggleSidebar(state) {
      state.sidebarExpanded = !state.sidebarExpanded;
    },
    setSidebarExpanded(state, action) {
      state.sidebarExpanded = Boolean(action.payload);
    },
  },
});

export const {
  toggleSidebar,
  setSidebarExpanded,
} = uiSlice.actions;

export const selectSidebarExpanded = (state) => state.ui.sidebarExpanded;

export default uiSlice.reducer;
