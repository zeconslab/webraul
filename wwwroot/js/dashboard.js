(() => {
    const formLayer = document.getElementById('adminFormModal');
    const formContent = document.getElementById('adminModalContent');
    const deleteLayer = document.getElementById('deleteModal');
    let opener = null;

    function initializeFormControls(root) {
        root.querySelectorAll('[data-icon-select], [data-category-select]').forEach(select => {
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
    }

    const setOpen = (layer, open) => {
        layer?.classList.toggle('is-open', open);
        layer?.setAttribute('aria-hidden', open ? 'false' : 'true');
        document.body.classList.toggle('modal-open', Boolean(document.querySelector('.admin-modal-layer.is-open')));
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
            formContent.querySelector('input:not([type="hidden"]), textarea, select')?.focus();
        } catch {
            formContent.innerHTML = '<div class="modal-load-error"><b class="material-symbols-outlined">error</b><h2>No se pudo cargar</h2><p>Inténtalo nuevamente.</p><button class="button secondary" data-modal-close>Cerrar</button></div>';
        }
    }

    document.addEventListener('click', event => {
        const modalButton = event.target.closest('[data-modal-url]');
        if (modalButton) { event.preventDefault(); openForm(modalButton); return; }
        if (event.target.closest('[data-modal-close]')) { setOpen(formLayer, false); return; }
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
        } catch {
            submit.disabled = false;
            submit.classList.remove('is-loading');
            alert('No fue posible guardar. Comprueba tu conexión e inténtalo de nuevo.');
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (deleteLayer?.classList.contains('is-open')) setOpen(deleteLayer, false);
        else if (formLayer?.classList.contains('is-open')) setOpen(formLayer, false);
    });
})();
