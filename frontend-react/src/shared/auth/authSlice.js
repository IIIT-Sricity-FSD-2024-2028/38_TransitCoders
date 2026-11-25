import { createSlice } from '@reduxjs/toolkit';
import { addFetchCases, idleFetch } from '../../app/api/fetchState';
import { sessionCleared, sessionDataReset } from './sessionActions';
import { fetchMe, updateProfile } from './authThunks';

export function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

export function readStoredToken() {
  return localStorage.getItem('x-auth-token');
}

function buildInitialState() {
  return {
    token: readStoredToken(),
    user: readStoredUser(),
    // Result of verifying the stored session with the server (`/auth/me`). Route guards trust
    // this, not the user cached in localStorage.
    me: idleFetch(),
  };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: buildInitialState,
  reducers: {
    setCredentials(state, action) {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.me = idleFetch();
    },
    syncSessionFromStorage(state, action) {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      state.me = idleFetch();
    },
  },
  extraReducers: (builder) => {
    addFetchCases(builder, fetchMe, (state) => state.me, {
      onFulfilled: (state, action) => {
        if (action.payload) state.user = action.payload;
      },
    });
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.me.data = action.payload;
        }
      })
      .addCase(sessionCleared, (state) => {
        state.token = null;
        state.user = null;
        state.me = idleFetch();
      })
      .addCase(sessionDataReset, (state) => {
        state.me = idleFetch();
      });
  },
});

export const { setCredentials, syncSessionFromStorage } = authSlice.actions;

export const selectAuthToken = (state) => state.auth.token;
export const selectCurrentUser = (state) => state.auth.user;
// The role is derived from the user so it can never drift out of sync with it.
export const selectCurrentRole = (state) => state.auth.user?.role ?? null;
// Super users manage privileged roles (admins, super users) and delivery zones.
export const selectIsSuperUser = (state) => selectCurrentRole(state) === 'super_user';
export const selectSessionCheck = (state) => state.auth.me;

export default authSlice.reducer;
