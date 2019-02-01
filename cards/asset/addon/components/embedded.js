import Component from '@ember/component';
import AssetBaseMixin from '../mixins/asset-base';
import layout from '../templates/embedded';
import { computed } from '@ember/object';

export default Component.extend(AssetBaseMixin, {
  layout,

  assetLink: computed(function() {
    return `/assets/${this.get('content.formattedAddress')}`;
  }),
});
