//////////////////////////////////////////////////////////////////////
// Stateworks - stateful object composition
// -----
// Copyright (c) Kiruse 2018 - 2021. Licensed under MIT License.
module.exports = function stateful(initializer) {
    let state = {};
    const common = {};
    
    const proxy = new Proxy({}, {
        getOwnPropertyDescriptor(_, prop) {
            return Reflect.getOwnPropertyDescriptor(common, prop) || Reflect.getOwnPropertyDescriptor(state, prop);
        },
        
        defineProperty(_, prop, desc) {
            Reflect.defineProperty(state, prop, desc);
        },
        
        has(_, prop) {
            return Reflect.has(common, prop) || Reflect.has(state, prop);
        },
        
        get(_, prop) {
            const value = prop in common ? common[prop] : state[prop];
            if (typeof(value) === 'function') {
                return value.bind(proxy);
            }
            return value;
        },
        
        set(_, prop, value) {
            if (prop in common) {
                common[prop] = value;
            }
            else {
                state[prop] = value;
            }
            return true;
        },
        
        deleteProperty(_, prop) {
            delete state[prop];
        },
        
        ownKeys(_) {
            return Reflect.ownKeys(common).concat(Reflect.ownKeys(state))
                .filter((curr, index, self) => self.indexOf(curr) === index);
        },
    });
    
    function enter(newState) {
        if (typeof(proxy.onStateLeave) === 'function') {
            proxy.onStateLeave();
        }
        state = newState;
        if (typeof(proxy.onStateEnter) === 'function') {
            proxy.onStateEnter();
        }
    }
    
    if (typeof(initializer) === 'function') {
        enter(initializer(proxy, common, enter));
    }
    
    return proxy;
};
