// 30–35 · Página de precios.
import { courses } from './data.js';
import { $, tr, onLanguage, setTitle } from './ui.js';
import { renderPlans, renderComparison } from './pricing.js';
import { courseRow } from './edu.js';

onLanguage(() => {
    setTitle(tr('Precios', 'Pricing'));
    renderPlans($('price-audience'), $('price-plans'));
    renderComparison($('price-compare'));
    $('price-courses').innerHTML = courses.map((course) => courseRow(course)).join('');
});
