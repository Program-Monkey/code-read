/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */

 // 自带且自用的几个actionsType
const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split('')
    .join('.')

const ActionTypes = {
  // 初始化store 和 state tree
  INIT: `@@redux/INIT${randomString()}`,
  // replace reducers
  REPLACE: `@@redux/REPLACE${randomString()}`,
  // unknow action
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
}

export default ActionTypes
