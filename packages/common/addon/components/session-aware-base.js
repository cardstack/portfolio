import Component from '@ember/component';
import { alias } from '@ember/object/computed';
import injectOptional from 'ember-inject-optional';

export default Component.extend({
  cardstackSession: injectOptional.service(),
  fastboot: injectOptional.service(),

  isAuthenticated: alias('cardstackSession.isAuthenticated'),
  isFastBoot: alias('fastboot.isFastBoot')
});