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
    // 延期状态 
    // 0：初始状态，当前promise的_deferreds属性值为null
    // 1：当前promise的_deferreds属性值设置为新promise
    // 2：当前promise的_deferreds中加入新promise
    this._deferredState = 0;
    // 状态
    this._state = 0;
    // 结果
    this._value = null;
    // 当前promise中将返回的新promise，值为对象或者列表
    this._deferreds = null;
    if (fn === noop) return;
    // 注册 onHandle 和 onReject
    doResolve(fn, this);
}


Promise._onHandle = null;
Promise._onReject = null;
Promise._noop = noop;

Promise.prototype.then = function (onFulfilled, onRejected) {
    // 如果当前的对象的constructor指向构造函数不是Promise，产生一个新的Promise，并且以当前的onFulfilled和onRejected作为新Promise的回调处理，之后又返回新的Promise
    if (this.constructor !== Promise) {
        return safeThen(this, onFulfilled, onRejected);
    }
    // 正常执行，执行onFulfilled和onRejected，返回新的Promise
    var res = new Promise(noop);
    handle(this, new Handler(onFulfilled, onRejected, res));
    return res;
};

// 如果调用.then的对象不是Promise对象，则生成Promise再处理
function safeThen(self, onFulfilled, onRejected) {
    return new self.constructor(function (resolve, reject) {
        var res = new Promise(noop);
        res.then(resolve, reject);
        handle(self, new Handler(onFulfilled, onRejected, res));
    });
}

// 传入当前Promise对象和新Promise对象
function handle(self, deferred) {
    // 如果当前promise需要采用上一个promise的结果，以上一个promise的结果作为当前promise的结果
    while (self._state === 3) {
        self = self._value;
    }
    // 
    if (Promise._onHandle) {
        Promise._onHandle(self);
    }
    // 如果还在pending状态
    if (self._state === 0) {
        // self._deferredState 为0时，将_deferredState设为1，且将新promise赋值到self._deferreds
        if (self._deferredState === 0) {
            self._deferredState = 1;
            self._deferreds = deferred;
            return;
        }
        // self._deferredState 为1时，将_deferredState设为2，且将当前self._deferreds和新promise赋值到self._deferreds(此时self._deferreds已存在值)
        if (self._deferredState === 1) {
            self._deferredState = 2;
            self._deferreds = [self._deferreds, deferred];
            return;
        }
        // 当self._deferredState 为2时，当前promise的_deferreds中push进新的promise
        self._deferreds.push(deferred);
        return;
    }
    // 如果promise已经被完成/拒绝，则执行 resolve/reject
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
        // 如果报错则以reject完成.then的执行
        var ret = tryCallOne(cb, self._value);
        if (ret === IS_ERROR) {
            reject(deferred.promise, LAST_ERROR);
        } else {
            resolve(deferred.promise, ret);
        }
    });
}

// resolve promise . 传入当前promise及其结果
function resolve(self, newValue) {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self) {
        return reject(
            self,
            new TypeError('A promise cannot be resolved with itself.')
        );
    }
    if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        // 获取下一个promise的 .then
        var then = getThen(newValue);
        // 如果获取.then出错的话，以reject处理
        if (then === IS_ERROR) {
            return reject(self, LAST_ERROR);
        }
        // 返回结果是个promise 并且 存在 then
        if (then === self.then && newValue instanceof Promise) {
            self._state = 3;
            self._value = newValue;
            finale(self);
            return;
        } else if (typeof then === 'function') {
            // 下个promise的.then注册到该promise的回调事件里
            doResolve(then.bind(newValue), self);
            return;
        }
    }
    // 状态变化为完成状态
    self._state = 1;
    // 存储结果
    self._value = newValue;
    // 依次向下执行新的promise
    finale(self);
}

// reject promise . 传入当前promise及其结果
function reject(self, newValue) {
    // 状态变化为拒绝状态
    self._state = 2;
    // 存储结果
    self._value = newValue;
    if (Promise._onReject) {
        Promise._onReject(self, newValue);
    }
    // 依次向下执行新的promise
    finale(self);
}

// finale . 传入当前promise，并且将余下的promise都进行处理
function finale(self) {
    // 
    if (self._deferredState === 1) {
        handle(self, self._deferreds);
        self._deferreds = null;
    }
    if (self._deferredState === 2) {
        for (var i = 0; i < self._deferreds.length; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }
}

// 构造一个新的promise
function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
// Promise初始化的时候，通过 doResolve 将回调函数分别绑到此时的 Promise对象 上
function doResolve(fn, promise) {
    var done = false;
    // 执行 resolve/reject 回调
    var res = tryCallTwo(fn, function (value) {
        if (done) return;
        done = true;
        resolve(promise, value);
    }, function (reason) {
        if (done) return;
        done = true;
        reject(promise, reason);
    });
    // 如果 done === false 并且 fn 抛出错误，则以 reject 回调执行
    if (!done && res === IS_ERROR) {
        done = true;
        reject(promise, LAST_ERROR);
    }
}
