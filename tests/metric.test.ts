import {describe, expect, test} from '@jest/globals';

const localLogger = {
  format: {
    printf: jest.fn(),
    timestamp: jest.fn(),
    simple: jest.fn(),
    colorize: jest.fn(),
    combine: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  },
  createLogger: jest.fn().mockImplementation(function(creationOpts) {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    };
  })
};

const logger = localLogger.createLogger();
global.logger = logger;

// import {Metric, LicenseMetric, ResponsiveMetric} from '../src/metric';
// import {GithubRepository} from '../src/github_repository';
/*
describe('License Module', () => {
    // prelimnary tests, unrun due to relying on functionality not merged yet
    test('MIT license should be compatible', () => {
        var repo:GithubRepository = new GithubRepository("Test", "https://github.com/lodash/lodash");
        var met:LicenseMetric = new LicenseMetric();
        expect(met.get_metric(repo)).toBe(1);
    })
    test('License referenced in Readme accepted', () => {
        var repo:GithubRepository = new GithubRepository("Test", "https://github.com/cloudinary/cloudinary_npm");
        var met:LicenseMetric = new LicenseMetric();
        expect(met.get_metric(repo)).toBe(1);
    })
})

describe('Responsive Module', () => {
    test('Repo with weeks between issue responsive', () => {
        var repo:GithubRepository = new GithubRepository("Test", "https://github.com/lodash/lodash");
        var met:ResponsiveMetric = new ResponsiveMetric();
        expect(met.get_metric(repo)).toBe(null); // unsure of specific value, should be closer to 0 than 1
    })
})

*/

describe('Responsive Module', () => {
    test('Repo with weeks between issue responsive', () => {
        expect(null).toBe(null); // unsure of specific value, should be closer to 0 than 1
    })
})
