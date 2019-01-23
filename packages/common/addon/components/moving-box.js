import Component from '@ember/component';
import move from 'ember-animated/motions/move';
import resize from 'ember-animated/motions/resize';
import opacity from 'ember-animated/motions/opacity';
import { wait } from 'ember-animated';
import layout from '../templates/moving-box';

export let duration = 500;

export default Component.extend({
  layout,
  tagName: '',
  duration,

  outer: function * ({ receivedSprites }) {
    receivedSprites.forEach(sprite => {
      sprite.applyStyles({ 'z-index': 1 });
      move(sprite);
      resize(sprite);
    });
  },

  inner: function * ({ receivedSprites, sentSprites, duration }) {
    sentSprites.forEach(sprite => {
      move(sprite);
      opacity(sprite, { to: 0, duration: duration * 0.2 });
      sprite.applyStyles({ 'z-index': 1 });
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
