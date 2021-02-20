/* eslint-env jest */
/* global document */
'use strict';
const React = require('react');
const cx = require('classnames');

const esc = s =>
	s.replace(esc.re || (esc.re = /[-[\]{}()*+?.,\\^$|#\s]/g), '\\$&');

Object.defineProperty(global, 'stylesheet', {
	value: () =>
		new Proxy(
			{},
			{
				get: (_, property) => property,
			}
		),
});

Object.defineProperty(global, 'styled', {
	value: new Proxy(
		tag => {
			function zip(strings, args) {
				const last = args.length - 1;
				return strings
					.reduce(
						(a, v, i) => [...a, v, ...(i > last ? [] : [args[i]])],
						[]
					)
					.join('');
			}

			const TagTemplate = (strings, ...values) => {
				const styles = zip(strings, values);
				const hasClass = cls => {
					const re = new RegExp(esc('.' + cls) + '[\\w.]*', 'i');
					return re.test(styles) ? cls.toLowerCase() : undefined;
				};

				// styled components have a special api that allows short hand
				// boolean/string props to be inferred based on the selectors
				// within the style block. This replicates it and leaves the
				// classNames plain

				return ({ className, children, ...props }) => {
					const el =
						typeof tag === 'string'
							? document.createElement(tag)
							: null;
					for (let [prop, value] of Object.entries({ ...props })) {
						if (
							el &&
							!(prop.toLowerCase() in el) &&
							!/^data-/.test(prop)
						) {
							delete props[prop];
						}

						if (typeof value === 'string') {
							const newClassName = cx(
								className,
								hasClass(prop + '-' + value)
							);
							if (newClassName !== className) {
								className = newClassName;
								continue;
							}
						}

						if (value) {
							className = cx(className, hasClass(prop));
						}
					}

					if (className === '') {
						className = undefined;
					}

					return React.createElement(tag, {
						...props,
						children,
						className,
					});
				};
			};

			TagTemplate.attrs = p => {
				const fill = x => ({
					...x,
					...(typeof p === 'function' ? p(x) : p),
				});
				return () => props => React.createElement(tag, fill(props));
			};

			return TagTemplate;
		},
		{
			get: (_, tag) => global.styled(tag),
		}
	),
});

Object.defineProperty(global, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // Deprecated
		removeListener: jest.fn(), // Deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	})),
});

if (!global.IntersectionObserver) {
	global.IntersectionObserver = jest.fn(f => ({
		observe: jest.fn(target => f([{ isIntersecting: true, target }])),
		unobserve: jest.fn(),
	}));
}
