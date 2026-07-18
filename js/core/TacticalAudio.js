/* 無外部音檔的輕量戰鬥音效，使用 Web Audio 即時合成。 */
(function (global) {
  'use strict';

  function TacticalAudio(enabled) {
    this.enabled = enabled !== false;
    this.context = null;
    this.master = null;
  }

  TacticalAudio.prototype.unlock = function () {
    if (!this.enabled) return;
    var AudioContext = global.AudioContext || global.webkitAudioContext;
    if (!AudioContext) return;
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.12;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume().catch(function () {});
  };

  TacticalAudio.prototype.setEnabled = function (enabled) {
    this.enabled = Boolean(enabled);
    if (this.enabled) this.unlock();
  };

  TacticalAudio.prototype.tone = function (frequency, duration, type, offset, volume) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.context || !this.master) return;
    var now = this.context.currentTime + (offset || 0), oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * 0.72), now + duration);
    gain.gain.setValueAtTime(volume || 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain); gain.connect(this.master);
    oscillator.start(now); oscillator.stop(now + duration + 0.02);
  };

  TacticalAudio.prototype.play = function (name) {
    if (!this.enabled) return;
    var self = this;
    var patterns = {
      ui: [[520, 0.06, 'sine', 0, 0.25]],
      move: [[180, 0.05, 'triangle', 0, 0.18], [220, 0.05, 'triangle', 0.07, 0.14]],
      attack: [[150, 0.14, 'sawtooth', 0, 0.32], [90, 0.18, 'square', 0.04, 0.18]],
      ranged: [[620, 0.12, 'triangle', 0, 0.25], [310, 0.16, 'sine', 0.08, 0.2]],
      hit: [[82, 0.17, 'square', 0, 0.34]],
      heal: [[420, 0.18, 'sine', 0, 0.22], [630, 0.24, 'sine', 0.08, 0.2]],
      unlock: [[440, 0.12, 'sine', 0, 0.25], [660, 0.16, 'sine', 0.1, 0.25], [880, 0.2, 'sine', 0.2, 0.22]],
      victory: [[392, 0.18, 'triangle', 0, 0.3], [523, 0.2, 'triangle', 0.16, 0.3], [659, 0.32, 'triangle', 0.32, 0.28]],
      defeat: [[220, 0.2, 'sine', 0, 0.26], [165, 0.32, 'sine', 0.18, 0.24]],
      crit: [[130, 0.16, 'sawtooth', 0, 0.36], [78, 0.22, 'square', 0.03, 0.24], [520, 0.1, 'triangle', 0.05, 0.2]],
      freeze: [[980, 0.1, 'sine', 0, 0.2], [1240, 0.14, 'sine', 0.06, 0.16], [660, 0.18, 'triangle', 0.12, 0.12]],
      poison: [[300, 0.16, 'sine', 0, 0.18], [240, 0.2, 'sine', 0.1, 0.16], [180, 0.24, 'triangle', 0.2, 0.12]],
      push: [[240, 0.1, 'square', 0, 0.24], [120, 0.18, 'sawtooth', 0.05, 0.2]],
      boss: [[98, 0.5, 'sawtooth', 0, 0.3], [130, 0.5, 'sawtooth', 0.1, 0.24], [65, 0.7, 'square', 0.25, 0.26]]
    };
    (patterns[name] || patterns.ui).forEach(function (tone) { self.tone.apply(self, tone); });
    var activation = global.navigator && global.navigator.userActivation;
    if ((name === 'hit' || name === 'attack') && global.navigator && typeof global.navigator.vibrate === 'function' && (!activation || activation.hasBeenActive)) {
      global.navigator.vibrate(name === 'hit' ? 25 : 12);
    }
  };

  TacticalAudio.prototype.destroy = function () {
    if (this.context) this.context.close().catch(function () {});
    this.context = null; this.master = null;
  };

  global.TacticalAudio = TacticalAudio;
}(window));
