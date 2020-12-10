/*eslint camelcase:0*/
'use strict';
process.env.NODE_ENV = 'development';
const path = require('path');

const DEBUG = process.argv.includes('--debug') || process.argv.includes('--profile');

//Webpack plugins:
// const BitBarWebpackProgressPlugin = require('BitBarWebpackProgressPlugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const paths = require('./paths');

const ENV = 'development';
const PROD = false;

const {loaders: jsLoaders, plugins: jsPlugins} = require('@nti/app-scripts/config/js-loaders');
const {loaders: cssLoaders, plugins: cssPlugins} = require('@nti/app-scripts/config/css-loaders');

const pkg = require(paths.packageJson);

const getWorkspace = require('@nti/lib-scripts/config/workspace');
const workspaceLinks = (!PROD && paths.workspace)
	? getWorkspace(paths.workspace, paths.packageJson)
	: {};

//TODO: Figure out how to inherit webpack config from app-scripts and mutate to target cmp-scripts needs so we
//		can maintain one set of loader/workspace implementations.

exports = module.exports = {
	mode: ENV,
	bail: PROD,
	entry: {
		index: [
			require.resolve('./polyfills'),
			paths.resolveApp('./test/app/index.js')
		]
	},
	output: {
		path: '/',
		filename: '[name].js',
		publicPath: '/'
	},

	devtool: 'cheap-module-source-map',

	node: {
		dgram: 'empty',
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
	},

	target: 'web',

	resolve: {
		extensions: ['.js', '.jsx', '.mjs', '.mjsx'],
		alias: {
			...workspaceLinks,
			// Resolve Babel runtime relative to app-scripts.
			// It usually still works on npm 3 without this but it would be
			// unfortunate to rely on, as app-scripts could be symlinked,
			// and thus babel-runtime might not be resolvable from the source.
			'@babel/runtime': path.dirname(
				require.resolve('@babel/runtime/package.json')
			),

			'core-js': path.dirname(
				require.resolve('core-js/package.json')
			),

			// Support React Native Web
			// https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
			'react-native': 'react-native-web',

			...(
				// just in case these modules aren't used in the host project, don't blow up if they aren't present.
				['react', 'react-dom']
					.reduce(
						(o, mod) => {
							try {
								o[mod] = path.dirname(require.resolve(path.join(mod, 'package.json')));
							}
							catch {/*not found*/}
							return o;
						},
						{}
					)
			),
		},
	},

	module: {
		strictExportPresence: true,
		rules: [
			// Disable require.ensure as it's not a standard language feature.
			{ parser: { requireEnsure: false } },


			{
				oneOf: [
					...jsLoaders(),

					{
						test: /-avatar.png$/,
						loader: require.resolve('url-loader'),
						options: {
							mimeType: 'image/[ext]'
						}
					},

					{
						test: /\.template\.svg$/,
						loader: require.resolve('raw-loader')
					},

					{
						test: /\.(ico|gif|png|jpg|svg)(\?.*)?$/,
						exclude: [/-avatar.png$/, /\.template\.svg$/],
						loader: require.resolve('url-loader'),
						options: {
							limit: 50,
							name: 'assets/[name]-[hash].[ext]',
							mimeType: 'image/[ext]'
						}
					},

					{
						test: /\.(woff|ttf|eot|otf)(\?.*)?$/,
						loader: require.resolve('file-loader'),
						options: {
							name: 'assets/fonts/[hash].[ext]'
						}
					},

					{
						test: /\.(eot|ttf|woff)$/,
						loader: require.resolve('file-loader'),
						query: {
							name: 'assets/fonts/[name]-[hash].[ext]'
						}
					},

					...cssLoaders(paths)

				].filter(Boolean)
			}
		].filter(Boolean)
	},

	optimization: {
		minimize: false
	},

	performance: false,
	devServer: {
		disableHostCheck: true,
		allowedHosts: ['.dev', '.local'],
		clientLogLevel: 'none',
		contentBase: paths.resolveApp('test/app/'),
		watchContentBase: true,
		overlay: {
			warnings: false,
			errors: true
		},
		proxy: [{
			context: ['/content', '/dataserver2'],
			target: 'https://app.localhost',
		}],
		stats: 'errors-only',
	},

	plugins: [
		// !PROD && new BitBarWebpackProgressPlugin(),
		DEBUG && new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /node_modules/,

			// add errors to webpack instead of warnings
			// failOnError: true,

			onDetected ({ /*module,*/ paths: cycle, compilation }) {
				// `paths` will be an Array of the relative module paths that make up the cycle
				// `module` will be the module record generated by webpack that caused the cycle
				compilation.warnings.push(new Error(cycle.join('\n\t-> ')));
			}
		}),

		...jsPlugins(),
		...cssPlugins({
			miniCssExtract: {
				filename: 'index.generated.css'
			}
		}),

		new HtmlWebpackPlugin({
			title: pkg.name + ': Test Harness',
			template: paths.exists(paths.testAppHtml, paths.testAppHtmlTemplate)
		}),

		// Watcher doesn't work well if you mistype casing in a path so we use
		// a plugin that prints an error when you attempt to do this.
		// See https://github.com/facebookincubator/create-react-app/issues/240
		new CaseSensitivePathsPlugin(),
	].filter(Boolean)
};
