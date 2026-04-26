// This stub is used during development/build only.
// In the real Cockpit environment, cockpit is injected as a global.
// We export the global cockpit object.
const cockpit = window.cockpit || {
  spawn: () => ({ stream: () => {}, then: () => {}, catch: () => {} }),
  file: () => ({ read: () => Promise.resolve(''), close: () => {} }),
  http: (opts) => ({
    get: (path) => ({
      then: () => {},
      catch: () => {}
    }),
    post: (path, body) => ({
      then: () => {},
      catch: () => {}
    })
  }),
  translate: () => {}
};

export default cockpit;
