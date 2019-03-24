import compose from "./compose";

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
// applyMiddleware 对应的是createStore里的enhancer
// middleware 其实就是针对 dispatch 时候所插入的执行函数 也可以理解为 dispatch 前后的 hooks，以下以hooks作为代表
export default function applyMiddleware(...middlewares) {
  // 传入 middlewares
  return createStore => (...args) => {
    const store = createStore(...args);
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      );
    };

    // hooks 内部能做的操作  仅 getState 和 dispatch
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    };
    // 将hooks处理，以 middlewareAPI 作为参数执行并且得到 hooks 的内部函数
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    // 依次作为函数参数来执行middleware(柯里化)，达到middleware的串联效果(此处较为精巧，可类比 async await 的切洋葱方式)
    // 如 middleware A(ABefore,AAfter) B(BBefore,BAfter) C(CBefore,CAfter)
    // 则执行顺序是  ABefore - BBefore - CBefore - (真实的操作) - CAfter - BAfter - AAfter
    dispatch = compose(...chain)(store.dispatch);

    return {
      ...store,
      dispatch
    };
  };
}
