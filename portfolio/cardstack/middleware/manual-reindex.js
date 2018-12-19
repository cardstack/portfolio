const { pbkdf2 : pbkdf2Node } = require('crypto');
const pbkdf2 = require('util').promisify(pbkdf2Node);
const { declareInjections } = require('@cardstack/di');
const log = require('@cardstack/logger')('portfolio');

module.exports = declareInjections({
  indexers: 'hub:indexers',
},

class ManualReindex {
  middleware() {
    return async (ctxt, next) => {
      if (ctxt.request.path !== '/reindex' || ctxt.request.method !== 'POST') {
        return next();
      }
      let secret = (await pbkdf2(ctxt.header['authorization'], 'cardstack', 1000, 16, 'sha256')).toString('hex');
      if (secret !== '846985b7b9c527ba185e98e18d6f9819') {
        ctxt.status = 401;
      } else {
        log.warn('Manually reindexing');
        this.indexers.update({ forceRefresh: true });
        ctxt.status = 200;
      }
    };
  }
});