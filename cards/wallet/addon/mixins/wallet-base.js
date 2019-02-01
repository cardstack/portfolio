import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { roundWithPrecision } from 'portfolio-common/helpers/round-with-precision';

let precision = {
  USD: 2,
  EUR: 2,
  BTC: 4
};

export default Mixin.create({
  selectedCurrency: service(),
  currency: readOnly('selectedCurrency.currency'),
  totalBalance: computed('content.totalAssetsBalance', 'currency', function() {
    let currency = this.get('currency');
    let balance = this.get('content.totalAssetsBalance');
    if (!balance) { return; }

    return roundWithPrecision(balance[currency], precision[currency]);
  })
});