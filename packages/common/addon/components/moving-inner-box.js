import Component from '@ember/component';
import move from 'ember-animated/motions/move';
import resize from 'ember-animated/motions/resize';
import adjustColor from 'ember-animated/motions/adjust-color';
import { duration } from './moving-box';
import layout from '../templates/moving-inner-box';

export default Component.extend({
  layout,
  tagName: '',
  duration,

  transition: function * ({ sentSprites }) {
    sentSprites.forEach(sprite => {

      // Caution! This is a hack. It just happens to be safe in this situation
      // because we're messing with only the children of sentSprites, which will
      // all get destroyed at the end of animation regardless.
      [...sprite.element.children].forEach(element => {
        element.classList.add('ember-animated-hidden');
      });

      sprite.applyStyles({ 'z-index': 1 });
      move(sprite);
      resize(sprite);
      adjustColor.property('background-color')(sprite);
    });
  }
});
