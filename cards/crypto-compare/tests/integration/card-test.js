import { module, test } from 'qunit';
import hbs from 'htmlbars-inline-precompile';
import { render } from '@ember/test-helpers';
import Fixtures from '@cardstack/test-support/fixtures';
import { setupURLs, setupCardTest } from '@cardstack/test-support/test-helpers';

const scenario = new Fixtures({
  create(factory) {
    factory.addResource('crypto-compares', 'ETH-USD-1514764800')
      .withAttributes({
        'from-crypto-currency': 'ETH',
        'to-fiat-currency': 'USD',
        'gmt-date': '2018-01-01',
        'cents': 74823
      });
    factory.addResource('grants', 'crypto-compare-grant')
      .withRelated('who', [{ type: 'groups', id: 'everyone' }])
      .withRelated('types', [{ type: 'content-types', id: 'crypto-compares' }])
      .withAttributes({
        'may-read-resource': true,
        'may-read-fields': true,
      });
  }
});

module('Card | crypto-compare', function(hooks) {
  setupCardTest(hooks);
  setupURLs(hooks);
  scenario.setupTest(hooks);

  test('embedded format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test 'crypto-compare' 'ETH-USD-1514764800' format="embedded"}}`);
    assert.dom('[data-test-crypto-compare-embedded-from-currency]').hasTextContaining('ETH');
    assert.dom('[data-test-crypto-compare-embedded-to-currency]').hasTextContaining('USD');
    assert.dom('[data-test-crypto-compare-embedded-date').hasTextContaining('2018-01-01');
    assert.dom('[data-test-crypto-compare-embedded-cents').hasTextContaining('74823');
  });

  test('isolated format renders', async function(assert) {
    await render(hbs`{{cardstack-card-test 'crypto-compare' 'ETH-USD-1514764800' format="isolated"}}`);
    assert.dom('[data-test-crypto-compare-isolated-from-currency]').hasTextContaining('ETH');
    assert.dom('[data-test-crypto-compare-isolated-to-currency]').hasTextContaining('USD');
    assert.dom('[data-test-crypto-compare-isolated-date').hasTextContaining('2018-01-01');
    assert.dom('[data-test-crypto-compare-isolated-cents').hasTextContaining('74823');
  });
});
