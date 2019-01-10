import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from '../templates/embedded';
import { offscreenLeft, dontScale, logoTransition } from './isolated';

export default Component.extend({
  logoTransition,
  dontScale,
  offscreenLeft,
  layout,
  title: computed('content.title', function () {
    return this.get('content.title').toLowerCase();
  }),
});
