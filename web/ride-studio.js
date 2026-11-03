'use strict';

const OdoStudio = (() => {
  const red = '#ff4e5d';
  const background = '#141217';
  const paper = '#fff5f5';

  function leanGraphic(left, right) {
    function figure(turn, direction) {
      const angle = turn?.angle;
      return `<svg viewBox="0 0 128 100" role="img" aria-label="${direction} lean illustration">
        <path d="M64 10v75M19 85h90" stroke="#75696e" stroke-dasharray="4 4" fill="none"/>
        ${Number.isFinite(angle) ? `<g transform="rotate(${angle} 64 84)" fill="none" stroke="${red}" stroke-width="4" stroke-linecap="round">
          <path d="M60 83v-19h8v19ZM64 64V43m-17 5 8-7h18l8 7M55 42l2-13h14l2 13"/>
          <circle cx="64" cy="21" r="7"/>
        </g>` : '<text x="64" y="52" text-anchor="middle" fill="#a897a0">—</text>'}
      </svg><span>${direction} · ${Number.isFinite(angle) ? Math.round(Math.abs(angle)) + '°' : 'No estimate'}</span>`;
    }
    return `<div class="lean-figures"><div>${figure(left, 'Left')}</div><div>${figure(right, 'Right')}</div></div>`;
  }

  function replay(canvas, track, slider, readout, onFrame) {
    const ctx = canvas.getContext('2d');
    const midpoint = track[Math.floor(track.length / 2)];
    const lonScale = Math.cos(midpoint[1] * Math.PI / 180);
    const points = track.map(p => [(p[0] - midpoint[0]) * lonScale, midpoint[1] - p[1]]);
    const extent = points.reduce((max, p) => Math.max(max, Math.abs(p[0]), Math.abs(p[1])), .00015);
    const start = track[0][2], end = track.at(-1)[2];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let elapsed = start, index = 0, frame = 0;

    function draw(time) {
      elapsed = Math.max(start, Math.min(end, time));
      while (index > 0 && track[index][2] > elapsed) index--;
      while (index < track.length - 1 && track[index + 1][2] <= elapsed) index++;
      const current = track[index], next = track[index + 1];
      const gap = next && next[7] !== current[7] && elapsed > current[2];
      const mix = next && !gap && next[2] > current[2] ? (elapsed - current[2]) / (next[2] - current[2]) : 0;
      const [x, y] = points[index].map((v, axis) => v + ((points[index + 1]?.[axis] ?? v) - v) * mix);
      const w = canvas.width, h = canvas.height, scale = w * .45 / extent;
      const project = ([px, py]) => {
        const dx = (px - (reducedMotion ? 0 : x * .54)) * scale;
        const dy = (py - (reducedMotion ? 0 : y * .54)) * scale;
        const perspective = 1 / (1 - dy / (w * 2));
        return [w / 2 + dx * perspective, h * .57 + dy * .45 * perspective];
      };
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#37202a');
      sky.addColorStop(.45, '#18141a');
      sky.addColorStop(1, '#0b090d');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#77535d66';
      ctx.beginPath();
      for (let i = -10; i <= 10; i++) {
        const d = i * extent * .28;
        ctx.moveTo(...project([d, -extent * 3]));
        ctx.lineTo(...project([d, extent * 2]));
        ctx.moveTo(...project([-extent * 3, d]));
        ctx.lineTo(...project([extent * 3, d]));
      }
      ctx.stroke();
      function trace(last, color, width) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= last; i++) {
          const p = project(points[i]);
          if (!i || track[i][7] !== track[i - 1][7]) ctx.moveTo(...p);
          else ctx.lineTo(...p);
        }
        if (mix && last === index) ctx.lineTo(...project([x, y]));
        ctx.stroke();
      }
      trace(points.length - 1, '#87505e', 3);
      ctx.shadowColor = red;
      ctx.shadowBlur = 20;
      trace(index, red, 6);
      ctx.shadowBlur = 0;
      if (!gap) {
        ctx.fillStyle = paper;
        ctx.beginPath();
        ctx.arc(...project([x, y]), 6, 0, 2 * Math.PI);
        ctx.fill();
      }
      slider.value = elapsed;
      readout.textContent = `${clock(elapsed)} · ${gap ? 'GPS gap' : fmt(current[3], 0) + ' km/h'}`;
      onFrame(elapsed);
    }

    function pause() {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    function play(rate, finished) {
      if (frame) return pause();
      if (elapsed >= end) draw(start);
      let previous = performance.now();
      function step(now) {
        draw(elapsed + Math.min(now - previous, 100) * rate / 1000);
        previous = now;
        if (elapsed < end && canvas.isConnected) frame = requestAnimationFrame(step);
        else { pause(); finished(); }
      }
      frame = requestAnimationFrame(step);
    }
    slider.min = start;
    slider.max = end;
    slider.step = 'any';
    draw(start);
    return { draw, pause, play, get playing() { return Boolean(frame); } };
  }

  function poster(canvas, options) {
    const { title, stats, photos, tall } = options;
    canvas.width = 1080;
    canvas.height = tall ? 1920 : 1350;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, w, 12);
    ctx.font = 'bold 55px system-ui';
    ctx.fillText('odo ↗', 64, 107);
    ctx.fillStyle = paper;
    ctx.font = '900 73px system-ui';
    ctx.fillText(title, 64, 213, w - 128);
    const statCols = stats.length === 1 ? 1 : 2;
    const rowHeight = 116;
    const statY = h - 118 - Math.ceil(stats.length / statCols) * rowHeight;
    const photoY = 267, photoH = statY - photoY - 32;
    function crop(image, x, y, width, height) {
      const scale = Math.max(width / image.width, height / image.height);
      const sw = width / scale, sh = height / scale;
      ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, width, height);
    }
    if (photos.length === 1) crop(photos[0], 64, photoY, 952, photoH);
    if (photos.length > 1) {
      const hero = photos.length === 3;
      if (hero) crop(photos[0], 64, photoY, 952, photoH * .58);
      const top = hero ? photoY + photoH * .58 + 12 : photoY;
      photos.slice(hero ? 1 : 0).forEach((photo, i) => crop(photo, 64 + i * 482, top, 470, photoY + photoH - top));
    }
    if (!photos.length) {
      ctx.fillStyle = '#281922';
      ctx.fillRect(64, photoY, 952, photoH);
      ctx.strokeStyle = '#6b303f';
      ctx.lineWidth = 4;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(64, photoY + photoH * (.46 + i * .054));
        ctx.lineTo(1016, photoY + photoH * (.13 + i * .054));
        ctx.stroke();
      }
      ctx.font = '800 66px system-ui';
      ctx.fillStyle = paper;
      ctx.fillText('RIDE LOG', 106, photoY + photoH * .57);
    }
    const colWidth = 952 / statCols;
    stats.forEach(([label, value], i) => {
      const x = 64 + (i % statCols) * colWidth, y = statY + Math.floor(i / statCols) * rowHeight;
      ctx.fillStyle = '#34272e';
      ctx.fillRect(x, y, colWidth - 12, 2);
      ctx.fillStyle = paper;
      ctx.font = '800 52px system-ui';
      ctx.fillText(value, x, y + 59, colWidth - 20);
      ctx.fillStyle = '#e4a7b0';
      ctx.font = '600 23px system-ui';
      ctx.fillText(label.toUpperCase(), x, y + 94, colWidth - 20);
    });
    ctx.fillStyle = red;
    ctx.font = '700 23px system-ui';
    ctx.fillText('ODO / JOURNEY EDITION', 64, h - 49);
  }

  return { leanGraphic, replay, poster };
})();

function openRideReplay(ride) {
  if (ride?.track?.length < 2 || !ride?.track) return toast('Import a journey with a GPS track first.');
  const evidence = OdoRideInsights.analyze(ride);
  const chapters = [
    { t: ride.track[0][2], label: 'Departure' },
    ...evidence.slowZones.slice(0, 3).map(zone => ({ t: zone.t, label: 'Low speed' })),
    ...[evidence.left, evidence.right].filter(Boolean).map(turn => ({
      t: ride.track[turn.index][2], label: turn.angle < 0 ? 'Left turn estimate' : 'Right turn estimate'
    })),
    { t: ride.track.at(-1)[2], label: 'Arrival' }
  ].sort((a, b) => a.t - b.t);
  const narration = rideNarrations.get(ride.id);
  modal(`<h2>${esc(ride.title)}</h2>
    <div class="studio-map"><span class="eyebrow">PERSPECTIVE REPLAY · GPS</span>
      <canvas id="studio-replay" width="1120" height="590" aria-label="Animated GPS route on a tilted grid"></canvas></div>
    <div class="playbar"><button id="studio-play" aria-label="Play replay">▶</button>
      <input id="studio-time" type="range" aria-label="Replay time">
      <span id="studio-readout" class="timeline-readout"></span>
      <select id="studio-rate" aria-label="Replay speed"><option value="15">15×</option><option value="30" selected>30×</option><option value="60">60×</option></select>
    </div>
    <div class="studio-chapters">${chapters.map(c => `<button data-chapter="${c.t}">${c.label} · ${clock(c.t)}</button>`).join('')}</div>
    <section class="section"><div class="eyebrow">JOURNEY DEBRIEF</div>
      ${narration ? `<p>${esc(narration.summary)}</p><span class="tiny">Meta ${esc(narration.model)}</span>` : '<p class="subtle">Ask Muse for a narration based on this ride’s summary.</p>'}
      ${ride.kind === 'ride' ? '<button data-action="muse-narrate">Ask Muse for a debrief</button>' : ''}
    </section><div class="actions"><button data-action="close">Close</button></div>`);
  const dialog = $('#modal'), slider = $('#studio-time'), play = $('#studio-play');
  dialog.classList.add('studio-dialog');
  const chapterButtons = $$('[data-chapter]');
  const replay = OdoStudio.replay($('#studio-replay'), ride.track, slider, $('#studio-readout'), time => {
    const active = chapters.findLastIndex(c => c.t <= time);
    chapterButtons.forEach((button, i) => button.setAttribute('aria-current', i === active));
  });
  const resetPlay = () => {
    play.textContent = '▶';
    play.setAttribute('aria-label', 'Play replay');
  };
  play.onclick = () => {
    replay.play(Number($('#studio-rate').value), resetPlay);
    if (replay.playing) {
      play.textContent = 'Ⅱ';
      play.setAttribute('aria-label', 'Pause replay');
    } else resetPlay();
  };
  slider.oninput = () => replay.draw(Number(slider.value));
  chapterButtons.forEach(button => {
    button.onclick = () => {
      replay.pause();
      resetPlay();
      replay.draw(Number(button.dataset.chapter));
    };
  });
  dialog.addEventListener('close', () => replay.pause(), { once: true });
}

const roadLabels = ['Pothole', 'Speed breaker', 'Rough patch', 'Phone moved', 'Other', 'Not sure'];

function roadReview(ride, event) {
  if (event.kind !== 'impact') return '';
  const label = ride.roadReviews?.[event.id];
  return `<label class="road-review">Rider note
    <select data-road-review="${esc(event.id)}">
      <option value="">Unreviewed</option>
      ${roadLabels.map(value => `<option ${value === label ? 'selected' : ''}>${value}</option>`).join('')}
    </select>
  </label>`;
}

document.addEventListener('change', async event => {
  const select = event.target.closest('[data-road-review]');
  if (!select) return;
  const ride = current(), id = select.dataset.roadReview;
  if (!ride?.events.some(item => item.id === id && item.kind === 'impact')) return;
  if (select.value && !roadLabels.includes(select.value)) return;
  const reviews = { ...ride.roadReviews };
  if (select.value) reviews[id] = select.value;
  else delete reviews[id];
  try {
    await saveRide({ ...ride, roadReviews: reviews });
    toast('Private rider note saved.');
  } catch {
    select.value = ride.roadReviews?.[id] || '';
    toast('Could not save the rider note.');
  }
});

function openShareStudio(ride) {
  if (!ride) return toast('Import a journey first.');
  const { left, right } = OdoRideInsights.analyze(ride);
  const stats = [
    ['Distance estimate', ride.distanceReliable ? fmt(ride.distanceKm, 1) + ' km' : null],
    ['Recorded duration', duration(ride.duration)],
    ['Average speed estimate', ride.distanceReliable ? fmt(ride.averageSpeed, 1) + ' km/h' : null],
    ['Peak GPS speed', Number.isFinite(ride.maxSpeed) ? fmt(ride.maxSpeed, 1) + ' km/h' : null],
    ['Left lean estimate', left ? fmt(Math.abs(left.angle), 0) + '°' : null],
    ['Right lean estimate', right ? fmt(Math.abs(right.angle), 0) + '°' : null]
  ];
  modal(`<h2>Share studio</h2><p class="subtle">Choose what appears on your card. Photos and stats are composed on this device. Preview anything identifying in photos or the title before posting.</p>
    <div class="studio-layout">
      <canvas class="poster-canvas" id="studio-poster" aria-label="Share card preview"></canvas>
      <div class="studio-fields">
        <label>Card title<input id="poster-title" maxlength="42" value="${ride.kind === 'walk' ? 'Out for a walk' : 'A day on two wheels'}"></label>
        <label>Format<select id="poster-format"><option value="feed">Portrait feed · 4:5</option><option value="story">Story · 9:16</option></select></label>
        <fieldset><legend>Stats to include</legend><div class="studio-stats">${stats.map(([label, value], i) => `<label class="check"><input type="checkbox" data-poster-stat="${i}" ${value === null ? 'disabled' : i < 2 ? 'checked' : ''}>${label}${value === null ? ' · unavailable' : ''}</label>`).join('')}</div></fieldset>
        <label>Choose up to three photos<input id="poster-photos" type="file" accept="image/*" multiple></label>
        <span class="tiny" id="poster-status" role="status">Speed is optional. Lean estimates come from GPS turns.</span>
        <button class="primary" id="poster-export">Download PNG</button>
        <button data-action="simple-draft">Open simple private draft</button>
      </div>
    </div><div class="actions"><button data-action="close">Close</button></div>`);
  $('#modal').classList.add('studio-dialog');
  const canvas = $('#studio-poster'), title = $('#poster-title'), format = $('#poster-format');
  const files = $('#poster-photos'), status = $('#poster-status'), save = $('#poster-export');
  let photos = [], version = 0;
  const draw = () => OdoStudio.poster(canvas, {
    title: title.value.trim() || 'Ride log', tall: format.value === 'story', photos,
    stats: $$('[data-poster-stat]:checked').map(input => stats[Number(input.dataset.posterStat)])
  });
  title.oninput = format.onchange = draw;
  $$('[data-poster-stat]').forEach(input => { input.onchange = draw; });
  files.onchange = async () => {
    const selectedFiles = [...files.files];
    const request = ++version;
    photos = [];
    draw();
    save.disabled = true;
    try {
      if (selectedFiles.length > 3) throw Error('Choose at most three photos.');
      if (selectedFiles.some(file => file.size > 20 * 1024 * 1024)) throw Error('Each photo must be under 20 MB.');
      const loaded = await Promise.all(selectedFiles.map(async file => {
        const url = URL.createObjectURL(file);
        try {
          const image = new Image();
          image.src = url;
          await image.decode();
          return image;
        } finally { URL.revokeObjectURL(url); }
      }));
      if (request !== version) return;
      photos = loaded;
      status.textContent = loaded.length ? `${loaded.length} photo(s) in preview` : 'No photos selected.';
      draw();
    } catch (error) {
      if (request === version) status.textContent = error.message || 'Could not open a photo.';
    } finally {
      if (request === version) save.disabled = false;
    }
  };
  save.onclick = () => canvas.toBlob(blob => {
    if (!blob) return toast('Could not export this card.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'odo-ride-card.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
  draw();
}

