module.exports = [{
  path: '/register',
  query: {
    filter: {
      type: { exact: 'registers' },
      id: { exact: 'portfolio-users' }
    }
  },
}, {
  path: '/assets/:friendly_id',
  query: {
    filter: {
      type: { exact: 'assets' },
      'case-insensitive-id': { exact: ':friendly_id' }
    }
  }
}, {
  path: '/profile',
  query: {
    filter: {
      type: { exact: ':session:type' },
      id: { exact: ':session:id' }
    }
  },
},{
  path: '/wallets/:id',
  query: {
    filter: {
      type: { exact: 'wallets' },
      id: { exact: ':id' },
      'user.type': { exact: ':session:type' },
      'user.id': { exact: ':session:id' }
    }
  },
},{
  path: '/',
  query: {
    filter: {
      type: { exact: 'portfolios' },
      id: { exact: 'test-portfolio' }
    }
  },
},{
  path: '/:type/:id',
  query: {
    filter: {
      type: { exact: ':type' },
      id: { exact: ':id'
     }
    }
  },
}];
