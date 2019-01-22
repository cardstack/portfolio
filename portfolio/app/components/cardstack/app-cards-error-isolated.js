import SessionAwareBase from 'portfolio-common/components/session-aware-base';
import { inject as service } from '@ember/service';
import injectOptional from 'ember-inject-optional';
import { getOwner } from '@ember/application';

export default SessionAwareBase.extend({
  fastboot: injectOptional.service(),
  router: service(),

  init() {
    this._super();
    if (this.get('fastboot.isFastBoot')) { return; }

    this.set('isTransitioning', false);

    this.router.on('routeWillChange', () => {
      if (this.isDestroyed) { return; }
      this.set('isTransitioning', true);
    });
    this.router.on('routeDidChange', () => {
      if (this.isDestroyed) { return; }
      this.set('isTransitioning', false);
    });
  },

  doAfterLogin() {
    let routeName = this.router.get('currentRouteName');
    let currentRoute = getOwner(this).lookup(`route:${routeName}`);
    currentRoute.refresh();
  }
});