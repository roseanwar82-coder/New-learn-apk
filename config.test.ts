import { blockedPackages, describeMode, isBlockable, isBlocked, toggleApp } from '../config';

const yt = { packageName: 'com.google.android.youtube', label: 'YouTube' };
const ig = { packageName: 'com.instagram.android', label: 'Instagram' };

describe('block config', () => {
  it('refuses system-critical and own packages', () => {
    expect(isBlockable('com.android.settings')).toBe(false);
    expect(isBlockable('com.google.android.dialer')).toBe(false);
    expect(isBlockable('com.studystreak.app', 'com.studystreak.app')).toBe(false);
    expect(isBlockable('')).toBe(false);
    expect(isBlockable(yt.packageName)).toBe(true);
  });

  it('toggles apps without mutating the input', () => {
    const base = [yt];
    const added = toggleApp(base, ig);
    expect(added.map((a) => a.label)).toEqual(['YouTube', 'Instagram']);
    expect(base).toHaveLength(1);
    const removed = toggleApp(added, yt);
    expect(removed).toEqual([ig]);
  });

  it('ignores toggling a non-blockable app', () => {
    const list = toggleApp([yt], { packageName: 'com.android.settings', label: 'Settings' });
    expect(list).toEqual([yt]);
  });

  it('reports membership and package list', () => {
    expect(isBlocked([yt], yt.packageName)).toBe(true);
    expect(isBlocked([yt], ig.packageName)).toBe(false);
    expect(blockedPackages([yt, ig, { packageName: 'com.android.settings', label: 'S' }])).toEqual([
      yt.packageName,
      ig.packageName,
    ]);
  });

  it('describes each mode', () => {
    expect(describeMode('off')).toMatch(/No blocking/);
    expect(describeMode('soft')).toMatch(/Warning/);
    expect(describeMode('hard')).toMatch(/Emergency/);
  });
});
