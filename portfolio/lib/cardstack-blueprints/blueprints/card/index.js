/* eslint-env node */
module.exports = {
  description: 'A simple blueprint to create a new card type',

  fileMapTokens() {
    return {
      __dirname__() {
        // HACK - allowing you to generate a card in the enclosing mono repo
        return `../`;
      },
      __isolatedModuleName__(options) {
        return options.dasherizedModuleName + "-isolated";
      },
      __embeddedModuleName__(options) {
        return options.dasherizedModuleName + "-embedded";
      },
    };
  },
};
