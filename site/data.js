// Datos locales de Solara. Cada texto visible tiene su pareja [español, inglés].
// Los cursos con `sample: true` tienen video real en `site/media/`.
// El resto son cursos en preparación: datos de demostración sin video.

export const courses = [
    {
        id: 'campo', topic: 'field-studies', title: 'Fundamentos de trabajo de campo', level: 'Inicial', price: 29, image: 'field', sample: true,
        description: 'Convierte una salida en una observación organizada con un registro que puedas consultar después.',
        lessons: [
            ['Antes de salir', 'Define una pregunta que puedas responder con una observación corta.'],
            ['Tu cuaderno de campo', 'Registra fecha, lugar y condiciones antes de anotar lo que observas.']
        ]
    },
    {
        id: 'biodiversidad', topic: 'biodiversity', title: 'Observación de biodiversidad', level: 'Intermedio', price: 39, image: 'biodiversity', sample: true,
        description: 'Aprende a describir la diversidad de un lugar y a comparar lo que encuentras en distintos recorridos.',
        lessons: [
            ['Mirar a distintas escalas', 'Compara lo que ves en el suelo con lo que encuentras en el dosel.'],
            ['Comparar observaciones', 'Usa el mismo recorrido y tiempo de observación al comparar dos visitas.']
        ]
    },
    {
        id: 'sendero', topic: 'field-studies', title: 'Lectura del paisaje', level: 'Inicial', price: 29, image: 'trail', sample: true,
        description: 'Interpreta las señales del terreno para reconocer cómo cambian el agua, la luz y la vegetación.',
        lessons: [
            ['Las pistas del terreno', 'Identifica pendientes y puntos bajos para seguir el recorrido del agua.'],
            ['Luz y vegetación', 'Compara una zona abierta con otra bajo sombra y anota sus diferencias.']
        ]
    }
];

export const englishCourses = {
    campo: ['Fieldwork fundamentals', 'Turn an outing into a structured observation you can refer back to later.', [
        ['Before you head out', 'Define a specific question. Choose a place and a time to observe.'],
        ['Your field notebook', 'Write down the date, place and weather. Separate what you see from your interpretations.']
    ]],
    biodiversidad: ['Observing biodiversity', 'Describe local diversity and compare what you find on different walks.', [
        ['Looking at different scales', 'Observe the ground, understory and canopy. Describe one difference between each layer.'],
        ['Comparing observations', 'Repeat the same route and observation period. Note what changes between two visits.']
    ]],
    sendero: ['Reading the landscape', 'Read the terrain to understand how water, light and vegetation change.', [
        ['Clues in the terrain', 'Look for slopes, channels and low areas. Draw the likely path of the water.'],
        ['Light and vegetation', 'Choose a sunny spot and a shaded one. Compare moisture and vegetation.']
    ]]
};

// Catálogo formativo del Documento Maestro (sección 06): 20 cursos en tres olas de lanzamiento.
// Grupo A = lanzamiento prioritario, B = segunda ola, C = expansión. Sin precio, nivel ni videos todavía.
// El área (`topic`) de cada curso es una asignación a las seis áreas de la sección 05.
const catalog = [
    { n: 1, id: 'gestion-riesgos', wave: 'A', topic: 'camp-management', image: 'trail',
      es: ['Gestión de riesgos outdoor para escuelas, campamentos y programas juveniles', 'Evaluación de riesgos, diseño de protocolos, gestión de incidentes, procedimientos de emergencia y documentación de seguridad.', 'Directores de campamento, administradores escolares y coordinadores de programas al aire libre'],
      en: ['Outdoor Risk Management for Schools, Camps & Youth Programs', 'Risk assessment, protocol design, incident management, emergency procedures and safety documentation.', 'Camp directors, school administrators and outdoor program coordinators'],
      topics: [['Evaluación de riesgos', 'Risk assessment'], ['Diseño de protocolos', 'Protocol design'], ['Gestión de incidentes', 'Incident management'], ['Procedimientos de emergencia', 'Emergency procedures'], ['Documentación de seguridad', 'Safety documentation']] },
    { n: 2, id: 'diseno-programas-outdoor', wave: 'A', topic: 'experiential-education', image: 'forest',
      es: ['Diseño y liderazgo de programas de educación al aire libre', 'Diseño de programas, objetivos de aprendizaje, planificación de experiencias, selección de actividades, evaluación de resultados y gestión de grupos.', 'Docentes, educadores al aire libre, directores de campamento y líderes de programas juveniles'],
      en: ['Outdoor Education Program Design & Leadership', 'Program design, learning objectives, experience planning, activity selection, outcome evaluation and group management.', 'Teachers, outdoor educators, camp directors and youth program leaders'],
      topics: [['Diseño de programas', 'Program design'], ['Objetivos de aprendizaje', 'Learning objectives'], ['Planificación de experiencias', 'Experience planning'], ['Selección de actividades', 'Activity selection'], ['Evaluación de resultados', 'Outcome evaluation'], ['Gestión de grupos', 'Group management']] },
    { n: 3, id: 'forest-school', wave: 'A', topic: 'experiential-education', image: 'forest',
      es: ['Introducción a Forest School y al aprendizaje basado en la naturaleza', 'Principios de Forest School, aprendizaje dirigido por el estudiante, juego en la naturaleza, exploración, observación y desarrollo integral. Es un curso introductorio, no una cualificación oficial Level 3.', 'Docentes, educadores de primera infancia, familias y practicantes del aprendizaje en la naturaleza'],
      en: ['Introduction to Forest School & Nature-Based Learning', 'Forest School principles, learner-led learning, nature play, exploration, observation and holistic development. An introductory course, not an official Level 3 qualification.', 'Teachers, early childhood educators, parents and nature-based learning practitioners'],
      topics: [['Principios de Forest School', 'Forest School principles'], ['Aprendizaje dirigido por el estudiante', 'Learner-led learning'], ['Juego en la naturaleza', 'Nature play'], ['Exploración y observación', 'Exploration and observation'], ['Desarrollo integral', 'Holistic development']] },
    { n: 4, id: 'curriculo-ambiental', wave: 'A', topic: 'biodiversity', image: 'biodiversity',
      es: ['Diseño curricular en educación ambiental', 'Currículos ambientales, objetivos pedagógicos, secuencias de actividades, sistemas de evaluación, proyectos de conservación y experiencias interdisciplinarias.', 'Docentes, diseñadores curriculares, educadores ambientales y ONG'],
      en: ['Environmental Education Curriculum Design', 'Environmental curricula, teaching objectives, activity sequences, assessment systems, conservation projects and interdisciplinary experiences.', 'Teachers, curriculum designers, environmental educators and NGOs'],
      topics: [['Currículos ambientales', 'Environmental curricula'], ['Objetivos pedagógicos', 'Teaching objectives'], ['Secuencias de actividades', 'Activity sequences'], ['Sistemas de evaluación', 'Assessment systems'], ['Proyectos de conservación', 'Conservation projects'], ['Experiencias interdisciplinarias', 'Interdisciplinary experiences']] },
    { n: 5, id: 'camp-counselor', wave: 'A', topic: 'camp-management', image: 'field',
      es: ['Formación de camp counselors y personal de programas juveniles', 'Supervisión de menores, comunicación efectiva, resolución de conflictos, manejo de grupos, conducción de actividades, responsabilidades del counselor y profesionalismo.', 'Aspirantes a camp counselor, personal de temporada y operadores de campamentos'],
      en: ['Camp Counselor & Youth Program Staff Training', 'Supervising minors, effective communication, conflict resolution, group management, leading activities, counselor responsibilities and professionalism.', 'Aspiring camp counselors, seasonal staff and camp operators'],
      topics: [['Supervisión de menores', 'Supervising minors'], ['Comunicación efectiva', 'Effective communication'], ['Resolución de conflictos', 'Conflict resolution'], ['Manejo de grupos', 'Group management'], ['Conducción de actividades', 'Leading activities'], ['Responsabilidades y profesionalismo', 'Responsibilities and professionalism']] },
    { n: 6, id: 'stem-outdoor', wave: 'A', topic: 'field-studies', image: 'field',
      es: ['STEM al aire libre y educación científica experiencial', 'Enseñanza STEM mediante experimentos de campo y observación directa de ecosistemas, biodiversidad, agua, suelo y fenómenos naturales.', 'Docentes de STEM y ciencias, escuelas y programas after-school'],
      en: ['Outdoor STEM & Experiential Science Education', 'Teaching STEM through field experiments and direct observation of ecosystems, biodiversity, water, soil and natural phenomena.', 'STEM teachers, science educators, schools and after-school programs'],
      topics: [['Experimentos de campo', 'Field experiments'], ['Ecosistemas y biodiversidad', 'Ecosystems and biodiversity'], ['Agua y suelo', 'Water and soil'], ['Fenómenos naturales', 'Natural phenomena']] },
    { n: 7, id: 'cambio-climatico', wave: 'B', topic: 'biodiversity', image: 'biodiversity',
      es: ['Educación sobre cambio climático para docentes', 'Enseñanza del cambio climático, alfabetización climática, estrategias de adaptación y mitigación y diseño de actividades educativas aplicadas.', 'Docentes'],
      en: ['Climate Change Education for Teachers', 'Teaching climate change, climate literacy, adaptation and mitigation strategies and designing applied learning activities.', 'Teachers'],
      topics: [['Alfabetización climática', 'Climate literacy'], ['Adaptación y mitigación', 'Adaptation and mitigation'], ['Actividades educativas aplicadas', 'Applied learning activities']] },
    { n: 8, id: 'liderazgo-outdoor', wave: 'B', topic: 'youth-leadership', image: 'field',
      es: ['Liderazgo al aire libre y facilitación de team building', 'Liderazgo al aire libre, dinámicas grupales, comunicación, construcción de confianza, resolución colaborativa de problemas y facilitación de experiencias formativas.', 'Facilitadores y líderes de grupos'],
      en: ['Outdoor Leadership & Team Building Facilitation', 'Outdoor leadership, group dynamics, communication, trust building, collaborative problem solving and facilitating learning experiences.', 'Facilitators and group leaders'],
      topics: [['Liderazgo al aire libre', 'Outdoor leadership'], ['Dinámicas grupales', 'Group dynamics'], ['Construcción de confianza', 'Trust building'], ['Resolución colaborativa de problemas', 'Collaborative problem solving'], ['Facilitación de experiencias', 'Facilitating experiences']] },
    { n: 9, id: 'leave-no-trace', wave: 'B', topic: 'outdoor-skills', image: 'trail',
      es: ['Leave No Trace y ética outdoor', 'Impacto ambiental, ética outdoor, gestión responsable de residuos, campamentos de bajo impacto y prácticas de conservación.', 'Educadores y operadores de actividades al aire libre'],
      en: ['Leave No Trace & Outdoor Ethics', 'Environmental impact, outdoor ethics, responsible waste management, low-impact camping and conservation practices.', 'Educators and outdoor activity operators'],
      topics: [['Análisis de impacto ambiental', 'Environmental impact analysis'], ['Ética outdoor', 'Outdoor ethics'], ['Gestión de residuos', 'Waste management'], ['Campamentos de bajo impacto', 'Low-impact camping']] },
    { n: 10, id: 'oceanos', wave: 'B', topic: 'biodiversity', image: 'biodiversity',
      es: ['Alfabetización oceánica y educación en conservación marina', 'Ecosistemas marinos, contaminación, biodiversidad marina, conservación y pedagogía oceánica, con una conexión especial con Costa Rica.', 'Docentes y educadores ambientales'],
      en: ['Ocean Literacy & Marine Conservation Education', 'Marine ecosystems, pollution, marine biodiversity, conservation and ocean pedagogy, with a special connection to Costa Rica.', 'Teachers and environmental educators'],
      topics: [['Ecosistemas marinos', 'Marine ecosystems'], ['Contaminación', 'Pollution'], ['Biodiversidad marina', 'Marine biodiversity'], ['Pedagogía oceánica', 'Ocean pedagogy']] },
    { n: 11, id: 'fauna-silvestre', wave: 'B', topic: 'biodiversity', image: 'biodiversity',
      es: ['Educación en biodiversidad y fauna silvestre', 'Identificación de especies, principios de conservación, funcionamiento de ecosistemas, educación sobre fauna silvestre y actividades de observación respetuosa.', 'Educadores y guías'],
      en: ['Biodiversity & Wildlife Education', 'Species identification, conservation principles, how ecosystems work, wildlife education and respectful observation activities.', 'Educators and guides'],
      topics: [['Identificación de especies', 'Species identification'], ['Principios de conservación', 'Conservation principles'], ['Funcionamiento de ecosistemas', 'How ecosystems work'], ['Observación respetuosa', 'Respectful observation']] },
    { n: 12, id: 'giras-educativas', wave: 'B', topic: 'field-studies', image: 'trail',
      es: ['Planificación y gestión de giras educativas', 'Diseño de excursiones educativas: presupuestos, autorizaciones, itinerarios, objetivos pedagógicos, coordinación con proveedores y comunicación con familias.', 'Docentes y coordinadores escolares'],
      en: ['Educational Field Trip Planning & Management', 'Designing educational trips: budgets, permissions, itineraries, learning goals, supplier coordination and communication with families.', 'Teachers and school coordinators'],
      topics: [['Presupuestos', 'Budgets'], ['Autorizaciones', 'Permissions'], ['Itinerarios', 'Itineraries'], ['Objetivos pedagógicos', 'Learning goals'], ['Coordinación con proveedores', 'Supplier coordination'], ['Comunicación con familias', 'Communication with families']] },
    { n: 13, id: 'summer-camp', wave: 'C', topic: 'camp-management', image: 'forest',
      es: ['Diseño y gestión de programas de summer camp', 'Temporadas completas de campamento: horarios, programación de actividades, gestión de personal, experiencia de los participantes y evaluación de cierre.', 'Directores y coordinadores de campamentos'],
      en: ['Summer Camp Program Design & Management', 'Full camp seasons: schedules, activity programming, staff management, participant experience and end-of-season evaluation.', 'Camp directors and coordinators'],
      topics: [['Diseño de temporada', 'Season design'], ['Horarios', 'Schedules'], ['Programación de actividades', 'Activity programming'], ['Gestión de personal', 'Staff management'], ['Evaluación de cierre', 'End-of-season evaluation']] },
    { n: 14, id: 'proteccion-menores', wave: 'C', topic: 'camp-management', image: 'field',
      es: ['Protección de menores para campamentos y programas al aire libre', 'Protección de menores, límites profesionales, prevención de abuso, identificación temprana de riesgos, canales de reporte y protocolos institucionales. Requiere revisión de especialistas y no es una certificación oficial.', 'Campamentos y programas al aire libre'],
      en: ['Child Safeguarding for Camps & Outdoor Programs', 'Child protection, professional boundaries, abuse prevention, early risk identification, reporting channels and institutional protocols. Requires specialist review and is not an official certification.', 'Camps and outdoor programs'],
      topics: [['Protección de menores', 'Child protection'], ['Límites profesionales', 'Professional boundaries'], ['Prevención de abuso', 'Abuse prevention'], ['Canales de reporte', 'Reporting channels'], ['Protocolos institucionales', 'Institutional protocols']] },
    { n: 15, id: 'supervivencia', wave: 'C', topic: 'outdoor-skills', image: 'trail',
      es: ['Habilidades de supervivencia y conciencia en la naturaleza', 'Preparación previa, orientación básica, lectura de mapas, planificación de excursiones, selección de equipo y seguridad. En línea es solo introductorio y no certifica competencia práctica.', 'Personas interesadas en actividades al aire libre'],
      en: ['Outdoor Survival Skills & Wilderness Awareness', 'Preparation, basic orientation, map reading, trip planning, gear selection and safety. Online it is introductory only and does not certify practical competence.', 'People interested in outdoor activities'],
      topics: [['Preparación previa', 'Preparation'], ['Orientación y lectura de mapas', 'Orientation and map reading'], ['Planificación de excursiones', 'Trip planning'], ['Selección de equipo', 'Gear selection'], ['Principios de seguridad', 'Safety principles']] },
    { n: 16, id: 'interpretacion', wave: 'C', topic: 'field-studies', image: 'forest',
      es: ['Interpretación de la naturaleza y guiado ambiental', 'Interpretación de ecosistemas, storytelling ambiental, comunicación científica accesible y facilitación de experiencias para visitantes y estudiantes.', 'Guías y educadores'],
      en: ['Nature Interpretation & Environmental Guiding', 'Interpreting ecosystems, environmental storytelling, accessible science communication and facilitating experiences for visitors and students.', 'Guides and educators'],
      topics: [['Interpretación de ecosistemas', 'Interpreting ecosystems'], ['Storytelling ambiental', 'Environmental storytelling'], ['Comunicación científica accesible', 'Accessible science communication']] },
    { n: 17, id: 'turismo-sostenible', wave: 'C', topic: 'biodiversity', image: 'trail',
      es: ['Educación en turismo sostenible y ecoturismo', 'Turismo responsable, gestión del impacto ambiental, interpretación cultural, diseño de experiencias educativas y prácticas sostenibles.', 'Profesionales del turismo y operadores educativos'],
      en: ['Sustainable Tourism & Ecotourism Education', 'Responsible tourism, environmental impact management, cultural interpretation, educational experience design and sustainable practices.', 'Tourism professionals and education operators'],
      topics: [['Turismo responsable', 'Responsible tourism'], ['Gestión del impacto', 'Impact management'], ['Interpretación cultural', 'Cultural interpretation'], ['Prácticas sostenibles', 'Sustainable practices']] },
    { n: 18, id: 'aprendizaje-proyectos', wave: 'C', topic: 'experiential-education', image: 'forest',
      es: ['Aprendizaje experiencial y basado en proyectos', 'Diseño de proyectos educativos, aprendizaje con experiencias directas, reflexión guiada, evaluación por competencias y transferencia a la vida real.', 'Docentes y educadores'],
      en: ['Experiential Learning & Project-Based Education', 'Designing educational projects, learning through direct experience, guided reflection, competency-based assessment and real-life transfer.', 'Teachers and educators'],
      topics: [['Diseño de proyectos', 'Project design'], ['Experiencias directas', 'Direct experiences'], ['Reflexión guiada', 'Guided reflection'], ['Evaluación por competencias', 'Competency-based assessment']] },
    { n: 19, id: 'aprendizaje-servicio', wave: 'C', topic: 'youth-leadership', image: 'field',
      es: ['Aprendizaje-servicio y proyectos ambientales comunitarios', 'Proyectos de aprendizaje-servicio, participación juvenil, voluntariado educativo, impacto social y evaluación de resultados en comunidad.', 'Organizaciones juveniles y comunitarias'],
      en: ['Service Learning & Environmental Community Projects', 'Service-learning projects, youth participation, educational volunteering, social impact and evaluating community outcomes.', 'Youth and community organizations'],
      topics: [['Proyectos de aprendizaje-servicio', 'Service-learning projects'], ['Participación juvenil', 'Youth participation'], ['Voluntariado educativo', 'Educational volunteering'], ['Evaluación de resultados', 'Outcome evaluation']] },
    { n: 20, id: 'actividades-ninos', wave: 'C', topic: 'youth-leadership', image: 'trail',
      es: ['Diseño de actividades al aire libre para niños y adolescentes', 'Actividades por rangos de edad, retos progresivos, dinámicas grupales, juegos educativos, espacios de reflexión y aprendizaje práctico al aire libre.', 'Educadores, campamentos y programas juveniles'],
      en: ['Outdoor Activity Design for Children & Teenagers', 'Age-appropriate activities, progressive challenges, group dynamics, educational games, reflection time and hands-on outdoor learning.', 'Educators, camps and youth programs'],
      topics: [['Actividades por edad', 'Age-appropriate activities'], ['Retos progresivos', 'Progressive challenges'], ['Juegos educativos', 'Educational games'], ['Espacios de reflexión', 'Reflection time']] }
];

export const waves = {
    A: ['Lanzamiento prioritario', 'Priority launch'],
    B: ['Segunda ola', 'Second wave'],
    C: ['Expansión del catálogo', 'Catalog expansion']
};

for (const entry of catalog) {
    courses.push({
        id: entry.id, number: entry.n, wave: entry.wave, topic: entry.topic, level: null, price: null, image: entry.image, sample: false,
        title: entry.es[0], description: entry.es[1], audience: [entry.es[2], entry.en[2]],
        lessons: entry.topics.map(([es]) => [es, `${es}.`])
    });
    englishCourses[entry.id] = [entry.en[0], entry.en[1], entry.topics.map(([, en]) => [en, `${en}.`])];
}

// Escuelas: las seis áreas principales de conocimiento (sección 05). `topic` coincide con `course.topic`.
export const schools = [
    {
        id: 'campo', topic: 'field-studies', image: 'field', color: 'lime', shape: 'compass',
        title: ['Estudios de campo y exploración natural', 'Field Studies & Nature Exploration'],
        description: ['Trabajo de campo, exploración, observación, investigación, orientación, cartografía y expediciones.', 'Fieldwork, exploration, observation, research, orientation, mapping and expeditions.']
    },
    {
        id: 'biodiversidad', topic: 'biodiversity', image: 'biodiversity', color: 'leaf', shape: 'leaf',
        title: ['Naturaleza, biodiversidad y educación ambiental', 'Nature, Biodiversity & Environmental Education'],
        description: ['Biodiversidad, flora, fauna, ecosistemas, conservación, sostenibilidad, cambio climático y recursos naturales.', 'Biodiversity, flora, fauna, ecosystems, conservation, sustainability, climate change and natural resources.']
    },
    {
        id: 'aire-libre', topic: 'outdoor-skills', image: 'trail', color: 'sky', shape: 'mountain',
        title: ['Habilidades al aire libre y educación de aventura', 'Outdoor Skills & Adventure Education'],
        description: ['Camping, senderismo, supervivencia básica, bushcraft, navegación, seguridad outdoor y actividades de aventura.', 'Camping, hiking, basic survival, bushcraft, navigation, outdoor safety and adventure activities.']
    },
    {
        id: 'experiencial', topic: 'experiential-education', image: 'forest', color: 'sun', shape: 'sun',
        title: ['Educación experiencial y alternativa', 'Experiential & Alternative Education'],
        description: ['Aprendizaje práctico, aprendizaje basado en proyectos, Forest School, aprendizaje al aire libre y diseño de experiencias educativas.', 'Hands-on learning, project-based learning, Forest School, outdoor learning and educational experience design.']
    },
    {
        id: 'liderazgo', topic: 'youth-leadership', image: 'field', color: 'clay', shape: 'people',
        title: ['Desarrollo juvenil y liderazgo', 'Youth Development & Leadership'],
        description: ['Liderazgo, trabajo en equipo, comunicación, resolución de problemas, habilidades para la vida y desarrollo personal.', 'Leadership, teamwork, communication, problem solving, life skills and personal development.']
    },
    {
        id: 'campamentos', topic: 'camp-management', image: 'forest', color: 'moss', shape: 'tent',
        title: ['Gestión de campamentos y educación recreativa', 'Camp Management & Recreation Education'],
        description: ['Administración de campamentos, formación de consejeros, programación de actividades, gestión de grupos, recreación educativa y operaciones.', 'Camp administration, counselor training, activity programming, group management, recreation education and operations.']
    }
];

// Identificadores antiguos que deben seguir funcionando en `escuelas.html?area=`.
export const schoolAliases = { paisaje: 'campo' };

// Rutas de aprendizaje: propuestas que agrupan cursos del catálogo según el comprador indicado en el documento.
export const paths = [
    {
        id: 'observador-de-campo', school: 'campo', requires: [],
        title: ['Primeros pasos en el campo', 'First steps in the field'],
        description: ['Las clases de muestra disponibles hoy: preparar una salida, observar la biodiversidad y leer el paisaje.', 'The sample lessons available today: prepare an outing, observe biodiversity and read the landscape.'],
        courses: ['campo', 'biodiversidad', 'sendero']
    },
    {
        id: 'direccion-campamentos', school: 'campamentos', requires: [],
        title: ['Dirección de campamentos y programas juveniles', 'Leading camps and youth programs'],
        description: ['Para directores de campamento y coordinadores: riesgos, personal, protección de menores y temporadas completas.', 'For camp directors and coordinators: risk, staff, child safeguarding and full seasons.'],
        courses: ['gestion-riesgos', 'camp-counselor', 'proteccion-menores', 'summer-camp']
    },
    {
        id: 'educacion-aire-libre', school: 'experiencial', requires: ['observador-de-campo'],
        title: ['Educación al aire libre para docentes', 'Outdoor education for teachers'],
        description: ['Para docentes y educadores: diseño de programas, Forest School, STEM al aire libre y aprendizaje por proyectos.', 'For teachers and educators: program design, Forest School, outdoor STEM and project-based learning.'],
        courses: ['diseno-programas-outdoor', 'forest-school', 'stem-outdoor', 'aprendizaje-proyectos']
    },
    {
        id: 'educacion-ambiental', school: 'biodiversidad', requires: ['observador-de-campo'],
        title: ['Educación ambiental y conservación', 'Environmental education and conservation'],
        description: ['Para educadores ambientales y ONG: currículo ambiental, cambio climático, océanos y fauna silvestre.', 'For environmental educators and NGOs: environmental curriculum, climate change, oceans and wildlife.'],
        courses: ['curriculo-ambiental', 'cambio-climatico', 'oceanos', 'fauna-silvestre']
    },
    {
        id: 'liderazgo-juvenil', school: 'liderazgo', requires: ['educacion-aire-libre'],
        title: ['Liderazgo juvenil y comunidad', 'Youth leadership and community'],
        description: ['Facilitación de grupos, aprendizaje-servicio y actividades para niños y adolescentes.', 'Group facilitation, service learning and activities for children and teenagers.'],
        courses: ['liderazgo-outdoor', 'aprendizaje-servicio', 'actividades-ninos']
    },
    {
        id: 'guias-y-salidas', school: 'aire-libre', requires: ['observador-de-campo'],
        title: ['Guías y salidas educativas', 'Guides and educational outings'],
        description: ['Planificar giras, interpretar la naturaleza y moverse con ética y seguridad en el campo.', 'Plan trips, interpret nature and move ethically and safely in the field.'],
        courses: ['giras-educativas', 'interpretacion', 'leave-no-trace', 'supervivencia', 'turismo-sostenible']
    }
];

// Sin perfiles confirmados todavía: se muestran las funciones del equipo, no personas.
export const teachers = [
    { id: 'guia-campo', initials: 'GC', name: ['Guía de campo', 'Field guide'], role: ['Perfil por publicar', 'Profile coming soon'], courses: ['campo', 'sendero', 'stem-outdoor', 'giras-educativas', 'interpretacion', 'leave-no-trace', 'supervivencia'] },
    { id: 'naturalista', initials: 'EA', name: ['Educación ambiental', 'Environmental education'], role: ['Perfil por publicar', 'Profile coming soon'], courses: ['biodiversidad', 'curriculo-ambiental', 'cambio-climatico', 'oceanos', 'fauna-silvestre', 'turismo-sostenible'] },
    { id: 'facilitacion', initials: 'EJ', name: ['Educación experiencial y juventud', 'Experiential education and youth'], role: ['Perfil por publicar', 'Profile coming soon'], courses: ['diseno-programas-outdoor', 'forest-school', 'aprendizaje-proyectos', 'liderazgo-outdoor', 'aprendizaje-servicio', 'actividades-ninos'] },
    { id: 'campamentos', initials: 'OC', name: ['Operación de campamentos', 'Camp operations'], role: ['Perfil por publicar', 'Profile coming soon'], courses: ['gestion-riesgos', 'camp-counselor', 'proteccion-menores', 'summer-camp'] }
];

// Testimonios de EJEMPLO: no son personas reales. Se muestran con la etiqueta «Ejemplo».
export const testimonials = [
    {
        role: ['Coordinación académica', 'Academic coordinator'], context: ['Colegio de secundaria', 'Secondary school'], image: 'field',
        quote: ['«El grupo volvió con preguntas propias y un cuaderno que pudimos revisar en clase.»', '“The group came back with their own questions and a notebook we could review in class.”'],
        label: ['Resultado', 'Outcome'], result: ['Gira educativa', 'Field trip']
    },
    {
        role: ['Estudiante', 'Student'], context: ['Curso de biodiversidad', 'Biodiversity course'], image: 'biodiversity',
        quote: ['«Aprendí a comparar dos recorridos sin quedarme solo con la primera impresión.»', '“I learned to compare two walks instead of sticking to my first impression.”'],
        label: ['Aprendió a', 'Learned to'], result: ['Comparar observaciones', 'Compare observations']
    },
    {
        role: ['Familia', 'Family'], context: ['Programa vacacional', 'Holiday program'], image: 'forest',
        quote: ['«Sabíamos en todo momento quién acompañaba al grupo y qué actividad tocaba.»', '“We always knew who was with the group and what activity came next.”'],
        label: ['Valoró', 'Valued'], result: ['Supervisión clara', 'Clear supervision']
    },
    {
        role: ['Joven CIT', 'CIT participant'], context: ['Ruta de liderazgo', 'Leadership pathway'], image: 'trail',
        quote: ['«Coordinar un tramo del sendero me ayudó a escuchar más al equipo.»', '“Leading part of the trail helped me listen more to the team.”'],
        label: ['Practicó', 'Practiced'], result: ['Liderazgo de grupo', 'Group leadership']
    }
];

// Formatos de entrega del portafolio (sección 4.4), presentados en la sección de comunidad.
export const events = [
    {
        color: 'sky', image: 'field', href: './programas.html',
        title: ['Experiencias de campo', 'Field learning experiences'],
        text: ['Aprendizaje aplicado directamente en entornos reales y naturales.', 'Learning applied directly in real, natural settings.']
    },
    {
        color: 'sun', image: 'forest', href: './programas.html',
        title: ['Talleres y webinars', 'Workshops and webinars'],
        text: ['Espacios prácticos y concentrados, y sesiones en línea en vivo.', 'Focused hands-on sessions and live online sessions.']
    },
    {
        color: 'lime', image: 'trail', href: './publico.html',
        title: ['Capacitación institucional', 'Institutional training'],
        text: ['Formación diseñada para equipos internos de escuelas, campamentos y organizaciones.', 'Training designed for the teams of schools, camps and organizations.']
    }
];

export const goals = [
    ['Observar mejor', 'Observe more closely'], ['Liderar un grupo', 'Lead a group'], ['Diseñar salidas', 'Design outings'],
    ['Cuidar el entorno', 'Care for nature'], ['Trabajar en equipo', 'Work as a team'], ['Registrar hallazgos', 'Record findings'],
    ['Leer el paisaje', 'Read the landscape']
];

// Campaña promocional. Sin campaña real: `active: false`.
// Para revisar el diseño se puede abrir `/?promo=preview`; muestra una vista previa sin precio.
export const promotion = {
    active: false,
    title: ['', ''],
    subtitle: ['', ''],
    price: null,
    previousPrice: null,
    endsAt: null,
    href: './precios.html'
};

// Planes de Solara. `price: null` se muestra como «Por confirmar». Precios en USD de muestra.
export const plans = {
    personas: [
        {
            id: 'muestra', name: ['Lecciones de muestra', 'Sample lessons'], period: ['Acceso libre', 'Open access'],
            seats: ['Para 1 estudiante', 'For 1 student'], price: 0, cta: ['Ver clases de muestra', 'Watch sample lessons'], href: './catalogo.html?muestra=1',
            features: { samples: true, syllabus: true, progress: true, full: false, group: false, guide: false }
        },
        {
            id: 'curso', name: ['Curso individual', 'Single course'], period: ['Pago único de ejemplo', 'Sample one-time price'],
            seats: ['Para 1 estudiante', 'For 1 student'], price: 29, from: true, highlight: true, cta: ['Elegir un curso', 'Choose a course'], href: './catalogo.html',
            features: { samples: true, syllabus: true, progress: true, full: true, group: false, guide: false }
        }
    ],
    instituciones: [
        {
            id: 'gira', name: ['Programas a medida', 'Custom programs'], period: ['Por proyecto', 'Per project'],
            seats: ['Escuelas, campamentos, ONG y entidades públicas', 'Schools, camps, NGOs and public bodies'], price: null, cta: ['Ver soluciones', 'View solutions'], href: './programas.html',
            features: { samples: true, syllabus: true, progress: true, full: true, group: true, guide: true }
        },
        {
            id: 'grupo', name: ['Capacitación institucional', 'Institutional training'], period: ['Por participante', 'Per participant'],
            seats: ['De 5 a 40 estudiantes', '5 to 40 students'], price: null, group: { min: 5, max: 40, step: 1, start: 10 }, highlight: true,
            cta: ['Consultar disponibilidad', 'Ask about availability'], href: './contacto.html',
            features: { samples: true, syllabus: true, progress: true, full: true, group: true, guide: false }
        }
    ],
    features: [
        ['samples', ['Lecciones de muestra en video', 'Sample video lessons']],
        ['syllabus', ['Temario completo de cada curso', 'Full syllabus for each course']],
        ['progress', ['Progreso guardado en este navegador', 'Progress saved in this browser']],
        ['full', ['Todas las lecciones del curso', 'Every lesson in the course']],
        ['group', ['Seguimiento por grupo', 'Group follow-up']],
        ['guide', ['Acompañamiento de guías en el campo', 'Guides in the field']]
    ]
};

// Medios de pago. PayPal está en vista previa: sin cuenta ni Client ID no se abre ni se cobra nada.
// Para activarlo: cuenta de PayPal Business, Client ID público aquí y un Worker que cree y capture
// la orden con la clave secreta (guardada con `wrangler secret put`, nunca en este archivo).
export const payments = {
    paypal: { enabled: false, clientId: null, currency: 'USD' }
};

export const footerColumns = [
    {
        title: ['Escuelas', 'Schools'], wide: true,
        links: schools.map((school) => [school.title, `./escuelas.html?area=${school.id}`])
    },
    {
        title: ['Solara', 'Solara'],
        links: [
            [['Programas', 'Programs'], './programas.html'],
            [['Público', 'Who it’s for'], './publico.html'],
            [['Sobre nosotros', 'About us'], './nosotros.html'],
            [['Becas', 'Scholarships'], './programas.html#becas'],
            [['Blog', 'Blog'], './blog.html']
        ]
    },
    {
        title: ['Aprender', 'Learn'],
        links: [
            [['Catálogo de cursos', 'Course catalog'], './catalogo.html'],
            [['Rutas de aprendizaje', 'Learning paths'], './ruta.html'],
            [['Precios de muestra', 'Sample prices'], './precios.html']
        ]
    },
    {
        title: ['Soporte', 'Support'],
        links: [
            [['Preguntas frecuentes', 'FAQ'], './contacto.html#preguntas'],
            [['Contacto', 'Contact'], './contacto.html']
        ]
    }
];

export const findCourse = (id) => courses.find((course) => course.id === id);
export const findSchool = (id) => schools.find((school) => school.id === (schoolAliases[id] ?? id));
export const findPath = (id) => paths.find((path) => path.id === id);
export const coursesForSchool = (school) => courses.filter((course) => course.topic === school.topic);
export const pathsForSchool = (school) => paths.filter((path) => path.school === school.id || path.courses.some((id) => findCourse(id)?.topic === school.topic));
export const pathsForCourse = (id) => paths.filter((path) => path.courses.includes(id));
export const teachersForCourse = (id) => teachers.filter((teacher) => teacher.courses.includes(id));
