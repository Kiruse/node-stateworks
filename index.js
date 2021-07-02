// Copyright (c) Kiruse 2018
// License GNU GPL 3.0

const Emitter = require('events');

module.exports = function Stateful(init) {
    let stateful = new StatefulInner();
    let proxy = new Proxy(stateful, {
        getOwnPropertyDescriptor(target, prop) {
            return Reflect.getOwnPropertyDescriptor(target._common, prop) || Reflect.getOwnPropertyDescriptor(target._state, prop) || Reflect.getOwnPropertyDescriptor(target, prop);
        },
        
        defineProperty(target, prop, desc) {
            Reflect.defineProperty(target._state, prop, desc);
        },
        
        has(target, prop) {
            return Reflect.has(target._common, prop) || Reflect.has(target._state, prop) || Reflect.has(target, prop);
        },
        
        get(target, prop) {
            let value = undefined;
            
            if (prop in target._common) {
                value = Reflect.get(target._common, prop);
            }
            else if (prop in target._state) {
                value = Reflect.get(target._state, prop);
            }
            else if (prop in target) {
                value = Reflect.get(target, prop);
            }
            
            if (typeof value === 'function') {
                return value.bind(target._proxy);
            }
            return value;
        },
        
        set(target, prop, value) {
            if (prop in target._common) {
                Reflect.set(target._common, prop, value);
            }
            else if (prop in target) {
                Reflect.set(target, prop, value);
            }
            else {
                Reflect.set(target._state, prop, value);
            }
            return true;
        },
        
        deleteProperty(target, prop) {
            Reflect.deleteProperty(target._state, prop);
        },
        
        ownKeys(target) {
            return Reflect.ownKeys(target._common).concat(Reflect.ownKeys(target._state)).concat(Reflect.ownKeys(target))
                .filter((curr, index, self) => {
                    return self.indexOf(curr) === index;
                });
        },
    });
    
    Object.defineProperty(stateful, '_proxy', {
        enumerable: false,
        writable: false,
        configurable: false,
        value: proxy
    });
    
    if (init) {
        stateful.enter(init);
    }
    
    return proxy;
};

class StatefulInner extends Emitter {
    constructor() {
        super();
        
        /**
         * Currently active state. The proxy returned by the Stateful
         * function has traps that expose the state's methods as our own.
         * @type {Object}
         */
        this._state  = {};
        
        /**
         * Properties of this Stateful that persist between state transitions.
         * The traps of the proxy returned by Stateful prioritizes this object's
         * properties.
         * @type {Object}
         */
        this._common = {};
        
        /**
         * The proxy object that provides our traps and allows us to do our magic.
         * @type {Proxy}
         */
        this._proxy  = undefined;
    }
    
    /**
     * Enters a new state, emitting the `leave` and `enter` events respectively.
     * @param {object} state State to enter.
     * @chainable
     */
    enter(state) {
        this.emit('leave', this._state);
        this._state = state;
        this.emit('enter', this._state);
        return this._proxy;
    }
    
    /**
     * Creates a new proxy interface allowing us to configure the common properties
     * shared across states of this Stateful.
     * @return {Proxy} The proxy interface.
     */
    common() {
        let stateful = this;
        let proxy = new Proxy(this._common, {
            has(target, prop) {
                return Reflect.has(target, prop);
            },
            
            get(target, prop) {
                // If 'done' property was requested, we return to the stateful.
                if (prop === 'done') return () => stateful;
                
                // We return the properties as chainable functions!
                return value => {
                    if (!arguments.length) return target[prop];
                    target[prop] = value;
                    return proxy;
                };
            },
        });
        return proxy;
    }
    
    /**
     * Gets the currently active state for reference.
     * @return {Object}
     */
    state() {
        return this._state;
    }
}
