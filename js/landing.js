// Landing pública. Cada bloque se protege por si su sección no se renderiza (p. ej. sin proyectos publicados).
(() => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const whatsAppUrl = document.body.dataset.whatsapp || '';

    // Navegación: fondo al hacer scroll, barra de lectura y sección activa
    const nav = $('#nav'), readBar = $('#readBar'), navLinks = $$('.nav-links a');
    const navSections = navLinks.map(a => $(a.getAttribute('href')));
    const updateNav = () => {
        nav.classList.toggle('scrolled', scrollY > 20);
        const max = document.documentElement.scrollHeight - innerHeight;
        readBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
        let current = -1;
        navSections.forEach((section, i) => { if (section && section.getBoundingClientRect().top < innerHeight * .4) current = i; });
        navLinks.forEach((a, i) => a.classList.toggle('active', i === current && navSections[i].getBoundingClientRect().bottom > innerHeight * .4));
    };
    addEventListener('scroll', updateNav, { passive: true });
    updateNav();

    // Menú móvil
    const burger = $('#burger'), mobileMenu = $('#mobileMenu');
    if (burger && mobileMenu) {
        const setMenu = open => {
            mobileMenu.classList.toggle('open', open);
            document.body.classList.toggle('menu-open', open);
            burger.setAttribute('aria-expanded', String(open));
            burger.querySelector('.ms').textContent = open ? 'close' : 'menu';
        };
        burger.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
        $$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    }

    // Aparición al hacer scroll
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
    }), { threshold: .15 });
    $$('.reveal, #payBar').forEach(el => revealObserver.observe(el));

    // Frase rotativa del hero
    const rotator = $('#rot');
    if (rotator && !reducedMotion) {
        const words = ['te encuentren', 'te escriban', 'reserven solos', 'te compren', 'confíen en ti'];
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        let index = 0;
        const type = async word => {
            for (let i = rotator.textContent.length; i >= 0; i--) { rotator.textContent = rotator.textContent.slice(0, i); await wait(28); }
            for (let i = 1; i <= word.length; i++) { rotator.textContent = word.slice(0, i); await wait(55); }
        };
        setInterval(() => { index = (index + 1) % words.length; type(words[index]); }, 2800);
    }

    // Inclinación del navegador del hero
    const stage = $('#stage'), browser = $('#browser');
    if (stage && browser) {
        stage.addEventListener('mousemove', e => {
            const r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            browser.style.transform = `perspective(1400px) rotateY(${-8 + x * 10}deg) rotateX(${3 - y * 8}deg)`;
        });
        stage.addEventListener('mouseleave', () => browser.style.transform = '');
    }

    // Partículas del hero (reaccionan al puntero)
    const canvas = $('#particles');
    if (canvas && !reducedMotion) {
        const ctx = canvas.getContext('2d'), hero = canvas.closest('.hero');
        const colors = ['74,158,255', '0,217,163', '167,139,250'];
        const dpr = Math.min(devicePixelRatio || 1, 2);
        let particles = [], frame, mouse = { x: -999, y: -999 };
        const resize = () => {
            const r = canvas.getBoundingClientRect();
            canvas.width = r.width * dpr; canvas.height = r.height * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = Math.min(110, Math.floor(r.width * r.height / 13000));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * r.width, y: Math.random() * r.height,
                vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5,
                size: Math.random() * 2 + 1, color: colors[Math.random() * 3 | 0], alpha: Math.random() * .5 + .3
            }));
        };
        const tick = () => {
            const w = canvas.width / dpr, h = canvas.height / dpr;
            ctx.clearRect(0, 0, w, h);
            for (const p of particles) {
                const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
                if (d < 120) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = w; if (p.x > w) p.x = 0; if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
                ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
            }
            ctx.lineWidth = 1;
            for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j], d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < 110) { ctx.strokeStyle = `rgba(74,158,255,${.22 * (1 - d / 110)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
            }
            for (const p of particles) {
                const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
                if (d < 170) { ctx.strokeStyle = `rgba(0,217,163,${.35 * (1 - d / 170)})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
            }
            frame = requestAnimationFrame(tick);
        };
        hero.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
        hero.addEventListener('pointerleave', () => mouse = { x: -999, y: -999 });
        new ResizeObserver(resize).observe(canvas);
        // Solo anima mientras el hero está a la vista y la pestaña activa
        new IntersectionObserver(([entry]) => { cancelAnimationFrame(frame); if (entry.isIntersecting) tick(); }).observe(hero);
        document.addEventListener('visibilitychange', () => { cancelAnimationFrame(frame); if (!document.hidden) tick(); });
    }

    // Diagnóstico de 3 preguntas
    const quiz = $('#quiz');
    if (quiz) {
        const steps = $$('.step', quiz), bar = $('#qBar'), label = $('#qLabel'), result = $('#result');
        let answers = [];
        const recommendations = {
            servicios: { title: 'Página web + sistema de citas en línea', match: /cita|reserva/i, why: 'Tu negocio vive de las citas. Que tus clientes reserven solos te ahorra horas de mensajes y llena huecos en tu agenda.', time: '4 a 8 semanas', format: 'Página + agenda', includes: ['Página profesional que aparece en Google', 'Agenda en línea con confirmación automática', 'Historial de cada cliente', 'Panel para ti y tu equipo'] },
            tienda: { title: 'Tienda en línea', match: /tienda|venta/i, why: 'Si vendes productos, el siguiente paso es que puedan comprarte a cualquier hora sin que tú estés contestando.', time: '5 a 10 semanas', format: 'Catálogo + pagos', includes: ['Catálogo que tú mismo actualizas', 'Pagos con tarjeta o transferencia', 'Aviso de cada pedido nuevo', 'Reporte de ventas'] },
            profesional: { title: 'Página web profesional', match: /p[aá]gina|sitio|web/i, why: 'En tu caso la confianza lo es todo. Una página clara, con tu experiencia y casos, hace que te escriban ya convencidos.', time: '2 a 4 semanas', format: 'Sitio informativo', includes: ['Diseño que transmite profesionalismo', 'Aparecer en Google y Google Maps', 'Botón directo a WhatsApp', 'Formulario de contacto'] },
            operacion: { title: 'Sistema a la medida', match: /sistema|medida/i, why: 'Cuando el negocio crece, las hojas de Excel se quedan cortas. Un sistema hecho a tu forma de trabajar ordena todo.', time: 'Se define en el diagnóstico', format: 'Proyecto por etapas', includes: ['Control de clientes e inventario', 'Usuarios con permisos', 'Reportes al instante', 'Se entrega por etapas, pagas por etapa'] }
        };
        const context = { nada: 'Empezar a aparecer en Google será lo que más impacto tenga.', redes: 'Tener tu propio sitio te da independencia de los algoritmos de redes.', web: 'Revisaremos qué falla en tu página actual antes de proponer algo nuevo.', ok: 'Nos enfocaremos en automatizar para que crezcas sin cargarte de trabajo.' };
        const labels = {
            servicios: 'servicios con citas', tienda: 'venta de productos', profesional: 'profesionista o despacho', operacion: 'empresa con procesos internos',
            nada: 'de boca en boca', redes: 'solo por redes sociales', web: 'tengo página pero no funciona', ok: 'me encuentran bien y quiero crecer',
            citas: 'agendar y confirmar citas', pedidos: 'tomar pedidos y cobrar', info: 'responder siempre lo mismo', control: 'llevar control y reportes'
        };
        const summary = rec => `Hice el diagnóstico en tu página.\n• Mi negocio: ${labels[answers[0]]}\n• Hoy me encuentran: ${labels[answers[1]]}\n• Lo que más tiempo me quita: ${labels[answers[2]]}\n• Me recomendaste: ${rec.title}`;
        const showStep = n => {
            steps.forEach(step => step.classList.toggle('on', +step.dataset.step === n));
            bar.style.width = (n / 3 * 100) + '%';
            label.textContent = n < 3 ? `pregunta ${n + 1} de 3` : 'tu recomendación';
        };
        const render = () => {
            const rec = recommendations[answers[0]];
            const waLink = whatsAppUrl + '?text=' + encodeURIComponent('Hola Raúl 👋 ' + summary(rec) + '\n\n¿Podemos platicarlo?');
            result.innerHTML = `<span class="result-kicker">✓ TE RECOMIENDO</span><h3></h3><p class="why"></p>
                <div class="result-grid"><div><small>TIEMPO ESTIMADO</small><span data-time></span></div><div><small>FORMATO</small><span data-format></span></div></div>
                <ul>${rec.includes.map(() => '<li><span class="ms">check_circle</span><span></span></li>').join('')}</ul>
                <div class="acts">${whatsAppUrl ? '<a target="_blank" rel="noopener" class="btn btn-wa" data-wa><span class="ms">chat</span>Enviarlo por WhatsApp</a>' : ''}<button type="button" class="btn btn-ghost" data-to-form>Prefiero el formulario</button></div>
                ${whatsAppUrl ? '<p class="wa-note"><span class="ms">info</span>Se abre WhatsApp con tus respuestas ya escritas. Solo le das enviar.</p>' : ''}
                <button type="button" class="restart" data-restart>Volver a empezar</button>`;
            $('h3', result).textContent = rec.title;
            $('.why', result).textContent = `${rec.why} ${context[answers[1]]}`;
            $('[data-time]', result).textContent = rec.time;
            $('[data-format]', result).textContent = rec.format;
            $$('li span:last-child', result).forEach((span, i) => span.textContent = rec.includes[i]);
            $('[data-wa]', result)?.setAttribute('href', waLink);
            $('[data-restart]', result).addEventListener('click', () => { answers = []; showStep(0); });
            $('[data-to-form]', result).addEventListener('click', () => {
                const select = $('#contactService'), message = $('#contactMessage');
                if (select) {
                    const option = [...select.options].find(o => o.value && rec.match.test(o.value)) ?? [...select.options].find(o => o.value === 'Otro');
                    if (option) select.value = option.value;
                }
                message.value = summary(rec);
                message.closest('form').classList.add('prefilled');
                // Las respuestas viajan aparte para verse ordenadas en el panel
                $('#contactSource').value = 'diagnostico';
                $('#contactDiagnostic').value = [
                    `Negocio|${labels[answers[0]]}`, `Hoy lo encuentran|${labels[answers[1]]}`,
                    `Le quita más tiempo|${labels[answers[2]]}`, `Le recomendaste|${rec.title} · ${rec.time}`
                ].join('\n');
                $('#contacto').scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => message.focus({ preventScroll: true }), 700);
            });
        };
        // Cuenta el diagnóstico terminado para el embudo del panel (no bloquea si falla)
        const reportCompletion = () => {
            const token = $('#contactForm input[name="__RequestVerificationToken"]')?.value;
            if (!token) return;
            const body = new FormData();
            body.set('business', answers[0]);
            body.set('__RequestVerificationToken', token);
            fetch('/Home/Diagnostic', { method: 'POST', body }).catch(() => {});
        };
        $$('.opt', quiz).forEach(option => option.addEventListener('click', () => {
            const step = +option.closest('.step').dataset.step;
            answers[step] = option.dataset.v;
            if (step < 2) showStep(step + 1); else { render(); showStep(3); reportCompletion(); }
        }));
    }

    // Pestañas de soluciones
    const solutionTabs = $$('#tabs .tab');
    solutionTabs.forEach(tab => tab.addEventListener('click', () => {
        solutionTabs.forEach(t => t.classList.toggle('on', t === tab));
        $$('.panel').forEach(panel => panel.classList.toggle('on', panel.dataset.p === tab.dataset.t));
    }));

    // Pantallas del proyecto destacado
    const screens = $$('#screens .desk'), screenTabs = $$('#screenTabs button');
    if (screens.length > 1) {
        let current = 0, timer;
        const go = n => {
            const previous = current;
            current = n;
            // La pantalla anterior se queda opaca debajo mientras la nueva aparece encima
            screens.forEach((img, i) => { img.classList.toggle('prev', i === previous && i !== n); img.classList.toggle('on', i === n); });
            screenTabs.forEach((tab, i) => { tab.classList.remove('on'); if (i === n) { void tab.offsetWidth; tab.classList.add('on'); } });
            clearTimeout(timer);
            timer = setTimeout(() => go((current + 1) % screens.length), 4000);
        };
        screenTabs.forEach((tab, i) => tab.addEventListener('click', () => go(i)));
        go(0);
    }

    // Filtros de proyectos
    const filters = $$('#filters .tab');
    filters.forEach(filter => filter.addEventListener('click', () => {
        filters.forEach(f => f.classList.toggle('on', f === filter));
        $$('.pitem').forEach(item => {
            const visible = filter.dataset.f === 'all' || item.dataset.type.split(' ').includes(filter.dataset.f);
            item.style.display = visible ? '' : 'none';
        });
    }));

    // Línea de tiempo del proceso
    const timeline = $('#timeline'), timelineFill = $('#tlFill');
    if (timeline) {
        const stepsInTimeline = $$('.st', timeline);
        addEventListener('scroll', () => {
            const r = timeline.getBoundingClientRect(), mid = innerHeight * .6;
            timelineFill.style.height = Math.min(r.height - 16, Math.max(0, mid - r.top)) + 'px';
            stepsInTimeline.forEach(step => step.classList.toggle('lit', step.getBoundingClientRect().top < mid));
        }, { passive: true });
    }

    // Contadores
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        counterObserver.unobserve(entry.target);
        const el = entry.target, end = +el.dataset.count, prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
        let start = null;
        const step = ts => {
            start ??= ts;
            const p = Math.min(1, (ts - start) / 1400);
            el.textContent = prefix + Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }), { threshold: .6 });
    $$('[data-count]').forEach(el => counterObserver.observe(el));

    // Preguntas frecuentes
    $$('.qa button').forEach(button => button.addEventListener('click', () => {
        const open = button.parentElement.classList.toggle('open');
        button.setAttribute('aria-expanded', String(open));
    }));

    // Glosario: hover en escritorio, toque en celular
    const tip = $('#tip');
    if (tip) {
        const definitions = {
            seo: ['SEO local', 'Ajustes para que Google muestre tu negocio cuando alguien de tu ciudad busca lo que vendes.'],
            dominio: ['Dominio', 'La dirección de tu página, como tunegocio.com.mx. Es como tu número de teléfono en internet.'],
            hosting: ['Hosting', 'La computadora siempre encendida donde vive tu página para que cualquiera pueda verla a cualquier hora.'],
            codigo: ['Código', 'Las instrucciones con las que está construida tu página o sistema. Si es tuyo, nadie te puede tener "secuestrado".'],
            saas: ['SaaS', 'Un sistema que se usa desde el navegador pagando una mensualidad, sin instalar nada. Como Netflix, pero para tu negocio.'],
            gmaps: ['Google Maps', 'Tu negocio aparece en el mapa con dirección, horario, fotos y botón para llamar o llegar.'],
            pagos: ['Pagos seguros', 'Cobros con tarjeta procesados por empresas especializadas. Tú nunca ves ni guardas los datos de la tarjeta.']
        };
        const tipTitle = $('#tipT'), tipText = $('#tipD');
        const canHover = () => matchMedia('(hover:hover)').matches;
        let current = null;
        const show = el => {
            const [title, text] = definitions[el.dataset.term];
            tipTitle.textContent = title; tipText.textContent = text;
            current?.classList.remove('on'); current = el; el.classList.add('on');
            tip.classList.add('show');
            const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
            const x = Math.min(innerWidth - w - 12, Math.max(12, r.left + r.width / 2 - w / 2));
            let y = r.top - h - 10; if (y < 80) y = r.bottom + 10;
            tip.style.left = x + 'px'; tip.style.top = y + 'px';
        };
        const hide = () => { tip.classList.remove('show'); current?.classList.remove('on'); current = null; };
        $$('.term').forEach(el => {
            el.addEventListener('mouseenter', () => canHover() && show(el));
            el.addEventListener('mouseleave', () => canHover() && hide());
            // Un toque dispara focus y luego click; se recuerda el estado previo para no abrir y cerrar a la vez
            el.addEventListener('pointerdown', () => { el.dataset.ptr = current === el ? 'open' : 'closed'; });
            el.addEventListener('focus', () => { if (!el.dataset.ptr) show(el); });
            el.addEventListener('blur', hide);
            el.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                const wasOpen = el.dataset.ptr === 'open';
                delete el.dataset.ptr;
                wasOpen ? hide() : show(el);
            });
        });
        document.addEventListener('click', hide);
        addEventListener('scroll', hide, { passive: true });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
    }

    // Barra fija en celular: visible entre el hero y el contacto
    const mobileBar = $('#mBar'), hero = $('.hero'), contact = $('#contacto');
    if (mobileBar && hero && contact) {
        let pastHero = false, atContact = false;
        const sync = () => {
            const on = pastHero && !atContact;
            mobileBar.classList.toggle('show', on);
            document.body.classList.toggle('mbar-on', on);
        };
        new IntersectionObserver(([entry]) => { pastHero = !entry.isIntersecting; sync(); }).observe(hero);
        new IntersectionObserver(([entry]) => { atContact = entry.isIntersecting; sync(); }, { threshold: .15 }).observe(contact);
    }

    // Volver arriba con anillo de progreso
    const toTop = $('#toTop'), toTopBar = $('#ttBar');
    if (toTop) {
        const update = () => {
            const max = document.documentElement.scrollHeight - innerHeight;
            toTop.classList.toggle('show', scrollY > 600);
            toTopBar.style.strokeDashoffset = 132 * (1 - (max > 0 ? scrollY / max : 0));
        };
        addEventListener('scroll', update, { passive: true });
        update();
        toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Formulario de contacto
    const form = $('#contactForm');
    if (form) {
        const status = $('#formStatus'), submit = $('button[type=submit]', form), reach = $('#contactReach');
        const setStatus = (type, text) => { status.className = `form-status ${type}`; status.textContent = text; };
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const value = reach.value.trim();
            if (!form.reportValidity()) return;
            // Un solo campo para WhatsApp o correo: se envía a donde corresponda
            const isEmail = value.includes('@');
            if (isEmail ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : value.replace(/\D/g, '').length < 10) {
                setStatus('error', isEmail ? 'Revisa tu correo, parece incompleto.' : 'Escribe tu WhatsApp a 10 dígitos o tu correo.');
                reach.focus();
                return;
            }
            const data = new FormData(form);
            data.set(isEmail ? 'email' : 'phone', value);
            submit.disabled = true;
            submit.classList.add('loading');
            setStatus('', '');
            try {
                const response = await fetch(form.action, { method: 'POST', body: data, headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                const result = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(result.message || 'No fue posible enviar el mensaje.');
                form.reset();
                form.classList.remove('prefilled');
                $('#contactSource').value = 'formulario';
                $('#contactDiagnostic').value = '';
                setStatus('ok', result.message || 'Gracias, te responderé pronto.');
            } catch (error) {
                setStatus('error', `${error.message} También puedes escribirme por WhatsApp.`);
            } finally {
                submit.disabled = false;
                submit.classList.remove('loading');
            }
        });
    }
})();
