(function (global) {
  'use strict';

  var MIN_FRAMES = 1;
  var MAX_FRAMES = 12;
  var DEFAULT_CHARACTER_FRAMES = 8;
  var DEFAULT_VFX_FRAMES = 8;
  var FEATURE_FRAMES = 12;
  var ACTION_DEFAULTS = {
    idle: { frameCount: DEFAULT_CHARACTER_FRAMES, fps: 8, loop: true, hitFrame: null },
    move: { frameCount: DEFAULT_CHARACTER_FRAMES, fps: 12, loop: true, hitFrame: null },
    attack: { frameCount: DEFAULT_CHARACTER_FRAMES, fps: 14, loop: false, hitFrame: 6 },
    cast: { frameCount: DEFAULT_CHARACTER_FRAMES, fps: 12, loop: false, hitFrame: 6 },
    hit: { frameCount: DEFAULT_CHARACTER_FRAMES, fps: 16, loop: false, hitFrame: 2 },
    victory: { frameCount: DEFAULT_CHARACTER_FRAMES, fps: 8, loop: true, hitFrame: null },
    death: { frameCount: DEFAULT_CHARACTER_FRAMES, fps: 10, loop: false, hitFrame: null },
    vfx: { frameCount: DEFAULT_VFX_FRAMES, fps: 14, loop: false, hitFrame: 6 },
    ultimate: { frameCount: FEATURE_FRAMES, fps: 16, loop: false, hitFrame: 9 },
    boss: { frameCount: FEATURE_FRAMES, fps: 14, loop: false, hitFrame: 9 }
  };

  function integer(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function normalizeAnimationAction(action, fallback) {
    action = action || {};
    fallback = fallback || ACTION_DEFAULTS.idle;
    var listedFrames = Array.isArray(action.frames) ? action.frames.filter(Boolean) : [];
    var requestedCount = action.frameCount ?? action.count ?? (listedFrames.length || undefined);
    var frameCount = clamp(integer(requestedCount, integer(fallback.frameCount, DEFAULT_CHARACTER_FRAMES)), MIN_FRAMES, MAX_FRAMES);
    var fps = clamp(integer(action.fps, integer(fallback.fps, 8)), 1, 60);
    var rawHitFrame = action.hitFrame === null ? null : action.hitFrame ?? fallback.hitFrame;
    var hitFrame = rawHitFrame === null || rawHitFrame === undefined ? null : clamp(integer(rawHitFrame, 1), 1, frameCount);
    return {
      frames: listedFrames.slice(0, frameCount),
      frameCount: frameCount,
      fps: fps,
      loop: action.loop === undefined ? Boolean(fallback.loop) : Boolean(action.loop),
      hitFrame: hitFrame,
      durationMs: Math.round(frameCount / fps * 1000)
    };
  }

  function action(name, override) {
    return normalizeAnimationAction(override, ACTION_DEFAULTS[name] || ACTION_DEFAULTS.idle);
  }

  function vfx(skill, override) {
    skill = skill || {};
    var featured = skill.kind === 'ultimate' || skill.boss === true;
    var fallback = featured ? ACTION_DEFAULTS.ultimate : ACTION_DEFAULTS.vfx;
    var source = Object.assign({}, override || skill.animation || skill.vfxAnimation || {});
    if (source.frameCount === undefined && source.frames === undefined) source.frameCount = featured ? FEATURE_FRAMES : DEFAULT_VFX_FRAMES;
    return normalizeAnimationAction(source, fallback);
  }

  global.TACTICAL_ANIMATION_CONFIG = Object.freeze({
    MIN_FRAMES: MIN_FRAMES,
    MAX_FRAMES: MAX_FRAMES,
    DEFAULT_CHARACTER_FRAMES: DEFAULT_CHARACTER_FRAMES,
    DEFAULT_VFX_FRAMES: DEFAULT_VFX_FRAMES,
    FEATURE_FRAMES: FEATURE_FRAMES,
    ACTION_DEFAULTS: ACTION_DEFAULTS,
    normalizeAnimationAction: normalizeAnimationAction,
    action: action,
    vfx: vfx
  });
})(typeof window !== 'undefined' ? window : globalThis);
