// Login: validación en el navegador (mismos mensajes que el servidor), mostrar contraseña, aviso de Bloq Mayús y partículas.
(() => {
    const form = document.getElementById('loginForm');
    const email = document.getElementById('Email');
    const password = document.getElementById('Password');
    const button = document.getElementById('loginButton');
    const label = button.querySelector('[data-label]');
    const toggle = document.getElementById('togglePassword');
    const caps = document.getElementById('capsWarning');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const rules = {
        Email: value => !value ? 'Escribe tu correo.' : !emailPattern.test(value) ? 'Revisa tu correo, parece incompleto.' : '',
        Password: value => !value ? 'Escribe tu contraseña.' : ''
    };
    const touched = new Set();

    const setError = (input, message) => {
        const field = input.closest('.field');
        field.classList.toggle('invalid', Boolean(message));
        input.setAttribute('aria-invalid', String(Boolean(message)));
        document.getElementById(`${input.id === 'Email' ? 'email' : 'password'}Error`).textContent = message;
    };
    const validate = input => {
        // El correo se recorta: pegarlo con espacios es un error común
        if (input === email) email.value = email.value.trim();
        const message = rules[input.id](input.value);
        setError(input, message);
        return !message;
    };

    [email, password].forEach(input => {
        // Valida al salir del campo y, una vez tocado, mientras escribes
        input.addEventListener('blur', () => { if (input.value || touched.has(input)) { touched.add(input); validate(input); } });
        input.addEventListener('input', () => { if (touched.has(input)) validate(input); });
    });

    form.addEventListener('submit', event => {
        if (button.disabled) { event.preventDefault(); return; }
        touched.add(email); touched.add(password);
        const validEmail = validate(email), validPassword = validate(password);
        if (!validEmail || !validPassword) {
            event.preventDefault();
            (validEmail ? password : email).focus();
            return;
        }
        // Evita doble envío; el botón se restaura si el navegador vuelve a esta página desde el historial
        button.disabled = true;
        button.classList.add('loading');
        label.textContent = 'Verificando…';
    });

    window.addEventListener('pageshow', () => {
        button.disabled = false;
        button.classList.remove('loading');
        label.textContent = 'Iniciar sesión';
    });

    toggle.addEventListener('click', () => {
        const show = password.type === 'password';
        const { selectionStart, selectionEnd } = password;
        password.type = show ? 'text' : 'password';
        toggle.querySelector('.ms').textContent = show ? 'visibility_off' : 'visibility';
        toggle.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
        toggle.setAttribute('aria-pressed', String(show));
        password.focus();
        password.setSelectionRange(selectionStart, selectionEnd);
    });

    const updateCaps = event => { if (event.getModifierState) caps.hidden = !event.getModifierState('CapsLock'); };
    password.addEventListener('keydown', updateCaps);
    password.addEventListener('keyup', updateCaps);
    password.addEventListener('blur', () => caps.hidden = true);

    // Foco inicial: al volver con error, la contraseña (el correo ya está escrito); si no, el primer campo vacío
    if (form.dataset.hasErrors === 'true') {
        const invalid = form.querySelector('.field.invalid input');
        (invalid ?? (email.value ? password : email)).focus();
    } else {
        (email.value ? password : email).focus();
    }

    // Partículas del fondo (mismas que el hero de la landing, sin interacción)
    const canvas = document.getElementById('particles');
    if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    const colors = ['74,158,255', '0,217,163', '167,139,250'];
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let particles = [], frame;
    const resize = () => {
        canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(90, Math.floor(innerWidth * innerHeight / 16000));
        particles = Array.from({ length: count }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, size: Math.random() * 2 + 1, color: colors[Math.random() * 3 | 0], alpha: Math.random() * .45 + .25 }));
    };
    const tick = () => {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (const p of particles) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = innerWidth; if (p.x > innerWidth) p.x = 0; if (p.y < 0) p.y = innerHeight; if (p.y > innerHeight) p.y = 0;
            ctx.fillStyle = `rgba(${p.color},${p.alpha})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
        }
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j], d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 110) { ctx.strokeStyle = `rgba(74,158,255,${.18 * (1 - d / 110)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        frame = requestAnimationFrame(tick);
    };
    resize();
    tick();
    addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => { cancelAnimationFrame(frame); if (!document.hidden) tick(); });
})();
