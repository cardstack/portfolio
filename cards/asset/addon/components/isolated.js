import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from '../templates/isolated';
import move from 'ember-animated/motions/move';
import resize from 'ember-animated/motions/resize';
import { wait } from 'ember-animated';

export function * offscreenLeft({ receivedSprites }) {
  yield null;
  // insertedSprites.forEach(sprite => {
  //   sprite.startAtPixel({ x: -1 * window.outerWidth })
  //   move(sprite);
  // });
  // removedSprites.forEach(sprite => {
  //   sprite.applyStyles({ 'z-index': 1000 });
  //   sprite.endAtPixel({ x: -1 * window.outerWidth });
  //   move(sprite);
  // });
  receivedSprites.forEach(sprite => {
    move(sprite);
    resize(sprite);
    sprite.applyStyles({ 'z-index': 1 });
  });
}

export function * logoTransition({ sentSprites }) {
  yield null;
  sentSprites.forEach(sprite => {
    move(sprite);
    resize(sprite);
  });
}

export function * dontScale({ duration, removedSprites }) {
  if (removedSprites.length > 0) {
    yield wait(duration);
  }
}

export default Component.extend({
  logoTransition,
  dontScale,
  offscreenLeft,
  layout,
  title: computed('content.title', function () {
    return this.get('content.title').toLowerCase();
  }),
});
