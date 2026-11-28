// Perfil editable de la cuenta. DEMOSTRACIÓN: se guarda solo en este navegador (localStorage) y no se
// envía a ningún servidor. Nunca guarda contraseñas ni datos de pago. Lo usan el campus y Mi cuenta.
import { demoAccount, goals } from './data.js';
import { esc } from './ui.js';

export const profileKey = 'solara-demo-profile';

export const countries = [
    ['CR', 'Costa Rica', 'Costa Rica'], ['MX', 'México', 'Mexico'], ['GT', 'Guatemala', 'Guatemala'], ['HN', 'Honduras', 'Honduras'],
    ['SV', 'El Salvador', 'El Salvador'], ['NI', 'Nicaragua', 'Nicaragua'], ['PA', 'Panamá', 'Panama'], ['CO', 'Colombia', 'Colombia'],
    ['EC', 'Ecuador', 'Ecuador'], ['PE', 'Perú', 'Peru'], ['CL', 'Chile', 'Chile'], ['AR', 'Argentina', 'Argentina'],
    ['UY', 'Uruguay', 'Uruguay'], ['DO', 'República Dominicana', 'Dominican Republic'], ['ES', 'España', 'Spain'],
    ['US', 'Estados Unidos', 'United States'], ['CA', 'Canadá', 'Canada'], ['OT', 'Otro país', 'Other country']
];

// Colores del avatar: solo tonos de la paleta de Solara, con texto legible encima.
export const avatarColors = [
    ['forest', 'Bosque', 'Forest'], ['earth', 'Tierra', 'Earth'], ['sage', 'Salvia', 'Sage'], ['charcoal', 'Carbón', 'Charcoal']
];

export const interestOptions = goals;

const defaults = () => ({
    name: '',
    email: demoAccount.email,
    country: demoAccount.country,
    role: '',
    bio: '',
    interests: [],
    color: 'forest',
    photo: '',
    updated: null
});

export function readProfile() {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(profileKey)) ?? {}; } catch { stored = {}; }
    const profile = { ...defaults(), ...stored };
    // La foto solo se acepta como imagen incrustada (data URL) que genera el recorte del campus.
    if (!safePhoto(profile.photo)) profile.photo = '';
    return profile;
}

export const safePhoto = (value) => typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);

// Avatar: la foto si hay una; si no, las iniciales sobre el color elegido.
export function avatarMarkup({ name, color = 'forest', photo = '', extra = '' }) {
    const hasPhoto = safePhoto(photo);
    return `<span class="teacher-avatar campus-avatar${hasPhoto ? ' has-photo' : ''}${extra ? ` ${extra}` : ''}" data-color="${esc(color)}" aria-hidden="true">${hasPhoto ? `<img src="${photo}" alt="">` : esc(initials(name))}</span>`;
}

export function saveProfile(profile) {
    if (profile.photo && !safePhoto(profile.photo)) profile = { ...profile, photo: '' };
    try {
        localStorage.setItem(profileKey, JSON.stringify({ ...profile, updated: Date.now() }));
        dispatchEvent(new CustomEvent('solara:profile'));
        return true;
    } catch { return false; }
}

export function resetProfile() {
    localStorage.removeItem(profileKey);
    dispatchEvent(new CustomEvent('solara:profile'));
}

// Nombre que se muestra: el del perfil o, si está vacío, el de la cuenta de demostración.
export const displayName = (fallback) => readProfile().name.trim() || fallback;

export function initials(name) {
    const words = name.trim().split(/\s+/).filter((word) => /\p{L}/u.test(word));
    if (!words.length) return '·';
    const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
    return letters.toUpperCase();
}

export const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
