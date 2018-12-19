module.exports = [{
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