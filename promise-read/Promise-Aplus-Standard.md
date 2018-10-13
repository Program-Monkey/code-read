【原文地址】Promises/A+(https://promisesaplus.com/)

一份开放、通用的 JavaScript promise 规范文档 - 由实施者制定，供实施者参考。

promise 表示异步操作所得到的最终结果。与promise交互的主要方式是通过`.then`方法，该方法为promise注册两个回调函数用于接收异步操作被完成的结果或者被拒绝的原因。

此规范文档详细描述了`.then`方法的执行流程，所有符合Promise/A+规范的promise实现均可参照这份标准。所以，这将是一份稳定的规范。尽管 Promise/A+ 组织偶尔可能会为了处理一些新发现的边界情况而修改此规范，但这些修改都是微小且向下兼容的。如果Promise/A+ 组织需要进行大规模或不向下兼容的更新，则会事先进行谨慎地考虑、详尽的探讨和严格的测试。

从历史上看，现有的 Promises/A+ 明确了早期的[Promises/A proposal](http://wiki.commonjs.org/wiki/Promises/A)标准，扩展了一些原规范的行为，删除一些原规范中未明确和有问题的部分。

最后，核心的 Promises/A+ 规范不涉及如何创建、完成和拒绝 promise，而是专注于提供一个通用的 `.then` 方法。上述的内容将来可能会在相关规范中提及。

## 术语

1.1. promise 是一个带有 `then` 方法的对象或函数，其行为符合此规范.

1.2. “thenable” 是一个定义了`then`方法的对象或者函数.

1.3. value 是一个合法的JavaScript值(包括 `undefined`，thenable ，抑或 promise)

1.4. “exception” 是通过`throw`语句抛出的异常.

1.5. reason 是promise被拒绝的原因.

## 2.条件

### 2.1 promise 状态

promise 有三种状态：等待、完成、拒绝。

2.1.1. 当promise处于等待状态时：

&nbsp;&nbsp;&nbsp;&nbsp;  2.1.1.1. promise的pending状态可能被转化成fulfilled或者rejected状态。

2.1.2. 当promise处于完成状态时：

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.2.1. promise的状态将不能再发生变更.

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.2.2. promise必须有结果值，且该值不能被改变.

2.1.3 当promise处于拒绝状态时：

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.3.1. promise的状态将不能再发生变更.

&nbsp;&nbsp;&nbsp;&nbsp; 2.1.3.2. promise必须有被拒绝的原因，且该值不能被改变.

这里的"不能被改变"指的是恒等(即满足"==="对比)，但不意味着深度比较(应该是指对象的引用).

### 2.2. then 方法

promise必须提供一个`then`方法用于访问当前或最终所获得的值或原因.

promise的`then`方法接收2个参数：

    promise.then(onFulfilled, onRejected)
 
2.2.1. `onFulfilled` 和 `onRejected` 都是可选的参数：

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.1.1. 如果`onFulfilled`不是一个函数，则忽略.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.1.2. 如果`onRejected`不是一个函数，则忽略.

2.2.2. 如果`onFulfilled` 是一个函数：

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.1. 必须在`promise`完成时执行，并且将`promise`的value作为第一个参数.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.2. 在`promise`完成之前不能被执行.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.2.3. 执行次数不能超过一次.

2.2.3. 如果`onRejected` 是一个函数：

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.1. 必须在`promise`拒绝时执行，并且将`promise`的reason作为第一个参数.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.2. 在`promise`拒绝之前不能被执行.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.3.3. 执行次数不能超过一次.

2.2.4. `onFulfilled` 和 `onRejected` 只能在[执行上下文](https://es5.github.io/#x10.3)堆栈只包含平台代码时才能调用.[[3.1]](#3.1).

2.2.5. `onFulfilled` 和 `onRejected` 必须作为函数被调用(即不包含`this`).[[3.2]](#3.2).

2.2.6. 同个promise的then可以被多次调用.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.6.1. 当`promise`被完成时，所有的`onFulfilled`需按照其在`.then`中的注册顺序依次回调.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.6.2. 当`promise`被拒绝时，所有的`onRejected`需按照其在`.then`中的注册顺序依次回调.

2.2.7. `then` 必须返回一个promise [[3.3]](#3.3).

    promise2 = promise1.then(onFulfilled, onRejected);
    
&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.1. 如果`onFulfilled` 或者 `onRejected`返回一个值`x`，执行Promise解决过程`[[Resolve]](promise2,x)`.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.2. 如果`onFulfilled` 或者 `onRejected`抛出一个异常`e`，`promise2`必须也被拒绝，并且以异常`e`作为原因.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.3. 如果`onFulfilled`不是函数且`promise1`是被完成的，则`promise2`必须被完成，并且以`promise1`的结果作为完成的结果.

&nbsp;&nbsp;&nbsp;&nbsp; 2.2.7.4. 如果`onRejected`不是函数且`promise1`是被拒绝的，则`promise2`必须被拒绝，并且以`promise1`的拒绝原因作为拒绝的原因.

### 2.3. Promise 解决过程

Promise的解决过程是一个抽象的操作，需要输入一个promise和一个值，就像这样`[[Resolve]](promise, x)`.如果`x`是一个thenable的对象或函数，则`promise`尝试采用`x`的状态作为解决依据，在这种假设下`x`的行为至少得有点像`promise`；否则以`x`值来完成promise.

thenable的处理方式使得promise更具通用性，只需暴露一个遵循Promise/A+规范的`then`方法即可。同时也使遵循Promises/A+规范但实现方式不同的promise具有一个合理的`then`方法.

执行`[[Resolve]](promise, x)`，遵循下面的执行步骤：

2.3.1. 如果`promise`和`x`指向同一个对象，则以`TypeError`为原因将`promise`拒绝.

2.3.2. 如果`x`是一个promise，采用其状态[[3.4]](#3.4)..

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.1. 如果`x`是等待状态，`promise`必须保持等待状态知道`x`被完成或者被拒绝.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.2. 如果`x`被完成，则以其值将`promise`完成.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.2.3. 如果`x`被拒绝，则以其拒绝原因将`promise`拒绝.

2.3.3. 如果`x`是一个对象或者函数：

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.1. 将`x.then`赋值给`then`.[[3.5]](#3.5).

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.2. 如果获取`x.then`的时候抛出异常`e`,则以`e`作为拒绝原因将`promise`拒绝.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3. 如果`then`是个函数，则将其调用并以`x`作为`this`，第一个参数为`resolvePromise`，第二个参数为`rejectPromise`：

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.1. 如果`resolvePromise`以`y`为结果值被调用，执行`[[Resolve]](promise, y)`.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.2. 如果`rejectPromise`以`r`为拒绝原因被调用，则以`r`作为拒绝原因将`promise`拒绝.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.3. 如果`resolvePromise`和`rejectPromise`都被调用，或者被同一参数被调用多次，则优先采用首次的调用并忽略剩下的调用.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4. 如果执行`then`的时候抛出异常`e`，

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4.1. 如果`resolvePromise`或`rejectPromise`已经被调用，则忽略.

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.3.4.2. 否则，以`e`为拒绝原因将`promise`拒绝.

&nbsp;&nbsp;&nbsp;&nbsp; 2.3.3.4. 如果`then`不是函数，则以`x`为参数完成`promise`.

2.3.4. 如果`x`不是一个对象或函数，则以`x`为参数完成`promise`.

如果一个promise被一个循环的thenable链中的某个thenabled解决，而 [[Resolve]](promise, thenable) 的递归性质又使其再次被调用，遵循上述算法将会导致无限递归。虽然不是必需的，但也鼓励promise的实施者去检查是否存在递归，如果存在则以`TypeError`为拒绝原因将`promise`拒绝。[[3.6]](#3.6).

## 3. 注释

<div id="3.1"></div>3.1. 这里的"平台代码"指的是引擎、环境和promise实现代码。实践中需确保`onFulfilled`和`onRejected`被异步执行，且应该在`then`方法被调用的事件循环之后的新事件循环堆栈中执行。事件队列可遵循“macro-task”机制或者“micro-task”机制实现。由于promise的实施代码本就属平台代码，其本身在处理时就可能已经包含任务调度队列或者"跳板"。


<div id="3.2"></div>3.2. 在严格模式中，`this`指向`undefined`;非严格模式中，this则指向全局对象。

<div id="3.3"></div>3.3. promise的实现在满足所有条件下允许`promise2 === promise1`，每份实现须文档注明是否允许`promise2 === promise1`，且在何等条件下允许。

<div id="3.6"></div>3.6. Implementations should not set arbitrary limits on the depth of thenable chains, and assume that beyond that arbitrary limit the recursion will be infinite. Only true cycles should lead to a `TypeError`; if an infinite chain of distinct thenables is encountered, recursing forever is the correct behavior.z

<div id="3.4"></div>3.4. 通常情况下，如果`x`符合当前的实现，则认为其是一个真正的promise。此条款允许具体实现方法的使用可以接受符合要求的promise状态。

<div id="3.5"></div>3.5. 在这过程中，为了避免多次访问`x.then`属性，需要先存储一个指向`x.then`的引用，然后测试并调用这个引用。这种预防措施有效的确保了访问属性值的一致性，因为其属性值在检索的时候可能已经发生了改变。

<div id="3.6"></div>3.6. 实现过程中不应该对thenable链的深度做任意限制，假设超出限制数就当是无限递归。只有正确的循环递归才能抛出`TypeError`；在无限递归且都是不同thenable的情况下，无限递归才是正确的行为。