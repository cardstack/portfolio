import Component from '@ember/component';
import move from 'ember-animated/motions/move';
import scale from 'ember-animated/motions/scale';
import adjustCSS from 'ember-animated/motions/adjust-css';
import { duration } from './moving-box';
import layout from '../templates/moving-item';

export default Component.extend({
  layout,
  tagName: '',
  duration,

  transition: function * ({ sentSprites }) {
    sentSprites.forEach(sprite => {
      sprite.applyStyles({ 'z-index': 1 });
      move(sprite);
      if (sprite.element.tagName === 'svg') {
        scale(sprite);
      } else {
        adjustCSS.property('font-size')(sprite);
        adjustCSS.property('letter-spacing')(sprite);
        adjustCSS.property('line-height')(sprite);
      }
    });
  },
});
