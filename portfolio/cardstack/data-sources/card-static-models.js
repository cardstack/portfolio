/*
  This is saying that the portfolio app itself is also a data source.
  Specifically, it implements cardstack/static-model.js to emit the schemas for
  all the cards in the portfolio.
*/
module.exports = [
  {
    type: 'data-sources',
    id: 'card-static-models',
    attributes: {
      'source-type': 'portfolio'
    }
  }
];
