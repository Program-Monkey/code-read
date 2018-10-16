'use strict';

var asap = require('asap/raw');

// asap/raw 根据执行环境和事件的判断来做 macro-task （such as setTimeout） 和 micro-task（such as process.nextTick） 的调控

// 空函数，用于 
// 1. 处理一些判断 
// 2.生成新的promise
function noop() { }

// States:
//
// 0 - pending  等待状态
// 1 - fulfilled with _value   完成状态
// 2 - rejected with _value    拒绝状态
// 3 - adopted the state of another promise, _value   采用其他promise的状态作为当前状态
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
// 为避免在关键函数中使用try catch ，将错误放在tryCallOne和tryCallTwo中提取
var LAST_ERROR = null;
var IS_ERROR = {};
// getThen 获取链式promise中的下一个.then回调 在resolve中被调用
function getThen(obj) {
    try {
        return obj.then;
    } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
    }
}
function tryCallOne(fn, a) {
    try {
        return fn(a);
    } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
    }
}
function tryCallTwo(fn, a, b) {
    try {
        fn(a, b);
    } catch (ex) {
        LAST_ERROR = ex;
        return IS_ERROR;
    }
}

module.exports = Promise;

// Promise 构造函数
function Promise(fn) {
    if (typeof this !== 'object') {
        throw new TypeError('Promises must be constructed via new');
    }
    if (typeof fn !== 'function') {
        throw new TypeError('Promise constructor\'s argument is not a function');
    }
    // .then 结果状态 
    // 0：初始状态，当前 promise 的 _deferreds 属性值为 null
    // 1：当前 promise 的 _deferreds 属性值设置为新 promise
    // 2：当前 promise 的 _deferreds 中加入新 promise
    this._deferredState = 0;
    // 状态
    this._state = 0;
    // 最终结果
    this._value = null;
    // promise 对象数组，值为 .then 方法里注册的回调函数返回的 promise
    this._deferreds = null;
    if (fn === noop) return;
    // 注册 onHandle 和 onReject
    doResolve(fn, this);
}

Promise._onHandle = null;
Promise._onReject = null;
Promise._noop = noop;

Promise.prototype.then = function (onFulfilled, onRejected) {
    /* * 如果当前的对象的 constructor 指向构造函数不是 Promise
     * * 则将其包装成一个 promise，
     * * 并且以当前的 onFulfilled 和 onRejected 作为新 Promise 的回调处理，
     * * 然后返回该 promise
     * */
    if (this.constructor !== Promise) {
        return safeThen(this, onFulfilled, onRejected);
    }

    // 执行 onFulfilled 和 onRejected ，处理当前 promise 和 deferred 对象
    var res = new Promise(noop);
    handle(this, new Handler(onFulfilled, onRejected, res));
    return res;
};

// 构造一个新的promise
function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
}

// 将不是 promise 的对象包装成 promise 对象并返回包装后的 promise
// 实际情况就是至今未发现怎么用的... 根据代码模拟了新的构造函数测试，未果
function safeThen(self, onFulfilled, onRejected) {
    return new self.constructor(function (resolve, reject) {
        var res = new Promise(noop);
        res.then(resolve, reject);
        handle(self, new Handler(onFulfilled, onRejected, res));
    });
}

// 传入当前promise对象和deferred对象
function handle(self, deferred) {
    // 如果当前 promise 需要采用其他 promise 的结果，
    // 则将 self 的 _value赋值给 self (在resolve方法中self._value存储了其他promise的结果)
    while (self._state === 3) {
        self = self._value;
    }
    if (Promise._onHandle) {
        Promise._onHandle(self);
    }
    // 如果还处于pending状态
    if (self._state === 0) {
        // self._deferredState 为0时，
        // 将 _deferredState 设为1，
        // 且将结果 promise 赋值到 self._deferreds
        if (self._deferredState === 0) {
            self._deferredState = 1;
            self._deferreds = deferred;
            return;
        }
        // self._deferredState 为1时，
        // 将 _deferredState 设为2，
        // 且将当前 self._deferreds 和结果 promise 赋值给 self._deferreds
        // self._deferreds 此时值为 self._deferredState 为1的时候赋值的 deferred
        // 也就是一个promise对象数组
        if (self._deferredState === 1) {
            self._deferredState = 2;
            self._deferreds = [self._deferreds, deferred];
            return;
        }
        // 当self._deferredState 为2时，
        // 当前promise的_deferreds中push进新的promise
        self._deferreds.push(deferred);
        return;
    }
    // 如果 promise 已经被完成/拒绝，则执行 handleResolved
    // 传入当前 promise 及当前执行的 .then 中返回的 promise
    handleResolved(self, deferred);
}

// 通过asap异步执行resolve/reject
function handleResolved(self, deferred) {
    asap(function () {
        var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
            if (self._state === 1) {
                resolve(deferred.promise, self._value);
            } else {
                reject(deferred.promise, self._value);
            }
            return;
        }
        // 如果报错则以 reject 完成
        var ret = tryCallOne(cb, self._value);
        if (ret === IS_ERROR) {
            reject(deferred.promise, LAST_ERROR);
        } else {
            resolve(deferred.promise, ret);
        }
    });
}

// 解决promise。 传入promise及需要处理的值
function resolve(self, newValue) {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self) {
        return reject(
            self,
            new TypeError('A promise cannot be resolved with itself.')
        );
    }
    // 如果 promise 的 _value 有值(表示当前promise此时已完成/已拒绝)
    if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        // 获取后续 .then 方法
        var then = getThen(newValue);
        // 如果获取 .then 出错的话，以reject处理
        if (then === IS_ERROR) {
            return reject(self, LAST_ERROR);
        }
        // 如果取到的 then 和 promise.then是同一个值，
        // 且最终值是个 promise，
        // 将 promise 改变状态及设置值，执行finale
        if (then === self.then && newValue instanceof Promise) {
            self._state = 3;
            self._value = newValue;
            // 执行 finale，传入 promise
            finale(self);
            return;
        } else if (typeof then === 'function') {
            // 如果 then 是个函数，已 newValue 为 this 来执行 .then，并且执行 doResolve 做回调绑定
            doResolve(then.bind(newValue), self);
            return;
        }
    }
    // 状态变化为完成状态
    self._state = 1;
    // 存储结果
    self._value = newValue;

    // 执行 finale，传入 .then 方法中返回的 promise
    finale(self);
}

// 拒绝 promise . 传入 promise 及拒绝原因
function reject(self, newValue) {
    // 状态变化为拒绝状态
    self._state = 2;
    // 存储结果
    self._value = newValue;
    if (Promise._onReject) {
        Promise._onReject(self, newValue);
    }
    // 执行 finale，传入 promise
    finale(self);
}

// finale . 传入 .then 里返回的 promise
function finale(self) {
    // 如果该 promise 只在 .then 方法中注册一个回调
    if (self._deferredState === 1) {
        handle(self, self._deferreds);
        self._deferreds = null;
    }
    // 如果该 promise 在多个 .then 方法中注册多个回调
    if (self._deferredState === 2) {
        for (var i = 0; i < self._deferreds.length; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
// promise 初始化的时候，通过 doResolve 将回调函数分别绑到当前 promise 对象上
function doResolve(fn, promise) {
    var done = false;
    // 执行 resolve/reject 回调
    var res = tryCallTwo(fn, function (value) {
        if (done) return;
        done = true;
        // 以当前 promise 执行和其值执行 resolve
        resolve(promise, value);
    }, function (reason) {
        if (done) return;
        done = true;
        // 以当前 promise 执行和其值执行 reject
        reject(promise, reason);
    });
    // 如果 done === false 并且 fn 抛出错误，则以 reject 回调执行
    if (!done && res === IS_ERROR) {
        done = true;
        // 以当前 promise 执行和其值执行 reject 
        reject(promise, LAST_ERROR);
    }
}
