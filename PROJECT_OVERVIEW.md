Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
deprecations.ts:9 ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
warnOnce @ deprecations.ts:9Understand this warning
deprecations.ts:9 ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
warnOnce @ deprecations.ts:9Understand this warning
2Dashboard.jsx:323 Uncaught ReferenceError: defaulters is not defined
    at Dashboard (Dashboard.jsx:323:16)
    at renderWithHooks (react-dom.development.js:15486:18)
    at updateFunctionComponent (react-dom.development.js:19617:20)
    at beginWork (react-dom.development.js:21640:16)
    at HTMLUnknownElement.callCallback2 (react-dom.development.js:4164:14)
    at Object.invokeGuardedCallbackDev (react-dom.development.js:4213:16)
    at invokeGuardedCallback (react-dom.development.js:4277:31)
    at beginWork$1 (react-dom.development.js:27490:7)
    at performUnitOfWork (react-dom.development.js:26596:12)
    at workLoopSync (react-dom.development.js:26505:5)Understand this error
react-dom.development.js:18704 The above error occurred in the <Dashboard> component:

    at Dashboard (http://localhost:5173/src/pages/Dashboard.jsx?t=1777546377612:189:33)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=1763586d:4131:5)
    at Routes (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=1763586d:4601:5)
    at main
    at div
    at div
    at App (http://localhost:5173/src/App.jsx?t=1777546377612:45:20)
    at Router (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=1763586d:4544:15)
    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/react-router-dom.js?v=1763586d:5290:5)

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
logCapturedError @ react-dom.development.js:18704Understand this error
react-dom.development.js:26962 Uncaught ReferenceError: defaulters is not defined
    at Dashboard (Dashboard.jsx:323:16)