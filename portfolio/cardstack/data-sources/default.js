let sources = [
  {
    type: 'plugin-configs',
    id: '@cardstack/hub',
    attributes: {
      'plugin-config': {
        'application-card': { type: 'app-cards', id: 'portfolio' }
      }
    },
    relationships: {
      'default-data-source': {
        data: { type: 'data-sources', id: 'default' }
      }
    }
  }
];

if (process.env.HUB_ENVIRONMENT === 'production') {
  sources.push({
    type: 'data-sources',
    id: 'default',
    attributes: {
      'source-type': '@cardstack/git',
      params: {
        branchPrefix: process.env.GIT_BRANCH_PREFIX,
        remote: {
          url: process.env.GIT_REPO,
          privateKey: process.env.GIT_PRIVATE_KEY,
        }
      }
    }
  });
} else {
  sources.push({
    type: 'data-sources',
    id: 'default',
    attributes: {
      'source-type': '@cardstack/ephemeral'
    }
  });
}

module.exports = sources;
