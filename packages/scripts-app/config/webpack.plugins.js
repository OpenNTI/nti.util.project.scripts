'use strict';
//Webpack plugins:
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin'); // let webpack manage this dep
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

Object.assign(exports, {
	CaseSensitivePathsPlugin,
	CircularDependencyPlugin,
	CompressionPlugin,
	ESLintPlugin,
	HtmlWebpackPlugin,
	HtmlWebpackHarddiskPlugin,
	IgnoreEmitPlugin,
	MiniCssExtractPlugin,
	ProgressBarPlugin,
	TerserPlugin,
	SentryWebpackPlugin,
});
