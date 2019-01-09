module.exports = [{
  path: '/register',
  query: {
    filter: {
      type: { exact: 'registers' },
      id: { exact: 'portfolio-users' }
    }
  },
},{
  path: '/profile',
  query: {
    filter: {
      type: { exact: ':session:type' },
      id: { exact: ':session:id' }
    }
  },
},{
  path: '/',
  query: {
    filter: {
      type: { exact: ':card:type' },
      id: { exact: ':card:id' }
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