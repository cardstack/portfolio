import Component from '@ember/component';
import layout from '../templates/embedded';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { roundWithPrecision } from 'portfolio-common/helpers/round-with-precision';

export default Component.extend({
  layout,

  dummyAccount: service(),

  accountUSDTotal: computed('content', function() {
    let total = this.dummyAccount.balanceFor(this.content, {
      inCurrency: 'USD'
    });
    return roundWithPrecision([ total, 2 ]);
  })
});
