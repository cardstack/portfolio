import Component from '@ember/component';
import { inject as service } from '@ember/service';
import layout from '../templates/top-header';

export default Component.extend({
  layout,
  tagName: '',
  router: service(),

  transitionToProfile() {
    this.router.transitionTo('cardstack.content', 'profile');
  }
});
