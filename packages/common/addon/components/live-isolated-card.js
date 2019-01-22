import Component from '@ember/component';
import { inject as service } from '@ember/service';
import injectOptional from 'ember-inject-optional';
import { readOnly } from '@ember/object/computed';
import { task, timeout } from 'ember-concurrency';
import Ember from 'ember';

export default Component.extend({
  config: service(),
  cardstackData: service(),
  fastboot: injectOptional.service(),
  isFastBoot: readOnly('fastboot.isFastBoot'),

  updateContent: task(function * () {
    // We don't keep this long-running task alive by default in tests,
    // because it would cause them to block when they wait for all
    // pending work to resolve.
    if (Ember.testing) { return; }
    if (this.get('isFastBoot')) { return; }

    while (this.get('content')) {
      yield timeout(this.get('config.liveUpdateSeconds') * 1000);
      yield this.setContent();
    }
  }).drop().on('init'),

  async setContent() {
    let type = this.get('content.type');
    let id = this.get('content.id');

    try {
      await this.get('cardstackData').queryCard('isolated', {
        filter: {
          type,
          id: { exact: id }
        }
      });
    } catch (err) {
      console.error(`Error trying to load card ${type}/${id}`, err.message); // eslint-disable-line no-console
    }


  }
});
