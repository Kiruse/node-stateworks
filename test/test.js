const assert = require('assert');
const {Stateful} = require('../main');

it('should work as a self-contained object', function(done) {
	var stateful = new Stateful(function(interface) {
		interface
		.addStates({
			start: {
				foo (enter) {
					enter ('mid');
					return 'start foo';
				}
			},
			mid: {
				foo (enter) {
					enter ('final');
					return 'mid foo';
				}
			},
			final: {
				foo (enter) {
					return 'final foo';
				}
			},
		})
		.enter('start');
	});
	
	assert.strictEqual(stateful.foo(), 'start foo');
	assert.strictEqual(stateful.foo(), 'mid foo');
	assert.strictEqual(stateful.foo(), 'final foo');
	assert.ok(!stateful.enter);
	
	// Finish unit test
	done();
});

it('should support scopes', function(done) {
	function MyStateful() {
		return Stateful.call(this, (interface) => {
			interface.addStates(myStatefulStates).default('base');
		});
	}
	
	MyStateful.prototype = Object.create(Stateful.prototype);
	
	const myStatefulStates = {
		base: {
			foo (enter) {
				enter('blurp');
				return ':O';
			}
		},
		blurp: {
			foo (enter) {
				enter('base');
				return 'O:';
			}
		},
	};
	
	var stateful = new MyStateful();
	assert.strictEqual(stateful.foo(), ':O');
	assert.strictEqual(stateful.foo(), 'O:');
	assert.strictEqual(stateful.foo(), ':O');
	done();
});

it('should support shared properties', function(done) {
	var stateful = new Stateful((interface) => {
		interface.addStates({
			start: {
				foo (enter) {
					this.status = 'start';
					enter('intermediate');
				}
			},
			intermediate: {
				foo (enter) {
					this.status = 'intermediate';
					enter('final');
				}
			},
			final: {
				foo (enter) {
					this.status = 'final';
				}
			},
		})
		.setCommon({
			status: 'unknown'
		})
		.enter('start');
	});
	
	assert.strictEqual(stateful.status, 'unknown');
	
	stateful.foo();
	assert.strictEqual(stateful.status, 'start');
	
	stateful.foo();
	assert.strictEqual(stateful.status, 'intermediate');
	
	stateful.foo();
	assert.strictEqual(stateful.status, 'final');
	
	done();
});

it('should call custom transition handler', function(done) {
	var numCalls = 0;
	
	var stateful = new Stateful((interface) => {
		interface.addStates({
			start: {
				foo (enter) {
					enter('intermediate');
				}
			},
			intermediate: {
				foo (enter) {
					enter('final');
				}
			},
			final: {
				foo () {}
			}
		})
		.enter('start')
		.setTransitionHandler((oldStateName, oldState, newStateName, newState) => {
			++numCalls;
		});
	});
	
	stateful.foo();
	assert.strictEqual(numCalls, 1);
	
	stateful.foo();
	assert.strictEqual(numCalls, 2);
	
	stateful.foo();
	assert.strictEqual(numCalls, 2);
	
	done();
});
