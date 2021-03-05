'use strict';

const Mock = () =>
	new Proxy(
		function () {
			return Mock();
		}, //the Target (the thing we are proxy'ing)... a callable/newable function
		{
			getOwnPropertyDescriptor: (_, p) =>
				Object.getOwnPropertyDescriptor(_, p) || {
					configurable: true,
					writable: true,
					enumerable: false,
					value: Mock(),
				},

			has: (_, p) =>
				typeof p !== 'symbol' ||
				p === Symbol.iterator ||
				p === Symbol.toPrimitive,

			//the get() hook...
			get (_, p) {
				const getters = {
					[Symbol.iterator]: () => ({
						next: () => ({ done: true }),
					}),

					//If caller wants to unbox the primitive... return a function that generates a string
					[Symbol.toPrimitive]: () => String(Date.now()),
				};

				return getters[p] || (typeof p === 'symbol' ? void 0 : Mock());
			},

			set() {

			}
		}
	);

module.exports = Mock;
