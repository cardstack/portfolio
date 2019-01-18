import Component from '@ember/component';
import { equal, match } from '@ember/object/computed';
import layout from '../templates/breadcrumbs';

export default Component.extend({
  layout,
  tagName: '',
  isAsset: equal('content.type', 'asset'),
  isTransaction: match('content.type', /.*?-transaction/)
});
