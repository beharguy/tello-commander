module.exports = (state = {}, action = {}) => {
  switch (action.type) {
    case 'actionStatus': 
      return {...state, actionStatus: action.actionStatus};
  }

  return state;
};