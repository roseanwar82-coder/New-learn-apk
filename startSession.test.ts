import { StartDeps, startFocusSession } from '../startSession';

function deps(over: Partial<{ overlay: boolean; usage: boolean }> = {}) {
  const calls: { block?: [string, string[]]; started?: number } = {};
  const d: StartDeps = {
    hasOverlayPermission: () => over.overlay ?? true,
    hasUsageAccess: () => over.usage ?? true,
    setBlockConfig: (m, p) => {
      calls.block = [m, p];
    },
    startSession: (ms) => {
      calls.started = ms;
    },
  };
  return { d, calls };
}

const yt = { packageName: 'com.google.android.youtube', label: 'YouTube' };

describe('startFocusSession', () => {
  it('starts a session and pushes the block config', () => {
    const { d, calls } = deps();
    expect(startFocusSession(d, 25, 'hard', [yt])).toEqual({ ok: true });
    expect(calls.started).toBe(25 * 60_000);
    expect(calls.block).toEqual(['hard', [yt.packageName]]);
  });

  it('requires overlay permission first', () => {
    const { d, calls } = deps({ overlay: false });
    expect(startFocusSession(d, 25, 'off', [])).toEqual({ ok: false, reason: 'overlay_permission' });
    expect(calls.started).toBeUndefined();
  });

  it('requires usage access only when blocking will actually be enforced', () => {
    const noAccess = deps({ usage: false });
    expect(startFocusSession(noAccess.d, 25, 'soft', [yt])).toEqual({ ok: false, reason: 'usage_access' });
    expect(noAccess.calls.started).toBeUndefined();

    const off = deps({ usage: false });
    expect(startFocusSession(off.d, 25, 'off', [yt])).toEqual({ ok: true });

    const empty = deps({ usage: false });
    expect(startFocusSession(empty.d, 25, 'soft', [])).toEqual({ ok: true });
    expect(empty.calls.block).toEqual(['off', []]);
  });

  it('rejects invalid durations', () => {
    const { d } = deps();
    expect(startFocusSession(d, 1, 'off', [])).toEqual({ ok: false, reason: 'invalid_duration' });
    expect(startFocusSession(d, 999, 'off', [])).toEqual({ ok: false, reason: 'invalid_duration' });
    expect(startFocusSession(d, NaN, 'off', [])).toEqual({ ok: false, reason: 'invalid_duration' });
  });
});
