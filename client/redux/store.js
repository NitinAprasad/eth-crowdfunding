import { configureStore } from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";
import rootReducer from "./reducers";

/**
 * Redux store using Redux Toolkit's configureStore.
 * - Replaces createStore + applyMiddleware + compose boilerplate
 * - RTK includes redux-thunk middleware by default
 * - RTK includes Redux DevTools support automatically
 */
const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    // Disable the serializable check for web3 contract objects
    // (they contain functions, which are not serializable)
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Web3 contract objects are not serializable and have circular references.
        // Disabling both checks prevents "Maximum call stack size exceeded" errors
        // that occur when RTK's dev-mode middleware tries to deep-walk these objects.
        serializableCheck: false,
        immutableCheck: false,
      }),
  });

export const wrapper = createWrapper(makeStore);