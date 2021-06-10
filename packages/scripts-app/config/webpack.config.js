/*eslint camelcase:0*/
'use strict';
const DEBUG =
	process.argv.includes('--debug') || process.argv.includes('--profile');
const NO_MINIFY = global.NTI_DevServer || process.argv.includes('--dev-build');

const path = require('path');
const webpack = require('webpack');
const { isCI } = require('ci-info');
const tmp = require('tmp');

const { branchSync, commitSync } = require('@nti/git-state');
//Webpack plugins:
const {
	CaseSensitivePathsPlugin,
	CircularDependencyPlugin,
	CompressionPlugin,
	HtmlWebpackPlugin,
	HtmlWebpackHarddiskPlugin,
	TerserPlugin,
	SentryWebpackPlugin,
} = require('./webpack.plugins');

const gitRevision = p =>
	JSON.stringify(`branch: ${branchSync(p)} [${commitSync(p)}]`);

const InlineChunkHtmlPlugin = require('./InlineChunkHtmlPlugin');
// const cacheDir = require('./cache-dir');
const { loaders: cssLoaders, plugins: cssPlugins } = require('./css-loaders');
const { loaders: jsLoaders, plugins: jsPlugins } = require('./js-loaders');
const thread = require('./thread');
const { PROD, ENV } = require('./env');
const paths = require('./paths');
const pkg = paths.package;
const projectName = pkg.name.replace(/^@nti\//, '');
const projectRelease = `${projectName}@${pkg.version.replace(
	/-alpha.*$/,
	'-alpha'
)}`;
const getWorkspace = require('./workspace');

const Configs = (exports = module.exports = []);
const ContentGlobalDefinitions = new webpack.DefinePlugin({
	BUILD_SOURCE: gitRevision(paths.path),
	BUILD_PACKAGE_NAME: JSON.stringify(pkg.name),
	BUILD_PACKAGE_VERSION: JSON.stringify(pkg.version),
	SENTRY_PROJECT: JSON.stringify(projectName),
	SENTRY_RELEASE: JSON.stringify(projectRelease),
});

const USE_DEV_STYLE_LOADER = global.NTI_DevServer;
const USE_DEV_BUILD_CACHE = global.NTI_DevServer;

function isNTIPackage(x) {
	const prefix = `${paths.nodeModules}/@nti/`;
	const descendent = /node_modules/;

	let str = x ? x.toString() : '';
	if (str.startsWith(prefix)) {
		str = str.substr(prefix.length);
		return !descendent.test(str);
	}
}

function tempPage() {
	return tempPage.file || (tempPage.file = tmp.fileSync().name);
}

function getLoaderRules(server) {
	return [
		{
			oneOf: [
				{
					test: /.*/,
					resourceQuery: /for-download/,
					loader: 'file-loader',
					options: {
						name: 'resources/files/[contenthash]/[name].[ext]',
					},
				},

				...jsLoaders(USE_DEV_BUILD_CACHE),

				{
					test: /\.(ico|gif|png|jpg|svg)(\?.*)?$/,
					loader: require.resolve('url-loader'),
					options: {
						limit: 50,
						name: 'resources/images/[contenthash].[ext]',
						mimeType: 'image/[ext]',
					},
				},

				{
					test: /\.(woff|ttf|eot|otf)(\?.*)?$/,
					loader: require.resolve('file-loader'),
					options: {
						name: 'resources/fonts/[contenthash].[ext]',
					},
				},

				...cssLoaders(paths, {
					server,
					inline: USE_DEV_STYLE_LOADER,
					sass: {
						sassOptions: {
							includePaths: [
								paths.resolveApp('src/main/resources/scss'),
							],
						},
					},
				}),
			]
				.filter(Boolean)
				.map(rule =>
					rule.loader
						? rule
						: {
								...rule,
								use: [thread(), ...rule.use].filter(Boolean),
						  }
				),
		},
	].filter(Boolean);
}

const ClientConfig = {
	mode: ENV,
	entry: {
		index: [require.resolve('./polyfills'), paths.appIndexJs],
	},
	//Hide this key from webpack, but allow our devmode module to access this value...
	[Symbol.for('template temp file')]: global.NTI_DevServer
		? tempPage()
		: void 0,
	output: {
		path: paths.DIST_CLIENT,
		filename: 'js/[name]-[contenthash:8].js',
		chunkFilename: 'js/[name]-[contenthash:8].js',
		publicPath: paths.servedPath || '/',
		devtoolModuleFilenameTemplate: PROD
			? void 0
			: info =>
					path.relative(
						path.resolve(paths.path),
						path.resolve(info.absoluteResourcePath)
					),
	},

	devtool: PROD ? 'source-map' : 'cheap-module-source-map',

	stats: 'errors-only',
	target: 'web',
	cache: USE_DEV_BUILD_CACHE
		? {
				type: 'filesystem',
				name: pkg.name.replace(/[@/.]/g, '-').replace(/^-/, ''),
				cacheDirectory: path.resolve(
					getWorkspace().root || paths.path,
					path.join('node_modules', '.cache')
				),
				buildDependencies: {
					config: [__filename],
				},
		  }
		: undefined,

	resolve: {
		fallback: {
			buffer: require.resolve('buffer'),
			os: require.resolve('os-browserify/browser'),
			path: require.resolve('path-browserify'),
			stream: require.resolve('stream-browserify'),
			util: require.resolve('util'),
		},
		modules: [
			// This needs to point to the `./node_modules` dir... not the resolved one... once everyone is on the npm7 workspace structure we can delete this.
			paths.resolveApp('node_modules'),
			'node_modules', //needed for conflicted versions of modules that get nested, but attempt last.
		],
		extensions: ['.js', '.jsx', '.mjs', '.mjsx'],
		alias: {
			...getWorkspace().aliases,
			// Resolve Babel runtime relative to app-scripts.
			// It usually still works on npm 3 without this but it would be
			// unfortunate to rely on, as app-scripts could be symlinked,
			// and thus babel-runtime might not be resolvable from the source.
			'@babel/runtime': path.dirname(
				require.resolve('@babel/runtime/package.json')
			),

			'core-js': path.dirname(require.resolve('core-js/package.json')),

			// Support React Native Web
			// https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
			'react-native': 'react-native-web',

			// just in case these modules aren't used in the host project, don't blow up if they aren't present.
			...['react', 'react-dom'].reduce((o, mod) => {
				try {
					o[mod] = path.dirname(
						require.resolve(path.join(mod, 'package.json'))
					);
				} catch {
					/*not found*/
				}
				return o;
			}, {}),

			// since we 'util' directories at src/ root and we allow "appModules" (we should remove them),
			// we need to enforce bare 'util' gets this package:
			util: path.dirname(require.resolve('util/package.json')),
		},
	},

	externals: [
		{
			'@nti/extjs': 'Ext',
		},
	],

	module: {
		strictExportPresence: true,
		rules: getLoaderRules(),
	},

	optimization: {
		minimize: !NO_MINIFY && PROD && !DEBUG,
		minimizer:
			DEBUG || NO_MINIFY
				? []
				: [
						// This is only used in production mode
						new TerserPlugin({
							terserOptions: {
								parse: {
									// We want terser to parse ecma 8 code. However, we don't want it
									// to apply any minification steps that turns valid ecma 5 code
									// into invalid ecma 5 code. This is why the 'compress' and 'output'
									// sections only apply transformations that are ecma 5 safe
									// https://github.com/facebook/create-react-app/pull/4234
									ecma: 8,
								},
								compress: {
									ecma: 5,
									warnings: false,
									// Disabled because of an issue with Uglify breaking seemingly valid code:
									// https://github.com/facebook/create-react-app/issues/2376
									// Pending further investigation:
									// https://github.com/mishoo/UglifyJS2/issues/2011
									comparisons: false,
									// Disabled because of an issue with Terser breaking valid code:
									// https://github.com/facebook/create-react-app/issues/5250
									// Pending further investigation:
									// https://github.com/terser-js/terser/issues/120
									inline: 2,
								},
								mangle: {
									safari10: true,
								},
								// Added for profiling in devtools
								keep_classnames: true,
								keep_fnames: true,
								output: {
									ecma: 5,
									comments: false,
									// Turned on because emoji and regex is not minified properly using default
									// https://github.com/facebook/create-react-app/issues/2488
									ascii_only: true,
								},
							},
							parallel: true,
						}),
				  ].filter(Boolean),
		sideEffects: true,
		splitChunks: {
			chunks: 'all',
			defaultSizeTypes: ['javascript', 'unknown'],
			minSize: 20000,
			maxSize: 1000000,
			cacheGroups: {
				shared: {
					test: module =>
						/node_modules/.test(module.context) &&
						isNTIPackage(module.context),
				},
				vendor: {
					test: module =>
						/node_modules/.test(module.context) &&
						!isNTIPackage(module.context),
				},
			},
		},
		// Keep the runtime chunk separated to enable long term caching
		// https://twitter.com/wSokra/status/969679223278505985
		// https://github.com/facebook/create-react-app/issues/5358
		runtimeChunk: {
			name: entrypoint => `runtime-${entrypoint.name}`,
		},
	},

	performance: false,

	plugins: [
		...jsPlugins(),
		...cssPlugins({}, USE_DEV_STYLE_LOADER),
		DEBUG &&
			new CircularDependencyPlugin({
				// exclude detection of files based on a RegExp
				exclude: /node_modules/,

				// add errors to webpack instead of warnings
				// failOnError: true,

				onDetected({ /*module,*/ paths: cycle, compilation }) {
					// `paths` will be an Array of the relative module paths that make up the cycle
					// `module` will be the module record generated by webpack that caused the cycle
					compilation.warnings.push(new Error(cycle.join('\n\t-> ')));
				},
			}),

		!isCI && progressBar(),

		new HtmlWebpackPlugin({
			inject: 'body',
			alwaysWriteToDisk: true,
			filename: global.NTI_DevServer ? tempPage() : 'page.html',
			template: paths.appHtml,
			minify:
				PROD && !NO_MINIFY
					? {
							removeComments: false,
							collapseWhitespace: true,
							removeRedundantAttributes: true,
							useShortDoctype: true,
							removeEmptyAttributes: true,
							removeStyleLinkTypeAttributes: true,
							keepClosingSlash: true,
							minifyJS: true,
							minifyCSS: true,
							minifyURLs: true,
					  }
					: false,
		}),
		new HtmlWebpackHarddiskPlugin(),

		// In-lines the webpack runtime script. This script is too small to warrant a network request.
		// https://github.com/facebook/create-react-app/issues/5358
		new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),

		ContentGlobalDefinitions,

		// Watcher doesn't work well if you mistype casing in a path so we use
		// a plugin that prints an error when you attempt to do this.
		// See https://github.com/facebookincubator/create-react-app/issues/240
		new CaseSensitivePathsPlugin(),

		PROD && !NO_MINIFY && new CompressionPlugin(),

		process.env.SENTRY_AUTH_TOKEN &&
			new SentryWebpackPlugin({
				// sentry-cli configuration
				authToken: process.env.SENTRY_AUTH_TOKEN,
				org: 'nextthought',
				project: projectName,
				release: projectRelease,

				// webpack specific configuration
				include: './dist/client',
				ignore: ['node_modules', './dist/client/resources'],
			}),
	].filter(Boolean),
};

Configs.push(ClientConfig);

function progressBar() {
	try {
		return new (require('webpackbar'))();
	} catch {
		return new webpack.ProgressPlugin({});
	}
}
