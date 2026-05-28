const KEY = 'workouts:v1';

const form = document.getElementById('workout-form');
const list = document.getElementById('entries');
const empty = document.getElementById('empty-state');
const exportBtn = document.getElementById('export-btn');

const fDate = document.getElementById('f-date');
const fExercise = document.getElementById('f-exercise');
const fSets = document.getElementById('f-sets');
const fReps = document.getElementById('f-reps');
const fWeight = document.getElementById('f-weight');
const fNotes = document.getElementById('f-notes');

fDate.value = todayISO();

function load() {
  return Store.read(KEY, []);
}

function save(entries) {
  Store.write(KEY, entries);
}

function render() {
  const entries = load().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  list.innerHTML = '';
  empty.classList.toggle('hidden', entries.length > 0);

  for (const e of entries) {
    const li = document.createElement('li');
    li.className = 'entry';

    const main = document.createElement('div');
    main.className = 'entry-main';

    const title = document.createElement('div');
    title.className = 'entry-title';
    title.textContent = e.exercise;
    main.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'entry-meta';
    const weight = e.weight ? ` @ ${e.weight}` : '';
    meta.textContent = `${formatDate(e.date)} · ${e.sets}×${e.reps}${weight}`;
    main.appendChild(meta);

    if (e.notes) {
      const notes = document.createElement('div');
      notes.className = 'entry-notes';
      notes.textContent = e.notes;
      main.appendChild(notes);
    }

    const del = document.createElement('button');
    del.className = 'entry-delete';
    del.type = 'button';
    del.setAttribute('aria-label', 'Delete entry');
    del.textContent = '✕';
    del.addEventListener('click', () => {
      if (confirm('Delete this entry?')) {
        save(load().filter((x) => x.id !== e.id));
        render();
      }
    });

    li.appendChild(main);
    li.appendChild(del);
    list.appendChild(li);
  }

  renderStats(entries);
}

function renderStats(entries) {
  const weekStart = startOfWeek(new Date());
  const inWeek = entries.filter((e) => new Date(e.date + 'T00:00:00') >= weekStart);
  const volume = inWeek.reduce(
    (sum, e) => sum + (Number(e.sets) || 0) * (Number(e.reps) || 0) * (Number(e.weight) || 0),
    0
  );

  document.getElementById('stat-total').textContent = entries.length;
  document.getElementById('stat-week').textContent = inWeek.length;
  document.getElementById('stat-volume').textContent = Math.round(volume).toLocaleString();
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const entry = {
    id: uid(),
    createdAt: Date.now(),
    date: fDate.value,
    exercise: fExercise.value.trim(),
    sets: Number(fSets.value),
    reps: Number(fReps.value),
    weight: fWeight.value ? Number(fWeight.value) : null,
    notes: fNotes.value.trim(),
  };
  if (!entry.exercise) return;
  save([...load(), entry]);

  fExercise.value = '';
  fNotes.value = '';
  fExercise.focus();
  render();
});

exportBtn.addEventListener('click', () => {
  const entries = load();
  if (!entries.length) {
    alert('Nothing to export yet.');
    return;
  }
  download(`workouts-${todayISO()}.json`, JSON.stringify(entries, null, 2));
});

render();
