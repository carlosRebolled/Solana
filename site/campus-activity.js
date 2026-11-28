// Actividad de estudio del campus. DEMOSTRACIÓN: todo se guarda solo en este navegador (localStorage):
// días con estudio, meta semanal, posición de cada video, marcas con tiempo, cursos guardados,
// preferencias del reproductor, historial reciente y logros ya obtenidos.
import { demoAccount, courses } from './data.js';

export const keys = {
    activity: 'solara-demo-activity',
    goal: 'solara-demo-goal',
    positions: 'solara-demo-positions',
    marks: 'solara-demo-marks',
    saved: 'solara-demo-saved',
    prefs: 'solara-demo-prefs',
    log: 'solara-demo-log',
    badges: 'solara-demo-badges'
};

export const store = {
    read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
};

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, days) => { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; };
const monday = (date) => addDays(startOfDay(date), -((date.getDay() + 6) % 7));

// ── Días de estudio ──
export const readActivity = () => store.read(keys.activity, {});
const isActive = (entry) => Boolean(entry) && (entry.lessons > 0 || entry.seconds >= 30);
function bump(field, amount) {
    const activity = readActivity();
    const key = dayKey();
    const entry = { lessons: 0, seconds: 0, ...activity[key] };
    entry[field] = Math.max(0, (entry[field] ?? 0) + amount);
    activity[key] = entry;
    store.write(keys.activity, activity);
}
export const addWatchSeconds = (seconds) => { if (seconds > 0) bump('seconds', Math.round(seconds)); };

export function recordLesson(course, lesson, completed) {
    bump('lessons', completed ? 1 : -1);
    if (completed) pushLog({ type: 'lesson', course, lesson });
}

export function streaks(activity = readActivity()) {
    const today = startOfDay(new Date());
    let cursor = isActive(activity[dayKey(today)]) ? today : addDays(today, -1);
    let current = 0;
    while (isActive(activity[dayKey(cursor)])) { current += 1; cursor = addDays(cursor, -1); }
    let best = 0;
    let run = 0;
    let previous = null;
    for (const key of Object.keys(activity).filter((day) => isActive(activity[day])).sort()) {
        const date = new Date(`${key}T12:00`);
        run = previous && Math.round((date - previous) / 864e5) === 1 ? run + 1 : 1;
        best = Math.max(best, run);
        previous = date;
    }
    return { current, best: Math.max(best, current), today: isActive(activity[dayKey(today)]) };
}

export function week(activity = readActivity()) {
    const now = new Date();
    const start = monday(now);
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(start, index);
        const entry = { lessons: 0, seconds: 0, ...activity[dayKey(date)] };
        return { date, key: dayKey(date), ...entry, active: isActive(entry), isToday: dayKey(date) === dayKey(now), future: date > now };
    });
    return { days, lessons: days.reduce((sum, day) => sum + day.lessons, 0), seconds: days.reduce((sum, day) => sum + day.seconds, 0) };
}

// Mapa de las últimas `weeks` semanas: columnas de lunes a domingo, nivel 0–4 según la actividad del día.
export function heatmap(weeks = 12, activity = readActivity()) {
    const now = startOfDay(new Date());
    const start = addDays(monday(now), -7 * (weeks - 1));
    return Array.from({ length: weeks }, (_, column) => Array.from({ length: 7 }, (_, row) => {
        const date = addDays(start, column * 7 + row);
        const entry = { lessons: 0, seconds: 0, ...activity[dayKey(date)] };
        const score = entry.lessons * 2 + Math.floor(entry.seconds / 120);
        const level = !isActive(entry) ? 0 : score >= 6 ? 4 : score >= 4 ? 3 : score >= 2 ? 2 : 1;
        return { date, key: dayKey(date), ...entry, level, future: date > now };
    }));
}

// ── Meta semanal (clases por semana) ──
export const readGoal = () => Math.min(14, Math.max(1, Number(store.read(keys.goal, { perWeek: 3 }).perWeek) || 3));
export const saveGoal = (perWeek) => store.write(keys.goal, { perWeek: Math.min(14, Math.max(1, perWeek)) });

// ── Posición de cada video, para seguir donde quedó ──
export const readPosition = (course, lesson) => Number(store.read(keys.positions, {})[`${course}:${lesson}`]) || 0;
export function savePosition(course, lesson, seconds) {
    const positions = store.read(keys.positions, {});
    if (seconds > 0) positions[`${course}:${lesson}`] = Math.round(seconds); else delete positions[`${course}:${lesson}`];
    store.write(keys.positions, positions);
}
export const playedCourses = () => new Set(Object.keys(store.read(keys.positions, {})).map((key) => key.split(':')[0]));

// ── Marcas con tiempo dentro de un video ──
export const readMarks = () => store.read(keys.marks, []);
export function addMark({ course, lesson, time, text }) {
    const mark = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, course, lesson, time: Math.max(0, Math.floor(time)), text: text.trim(), created: Date.now() };
    store.write(keys.marks, [...readMarks(), mark]);
    pushLog({ type: 'mark', course, lesson });
    return mark;
}
export const removeMark = (id) => store.write(keys.marks, readMarks().filter((mark) => mark.id !== id));

// ── Cursos guardados para más adelante ──
export const readSaved = () => store.read(keys.saved, demoAccount.wishlist);
export function toggleSaved(id) {
    const saved = readSaved();
    const next = saved.includes(id) ? saved.filter((entry) => entry !== id) : [...saved, id];
    store.write(keys.saved, next);
    if (!saved.includes(id)) pushLog({ type: 'saved', course: id });
    return next.includes(id);
}

// ── Preferencias del reproductor ──
export const readPrefs = () => ({ speed: 1, autoplay: true, ...store.read(keys.prefs, {}) });
export const savePrefs = (patch) => store.write(keys.prefs, { ...readPrefs(), ...patch });

// ── Historial reciente ──
export const readLog = () => store.read(keys.log, []);
export function pushLog(entry) {
    store.write(keys.log, [{ ...entry, at: Date.now() }, ...readLog()].slice(0, 40));
}

// ── Recomendaciones: cursos del catálogo del mismo tema que lo que estudias ──
export function recommendations(items, limit = 6) {
    const owned = new Set(items.map((item) => item.id));
    const weight = new Map();
    for (const item of items) weight.set(item.course.topic, (weight.get(item.course.topic) ?? 0) + 1 + item.completed);
    return courses
        .filter((course) => !owned.has(course.id) && weight.has(course.topic))
        .map((course) => ({ course, score: weight.get(course.topic) * 10 + (course.price !== null ? 5 : 0), because: items.filter((item) => item.course.topic === course.topic).sort((a, b) => b.completed - a.completed)[0] }))
        .sort((a, b) => b.score - a.score || a.course.lessons.length - b.course.lessons.length)
        .slice(0, limit);
}

// ── Logros: se calculan con la actividad real de este navegador y se recuerdan una vez obtenidos ──
const badgeList = [
    { id: 'first-lesson', icon: '1', title: ['Primera clase', 'First lesson'], text: ['Completaste tu primera clase.', 'You completed your first lesson.'], test: (c) => [c.done >= 1, `${Math.min(c.done, 1)}/1`] },
    { id: 'three-lessons', icon: '3', title: ['En marcha', 'Up and running'], text: ['Completaste 3 clases.', 'You completed 3 lessons.'], test: (c) => [c.done >= 3, `${Math.min(c.done, 3)}/3`] },
    { id: 'first-course', icon: '✓', title: ['Primer curso', 'First course'], text: ['Terminaste todas las clases de un curso.', 'You finished every lesson of a course.'], test: (c) => [c.finished >= 1, `${Math.min(c.finished, 1)}/1`] },
    { id: 'all-courses', icon: '★', title: ['Todo tu campus', 'Your whole campus'], text: ['Terminaste todos tus cursos.', 'You finished all your courses.'], test: (c) => [c.finished === c.courses && c.courses > 0, `${c.finished}/${c.courses}`] },
    { id: 'streak-3', icon: '◆', title: ['Tres días seguidos', 'Three days in a row'], text: ['Estudiaste 3 días seguidos.', 'You studied 3 days in a row.'], test: (c) => [c.best >= 3, `${Math.min(c.best, 3)}/3`] },
    { id: 'weekly-goal', icon: '◎', title: ['Meta cumplida', 'Goal reached'], text: ['Llegaste a tu meta semanal de clases.', 'You reached your weekly lesson goal.'], test: (c) => [c.week >= c.goal, `${Math.min(c.week, c.goal)}/${c.goal}`] },
    { id: 'first-mark', icon: '✎', title: ['Buena observación', 'Good observation'], text: ['Guardaste una nota con marca de tiempo en un video.', 'You saved a timestamped note on a video.'], test: (c) => [c.marks >= 1, `${Math.min(c.marks, 1)}/1`] },
    { id: 'explorer', icon: '⌖', title: ['Exploración', 'Explorer'], text: ['Reprodujiste una clase de cada uno de tus cursos.', 'You played a lesson from each of your courses.'], test: (c) => [c.played >= c.courses && c.courses > 0, `${Math.min(c.played, c.courses)}/${c.courses}`] }
];

export function badges(items) {
    const played = playedCourses();
    const context = {
        done: items.reduce((sum, item) => sum + item.completed, 0),
        finished: items.filter((item) => item.status === 'done').length,
        courses: items.length,
        best: streaks().best,
        week: week().lessons,
        goal: readGoal(),
        marks: readMarks().length,
        played: items.filter((item) => played.has(item.id)).length
    };
    const stored = store.read(keys.badges, {});
    const fresh = [];
    const list = badgeList.map((badge) => {
        const [now, progress] = badge.test(context);
        if (now && !stored[badge.id]) { stored[badge.id] = Date.now(); fresh.push(badge.id); }
        return { ...badge, earned: Boolean(stored[badge.id]), earnedAt: stored[badge.id] ?? null, progress };
    });
    if (fresh.length) store.write(keys.badges, stored);
    return { list, fresh: list.filter((badge) => fresh.includes(badge.id)) };
}

// Borra la actividad del campus en este navegador (no toca el progreso ni las notas).
export function clearActivity() {
    for (const key of [keys.activity, keys.positions, keys.log, keys.badges]) localStorage.removeItem(key);
}
