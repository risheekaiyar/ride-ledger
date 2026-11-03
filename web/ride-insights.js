(function (root) {
  'use strict';
  const gravity = 9.80665;
  const radians = Math.PI / 180;
  const round = (value, places = 0) => Number.isFinite(value) ? Number(value.toFixed(places)) : null;
  const courseDelta = (from, to) => ((to - from + 540) % 360) - 180;

  function cornerEstimate(window) {
    const first = window[0];
    if (window.some(p => p[7] !== first[7] || p[3] < 18 || !Number.isFinite(p[4]) || p[4] > 8 ||
      !Number.isFinite(p[6]) || !Number.isFinite(p[8]) || p[8] > 1.5)) return null;
    const rates = window.slice(1).map((point, i) => {
      const dt = point[2] - window[i][2];
      return dt > 0 && dt <= 2 ? courseDelta(window[i][6], point[6]) / dt : NaN;
    });
    const direction = Math.sign(rates[0]);
    if (rates.some(rate => !Number.isFinite(rate) || Math.sign(rate) !== direction || Math.abs(rate) < 3 || Math.abs(rate) > 35)) return null;
    const speed = window.map(p => p[3]);
    const meanSpeed = speed.reduce((total, value) => total + value, 0) / speed.length;
    if (Math.max(...speed) - Math.min(...speed) > meanSpeed * 0.2) return null;
    const yawRate = rates.reduce((total, value) => total + value, 0) / rates.length;
    const lateralG = (meanSpeed / 3.6) * yawRate * radians / gravity;
    const angle = Math.atan(lateralG) / radians;
    return Math.abs(angle) <= 55 ? { angle, lateralG } : null;
  }

  function analyze(ride) {
    const track = ride.track || [];
    const events = (ride.events || []).filter(event => Number.isFinite(event.t));
    const turns = [];
    if (ride.kind === 'ride') {
      for (let i = 2; i < track.length - 2; i++) {
        const estimate = cornerEstimate(track.slice(i - 2, i + 3));
        if (estimate) turns.push({ ...estimate, index: i });
      }
    }
    const peak = direction => {
      const eligible = turns.filter(turn => Math.sign(turn.angle) === direction);
      return eligible.reduce((best, turn) => !best || Math.abs(turn.angle) > Math.abs(best.angle) ? turn : best, null);
    };
    const slowZones = [];
    let slowStart = null;
    let slowSeconds = 0;
    function finishSlowZone() {
      if (slowStart && slowSeconds >= 8) {
        slowZones.push({ kind: 'slow', t: slowStart[2], seconds: slowSeconds, lon: slowStart[0], lat: slowStart[1] });
      }
      slowStart = null;
      slowSeconds = 0;
    }
    for (let i = 1; i < track.length; i++) {
      const previous = track[i - 1];
      const point = track[i];
      const dt = point[2] - previous[2];
      const slow = point[7] === previous[7] && dt > 0 && dt <= 3 &&
        [previous, point].every(p => Number.isFinite(p[3]) && p[3] <= 5);
      if (!slow) { finishSlowZone(); continue; }
      slowStart ??= previous;
      slowSeconds += dt;
    }
    finishSlowZone();
    const counts = Object.fromEntries(['braking', 'acceleration', 'impact'].map(kind => [kind, events.filter(e => e.kind === kind).length]));
    const observed = ride.observedSeconds || 0;
    const coverage = ride.duration > 0 ? Math.min(1, observed / ride.duration) : 0;
    const slowShare = observed ? Math.min(1, (ride.stoppedSeconds || 0) / observed) : null;
    const changesPerMinute = observed >= 60 ? (counts.braking + counts.acceleration) * 60 / observed : null;
    let pattern = 'Insufficient coverage';
    if (ride.kind === 'ride' && coverage >= 0.7 && changesPerMinute !== null) {
      if (slowShare >= 0.2) pattern = 'Stop-and-go';
      else if (changesPerMinute >= 0.75) pattern = 'Frequent speed changes';
      else pattern = 'Mostly steady pace';
    }
    const peakG = kind => events.reduce((highest, event) => event.kind === kind && Number.isFinite(event.g)
      ? Math.max(highest ?? 0, event.g) : highest, null);
    return { left: peak(-1), right: peak(1), turns, slowZones, counts, observed, coverage, slowShare,
      changesPerMinute, pattern, brakingG: peakG('braking'), impactG: peakG('impact') };
  }

  function summary(ride, evidence) {
    return {
      average_speed_kmh: ride.distanceReliable ? round(ride.averageSpeed, 1) : null,
      gps_observed_seconds: round(evidence.observed),
      low_speed_seconds: evidence.observed ? round(ride.stoppedSeconds) : null,
      sustained_slow_zones: evidence.slowZones.length,
      braking_candidates: evidence.counts.braking,
      acceleration_candidates: evidence.counts.acceleration,
      phone_impact_candidates: ride.placement === 'Rigid mount' ? evidence.counts.impact : null,
      peak_gps_braking_g: round(evidence.brakingG, 2),
      peak_phone_impact_g: round(evidence.impactG, 2),
      left_lean_proxy_deg: round(Math.abs(evidence.left?.angle)),
      right_lean_proxy_deg: round(Math.abs(evidence.right?.angle)),
      qualified_turn_windows: evidence.turns.length,
      pace_pattern: evidence.pattern
    };
  }

  const api = { analyze, summary };
  if (typeof module !== 'undefined') module.exports = api;
  root.OdoRideInsights = api;
})(globalThis);
