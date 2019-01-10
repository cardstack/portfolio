import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from '../templates/isolated';

export default Component.extend({
  layout,
  title: computed('content.title', function () {
    return this.get('content.title').toLowerCase();
  }),
});
