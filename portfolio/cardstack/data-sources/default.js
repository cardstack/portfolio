const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');
let factory = new JSONAPIFactory();

factory.addResource('plugin-configs', '@cardstack/hub')
  .withAttributes({
    'plugin-config': {
      'application-card': { type: 'app-cards', id: 'portfolio' }
    }
  })
  .withRelated('default-data-source', { type: 'data-sources', id: 'default' });

if (process.env.HUB_ENVIRONMENT === 'production') {
  factory.addResource('data-sources', 'default')
    .withAttributes({
      'source-type': '@cardstack/git',
      params: {
        branchPrefix: process.env.GIT_BRANCH_PREFIX,
        remote: {
          url: process.env.GIT_REPO,
          privateKey: process.env.GIT_PRIVATE_KEY,
        }
      }
    });
} else {
  factory.addResource('data-sources', 'default')
    .withAttributes({
      'source-type': '@cardstack/ephemeral'
    });
}

module.exports = factory.getModels();
