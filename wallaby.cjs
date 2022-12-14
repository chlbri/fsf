// eslint-disable-next-line @typescript-eslint/no-unused-vars
module.exports = function (_wallaby) {
  return {
    slowTestThreshold: 500, // 200 ms
    runMode: 'onsave',
    lowCoverageThreshold: 70,
    resolveGetters: true,
    workers: {
      initial: 6,
      regular: 3,
      restart: false,
    },
    hints: {
      // or /istanbul ignore next/, or any RegExp
      ignoreCoverage: /ignore coverage/,
    },
  };
};
