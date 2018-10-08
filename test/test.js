const assert = require('assert');
const Stateful = require('../main');

it('basic functionality', function(done) {
	class StateFoo {
		foo() {
			this.enter(new StateBar());
			return 'foo.foo';
		}
	}
	
	class StateBar {
		foo() {
			this.enter(new StateBaz());
			return 'bar.foo';
		}
	}
	
	class StateBaz {
		foo() {
			this.enter({});
			return 'baz.foo';
		}
	}
	
	let stateful = Stateful(new StateFoo());
	
	assert.strictEqual(stateful.foo(), 'foo.foo');
	assert.strictEqual(stateful.foo(), 'bar.foo');
	assert.strictEqual(stateful.foo(), 'baz.foo');
	assert.strictEqual(stateful.foo, undefined);
	
	// Finish unit test
	done();
});

it('common properties', function(done) {
	class StateOne {
		foo() {
			this.hello = 'world';
			this.enter(new StateTwo());
		}
	}
	
	class StateTwo {
		foo() {
			this.hello = 'bye';
			this.enter({});
		}
	}
	
	let stateful = Stateful(new StateOne())
		.common()
			.hello(42)
			.shared(33)
		.done();
	
	assert.strictEqual(stateful.hello, 42);
	assert.strictEqual(stateful.shared, 33);
	assert.ok(stateful.state() instanceof StateOne);
	
	stateful.foo();
	assert.strictEqual(stateful.hello, 'world');
	assert.strictEqual(stateful.shared, 33);
	assert.ok(stateful.state() instanceof StateTwo);
	
	stateful.foo();
	assert.strictEqual(stateful.hello, 'bye');
	assert.strictEqual(stateful.shared, 33);
	assert.ok(!(stateful.state() instanceof StateOne) && !(stateful.state() instanceof StateTwo));
	
	done();
});
