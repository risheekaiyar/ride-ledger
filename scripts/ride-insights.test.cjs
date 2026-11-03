const { test } = require('node:test');
const assert = require('node:assert/strict');
const { analyze, summary } = require('../web/ride-insights.js');
const { packet } = require('./muse-runtime.cjs');

function recording(courses) {
  return { kind: 'ride', duration: 100, observedSeconds: 90, stoppedSeconds: 25,
    distanceReliable: true, averageSpeed: 32, events: [],
    track: courses.map((course, i) => [0, 0, i, 36, 3, null, course, 0, 0.5]) };
}

test('qualifying turns preserve left/right sign through north', () => {
  const right = analyze(recording([350, 355, 0, 5, 10]));
  assert.equal(right.left, null);
  assert.ok(Math.abs(right.right.angle - 5.1) < 0.2);
  const left = analyze(recording([10, 5, 0, 355, 350]));
  assert.equal(left.right, null);
  assert.ok(Math.abs(left.left.angle + 5.1) < 0.2);
});

test('poor coverage or GPS gaps do not produce a lean number across a gap', () => {
  const ride = recording([350, 355, 0, 5, 10]);
  ride.track[3][7] = 1;
  ride.observedSeconds = 10;
  const evidence = analyze(ride);
  assert.equal(evidence.turns.length, 0);
  assert.equal(evidence.pattern, 'Insufficient coverage');
});

test('route profile drops private fields and preserves missing lean', () => {
  const ride = recording([0, 0, 0, 0, 0]);
  const profile = summary(ride, analyze(ride));
  const request = { question: 'Review this ride', rides: [{ kind: 'ride', placement: 'Pocket',
    duration_seconds: 100, distance_km: 1, gps_accepted_percent: 90, gps_accuracy_m: 3,
    screen_off_seconds: 0, route_profile: { ...profile, raw_route: 'private' } }] };
  const evidence = packet(request).evidence[0].route_profile;
  assert.equal(evidence.left_lean_proxy_deg, null);
  assert.equal(evidence.pace_pattern, 'Stop-and-go');
  assert.equal(evidence.raw_route, undefined);
  request.rides[0].route_profile.left_lean_proxy_deg = 999;
  assert.throws(() => packet(request), /Invalid route-profile/);
});
