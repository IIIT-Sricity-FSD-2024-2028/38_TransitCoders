import { createAction } from '@reduxjs/toolkit';

// Kept apart from authSlice so the API layer can dispatch them without importing the slice
// (which in turn imports the auth thunks).

/** The user signed out, or the server rejected the session. Clears credentials and all data. */
export const sessionCleared = createAction('auth/sessionCleared');

/** The signed-in user changed. Credentials stay, but every cached server response is dropped. */
export const sessionDataReset = createAction('auth/sessionDataReset');
