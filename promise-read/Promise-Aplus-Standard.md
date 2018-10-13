【原文地址】Promises/A+(https://promisesaplus.com/)

An open standard for sound, interoperable JavaScript promises — by implementers, for implementers.

一份开放、通用的 JavaScript promise 规范文档 - 由实施者制定，供实施者参考。

A promise represents the eventual result of an asynchronous operation. The primary way of interacting with a promise is through its `then` method, which registers callbacks to receive either a promise’s eventual value or the reason why the promise cannot be fulfilled.

promise 表示异步操作所得到的最终结果。与promise交互的主要方式是通过`.then`方法，该方法为promise注册两个回调函数用于接收异步操作被完成的结果或者被拒绝的原因。

This specification details the behavior of the `then` method, providing an interoperable base which all Promises/A+ conformant promise implementations can be depended on to provide. As such, the specification should be considered very stable. Although the Promises/A+ organization may occasionally revise this specification with minor backward-compatible changes to address newly-discovered corner cases, we will integrate large or backward-incompatible changes only after careful consideration, discussion, and testing.

此规范文档详细描述了`.then`方法的执行流程，所有符合Promise/A+规范的promise实现均可参照这份标准。所以，这将是一份稳定的规范。尽管 Promise/A+ 组织偶尔可能会为了处理一些新发现的边界情况而修改此规范，但这些修改都是微小且向下兼容的。如果Promise/A+ 组织需要进行大规模或不向下兼容的更新，则会事先进行谨慎地考虑、详尽的探讨和严格的测试。

Historically, Promises/A+ clarifies the behavioral clauses of the earlier [Promises/A proposal](http://wiki.commonjs.org/wiki/Promises/A), extending it to cover de facto behaviors and omitting parts that are underspecified or problematic.

从历史上看，现有的 Promises/A+ 明确了早期的[Promises/A proposal](http://wiki.commonjs.org/wiki/Promises/A)标准，扩展了一些原规范的行为，删除一些原规范中未明确和有问题的部分。

Finally, the core Promises/A+ specification does not deal with how to create, fulfill, or reject promises, choosing instead to focus on providing an interoperable `then` method. Future work in companion specifications may touch on these subjects.

最后，核心的 Promises/A+ 规范不涉及如何创建、完成和拒绝 promise，而是专注于提供一个通用的 `.then` 方法。上述的内容将来可能会在相关规范中提及。

## 1. Terminology

## 术语

1.1. “promise” is an object or function with a `then` method whose behavior conforms to this specification.

1.1. promise 是一个带有 `then` 方法的对象或函数，其行为符合此规范.

1.2. “thenable” is an object or function that defines a `then` method.

1.2. “thenable” 是一个定义了`then`方法的对象或者函数.

1.3. “value” is any legal JavaScript value (including `undefined`, a thenable, or a promise).

1.3. value 是一个合法的JavaScript值(包括 `undefined`，thenable ，抑或 promise)

1.4. “exception” is a value that is thrown using the `throw` statement.

1.4. “exception” 是通过`throw`语句抛出的异常.

1.5. “reason” is a value that indicates why a promise was rejected.

1.5. reason 是promise被拒绝的原因.

## 2. Requirements

## 2.条件

### 2.1 Promise States

### 2.1 promise 状态

A promise must be in one of three states: pending, fulfilled, or rejected.

promise 有三种状态：等待、完成、拒绝。

2.1.1. When pending, a promise:

2.1.1. 当promise处于等待状态时：

&nbsp;&nbsp;&nbsp;&nbsp;  2.1.1.1. may transition to either the fulfilled or rejected state.

&nbsp;&nbsp;&nbsp;&nbsp;  2.1.1.1. promise的pending状态可能被转化成fulfilled或者rejected状态。

2.1.2. When fulfilled, a promise:

2.1.2. 当promise处于完成状态时：

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.2.1. must not transition to any other state.

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.2.1. promise的状态将不能再发生变更.

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.2.2. must have a value, which must not change.

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.2.2. promise必须有结果值，且该值不能被改变.

2.1.3 When rejected, a promise:

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.3.1. must not transition to any other state.

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.3.1. promise的状态将不能再发生变更.

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.3.2. must have a reason, which must not change.

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.3.2. promise必须有被拒绝的原因，且该值不能被改变.

Here, “must not change” means immutable identity (i.e. `===`), but does not imply deep immutability.

这里的"不能被改变"指的是恒等(即满足"==="对比)，但不意味着深度比较(应该是指对象的引用).

## 2.2. The then Method

## 2.2. then 方法

A promise must provide a `then` method to access its current or eventual value or reason.

promise必须提供一个`then`方法用于访问当前或最终所获得的值或原因.

A promise’s `then` method accepts two arguments:

promise的`then`方法接收2个参数：

    promise.then(onFulfilled, onRejected)
    
2.2.1. Both `onFulfilled` and `onRejected` are optional arguments:

2.2.1. `onFulfilled` 和 `onRejected` 都是可选的参数：

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.1.1. If `onFulfilled` is not a function, it must be ignored.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.1.1. 如果`onFulfilled`不是一个函数，则忽略.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.1.2. If `onRejected` is not a function, it must be ignored.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.1.2. 如果`onRejected`不是一个函数，则忽略.

2.2.2. If `onFulfilled` is a function:

2.2.2. 如果`onFulfilled` 是一个函数：

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.1. it must be called after `promise` is fulfilled, with `promise`’s value as its first argument.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.1. 必须在`promise`完成时执行，并且将`promise`的value作为第一个参数.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.2. it must not be called before `promise` is fulfilled.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.2. 在`promise`完成之前不能被执行.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.3. it must not be called more than once.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.3. 执行次数不能超过一次.

2.2.3. If `onRejected` is a function:

2.2.3. 如果`onRejected` 是一个函数：

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.1. it must be called after `promise` is rejected, with `promise`’s reason as its first argument.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.1. 必须在`promise`拒绝时执行，并且将`promise`的reason作为第一个参数.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.2. it must not be called before `promise` is rejected.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.2. 在`promise`拒绝之前不能被执行.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.3. it must not be called more than once.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.3. 执行次数不能超过一次.

2.2.4. `onFulfilled` or `onRejected` must not be called until the [execution context](https://es5.github.io/#x10.3) stack contains only platform code. [[3.1]](#3.1).

2.2.4. `onFulfilled` 和 `onRejected` 只能在[执行上下文](https://es5.github.io/#x10.3)堆栈只包含平台代码时才能调用.[[3.1]](#3.1).

2.2.5. `onFulfilled` and `onRejected` must be called as functions (i.e. with no `this` value). [[3.2]](#3.2).

2.2.5. `onFulfilled` 和 `onRejected` 必须作为函数被调用(即不包含`this`).[[3.2]](#3.2).

2.2.6. then may be called multiple times on the same promise.

2.2.6. 同个promise的then可以被多次调用.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.6.1. If/when `promise` is fulfilled, all respective `onFulfilled` callbacks must execute in the order of their originating calls to `then`.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.6.1. 当`promise`被完成时，所有的`onFulfilled`需按照其在`.then`中的注册顺序依次回调.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.6.2. If/when `promise` is rejected, all respective `onRejected` callbacks must execute in the order of their originating calls to `then`.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.6.2. 当`promise`被拒绝时，所有的`onRejected`需按照其在`.then`中的注册顺序依次回调.

2.2.7. `then` must return a promise [[3.3]](#3.3).

2.2.7. `then` 必须返回一个promise [[3.3]](#3.3).

    promise2 = promise1.then(onFulfilled, onRejected);
    
&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.1. If either `onFulfilled` or `onRejected` returns a value `x`, run the Promise Resolution Procedure `[[Resolve]](promise2, x)`.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.1. 如果`onFulfilled` 或者 `onRejected`返回一个值`x`，执行Promise解决过程`[[Resolve]](promise2,x)`.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.2. If either `onFulfilled` or `onRejected` throws an exception `e`, `promise2` must be rejected with `e` as the reason.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.2. 如果`onFulfilled` 或者 `onRejected`抛出一个异常`e`，`promise2`必须也被拒绝，并且以异常`e`作为原因.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.3. If `onFulfilled` is not a function and `promise1` is fulfilled, `promise2` must be fulfilled with the same value as `promise1`.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.3. 如果`onFulfilled`不是函数且`promise1`是被完成的，则`promise2`必须被完成，并且以`promise1`的结果作为完成的结果.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.4. If `onRejected` is not a function and `promise1` is rejected, `promise2` must be rejected with the same reason as `promise1`.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.4. 如果`onRejected`不是函数且`promise1`是被拒绝的，则`promise2`必须被拒绝，并且以`promise1`的拒绝原因作为拒绝的原因.

## 2.3. The Promise Resolution Procedure

## 2.3. Promise 解决过程

The promise resolution procedure is an abstract operation taking as input a promise and a value, which we denote as `[[Resolve]](promise, x)`. If `x` is a thenable, it attempts to make `promise` adopt the state of `x`, under the assumption that `x` behaves at least somewhat like a `promise`. Otherwise, it fulfills promise with the value `x`.

Promise的解决过程是一个抽象的操作，需要输入一个promise和一个值，就像这样`[[Resolve]](promise, x)`.如果`x`是一个thenable的对象或函数，则`promise`尝试采用`x`的状态作为解决依据，在这种假设下`x`的行为至少得有点像`promise`；否则以`x`值来完成promise.

This treatment of thenables allows promise implementations to interoperate, as long as they expose a Promises/A+-compliant `then` method. It also allows Promises/A+ implementations to “assimilate” nonconformant implementations with reasonable `then` methods.

thenable的处理方式使得promise更具通用性，只需暴露一个遵循Promise/A+规范的`then`方法即可。同时也使遵循Promises/A+规范但实现方式不同的promise具有一个合理的`then`方法.

To run `[[Resolve]](promise, x)`, perform the following steps:

执行`[[Resolve]](promise, x)`，遵循下面的执行步骤：

2.3.1. If `promise` and `x` refer to the same object, reject `promise` with a `TypeError` as the reason.

2.3.1. 如果`promise`和`x`指向同一个对象，则以`TypeError`为原因将`promise`拒绝.

2.3.2. If `x` is a promise, adopt its state [[3.4]](#3.4).:

2.3.2. 如果`x`是一个promise，采用其状态[[3.4]](#3.4)..

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.1. If `x` is pending, `promise` must remain pending until `x` is fulfilled or rejected.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.1. 如果`x`是等待状态，`promise`必须保持等待状态知道`x`被完成或者被拒绝.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.2. If/when `x` is fulfilled, fulfill `promise` with the same value.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.2. 如果`x`被完成，则以其值将`promise`完成.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.3. If/when `x` is rejected, reject `promise` with the same reason.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.3. 如果`x`被拒绝，则以其拒绝原因将`promise`拒绝.

2.3.3. Otherwise, if `x` is an object or function:

2.3.3. 如果`x`是一个对象或者函数：

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.1. Let `then` be `x.then`. [[3.5]](#3.5).

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.1. 将`x.then`赋值给`then`.[[3.5]](#3.5).

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.2. If retrieving the property `x.then` results in a thrown exception `e`, reject `promise` with `e` as the reason.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.2. 如果获取`x.then`的时候抛出异常`e`,则以`e`作为拒绝原因将`promise`拒绝.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3. If `then` is a function, call it with `x` as `this`, first argument `resolvePromise`, and second argument `rejectPromise`, where:

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3. 如果`then`是个函数，则将其调用并以`x`作为`this`，第一个参数为`resolvePromise`，第二个参数为`rejectPromise`：

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.1. If/when `resolvePromise` is called with a value `y`, run `[[Resolve]](promise, y)`.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.1. 如果`resolvePromise`以`y`为结果值被调用，执行`[[Resolve]](promise, y)`.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.2. If/when `rejectPromise` is called with a reason `r`, reject `promise` with `r`.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.2. 如果`rejectPromise`以`r`为拒绝原因被调用，则以`r`作为拒绝原因将`promise`拒绝.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.3. If both `resolvePromise` and `rejectPromise` are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.3. 如果`resolvePromise`和`rejectPromise`都被调用，或者被同一参数被调用多次，则优先采用首次的调用并忽略剩下的调用.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4. If calling `then` throws an exception `e`,

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4. 如果执行`then`的时候抛出异常`e`，

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4.1. If `resolvePromise` or `rejectPromise` have been called, ignore it.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4.1. 如果`resolvePromise`或`rejectPromise`已经被调用，则忽略.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4.2. Otherwise, reject `promise` with `e` as the reason.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4.2. 否则，以`e`为拒绝原因将`promise`拒绝.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.4. If `then` is not a function, fulfill `promise` with `x`.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.4. 如果`then`不是函数，则以`x`为参数完成`promise`.

2.3.4. If `x` is not an object or function, fulfill `promise` with `x`.

2.3.4. 如果`x`不是一个对象或函数，则以`x`为参数完成`promise`.

If a promise is resolved with a thenable that participates in a circular thenable chain, such that the recursive nature of `[[Resolve]](promise, thenable)` eventually causes `[[Resolve]](promise, thenable)` to be called again, following the above algorithm will lead to infinite recursion. Implementations are encouraged, but not required, to detect such recursion and reject `promise` with an informative `TypeError` as the reason. [[3.6]](#3.6).

如果一个promise被一个循环的thenable链中的某个thenabled解决，而 [[Resolve]](promise, thenable) 的递归性质又使其再次被调用，遵循上述算法将会导致无限递归。虽然不是必需的，但也鼓励promise的实施者去检查是否存在递归，如果存在则以`TypeError`为拒绝原因将`promise`拒绝。[[3.6]](#3.6).


## 3. Notes

## 3. 注释

<div id="3.1"></div>3.1. Here “platform code” means engine, environment, and promise implementation code. In practice, this requirement ensures that `onFulfilled` and `onRejected` execute asynchronously, after the event loop turn in which `then` is called, and with a fresh stack. This can be implemented with either a “macro-task” mechanism such as `setTimeout` or `setImmediate`, or with a “micro-task” mechanism such as `MutationObserver` or `process.nextTick`. Since the promise implementation is considered platform code, it may itself contain a task-scheduling queue or “trampoline” in which the handlers are called.

3.1. 这里的"平台代码"指的是引擎、环境和promise实现代码。实践中需确保`onFulfilled`和`onRejected`被异步执行，且应该在`then`方法被调用的事件循环之后的新事件循环堆栈中执行。事件队列可遵循“macro-task”机制或者“micro-task”机制实现。由于promise的实施代码本就属平台代码，其本身在处理时就可能已经包含任务调度队列或者"跳板"。

<div id="3.2"></div>3.2. That is, in strict mode `this` will be `undefined` inside of them; in sloppy mode, it will be the global object.

3.2. 在严格模式中，`this`指向`undefined`;非严格模式中，this则指向全局对象。

<div id="3.3"></div>3.3. Implementations may allow `promise2 === promise1`, provided the implementation meets all requirements. Each implementation should document whether it can produce `promise2 === promise1` and under what conditions.

3.3. promise的实现在满足所有条件下允许`promise2 === promise1`，每份实现须文档注明是否允许`promise2 === promise1`，且在何等条件下允许。

<div id="3.4"></div>3.4. Generally, it will only be known that `x` is a true promise if it comes from the current implementation. This clause allows the use of implementation-specific means to adopt the state of known-conformant promises.

3.4. 通常情况下，如果`x`符合当前的实现，则认为其是一个真正的promise。此条款允许具体实现方法的使用可以接受符合要求的promise状态。

<div id="3.5"></div>3.5. This procedure of first storing a reference to `x.then`, then testing that reference, and then calling that reference, avoids multiple accesses to the `x.then` property. Such precautions are important for ensuring consistency in the face of an accessor property, whose value could change between retrievals.

3.5. 在这过程中，为了避免多次访问`x.then`属性，需要先存储一个指向`x.then`的引用，然后测试并调用这个引用。这种预防措施有效的确保了访问属性值的一致性，因为其属性值在检索的时候可能已经发生了改变。

<div id="3.6"></div>3.6. Implementations should not set arbitrary limits on the depth of thenable chains, and assume that beyond that arbitrary limit the recursion will be infinite. Only true cycles should lead to a `TypeError`; if an infinite chain of distinct thenables is encountered, recursing forever is the correct behavior.

3.6. 实现过程中不应该对thenable链的深度做任意限制，假设超出限制数就当是无限递归。只有正确的循环递归才能抛出`TypeError`；在无限递归且都是不同thenable的情况下，无限递归才是正确的行为。