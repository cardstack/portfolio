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

// TODO use git data source in HUB_ENVIRONMENT=production
sources.push({
  type: 'data-sources',
  id: 'default',
  attributes: {
    'source-type': '@cardstack/ephemeral'
  }
});

module.exports = sources;
