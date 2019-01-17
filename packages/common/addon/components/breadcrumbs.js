import Component from '@ember/component';
import { equal, match } from '@ember/object/computed';
import layout from '../templates/breadcrumbs';

export default Component.extend({
  layout,
  tagName: '',
  asset: equal('content.type', 'asset'),
  transaction: match('content.type', /.*?-transaction/)
});
