import Service from '@ember/service';

const initialCurrency = 'USD';

export default Service.extend({
  init() {
    this._super(...arguments);
    this.set('currency', initialCurrency);
  },
  setCurrency(currency) {
    this.set('currency', currency);
  }
});