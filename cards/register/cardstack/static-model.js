const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();
factory.addResource('content-types', 'registers');
factory.addResource('grants', 'registers-grant')
  .withRelated('who', [{ type: 'groups', id: 'everyone' }])
  .withRelated('types', [{ type: 'content-types', id: 'registers' }])
  .withAttributes({
    'may-read-resource': true,
    'may-read-fields': true,
  });
let models = factory.getModels();
module.exports = function() { return models; };