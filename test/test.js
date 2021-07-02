//////////////////////////////////////////////////////////////////////
// Node Stateworks UTs
// -----
// Copyright (c) Kiruse 2018 - 2021. Licensed under MIT License.
const assert = require('assert');
const Stateful = require('../index');

it('basic functionality', function(done) {
	const stateful = Stateful((proxy, common, enter) => {
		const stateFoo = {
			foo() {
				enter(stateBar);
				return 'foo.foo';
			},
		};
		const stateBar = {
			foo() {
				enter(stateBaz);
				return 'bar.foo';
			},
		};
		const stateBaz = {
			foo() {
				enter({});
				return 'baz.foo';
			}
		};
		
		return stateFoo;
	});
	
	assert.strictEqual(stateful.foo(), 'foo.foo');
	assert.strictEqual(stateful.foo(), 'bar.foo');
	assert.strictEqual(stateful.foo(), 'baz.foo');
	assert.strictEqual(stateful.foo, undefined);
	
	done();
});

it('common properties', function(done) {
	const stateful = Stateful((proxy, common, enter) => {
		Object.assign(common, {
			hello: 42,
			shared: 33,
		});
		
		const state1 = {
			foo() {
				this.hello = 'world';
				enter(state2);
			}
		};
		const state2 = {
			foo() {
				this.hello = 'bye';
				enter({});
			}
		}
		
		return state1;
	});
	
	assert.strictEqual(stateful.hello, 42);
	assert.strictEqual(stateful.shared, 33);
	
	stateful.foo();
	assert.strictEqual(stateful.hello, 'world');
	assert.strictEqual(stateful.shared, 33);
	
	stateful.foo();
	assert.strictEqual(stateful.hello, 'bye');
	assert.strictEqual(stateful.shared, 33);
	
	done();
});
