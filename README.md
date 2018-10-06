# Node Stateworks

There are various finite state machines out there. After inspecting a couple of
them, I decided most of them just are too close to the mathematical definition.
I'm a programmer, not a mathematician. I need something convenient and
practical. So, I wrote my own stateful class / wrapper.

Stateworks makes heavy use of Proxy objects. Accordingly, the constructor does
not return a `Stateful` object, but a `Proxy` around an arbitrary base object.
It tracks the state in the actual Stateful object. Inspired by Promises, you
simply pass an "initializer" to the constructor which gains direct access to the
raw Stateful object to configure the states.

# Example Usage

Following is a simple example usage for Stateworks. See `test/test.js` for more.

    const {Stateful} = require('stateworks');
    
    var stateful = new Stateful(function(interface) {
        interface.addStates({
            foo: {
                foo (enter) {
                    enter('bar');
                    return 'foo.foo';
                }
            },
            bar: {
                foo (enter) {
                    enter('baz');
                    return 'bar.foo';
                }
            },
            baz: {
                foo (enter) {
                    enter('foo');
                    return 'baz.foo';
                }
            }
        })
        .enter('foo');
    });
    
    console.log(stateful.foo(), stateful.foo(), stateful.foo());
    // output: foo.foo  bar.foo  baz.foo

# Details / Caveat

As aforementioned, the constructor returns a Proxy object with several traps.
When accessing a property, this object searches in three different places in
this order:

1. **Common properties**
   Allows us to define cross-state properties. First and foremost lookup priority.

2. **Current state**
   Allows us to change the value of properties based on the object's state. Neat.
   When setting properties, they will always be set in the current state, unless
   they are found in the Common Properties above.
   
3. **Default state**
   Allows us to define default values for properties. Only used in get trap. The
   set trap is limited to common and current-state properties only. Most useful
   when defining methods that will not change for most states, although it can
   become disorienting when working with increasingly complex state machines.
   
Every function it detects will have its `this` scope bound to the Proxy object
so you can call stateful methods easily. The first parameter passed to these
methods is *always* the `Stateful.enter()` method, which allows you to
transition between states from any of the stateful's methods.

That's all there really is to pay attention to.


# Stateful Class

## Overview

- proxy
- states
- common
- currentState
- defaultState
- transitionHandler
- setCommon
- addStates
- addState
- default
- enter
- setTransitionHandler

## proxy

The proxy object which the constructor will return.

**CAVEAT**: This will be undefined at the time of calling of the initializer!

## states

Stores the defined states. Nothing more, nothing less. Accessed by the `addState`
and `addStates` methods as well as the traps.

## common

Holds the defined common properties. Accessed by the `setCommon` method as well
as the traps.

## currentState

Current state of the state machine. Plain as that.

## defaultState

Default state of the state machine for *get* lookup of properties that do not
exist on the current state.

Set by `default`, which returns this instance for convenient method chaining.

## transitionHandler(oldStateName, oldState, newStateName, newState)

Called by `enter` upon transitioning into a new state (even if the state
transitions to itself!). Useful for debugging, or e.g. to throw an `Error`
whenever the `newStateName === 'error'`.

Parameters should be self-explanatory, but in any case:

### oldStateName

State key of the state from which we transitioned. At the time of calling, the
internal `currentState` property has already changed to `newStateName`.

### oldState

State object of the state from which we transitioned. At the time of calling,
the traps will lookup properties from the `newState` already.

### newStateName

State key of the new state into which we've transitioned.

### newState

State object of the new state into which we've transitioned.

## addStates(states)

Adds states to the internal `states` object. That's all.

## addState(statename, stateobj)

Adds the `stateobj` to the internal `states` object under the given `statename`
key. Used internally by `addStates()`.

## default(statename)

Sets the internal `defaultState` property and returns `this` for convenience.

## enter(statename)

Sets the internal `currentState` property, aka. transitions into another state.
Passed as first argument to any of the stateful's methods.

## setTransitionHandler(handler)

Sets the internal `transitionHandler` property and returns `this` for convenience.


# TODO

[ ] Support Symbols as state keys. Makes refactoring easier.
