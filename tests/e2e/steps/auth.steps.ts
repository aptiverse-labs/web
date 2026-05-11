// Auth steps. The Playwright "setup" project signs in once via the UI
// and persists storage state to .auth/user.json; every other test loads
// that state at startup and is already signed in.
//
// Keep this file for any explicit re-sign-in scenarios that need to
// exercise the login form itself.

export {};
