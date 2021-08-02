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

Object.defineProperty(global, 'css', {
	value: () => '__inline_css_extracted_to_hashed_class_name',
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

			// styled components have a special api that allows short hand
			// boolean/string props to be inferred based on the selectors
			// within the style block. This replicates it and leaves the
			// classNames plain
			function computeClassName({ className, ...props }, styles) {
				function hasClass(cls) {
					const re = new RegExp(esc('.' + cls) + '[\\w.]*', 'i');
					return re.test(styles) ? cls.toLowerCase() : undefined;
				}

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

				return {
					className,
					...props,
				};
			}

			const TagTemplate = (strings, ...values) => {
				const styles = zip(strings, values);

				const Cmp = React.forwardRef(({ children, ...props }, ref) => {
					return React.createElement(tag, {
						...computeClassName(props, styles),
						children,
						ref,
					});
				});

				Cmp.withComponent = Other =>
					React.forwardRef((props, ref) =>
						React.createElement(Other, {
							...computeClassName(props, styles),
							ref,
						})
					);

				return Cmp;
			};

			TagTemplate.attrs = p => {
				const fill = x => ({
					...(typeof p === 'function' ? p(x) : { ...x, ...p }),
				});
				return (strings, ...values) => {
					const cmp = TagTemplate(strings, values);
					const X = React.forwardRef((props, ref) =>
						React.createElement(cmp, {
							...fill(props),
							ref,
						})
					);
					X.withComponent = (...x) => cmp.withComponent(...x);
					return X;
				};
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

global.IntersectionObserver = function IntersectionObserver(f) {
	this.observe = jest.fn(target => f([{ isIntersecting: true, target }]));
	this.unobserve = jest.fn();
};
