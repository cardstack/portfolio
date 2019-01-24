import Component from '@ember/component';
import layout from '../templates/embedded';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { roundWithPrecision } from 'portfolio-common/helpers/round-with-precision';

export default Component.extend({
  layout,

  dummyAccount: service(),
  selectedCurrency: service(),

  currency: readOnly('selectedCurrency.currency'),

  accountTotal: computed('content', 'currency', function() {
    let total = this.dummyAccount.balanceFor(this.content, {
      inCurrency: this.currency
    });
    return roundWithPrecision([ total, 2 ]);
  })
});
