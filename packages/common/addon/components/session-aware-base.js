import Component from '@ember/component';
import { readOnly } from '@ember/object/computed';
import injectOptional from 'ember-inject-optional';

export default Component.extend({
  fastboot: injectOptional.service(),

  isAuthenticated: true,
  isFastBoot: readOnly('fastboot.isFastBoot')
});