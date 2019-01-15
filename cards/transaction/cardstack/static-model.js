const JSONAPIFactory = require('@cardstack/test-support/jsonapi-factory');

let factory = new JSONAPIFactory();

let models = factory.getModels();
module.exports = function() { return models; };
