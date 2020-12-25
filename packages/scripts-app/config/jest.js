'use strict';
process.env.JEST_ENV = 'jsdom';
exports.setupFilesAfterEnv = ['@testing-library/jest-dom'];
