# *UPDATE*

Version 2.0 is a complete rewrite of the former Stateworks library!

Although I had originally claimed that "I need something convenient and practical",
I found it not to be nearly as practical or convenient as I had thought and hoped.
In fact, it made a pure mess out of the resulting code. The new approach follows
the same basic principle, but a different usage paradigm, and produces much cleaner
code!

# Node Stateworks

There are various finite state machines out there. After inspecting a couple of
them, I decided most of them just are too close to the mathematical definition.
I'm a programmer, not a mathematician. I need something convenient and
practical. So, I wrote my own stateful class / wrapper.

Stateworks makes heavy use of Proxy objects. Accordingly, the constructor does
not return a `Stateful` object, but a `Proxy` around a `StatefulInner` object.
The resulting object is more or less a composition of a total of three objects:
The `StatefulInner` (which is also an event emitter), the actual state, and
the common properties object.

# Simple Example

Following is a simple example usage for Stateworks. See `test/test.js` for more.

    const Stateful = require('stateworks');
    
    class State1 {
        foo() {
            this.enter(new State2());
            return 'state1.foo';
        }
    };
    
    class State2 {
        foo() {
            this.enter(new State3());
            return 'state2.foo';
        }
    }
    
    class State3 {
        foo() {
            this.enter({}); // Essentially enters an empty / final / invalid state.
            return 'state3.foo';
        }
    }
    
    var stateful = Stateful(new State1());
    // alternatively:
    stateful = Stateful().enter(new State1());
    
    console.log(stateful.foo(), stateful.foo(), stateful.foo());
    // output: state1.foo  state2.foo  state3.foo

# Details / Caveat

The properties of the active state object are reflected onto the Stateful. As
mentioned above, the Stateful is essentially a composition of three objects.
When getting a property, it looks in these places in this order:

1. **Common properties**
   Persisting properties across state transitions.

2. **Current state**
   Properties of the active state.
   
3. **StatefulInner object**
   This object provides the minimalistic interface of the Stateful objects needed
   to manipulate the Stateful itself.
   
It is safe to assume that `this === stateful` in any of the methods called on
the stateful object.


# Stateful Interface

## Events

### enter

Triggered when entering a new state. Usually back-to-back with a `leave` event.
Receives the new state as sole argument.

### leave

Triggered when leaving a state in favor of a new one. Usually imminently before
an `enter` event. Receives the old state as sole argument.

## Properties

The following properties exist on the internal stateful object. Usually you
shouldn't have a need to access these specifically.

### _proxy

The proxy object which the constructor will return. Usually `this === this._proxy`
when invoked inside a stateful method.

Not enumerable, configurable, or writable.

### _state

Currently active state.

### _common

Holds the defined common properties. For convenience, prefer using `.common()`
instead.

## Methods

The Stateful is an event emitter, hence all of the emitter's methods are exposed
as well.

## enter(*<object>* state_object)

Replaces the current active state and triggers respective events.

Chainable.

## common()

Takes no arguments.

Retrieves another proxy object acting as an interface to access all common
properties as getter/setter methods, whether they exist already or not.

A special property `done` returns the associated stateful for the sake of method
chaining.

### Example

    Stateful()
        .common()
            .hello('world')
            .foo('bar')
            .answer(42)
        .done()
        .enter({});

## state()

Takes no arguments.

Retrieves the active state object. Essentially the same as accessing
`stateful._state` directly. The method's purpose is solely to maintain coherency
with `.common()`.
