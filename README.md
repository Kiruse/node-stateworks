# Node Stateworks
*Stateworks* is a library to compose distinct objects into a single
stateful.

*Stateworks* leverages Proxy objects to conduct its magic. Accordingly, the constructor does not return a `Stateful` object, but a `Proxy` around a `StatefulCore` object. The resulting object is more or less a composition of a total of three objects: The `StatefulCore` (which is also an event emitter), the actual state, and the common properties object.

## Update v3
*Stateworks* has been slightly redesigned to use closures instead. Its use is now much like `Promise`s. The `enter` method has effectively been removed from the Stateful object. The `stateful` function no longer takes the initial state as single argument, but an initializer function. See below for details.

# Simple Example
```javascript
const stateful = require('stateworks');

const mystateful = stateful((proxy, common, enter) => {
    const state1 = {
        foo() {
            enter(state2);
            return 'state1.foo';
        }
    };
    const state2 = {
        foo() {
            enter(state3);
            return 'state2.foo';
        }
    };
    const state3 = {
        foo() {
            enter({}); // enter empty/terminal state - foo is no longer defined here
            return 'state3.foo';
        }
    };
    return state1;
});

console.log(mystateful.foo(), mystateful.foo(), mystateful.foo());
// output: state1.foo  state2.foo  state3.foo
mystateful.foo(); // throws because 'undefined' is not callable
```

# 2-Layer System
The Stateful object is composed of two objects: the *active state* object and the *common properties*. When transitioning with `enter` the *active state* changes, and thus dynamically the exposed properties along with it.

When getting properties, the *common properties* take precedence. If the property does not exist on the *common properties* object, it is read from the *active state* object. If it doesn't exist there either, `undefined` is returned.

Setting properties follows a very similar logic: if the property exists on the *common properties* object, its property is overridden; otherwise, the *active state*'s property is overridden.
   
Any method on either the *common properties* or the *active state* are bound to your Stateful object.

**Note** that due to the dynamic nature of these stateful objects, it is impossible to standardize a stateful object's interface for TypeScript as a different state may expose entirely different properties. *Stateworks* is too generic for TypeScript's typing system, though you may define interfaces to describe the current state of the stateful.

## Common Properties
Common properties persist across state transitions. When assigning a value to a Stateful's property, if this property is *common*, it will be stored in the `common` object passed to the initializer. Otherwise, it will be stored in the active state. Thus, when transitioning into another state, this property will be rerouted by the Stateful proxy.

**Example**
```javascript
const stateful = require('stateworks');

const mystateful = stateful((proxy, common, enter) => {
    Object.assign(common, {
        foo: 'bar',
        answer: 42,
    })
    
    const state1 = {
        state: 1,
        ask() {
            console.log(this.foo === 'bar'); // true
            const answer = this.answer += 1;
            enter(state2); // Note that this call already changes the active state
            return answer;
        }
    };
    const state2 = {
        state: 2,
        ask() {
            console.log(this.foo === 'bar'); // true
            const answer = this.answer += 2
            enter(state3);
            return answer;
        }
    };
    const state3 = {
        state: 3,
        ask() {
            console.log(this.foo === 'bar'); // true
            return this.answer += 1;
        }
    }
    
    return state1;
});

console.log(mystateful.answer, mystateful.state); // 42 1
console.log(mystateful.ask(), mystateful.state);  // 43 2
console.log(mystateful.ask(), mystateful.state);  // 45 3
console.log(mystateful.ask(), mystateful.state);  // 46 3
```


# Callbacks
If your active state implements `onStateEnter` and `onStateLeave` methods, they will be called accordingly upon transitioning states. `this` will be bound to the Stateful proxy object.

**Example**
```javascript
const stateful = require('stateworks');

const mystateful = stateful((proxy, common, enter) => {
    Object.assign(common, {
        state: undefined,
    });
    
    const state1 = {
        onEnterState() {
            this.state = 1;
        },
        onLeaveState() {
            console.log('bye bye state 1');
        },
        next() {
            enter(state2);
        }
    };
    const state2 = {
        onEnterState() {
            this.state = 2;
        },
        next() {
            enter(state1);
        }
    };
    
    return state1;
});

console.log(mystateful.state); // 1
mystateful.next();
console.log(mystateful.state); // 2
mystateful.next();
console.log(mystateful.state); // 1
```

**Note** that the state returned from the initializer will also trigger `onEnterState`.
