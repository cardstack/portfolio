import Mixin from '@ember/object/mixin';
import { inject as service } from '@ember/service';
import injectOptional from 'ember-inject-optional';
import { pluralize } from 'ember-inflector';

const defaultCurrency = 'USD';

export default Mixin.create({
  fastboot: injectOptional.service(),
  selectedCurrency: service(),

  didReceiveAttrs() {
    this._super(...arguments);

    let params;
    if (!this.get('fastboot.isFastBoot')) {
      params = this.get('params');
    } else {
      params = this.get(`fastboot.request.queryParams.${pluralize(this.get('content.type'))}`);
    }

    if (params) {
      let initialCurrency = params.currency
      if (initialCurrency) {
        let currencyService = this.get('selectedCurrency');
        currencyService.setCurrency(initialCurrency);
      }
    }
  },

  setCurrency(currency) {
    let currencyService = this.get('selectedCurrency');
    currencyService.setCurrency(currency);

    let setParam = this.get('setParam');
    if (typeof setParam !== 'function') { return; }

    if (!this.get('fastboot.isFastBoot')) {
      if (currency === defaultCurrency) {
        setParam('currency', null);
      } else {
        setParam('currency', currency);
      }
    }
  }
});