import { resolveFx } from './weatherFx';

describe('resolveFx', () => {
  it('resolves a plain day condition', () => {
    expect(resolveFx('sunny', false).bg).toContain('rgb(0 127 255)');
  });

  it('strips a -night suffix already present on the condition', () => {
    const fromSuffix = resolveFx('partlycloudy-night', false);
    const fromHint = resolveFx('partlycloudy', true);
    expect(fromSuffix.bg).toBe(fromHint.bg);
  });

  it('maps clear/sunny at night to the clear-night entry with stars', () => {
    expect(resolveFx('clear', true).precip?.[0]).toEqual({ kind: 'stars', intensity: 'normal' });
    expect(resolveFx('sunny', true).precip?.[0]).toEqual({ kind: 'stars', intensity: 'normal' });
  });

  it('falls back to default/default-night for an unknown condition', () => {
    expect(resolveFx('made-up-condition', false)).toBe(resolveFx('', false));
    expect(resolveFx('made-up-condition', true).precip).toBeUndefined();
    expect(resolveFx('made-up-condition', true).bg).toBe(resolveFx('anything-else', true).bg);
  });

  it('carries clouds spec for cloudy conditions', () => {
    expect(resolveFx('cloudy', false).clouds).toEqual({ intensity: 'heavy', isNight: false });
    expect(resolveFx('cloudy', true).clouds).toEqual({ intensity: 'heavy', isNight: true });
  });

  it('carries flash for lightning conditions', () => {
    expect(resolveFx('lightning', false).flash).toBe(true);
    expect(resolveFx('lightning-rainy', false).flash).toBe(true);
    expect(resolveFx('rainy', false).flash).toBeUndefined();
  });

  it('carries a two-part precip spec for snowy-rainy, with a style override on the rain layer', () => {
    const fx = resolveFx('snowy-rainy', false);
    expect(fx.precip).toHaveLength(2);
    expect(fx.precip?.[0].kind).toBe('snow');
    expect(fx.precip?.[1].kind).toBe('rain');
    expect(fx.precip?.[1].style).toContain('--rain-r:20');
  });

  it('is case-insensitive', () => {
    expect(resolveFx('SUNNY', false)).toBe(resolveFx('sunny', false));
  });
});
