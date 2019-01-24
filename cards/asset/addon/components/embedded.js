import Component from '@ember/component';
import AssetBaseMixin from '../mixins/asset-base';
import { computed  } from '@ember/object';
import layout from '../templates/embedded';

export default Component.extend(AssetBaseMixin, {
  layout,

  assetLink: computed(function() {
    return `/assets/${this.get('content.id')}`;
  })
});
