import Component from '@ember/component';
import injectOptional from 'ember-inject-optional';
import { inject as service } from '@ember/service';
import layout from '../templates/logout-button';
import { getOwner } from '@ember/application';

export default Component.extend({
  layout,
  session: injectOptional.service(),
  router: service(),

  async doLogout() {
    let session = this.get('session');
    if (!session) { return; }

    await session.invalidate();
    this.router.transitionTo('cardstack.index');

    let routeName = this.router.get('currentRouteName');
    let currentRoute = getOwner(this).lookup(`route:${routeName}`);
    currentRoute.refresh();
  }
});
