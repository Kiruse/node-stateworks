// Copyright (c) Kiruse 2018
// License GNU GPL 3.0

function Stateful(base, callback) {
    if (arguments.length === 1) {
        callback = base;
        base = {};
    }
    
    // Call the initializer of the stateful object.
    callback.call(this, this);
    
    // Ensure we're in a valid starting state.
    if (!(this.currentState in this.states)) throw new InvalidStateError(this.currentState);
    
    // Create the proxy which will gather its methods from the current and default states of the stateful.
    var proxy = new Proxy(base, Object.assign({stateful: this}, traps));
    
    // Save it, cus we might need it. It's more or less private anyway.
    this.proxy = proxy;
    
    // Return the stateful object.
    return proxy;
}

Object.assign(Stateful.prototype, {
    proxy: null, // Filled during construction.
    states: {},
    common: {}, // Properties shared across states. These have highest priority.
    currentState: undefined,
    defaultState: undefined,
    transitionHandler (){},
    
    setCommon (properties) {
        if (typeof properties === 'object') {
            Object.assign(this.common, properties);
        }
        return this;
    },
    
    addStates (states) {
        if (typeof states === 'object') {
            for (var statename in states) {
                this.addState(statename, states[statename]);
            }
        }
        return this;
    },

    addState (statename, stateobject) {
        if (typeof stateobject === 'object') {
            this.states[statename] = stateobject;
        }
        return this;
    },
    
    default (statename) {
        if (!(statename in this.states)) throw new InvalidStateError(statename);
        
        this.defaultState = String(statename);
        if (!this.currentState) this.currentState = this.defaultState;
        
        return this;
    },
    
    enter (statename) {
        if (!(statename in this.states)) throw new InvalidStateError(statename);
        
        
        var oldState = this.states[this.currentState];
        var oldStateName = this.currentState;
        var oldName  = this.currentState;
        this.currentState = statename;
        var newState = this.states[this.currentState];
        var newStateName = this.currentState;
        
        this.transitionHandler(oldStateName, oldState, newStateName, newState);
        
        return this;
    },
    
    setTransitionHandler (handler) {
        this.transitionHandler = handler;
        return this;
    }
});

const traps = {
    defineProperty (target, key, descriptor) {
        return Reflect.defineProperty(this.stateful.states[this.stateful.currentState], key, descriptor);
    },
    getOwnPropertyDescriptor (target, key) {
        if (key in this.stateful.common) {
            return Reflect.getOwnPropertyDescriptor(this.stateful.common, key);
        }
        return Reflect.getOwnPropertyDescriptor(this.stateful.states[this.stateful.currentState], key);
    },
    has (target, key) {
        return key in this.stateful.common || key in this.stateful.states[this.stateful.currentState] || key in this.stateful.states[this.stateful.defaultState];
    },
    get (target, key) {
        const stateful = this.stateful;
        
        // Functions need to be rebound to the stateful or the stateful's target scope!
        function alter(fn) {
            return typeof fn !== 'function' ? fn : fn.bind(stateful.proxy, stateful.enter.bind(stateful));
        }
        
        // Highest priority: shared/common properties.
        if (key in stateful.common) {
            return alter(stateful.common[key]);
        }
        
        // Second priority: current state properties.
        if (key in stateful.states[stateful.currentState]) {
            return alter(stateful.states[stateful.currentState][key]);
        }
        
        // Third priority: default state properties.
        else if (stateful.defaultState && key in stateful.states[stateful.defaultState]) {
            return alter(stateful.states[stateful.defaultState][key]);
        }
        
        // Lowest priority: base object properties.
        return target[key];
    },
    set (target, key, value) {
        // Highest priority: shared/common properties
        if (key in this.stateful.common) {
            this.stateful.common[key] = value;
        }
        
        // Otherwise: current state properties, even if they don't exist!
        // NEVER modify the base object as this contradicts the design choice!
        else {
            this.stateful.states[this.stateful.currentState][key] = value;
        }
    },
    deleteProperty (target, key) {
        // One does not delete shared/common properties. One can set them to undefined, tho...
        if (key in this.stateful.common) {
            this.stateful.common[key] = undefined;
        }
        else {
            delete this.stateful.states[this.stateful.currentState][key];
        }
    },
};


function InvalidStateError(state) {
    var err = Error.call(this, state);
    err.name = 'InvalidStateError';
    
    var stack = err.stack.split("\n");
    stack.splice(1, 1);
    err.stack = stack.join("\n");
    
    err.__proto__ = InvalidStateError.prototype;
    return err;
}

InvalidStateError.prototype = Object.create(Error.prototype, {
    constructor: { value: InvalidStateError, enumerable: false, writable: true, configurable: true }
});

function InvalidOperationError(operation, state) {
    var err = Error.call(this, operation + ' in state ' + state);
    err.name = 'InvalidOperationError';
    
    var stack = err.stack.split("\n");
    stack.splice(1, 1);
    err.stack = stack.join("\n");
    
    err.__proto__ = InvalidOperationError.prototype;
    return err;
}

InvalidOperationError.prototype = Object.create(Error.prototype, {
    constructor: { value: InvalidOperationError, enumerable: false, writable: true, configurable: true }
});


exports.Stateful = Stateful;
exports.InvalidStateError = InvalidStateError;
exports.InvalidOperationError = InvalidOperationError;
