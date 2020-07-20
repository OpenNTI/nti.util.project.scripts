'use strict';
module.exports = class Cancelable {

	constructor () {
		this.observers = [];
	}

	cancel () {
		if (this.canceled) {return;}

		this.canceled = true;
		this.observers.map(fn => process.nextTick(fn));
		this.observers = [];
	}


	has (fn) {
		return ~this.observers.findIndex(f => f === fn || f.wrapped === fn);
	}


	onCancel (fn) {
		const {observers} = this;

		if (this.canceled) {
			process.nextTick(fn);
			return () => {};
		}

		//wrap fn() so the pointer is unique to this invocation.
		const f = () => fn();

		f.wrapped = fn;

		if (!this.has(fn)) {
			observers.push(f);
		}

		const remove = (list, v) => {
			const i = list.indexOf(v);
			if (~i) {return list.splice(i, 1)[0];}
		};

		return () => remove(observers, f);
	}
};
