const isFunction = o => typeof o === 'function';

const createStore = (reducer = (state, action) => state, defaultState = {}) => {
  let state = defaultState;
  let handlers = [];

  const getState = () => state;

  const subscribe = handler => {
    handlers = handlers.concat(handler);

    return () => {
      handlers = handlers.filter(h => h !== handler);
    };
  }

  const dispatch = action => {
    state = reducer(state, action);

    handlers.forEach(handler => {
      if (isFunction(handler)) handler()
    });
  };

  return {
    getState,
    dispatch,
    subscribe
  };
};

module.exports = createStore;