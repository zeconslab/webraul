// Panel administrativo: avisos, panel lateral de formularios, controles de formulario, publicar/reordenar y menú móvil.
function showToast(type, message, duration = 5000) {
    const icons = { success: 'check_circle', warning: 'warning', error: 'error', info: 'info' };
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type in icons ? type : 'info'}`;
    toast.innerHTML = '<span class="ms toast-icon"></span><span class="toast-message"></span><button type="button" class="toast-close" aria-label="Cerrar"><span class="ms">close</span></button>';
    toast.querySelector('.toast-icon').textContent = icons[type] || icons.info;
    toast.querySelector('.toast-message').textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('is-visible')));
    const dismiss = () => {
        toast.classList.remove('is-visible');
        setTimeout(() => toast.remove(), 400);
    };
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
}
window.showToast = showToast;

const antiForgeryToken = () => document.querySelector('input[name="__RequestVerificationToken"]')?.value ?? '';

async function postForm(url, data) {
    const body = new FormData();
    Object.entries(data).forEach(([key, value]) => Array.isArray(value) ? value.forEach(v => body.append(key, v)) : body.set(key, value));
    const response = await fetch(url, { method: 'POST', body, headers: { 'RequestVerificationToken': antiForgeryToken(), 'X-Requested-With': 'XMLHttpRequest' } });
    if (!response.ok) throw new Error(response.statusText);
    return response;
}

// Menú "Más" en celular
(() => {
    const sheet = document.getElementById('moreSheet');
    if (!sheet) return;
    const setOpen = open => { sheet.classList.toggle('is-open', open); sheet.setAttribute('aria-hidden', String(!open)); };
    document.querySelector('[data-sheet-open]')?.addEventListener('click', () => setOpen(true));
    sheet.querySelectorAll('[data-sheet-close]').forEach(el => el.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();

// Interruptor publicado/oculto en las listas
document.addEventListener('click', async event => {
    const toggle = event.target.closest('[data-publish]');
    if (!toggle) return;
    const next = toggle.getAttribute('aria-pressed') !== 'true';
    const item = toggle.closest('[data-item]');
    const label = on => on ? toggle.dataset.on ?? 'Publicado' : toggle.dataset.off ?? 'Oculto';
    toggle.setAttribute('aria-pressed', String(next));
    toggle.querySelector('[data-publish-label]').textContent = label(next);
    item?.classList.toggle('hidden-item', !next);
    try {
        await postForm('/admin/Publish', { type: toggle.dataset.publish, id: item.dataset.item, published: next });
        showToast('success', next ? 'Publicado en el sitio.' : 'Oculto del sitio.', 2500);
    } catch {
        toggle.setAttribute('aria-pressed', String(!next));
        toggle.querySelector('[data-publish-label]').textContent = label(!next);
        item?.classList.toggle('hidden-item', next);
        showToast('error', 'No se pudo guardar el cambio. Inténtalo de nuevo.');
    }
});

// Arrastrar para reordenar ([data-sortable] con hijos [data-item] y una agarradera .grip)
document.querySelectorAll('[data-sortable]').forEach(container => {
    let dragged = null, startOrder = '';
    const order = () => [...container.querySelectorAll('[data-item]')].map(el => el.dataset.item);
    container.querySelectorAll('[data-item]').forEach(item => {
        // Solo se puede arrastrar desde la agarradera para no estorbar clics en botones
        item.querySelector('.grip')?.addEventListener('pointerdown', () => item.setAttribute('draggable', 'true'));
        item.addEventListener('dragstart', e => { dragged = item; startOrder = order().join(); item.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
        item.addEventListener('dragend', async () => {
            item.classList.remove('dragging');
            item.removeAttribute('draggable');
            dragged = null;
            const ids = order();
            if (ids.join() === startOrder) return;
            try {
                await postForm('/admin/Reorder', { type: container.dataset.sortable, ids });
                showToast('success', 'Orden guardado.', 2000);
            } catch {
                showToast('error', 'No se pudo guardar el orden. Recarga la página.');
            }
        });
        item.addEventListener('dragover', e => {
            e.preventDefault();
            if (!dragged || dragged === item) return;
            const r = item.getBoundingClientRect();
            const before = container.dataset.layout === 'list' ? e.clientY < r.top + r.height / 2 : e.clientX < r.left + r.width / 2;
            container.insertBefore(dragged, before ? item : item.nextSibling);
        });
    });
});

// Bandeja: en celular el detalle ocupa la pantalla
document.querySelector('[data-inbox-back]')?.addEventListener('click', () => document.querySelector('.inbox')?.classList.remove('reading'));

(() => {
    const formLayer = document.getElementById('adminFormModal');
    const formContent = document.getElementById('adminModalContent');
    const deleteLayer = document.getElementById('deleteModal');
    let opener = null;

    function initializeFormControls(root) {
        root.querySelectorAll('[data-icon-select]').forEach(select => {
            const preview = select.closest('.icon-select-wrap')?.querySelector('[data-icon-preview]');
            const update = () => { if (preview) preview.textContent = select.selectedOptions[0]?.dataset.icon || select.value || 'apps'; };
            select.addEventListener('change', update);
            update();
        });

        root.querySelectorAll('[data-tag-editor]').forEach(editor => {
            const value = editor.querySelector('[data-tag-value]');
            const input = editor.querySelector('[data-tag-input]');
            const list = editor.querySelector('.tag-list');
            let tags = (value.value || '').split(',').map(tag => tag.trim()).filter(Boolean);
            const render = () => {
                tags = [...new Set(tags.map(tag => tag.trim()).filter(Boolean))];
                value.value = tags.join(', ');
                list.innerHTML = '';
                tags.forEach((tag, index) => {
                    const chip = document.createElement('span');
                    chip.className = 'tag-chip';
                    chip.append(document.createTextNode(tag));
                    const remove = document.createElement('button');
                    remove.type = 'button'; remove.setAttribute('aria-label', `Quitar ${tag}`); remove.innerHTML = '&times;';
                    remove.addEventListener('click', () => { tags.splice(index, 1); render(); input.focus(); });
                    chip.append(remove); list.append(chip);
                });
            };
            const commit = () => {
                input.value.split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => tags.push(tag));
                input.value = ''; render();
            };
            input.addEventListener('keydown', event => {
                if (event.key === ',' || event.key === 'Enter') { event.preventDefault(); commit(); }
                if (event.key === 'Backspace' && !input.value && tags.length) { tags.pop(); render(); }
            });
            input.addEventListener('blur', commit);
            input.addEventListener('paste', event => { if (event.clipboardData?.getData('text').includes(',')) setTimeout(commit); });
            render();
        });

        root.querySelectorAll('[data-file-drop]').forEach(drop => {
            const input = drop.querySelector('[data-file-input]');
            const preview = drop.querySelector('[data-file-preview]');
            const fileName = drop.querySelector('[data-file-name]');
            let objectUrl;
            const showFile = file => {
                if (!file) return;
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { fileName.textContent = 'Formato no permitido'; drop.classList.add('file-error'); input.value = ''; return; }
                if (file.size > 8_000_000) { fileName.textContent = 'La imagen supera los 8 MB'; drop.classList.add('file-error'); input.value = ''; return; }
                drop.classList.remove('file-error');
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                objectUrl = URL.createObjectURL(file);
                preview.src = objectUrl; preview.classList.add('has-image');
                fileName.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
                drop.classList.add('file-ready');
                root.dispatchEvent(new Event('input', { bubbles: true }));
            };
            input.addEventListener('change', () => showFile(input.files[0]));
            ['dragenter', 'dragover'].forEach(name => drop.addEventListener(name, event => { event.preventDefault(); drop.classList.add('is-dragging'); }));
            ['dragleave', 'drop'].forEach(name => drop.addEventListener(name, event => { event.preventDefault(); drop.classList.remove('is-dragging'); }));
            drop.addEventListener('drop', event => {
                const file = event.dataTransfer.files[0];
                if (!file) return;
                const transfer = new DataTransfer(); transfer.items.add(file); input.files = transfer.files; showFile(file);
            });
        });

        // Pestañas dentro del formulario; si una pestaña tiene errores, se marca y se abre
        root.querySelectorAll('[data-tabs]').forEach(tabs => {
            const buttons = [...tabs.querySelectorAll('[data-tab]')];
            const panes = [...root.querySelectorAll('[data-pane]')];
            const show = key => {
                buttons.forEach(b => b.classList.toggle('on', b.dataset.tab === key));
                panes.forEach(p => p.hidden = p.dataset.pane !== key);
            };
            buttons.forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
            const withErrors = panes.filter(p => p.querySelector('.field-validation-error, .input-validation-error'));
            withErrors.forEach(p => buttons.find(b => b.dataset.tab === p.dataset.pane)?.insertAdjacentHTML('beforeend', '<i class="err" aria-label="con errores"></i>'));
            show(withErrors[0]?.dataset.pane ?? buttons[0]?.dataset.tab);
        });

        root.querySelectorAll('[data-project-preview]').forEach(form => initializeProjectPreview(form));
    }

    // Vista previa en vivo de la tarjeta del proyecto
    function initializeProjectPreview(form) {
        const $ = selector => form.querySelector(selector);
        const types = { web: ['t-web', 'language', 'SITIO WEB'], sistema: ['t-sistema', 'dashboard', 'SISTEMA'], app: ['t-app', 'smartphone', 'APP MÓVIL'], tienda: ['t-tienda', 'shopping_cart', 'TIENDA'] };
        const text = value => { const span = document.createElement('span'); span.textContent = value; return span.innerHTML; };
        const imageOf = name => {
            const drop = form.querySelector(`input[name="${name}"]`)?.closest('[data-file-drop]');
            const img = drop?.querySelector('img.has-image');
            return img?.src || '';
        };
        const update = () => {
            const checked = [...form.querySelectorAll('input[name="selectedTypes"]:checked')].map(i => i.value);
            const isApp = checked.includes('app');
            const desktop = imageOf('desktopImage'), mobile = imageOf('mobileImage');
            const image = isApp ? mobile || desktop : desktop || mobile;
            const badge = $('[name="Badge"]').value.trim();
            $('[data-pv-types]').innerHTML = checked.map(t => `<span class="t ${types[t][0]}"><span class="ms">${types[t][1]}</span>${types[t][2]}</span>`).join('')
                + (badge ? `<span class="t t-badge">${text(badge.toUpperCase())}</span>` : '');
            $('[data-pv-title]').textContent = $('[name="Title"]').value.trim() || 'Sin nombre';
            $('[data-pv-desc]').textContent = $('[name="Description"]').value.trim();
            $('[data-pv-features]').innerHTML = $('[name="Features"]').value.split('\n').map(f => f.trim()).filter(Boolean).map(f => `<span>${text(f)}</span>`).join('');
            $('[data-pv-media]').innerHTML = image ? `<img class="${isApp ? 'app-shot' : ''}" src="${image}" alt="">` : '<span class="ms">image</span>';
            const link = $('[name="WebsiteUrl"]').value.trim();
            $('[data-pv-link]').textContent = link ? (isApp ? 'Ver app ↗' : 'Visitar sitio ↗') : 'Quiero algo así para mi negocio →';
            const screens = form.querySelectorAll('[data-gallery-row]').length + form.querySelectorAll('input[name="newGalleryFiles"]').length - [...form.querySelectorAll('input[name="newGalleryFiles"]')].filter(i => !i.files.length).length;
            const checks = [
                [$('[name="Description"]').value.trim().length > 20, 'Tiene descripción'],
                [checked.length > 0, checked.length ? checked.length === 1 ? '1 tipo seleccionado' : `${checked.length} tipos seleccionados` : 'Elige al menos un tipo'],
                [Boolean(image), image ? 'Tiene imagen' : 'Sin imagen: la tarjeta muestra un ícono'],
                [Boolean(link), link ? 'Tiene enlace público' : 'Sin enlace público'],
                [!$('[name="IsFeatured"]').checked || screens > 0 || Boolean(desktop), $('[name="IsFeatured"]').checked ? `Portada con ${screens || (desktop ? 1 : 0)} pantalla(s)` : 'No es la portada'],
            ];
            $('[data-pv-checks]').innerHTML = checks.map(([ok, label]) => `<div><span class="ms ${ok ? 'ok' : 'warn'}">${ok ? 'check_circle' : 'warning'}</span>${text(label)}</div>`).join('');
        };
        // El identificador se genera del nombre mientras no lo edites a mano
        const slug = form.querySelector('[data-slug-target]'), title = form.querySelector('[data-slug-source]');
        let slugTouched = Boolean(slug?.value);
        slug?.addEventListener('input', () => slugTouched = true);
        title?.addEventListener('input', () => {
            if (!slugTouched) slug.value = title.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        });
        form.addEventListener('input', update);
        form.addEventListener('change', update);
        update();
    }

    const setOpen = (layer, open) => {
        layer?.classList.toggle('is-open', open);
        layer?.setAttribute('aria-hidden', open ? 'false' : 'true');
        document.body.style.overflow = document.querySelector('.admin-modal-layer.is-open') ? 'hidden' : '';
        if (!open) opener?.focus();
    };

    async function openForm(button) {
        opener = button;
        setOpen(formLayer, true);
        formContent.innerHTML = '<div class="modal-loading"><span></span><p>Cargando formulario…</p></div>';
        try {
            const response = await fetch(button.dataset.modalUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error();
            formContent.innerHTML = await response.text();
            initializeFormControls(formContent);
            formContent.querySelector('.modal-form-body input:not([type="hidden"]), .modal-form-body textarea')?.focus({ preventScroll: true });
        } catch {
            formContent.innerHTML = '<div class="modal-load-error"><span class="ms">error</span><h2>No se pudo cargar</h2><p>Inténtalo nuevamente.</p><button class="button secondary" data-modal-close>Cerrar</button></div>';
        }
    }

    document.addEventListener('click', event => {
        const modalButton = event.target.closest('[data-modal-url]');
        if (modalButton) { event.preventDefault(); openForm(modalButton); return; }
        if (event.target.closest('[data-modal-close]')) { setOpen(formLayer, false); return; }
        const remove = event.target.closest('[data-gallery-remove]');
        if (remove) { const form = remove.closest('form'); remove.closest('[data-gallery-row]')?.remove(); form?.dispatchEvent(new Event('input')); return; }
        const deleteButton = event.target.closest('[data-delete-id]');
        if (deleteButton) {
            opener = deleteButton;
            document.getElementById('deleteItemId').value = deleteButton.dataset.deleteId;
            document.getElementById('deleteItemType').value = deleteButton.dataset.deleteType;
            document.getElementById('deleteItemName').textContent = `“${deleteButton.dataset.deleteName}”`;
            setOpen(deleteLayer, true);
            deleteLayer.querySelector('[data-delete-close]')?.focus();
            return;
        }
        if (event.target.closest('[data-delete-close]')) setOpen(deleteLayer, false);
    });

    document.addEventListener('submit', async event => {
        const form = event.target.closest('[data-modal-form]');
        if (!form || !formLayer.classList.contains('is-open')) return;
        event.preventDefault();
        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        submit.classList.add('is-loading');
        try {
            const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const result = await response.json();
                if (result.ok) { window.location.assign(result.redirect); return; }
            }
            formContent.innerHTML = await response.text();
            initializeFormControls(formContent);
            showToast('warning', 'Revisa los campos marcados.');
        } catch {
            submit.disabled = false;
            submit.classList.remove('is-loading');
            showToast('error', 'No fue posible guardar. Comprueba tu conexión e inténtalo de nuevo.');
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (deleteLayer?.classList.contains('is-open')) setOpen(deleteLayer, false);
        else if (formLayer?.classList.contains('is-open')) setOpen(formLayer, false);
    });

    // Formularios abiertos como página completa (sin JS de modal)
    document.querySelectorAll('.standalone-form').forEach(initializeFormControls);
    // Abrir un formulario directo desde la URL (?editar=/admin/Project/3?modal=true)
    const autoOpen = new URLSearchParams(location.search).get('editar');
    if (autoOpen?.startsWith('/admin/')) openForm({ dataset: { modalUrl: autoOpen }, focus() {} });
})();
