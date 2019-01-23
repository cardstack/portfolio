import Component from '@ember/component';
import move from 'ember-animated/motions/move';
import resize from 'ember-animated/motions/resize';
import adjustColor from 'ember-animated/motions/adjust-color';
import { duration } from './moving-box';
import opacity from 'ember-animated/motions/opacity';
import { wait } from 'ember-animated';

export default Component.extend({
  tagName: '',
  duration,

  outer: function * ({ sentSprites }) {
    sentSprites.forEach(sprite => {
      sprite.applyStyles({ 'z-index': 1 });
      move(sprite);
      resize(sprite);
      adjustColor.property('background-color')(sprite);
    });
  },

  inner: function * ({ receivedSprites, sentSprites, duration }) {
    sentSprites.forEach(sprite => {
      move(sprite);
      opacity(sprite, { to: 0, duration: duration * 0.2 });
      sprite.applyStyles({ 'z-index': 2 });
    });

    receivedSprites.forEach(sprite => {
      let diff = sprite.difference('finalBounds', sprite, 'initialBounds');
      sprite.translate(diff.dx, diff.dy);
      sprite.applyStyles({ opacity: 0 });
    });

    if (receivedSprites.length > 0) {
      yield wait(duration * 0.75);
      receivedSprites.forEach(sprite => {
        opacity(sprite, { from: 0, to: 1, duration: duration * 0.2 });
      });
    }
  },
});
