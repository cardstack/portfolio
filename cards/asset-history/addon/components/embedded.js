import Component from '@ember/component';
import layout from '../templates/embedded';
import { computed } from '@ember/object';
import { displayDecimalPlaces } from 'portfolio-common/helpers/convert-currency';
import { symbolMapping } from 'portfolio-common/helpers/currency-symbol';
import { abbreviateNumber } from 'portfolio-common/helpers/abbreviate-number';
import { inject as service } from '@ember/service';

const { readOnly } = computed;

export default Component.extend({
  layout,
  selectedCurrency: service(),
  currency: readOnly('selectedCurrency.currency'),

  init() {
    this._super(...arguments);
    let _this = this;
    this.set('chartOptions', {
      chart: {
        styledMode: true,
        rangeSelector: {
          selected: 1
        },
      },
      yAxis: {
        offset: -5,
        min: 0, // this forces the y-axis to start at zero
        labels: {
          formatter() {
            let currency = _this.get('currency');
            return `${symbolMapping[currency] || ''}${abbreviateNumber(this.value)}${currency === 'BTC' ? ' BTC' : ''}`;
          }
        },
      },
    });
  },

  chartData: computed('currency', 'content.{timeseries,historyValues.@each.balance}', function() {
    let currency = this.get('currency');
    let timeseries = Object.assign({}, this.get('content.timeseries'));

    return [{
      name: `${currency} value`,
      step: true,
      tooltip: {
        valueDecimals: displayDecimalPlaces[currency] || 2,
        valuePrefix: symbolMapping[currency] || '',
      },
      data: timeseries[currency]
    }];
  })
});