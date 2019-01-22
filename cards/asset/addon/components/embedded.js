import Component from '@ember/component';
import AssetBaseMixin from '../mixins/asset-base';
import layout from '../templates/embedded';

export default Component.extend(AssetBaseMixin, {
  layout,
});
