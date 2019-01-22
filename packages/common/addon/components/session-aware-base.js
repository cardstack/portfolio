import Component from '@ember/component';
import { readOnly } from '@ember/object/computed';
import injectOptional from 'ember-inject-optional';

export default Component.extend({
  cardstackSession: injectOptional.service(),
  fastboot: injectOptional.service(),

  isAuthenticated: readOnly('cardstackSession.isAuthenticated'),
  isFastBoot: readOnly('fastboot.isFastBoot')
});