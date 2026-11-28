// Recorte de la foto de perfil: se elige una imagen, se acerca con el control de zoom y se mueve
// arrastrándola (o con las flechas) dentro del círculo. Todo ocurre en este navegador: la imagen no
// se sube a ningún servidor; se reduce a 320×320 px en JPEG para guardarla en el perfil.
import { $, tr } from './ui.js';

export const photoTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const maxPhotoBytes = 8 * 1024 * 1024;
const outputSize = 320;

// Comprueba el archivo antes de abrirlo. Devuelve un mensaje de error o null.
export function photoProblem(file) {
    if (!file) return tr('No se eligió ningún archivo.', 'No file was chosen.');
    if (!photoTypes.includes(file.type)) return tr('Usa una imagen JPG, PNG, WebP o GIF.', 'Use a JPG, PNG, WebP or GIF image.');
    if (file.size > maxPhotoBytes) return tr('La imagen pesa más de 8 MB. Elige una más liviana.', 'The image is larger than 8 MB. Choose a smaller one.');
    return null;
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => resolve({ image, url });
        image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
        image.src = url;
    });
}

// Abre la ventana de recorte. Resuelve con la foto recortada (data URL) o null si se cancela.
export async function cropPhoto(file) {
    const { image, url } = await loadImage(file);
    if (image.naturalWidth < 64 || image.naturalHeight < 64) {
        URL.revokeObjectURL(url);
        throw new Error('small');
    }
    const dialog = $('photo-dialog');
    const frame = $('photo-frame');
    const shown = $('photo-image');
    const zoom = $('photo-zoom');
    const size = () => frame.clientWidth || 260;
    shown.src = url;
    zoom.value = '1';
    let x = 0;
    let y = 0;
    const scale = () => (size() / Math.min(image.naturalWidth, image.naturalHeight)) * Number(zoom.value);
    const clamp = () => {
        const s = scale();
        x = Math.min(0, Math.max(size() - image.naturalWidth * s, x));
        y = Math.min(0, Math.max(size() - image.naturalHeight * s, y));
    };
    const paint = () => {
        clamp();
        const s = scale();
        shown.style.width = `${image.naturalWidth * s}px`;
        shown.style.height = `${image.naturalHeight * s}px`;
        shown.style.transform = `translate(${x}px, ${y}px)`;
    };
    const center = () => {
        const s = scale();
        x = (size() - image.naturalWidth * s) / 2;
        y = (size() - image.naturalHeight * s) / 2;
        paint();
    };

    // Al acercar, se mantiene fijo el punto del centro del círculo.
    let previous = scale();
    const onZoom = () => {
        const next = scale();
        const middle = size() / 2;
        x = middle - ((middle - x) / previous) * next;
        y = middle - ((middle - y) / previous) * next;
        previous = next;
        paint();
    };
    let drag = null;
    const onDown = (event) => {
        drag = { startX: event.clientX, startY: event.clientY, x, y };
        frame.setPointerCapture(event.pointerId);
        frame.classList.add('is-dragging');
    };
    const onMove = (event) => {
        if (!drag) return;
        x = drag.x + event.clientX - drag.startX;
        y = drag.y + event.clientY - drag.startY;
        paint();
    };
    const onUp = () => { drag = null; frame.classList.remove('is-dragging'); };
    const onKey = (event) => {
        const step = event.shiftKey ? 24 : 8;
        const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
        if (event.key === '+' || event.key === '=') { zoom.value = Math.min(3, Number(zoom.value) + 0.1); onZoom(); event.preventDefault(); return; }
        if (event.key === '-') { zoom.value = Math.max(1, Number(zoom.value) - 0.1); onZoom(); event.preventDefault(); return; }
        if (!moves[event.key]) return;
        event.preventDefault();
        x += moves[event.key][0];
        y += moves[event.key][1];
        paint();
    };
    const onWheel = (event) => {
        event.preventDefault();
        zoom.value = Math.min(3, Math.max(1, Number(zoom.value) - Math.sign(event.deltaY) * 0.1));
        onZoom();
    };

    zoom.addEventListener('input', onZoom);
    frame.addEventListener('pointerdown', onDown);
    frame.addEventListener('pointermove', onMove);
    frame.addEventListener('pointerup', onUp);
    frame.addEventListener('pointercancel', onUp);
    frame.addEventListener('keydown', onKey);
    frame.addEventListener('wheel', onWheel, { passive: false });

    dialog.showModal();
    center();
    previous = scale();
    frame.focus();

    const result = await new Promise((resolve) => {
        const finish = (value) => { cleanup(); resolve(value); };
        const onUse = () => {
            const canvas = document.createElement('canvas');
            canvas.width = outputSize;
            canvas.height = outputSize;
            const context = canvas.getContext('2d');
            const ratio = outputSize / size();
            const s = scale();
            context.fillStyle = '#F3F5ED';
            context.fillRect(0, 0, outputSize, outputSize);
            context.imageSmoothingQuality = 'high';
            context.drawImage(image, x * ratio, y * ratio, image.naturalWidth * s * ratio, image.naturalHeight * s * ratio);
            finish(canvas.toDataURL('image/jpeg', 0.86));
        };
        const onCancel = () => finish(null);
        const onClose = () => finish(null);
        const cleanup = () => {
            $('photo-use').removeEventListener('click', onUse);
            $('photo-cancel').removeEventListener('click', onCancel);
            $('photo-close').removeEventListener('click', onCancel);
            dialog.removeEventListener('close', onClose);
            zoom.removeEventListener('input', onZoom);
            frame.removeEventListener('pointerdown', onDown);
            frame.removeEventListener('pointermove', onMove);
            frame.removeEventListener('pointerup', onUp);
            frame.removeEventListener('pointercancel', onUp);
            frame.removeEventListener('keydown', onKey);
            frame.removeEventListener('wheel', onWheel);
            if (dialog.open) dialog.close();
            URL.revokeObjectURL(url);
            shown.removeAttribute('src');
        };
        $('photo-use').addEventListener('click', onUse);
        $('photo-cancel').addEventListener('click', onCancel);
        $('photo-close').addEventListener('click', onCancel);
        dialog.addEventListener('close', onClose);
    });
    return result;
}
