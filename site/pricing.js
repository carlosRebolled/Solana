// 30–35 · Componentes de precios: selector de modalidad, tarjetas, comparación y grupos.
import { plans } from './data.js';
import { t, tr, esc, price } from './ui.js';

const audiences = [
    ['personas', ['Personas', 'Individuals']],
    ['instituciones', ['Instituciones', 'Institutions']]
];
const groupSizes = new Map();

function groupSelector(plan) {
    const { min, max, start } = plan.group;
    const value = groupSizes.get(plan.id) ?? start;
    const id = `group-${plan.id}`;
    return `<div class="group-selector">
        <label for="${id}">${tr('Cantidad de estudiantes', 'Number of students')}</label>
        <div class="stepper" data-plan="${plan.id}">
            <button type="button" data-delta="-1" aria-label="${tr('Quitar un estudiante', 'Remove one student')}" ${value <= min ? 'disabled' : ''}>−</button>
            <input id="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" value="${value}">
            <button type="button" data-delta="1" aria-label="${tr('Añadir un estudiante', 'Add one student')}" ${value >= max ? 'disabled' : ''}>+</button>
        </div>
    </div>`;
}

export function pricingCard(plan) {
    const pending = plan.price === null;
    const value = groupSizes.get(plan.id) ?? plan.group?.start;
    return `<article class="pricing-card" data-highlight="${Boolean(plan.highlight)}">
        ${plan.highlight ? `<span class="ribbon">${tr('Recomendado', 'Recommended')}</span>` : ''}
        <header><h3>${esc(t(plan.name))}</h3><span class="period">${esc(t(plan.period))}</span></header>
        <p class="seats">${plan.group ? `${value} ${tr('estudiantes', 'students')} · ${tr('de', 'from')} ${plan.group.min} ${tr('a', 'to')} ${plan.group.max}` : esc(t(plan.seats))}</p>
        <p class="price-line ${pending ? 'is-pending' : ''}">${esc(price(plan.price, { from: plan.from }))}${pending ? '' : plan.price ? ` <small>${tr('precio de muestra', 'sample price')}</small>` : ''}</p>
        ${plan.group ? groupSelector(plan) : ''}
        <ul class="feature-list">${plans.features.map(([key, label]) => `<li data-included="${plan.features[key]}"><span>${esc(t(label))}<span class="sr-only">: ${plan.features[key] ? tr('incluido', 'included') : tr('no incluido', 'not included')}</span></span></li>`).join('')}</ul>
        <a class="btn ${plan.highlight ? 'btn-primary' : 'btn-outline'}" href="${plan.href}">${esc(t(plan.cta))}</a>
    </article>`;
}

// Selector de modalidad con pestañas accesibles; cambia el contenido de las tarjetas.
export function renderPlans(switchElement, grid, onChange) {
    if (!switchElement || !grid) return;
    const current = switchElement.dataset.audience ?? new URLSearchParams(location.search).get('modalidad') ?? 'personas';
    switchElement.dataset.audience = current;
    switchElement.innerHTML = audiences.map(([id, label]) => `<button type="button" role="tab" id="tab-${switchElement.id}-${id}" aria-selected="${id === current}" tabindex="${id === current ? 0 : -1}" aria-controls="${grid.id}" data-audience="${id}">${esc(t(label))}</button>`).join('');
    grid.setAttribute('aria-labelledby', `tab-${switchElement.id}-${current}`);
    grid.innerHTML = plans[current].map(pricingCard).join('');
    onChange?.(current);

    if (switchElement.dataset.ready) return;
    switchElement.dataset.ready = 'true';
    const select = (id, focus) => {
        switchElement.dataset.audience = id;
        renderPlans(switchElement, grid, onChange);
        if (focus) switchElement.querySelector(`[data-audience="${id}"]`).focus();
    };
    switchElement.addEventListener('click', (event) => {
        const button = event.target.closest('[data-audience]');
        if (button) select(button.dataset.audience, false);
    });
    switchElement.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const ids = audiences.map(([id]) => id);
        const index = ids.indexOf(switchElement.dataset.audience);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? ids.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + ids.length) % ids.length;
        select(ids[next], true);
    });
    const setSize = (stepper, value) => {
        const plan = Object.values(plans).flat().find((entry) => entry.id === stepper.dataset.plan);
        const { min, max } = plan.group;
        const size = Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : plan.group.start));
        groupSizes.set(plan.id, size);
        renderPlans(switchElement, grid, onChange);
        return plan;
    };
    grid.addEventListener('click', (event) => {
        const button = event.target.closest('[data-delta]');
        if (!button) return;
        const stepper = button.closest('.stepper');
        const plan = setSize(stepper, Number(stepper.querySelector('input').value) + Number(button.dataset.delta));
        const again = grid.querySelector(`.stepper[data-plan="${plan.id}"] [data-delta="${button.dataset.delta}"]`);
        (again && !again.disabled ? again : grid.querySelector(`#group-${plan.id}`)).focus();
    });
    grid.addEventListener('change', (event) => {
        const stepper = event.target.closest('.stepper');
        if (!stepper) return;
        const plan = setSize(stepper, Number(event.target.value));
        grid.querySelector(`#group-${plan.id}`).focus();
    });
}

// 33 · Tabla comparativa y alternativa en tarjetas para móvil.
export function renderComparison(container) {
    const all = [...plans.personas, ...plans.instituciones];
    const mark = (included) => included ? `<span class="yes" aria-label="${tr('Incluido', 'Included')}">✓</span>` : `<span class="no" aria-label="${tr('No incluido', 'Not included')}">—</span>`;
    container.innerHTML = `<table class="compare-table">
        <caption class="sr-only">${tr('Comparación de opciones', 'Comparison of options')}</caption>
        <thead><tr><th scope="col">${tr('Beneficio', 'Benefit')}</th>${all.map((plan) => `<th scope="col">${esc(t(plan.name))}</th>`).join('')}</tr></thead>
        <tbody>${plans.features.map(([key, label]) => `<tr><th scope="row">${esc(t(label))}</th>${all.map((plan) => `<td>${mark(plan.features[key])}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div class="compare-mobile">${all.map((plan) => `<details class="info-card"><summary><strong>${esc(t(plan.name))}</strong></summary>
        <ul class="feature-list" style="margin-top:12px">${plans.features.map(([key, label]) => `<li data-included="${plan.features[key]}">${esc(t(label))}</li>`).join('')}</ul></details>`).join('')}</div>`;
}
