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
    scope: null,
    states: {},
    currentState: undefined,
    defaultState: undefined,
    transitionHandler (){},
    
    bind (scope) {
        this.scope = scope;
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
        var oldName  = this.currentState;
        this.currentState = statename;
        var newState = this.states[this.currentState];
        
        this.transitionHandler(oldState, newState);
        
        return this;
    },
    
    setTransitionHandler (handler) {
        transitionHandler = handler;
        return this;
    }
});

const traps = {
    defineProperty (target, key, descriptor) {
        return Reflect.defineProperty(this.stateful.states[this.stateful.currentState], key, descriptor);
    },
    getOwnPropertyDescriptor (target, key) {
        return Reflect.getOwnPropertyDescriptor(this.stateful.states[this.stateful.currentState], key);
    },
    has (target, key) {
        return key in this.stateful.states[this.stateful.currentState] || key in this.stateful.states[this.stateful.defaultState];
    },
    get (target, key) {
        const stateful = this.stateful;
        
        // Attempt to find the property on the current or default state objects
        // and if it's a function, change the scope and prefix the enter method
        // argument.
        if (key in stateful.states[stateful.currentState]) {
            let result = stateful.states[stateful.currentState][key];
            if (typeof result === 'function') {
                return result.bind(stateful.scope || target, stateful.enter.bind(stateful));
            }
            return result;
        }
        else if (stateful.defaultState && key in stateful.states[stateful.defaultState]) {
            let result = stateful.states[stateful.defaultState][key];
            if (typeof result === 'function') {
                return result.bind(stateful.scope || target, stateful.enter.bind(stateful));
            }
            return result;
        }
        
        // Otherwise just return the base object's property unmodified.
        return target[key];
    },
    set (target, key, value) {
        this.stateful.states[this.stateful.currentState][key] = value;
    },
    deleteProperty (target, key) {
        delete this.stateful.states[this.stateful.currentState][key];
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

InvalidStateError.prototype = Object.create(Error.prototype);


exports.Stateful = Stateful;
exports.InvalidStateError = InvalidStateError;
