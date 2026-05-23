
        // ======================
        // MOBILE MENU
        // ======================
        (function() {
            const mobileMenuToggle = document.getElementById('mobileMenuToggle');
            const mobileMenu = document.getElementById('mobileMenu');
            const mobileNavLinks = mobileMenu?.querySelectorAll('.mobile-nav-link');
            const hamburgerIcon = mobileMenuToggle?.querySelector('.hamburger-icon');
            const closeIcon = mobileMenuToggle?.querySelector('.close-icon');
            
            if (!mobileMenuToggle || !mobileMenu) return;

            // Handler para cerrar el menú al clicar fuera
            function handleOutsideClick(e) {
                if (!mobileMenu.classList.contains('active')) return;
                // Si el clic no está dentro del menú ni en el toggle, cerrar
                if (!mobileMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    toggleMobileMenu();
                }
            }
            
            // Toggle menú móvil
            function toggleMobileMenu() {
                const isActive = mobileMenu.classList.contains('active');
                const headerEl = document.querySelector('header');

                if (isActive) {
                    // Cerrar menú
                    mobileMenu.classList.remove('active');
                    hamburgerIcon?.classList.remove('hidden');
                    closeIcon?.classList.add('hidden');
                    headerEl?.classList.remove('header-menu-open');
                    document.removeEventListener('click', handleOutsideClick);
                } else {
                    // Abrir menú — el menú es position:absolute top:100% dentro del header fixed,
                    // así siempre queda pegado al borde inferior del header sin cálculos JS.
                    headerEl?.classList.add('header-menu-open');
                    mobileMenu.classList.add('active');
                    hamburgerIcon?.classList.add('hidden');
                    closeIcon?.classList.remove('hidden');
                    setTimeout(() => document.addEventListener('click', handleOutsideClick));
                }
            }
            
            // Eventos
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
            
            // Cerrar al hacer click en un link (nav links + CTA del footer)
            const allMobileLinks = mobileMenu?.querySelectorAll('.mobile-nav-link, a[href^="#"]');
            allMobileLinks?.forEach(link => {
                link.addEventListener('click', () => {
                    setTimeout(toggleMobileMenu, 200);
                });
            });
            
            // Cerrar con tecla Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                    toggleMobileMenu();
                }
            });
        })();

        // ============================================
        // DYNAMIC MOBILE STATUS BAR COLOR (theme-color)
        // Updates meta[name="theme-color"] to match visible header background
        // ============================================
        (function() {
            const DEFAULT_COLOR = '#135bec';

            function ensureMeta(name) {
                let meta = document.querySelector(`meta[name="${name}"]`);
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = name;
                    document.head.appendChild(meta);
                }
                return meta;
            }

            function rgbToHex(input) {
                if (!input) return DEFAULT_COLOR;
                if (input.startsWith('#')) return input;
                const m = input.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
                if (m) {
                    return '#' + [1,2,3].map(i => parseInt(m[i]).toString(16).padStart(2,'0')).join('');
                }
                const hexMatch = input.match(/#([0-9a-fA-F]{3,6})/);
                if (hexMatch) return '#' + hexMatch[1];
                return DEFAULT_COLOR;
            }

            function computedBgColor(el) {
                if (!el) return null;
                const cs = getComputedStyle(el);
                const bg = cs.backgroundColor;
                const bgImage = cs.backgroundImage;

                if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return rgbToHex(bg);

                if (bgImage && bgImage !== 'none') {
                    // try to extract first color stop (hex or rgb)
                    const m = bgImage.match(/(#[0-9a-fA-F]{3,6}|rgba?\([^\)]+\))/);
                    if (m) return rgbToHex(m[1]);
                }

                return null;
            }

            function findHeaderColor() {
                // Solo comprueba header + body — evita iterar todos los descendientes
                // que causaba getComputedStyle() en O(N) elementos por evento de scroll.
                const header = document.querySelector('header');
                for (const el of [header, document.body, document.documentElement]) {
                    const c = computedBgColor(el);
                    if (c) return c;
                }
                return DEFAULT_COLOR;
            }

            const themeMeta = ensureMeta('theme-color');
            const tileMeta = ensureMeta('msapplication-TileColor');

            let pending = false;
            function updateMeta() {
                if (pending) return;
                pending = true;
                requestAnimationFrame(() => {
                    pending = false;
                    const color = findHeaderColor() || DEFAULT_COLOR;
                    themeMeta.setAttribute('content', color);
                    tileMeta.setAttribute('content', color);
                });
            }

            // Update on load y resize. No se suscribe a scroll — el MutationObserver
            // del header ya detecta cambios de clase, y scroll causaba reflows forzados.
            window.addEventListener('load', updateMeta);
            window.addEventListener('resize', updateMeta, { passive: true });

            // Listen for theme toggle clicks (desktop and mobile)
            document.addEventListener('click', (e) => {
                if (e.target.closest('#themeToggle') || e.target.closest('#mobileThemeToggle')) {
                    setTimeout(updateMeta, 80);
                }
            });

            // Also respond to explicit theme-change events (fired by toggleTheme)
            document.addEventListener('theme-change', updateMeta);

            // Observe header class/style changes (e.g., mobile menu open/close)
            const headerEl = document.querySelector('header');
            if (headerEl) {
                const mo = new MutationObserver(updateMeta);
                mo.observe(headerEl, { attributes: true, attributeFilter: ['class', 'style'] });
            }

            // Initial call
            updateMeta();
        })();

        // ======================
        // LOADING SCREEN
        // ======================
        (function() {
            const loadingScreen = document.getElementById('loadingScreen');
            const progressBar = document.getElementById('loadingProgressBar');
            
            if (!loadingScreen || !progressBar) return;
            
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress > 100) progress = 100;
                progressBar.style.width = progress + '%';
                
                if (progress === 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        loadingScreen.classList.add('loaded');
                    }, 300);
                }
            }, 200);
            
            // Asegurar que se oculte después de 3 segundos máximo
            window.addEventListener('load', () => {
                setTimeout(() => {
                    progress = 100;
                    progressBar.style.width = '100%';
                    clearInterval(progressInterval);
                    setTimeout(() => {
                        loadingScreen.classList.add('loaded');
                    }, 300);
                }, 1000);
            });
        })();

        // ======================
        // CUSTOM CURSOR
        // ======================
        (function() {
            const cursor = document.getElementById('customCursor');
            const cursorDot = document.getElementById('customCursorDot');
            
            if (!cursor || !cursorDot) return;
            
            let mouseX = 0, mouseY = 0;
            let cursorX = 0, cursorY = 0;
            let dotX = 0, dotY = 0;
            
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
                
                cursor.classList.add('active');
                cursorDot.classList.add('active');
            });
            
            // Animación suave del cursor — translate() es GPU-composited y no invalida layout
            function animateCursor() {
                cursorX += (mouseX - cursorX) * 0.1;
                cursorY += (mouseY - cursorY) * 0.1;
                cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;

                dotX += (mouseX - dotX) * 0.3;
                dotY += (mouseY - dotY) * 0.3;
                cursorDot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;

                requestAnimationFrame(animateCursor);
            }
            animateCursor();
            
            // Efecto hover en elementos interactivos
            const interactiveElements = document.querySelectorAll('a, button, .ripple, .filter-btn, .project-item');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursor.classList.add('hover');
                    cursorDot.classList.add('hover');
                });
                el.addEventListener('mouseleave', () => {
                    cursor.classList.remove('hover');
                    cursorDot.classList.remove('hover');
                });
            });
        })();

        // ======================
        // PARTICLES ANIMATION
        // ======================
        (function() {
            const canvas = document.getElementById('particlesCanvas');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            let particles = [];
            let animationId;
            
            // Configurar tamaño del canvas — ResizeObserver evita el reflow forzado
            function resizeCanvas(width, height) {
                canvas.width = width;
                canvas.height = height;
            }
            const _ro = new ResizeObserver(([entry]) => {
                const { inlineSize: w, blockSize: h } = entry.contentBoxSize[0];
                resizeCanvas(w, h);
                createParticles();
            });
            _ro.observe(canvas);
            
            // Clase Partícula
            class Particle {
                constructor() {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                    this.size = Math.random() * 3 + 1;
                    this.speedX = Math.random() * 1 - 0.5;
                    this.speedY = Math.random() * 1 - 0.5;
                    this.opacity = Math.random() * 0.5 + 0.2;
                }
                
                update() {
                    this.x += this.speedX;
                    this.y += this.speedY;
                    
                    if (this.x > canvas.width) this.x = 0;
                    if (this.x < 0) this.x = canvas.width;
                    if (this.y > canvas.height) this.y = 0;
                    if (this.y < 0) this.y = canvas.height;
                }
                
                draw() {
                    ctx.fillStyle = `rgba(19, 91, 236, ${this.opacity})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Crear partículas
            function createParticles() {
                const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
                particles = [];
                for (let i = 0; i < particleCount; i++) {
                    particles.push(new Particle());
                }
            }
            // createParticles() es llamado por el ResizeObserver en el primer render y en cada resize
            
            // Conectar partículas cercanas
            function connectParticles() {
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[i].x - particles[j].x;
                        const dy = particles[i].y - particles[j].y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < 100) {
                            ctx.strokeStyle = `rgba(19, 91, 236, ${0.2 * (1 - distance / 100)})`;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(particles[i].x, particles[i].y);
                            ctx.lineTo(particles[j].x, particles[j].y);
                            ctx.stroke();
                        }
                    }
                }
            }
            
            // Animar partículas
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                particles.forEach(particle => {
                    particle.update();
                    particle.draw();
                });
                
                connectParticles();
                animationId = requestAnimationFrame(animate);
            }
            animate();
            
            // Pausar animación cuando no está visible
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    cancelAnimationFrame(animationId);
                } else {
                    animate();
                }
            });
        })();


        // Scroll to Top Button
        (function() {
            const scrollToTopBtn = document.getElementById('scrollToTopBtn');
            if (!scrollToTopBtn) return;

            scrollToTopBtn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                history.pushState('', document.title, window.location.pathname + window.location.search);
            });

            // IntersectionObserver en el hero evita leer window.pageYOffset en cada evento scroll
            // (pageYOffset fuerza layout flush cuando el CSS animation-timeline mantiene el layout sucio)
            const heroEl = document.getElementById('hero');
            if (heroEl) {
                new IntersectionObserver(
                    ([entry]) => scrollToTopBtn.classList.toggle('show', !entry.isIntersecting),
                    { threshold: 0 }
                ).observe(heroEl);
            }
        })();

        // Progress bar: la animación CSS (animation-timeline:scroll) lo maneja en navegadores modernos.
        // El JS sólo actúa como fallback para navegadores sin soporte.
        (function () {
            const bar = document.querySelector('.progress-bar-fill');
            if (!bar) return;
            bar.style.transformOrigin = '0% 50%';
            if (CSS.supports('animation-timeline: scroll()')) return;

            // Caché de scrollHeight para evitar reflows en el handler de scroll
            let cachedMax = document.documentElement.scrollHeight - window.innerHeight;
            new ResizeObserver(() => {
                cachedMax = document.documentElement.scrollHeight - window.innerHeight;
            }).observe(document.documentElement);

            function updateProgress() {
                const progress = cachedMax > 0 ? Math.min(Math.max(window.scrollY / cachedMax, 0), 1) : 0;
                bar.style.transform = `scaleX(${progress})`;
            }
            updateProgress();
            window.addEventListener('scroll', updateProgress, { passive: true });
            window.addEventListener('resize', updateProgress, { passive: true });
        })();

        // Modal overlay close handler
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Carousel functionality
        (function() {
            let currentIndex = 1; // Start with the middle card (Carlos Méndez)
            const cards = document.querySelectorAll('.testimonial-card');
            const dots = document.querySelectorAll('.carousel-dot');
            const track = document.querySelector('.carousel-track');
            const totalCards = cards.length;
            let autoPlayInterval;
            // matchMedia no fuerza layout; window.innerWidth sí (causa reflow en init)
            const _mql = window.matchMedia('(max-width: 1023px)');
            let isMobile = _mql.matches;
            _mql.addEventListener('change', e => { isMobile = e.matches; });

            function updateCarousel(newIndex) {
                // Update current index
                currentIndex = newIndex;
                if (currentIndex < 0) currentIndex = totalCards - 1;
                if (currentIndex >= totalCards) currentIndex = 0;

                // Simple calculation: shift track based on index
                // The middle card (index 1) should have no offset
                // Index 0 should shift right, index 2 should shift left
                let offset = 0;
                
                if (!isMobile) {
                    // Desktop: shift to center the active card
                    if (currentIndex === 0) {
                        offset = 400; // Shift right
                    } else if (currentIndex === 1) {
                        offset = 0; // Center (no shift)
                    } else if (currentIndex === 2) {
                        offset = -400; // Shift left
                    }
                } else {
                    // Mobile: just show the active card
                    offset = 0;
                }
                
                if (track) {
                    track.style.transform = `translateX(${offset}px)`;
                }
                
                // Update all cards
                cards.forEach((card, index) => {
                    const starsContainer = card.querySelector('.flex.gap-0\\.5');
                    const textContent = card.querySelector('p[class*="italic"]');
                    
                    if (index === currentIndex) {
                        // Active card styling
                        card.classList.remove('opacity-40', 'scale-90', 'blur-[2px]', 'p-8', 'shadow-lg', 'gap-6', 'hidden');
                        card.classList.add('active-card', 'p-10', 'border-2', 'min-w-[380px]', 'md:min-w-[500px]', 'flex', 'flex-col');
                        
                        // Update stars container
                        if (starsContainer) {
                            starsContainer.classList.add('my-2');
                        }
                        
                        // Update text size
                        if (textContent) {
                            textContent.classList.remove('text-sm', 'text-gray-600', 'dark:text-gray-300');
                            textContent.classList.add('text-lg', 'text-gray-700', 'dark:text-gray-200');
                        }
                    } else {
                        // Inactive card styling
                        card.classList.remove('active-card', 'p-10', 'border-2');
                        card.classList.add('opacity-40', 'scale-90', 'blur-[2px]', 'p-8', 'shadow-lg', 'flex', 'flex-col', 'gap-6', 'min-w-[350px]');
                        
                        // Update stars container
                        if (starsContainer) {
                            starsContainer.classList.remove('my-2');
                        }
                        
                        // Update text size
                        if (textContent) {
                            textContent.classList.remove('text-lg', 'text-gray-700', 'dark:text-gray-200');
                            textContent.classList.add('text-sm', 'text-gray-600', 'dark:text-gray-300');
                        }
                        
                        // Show side cards on desktop
                        if (!isMobile) {
                            card.classList.remove('hidden');
                            card.classList.add('lg:flex');
                        }
                    }
                });
                
                // Update dots
                dots.forEach((dot, index) => {
                    dot.classList.remove('bg-primary', 'w-8');
                    dot.classList.add('bg-gray-300', 'dark:bg-gray-600', 'w-2');
                    
                    if (index === currentIndex) {
                        dot.classList.remove('bg-gray-300', 'dark:bg-gray-600', 'w-2');
                        dot.classList.add('bg-primary', 'w-8');
                    }
                });
            }
            
            // Navigation functions
            window.carouselNext = function() {
                updateCarousel(currentIndex + 1);
                resetAutoPlay();
            };
            
            window.carouselPrev = function() {
                updateCarousel(currentIndex - 1);
                resetAutoPlay();
            };
            
            // Auto-play functionality
            function startAutoPlay() {
                autoPlayInterval = setInterval(() => {
                    updateCarousel(currentIndex + 1);
                }, 5000); // Change slide every 5 seconds
            }
            
            function stopAutoPlay() {
                if (autoPlayInterval) {
                    clearInterval(autoPlayInterval);
                }
            }
            
            function resetAutoPlay() {
                stopAutoPlay();
                startAutoPlay();
            }
            
            // Click on dots to navigate
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    updateCarousel(index);
                    resetAutoPlay();
                });
                dot.style.cursor = 'pointer';
            });
            
            // Pause auto-play on hover
            const carouselContainer = document.querySelector('.carousel-container');
            if (carouselContainer) {
                carouselContainer.addEventListener('mouseenter', stopAutoPlay);
                carouselContainer.addEventListener('mouseleave', startAutoPlay);
            }
            
            // Initialize
            updateCarousel(currentIndex);
            startAutoPlay();
        })();

        // Scroll Reveal — IntersectionObserver para todos los browsers
        (function() {
            const sel = '.reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-scale, .reveal-zoom, .reveal-rotate';
            const els = document.querySelectorAll(sel);
            if (!els.length) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    const delay = el.classList.contains('stagger-1') ? 80  :
                                  el.classList.contains('stagger-2') ? 180 :
                                  el.classList.contains('stagger-3') ? 280 :
                                  el.classList.contains('stagger-4') ? 380 : 0;
                    setTimeout(() => el.classList.add('is-visible'), delay);
                    observer.unobserve(el);
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

            els.forEach(el => observer.observe(el));
        })();

        // FAQ Accordion — solo uno abierto a la vez, todos cerrados al inicio
        (function() {
            const items = document.querySelectorAll('#faq details');
            // Asegurar que todos empiecen cerrados
            items.forEach(d => d.removeAttribute('open'));

            items.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const isOpen = this.open;
                    items.forEach(d => d.open = false);
                    if (!isOpen) this.open = true;
                });
            });
        })();

        // ============================================
        // NUEVAS ANIMACIONES Y EFECTOS AVANZADOS
        // ============================================

        // Efecto Parallax en fondos de secciones
        (function() {
            const parallaxElements = document.querySelectorAll('.parallax-bg');
            if (parallaxElements.length === 0) return;

            // innerHeight cacheado para no leerlo en cada frame de scroll (forzaría reflow si layout está sucio)
            let cachedWH = window.innerHeight;
            // Caché de posiciones — getBoundingClientRect() solo en load/resize, no en scroll
            let parallaxData = [];
            function cacheParallaxRects() {
                cachedWH = window.innerHeight;
                parallaxData = Array.from(parallaxElements).map(el => {
                    const r = el.getBoundingClientRect();
                    return { el, top: r.top + window.scrollY, height: r.height };
                });
            }
            window.addEventListener('load', cacheParallaxRects);
            window.addEventListener('resize', cacheParallaxRects, { passive: true });

            let parallaxPending = false;
            function updateParallax() {
                if (parallaxPending) return;
                parallaxPending = true;
                requestAnimationFrame(() => {
                    parallaxPending = false;
                    const scrollY = window.scrollY;
                    parallaxData.forEach(({ el, top, height }) => {
                        const relTop = top - scrollY;
                        const scrollPercent = (cachedWH - relTop) / (cachedWH + height);
                        el.style.transform = `translateY(${(scrollPercent - 0.5) * 50}px)`;
                    });
                });
            }

            window.addEventListener('scroll', updateParallax, { passive: true });
            cacheParallaxRects();
            updateParallax();
        })();

        // Contador numérico animado
        (function() {
            const counters = document.querySelectorAll('.counter');
            if (counters.length === 0) return;

            const animateCounter = (counter) => {
                const target = parseInt(counter.getAttribute('data-target'));
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                        counter.classList.add('animated');
                    }
                };

                updateCounter();
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                        animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            counters.forEach(counter => observer.observe(counter));
        })();

        // Efecto máquina de escribir
        (function() {
            const typewriterElements = document.querySelectorAll('.typewriter-text');
            if (typewriterElements.length === 0) return;

            typewriterElements.forEach((element) => {
                const text = element.getAttribute('data-text') || element.textContent;
                element.textContent = '';
                element.style.visibility = 'visible';
                let index = 0;

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const typeWriter = () => {
                                if (index < text.length) {
                                    element.textContent += text.charAt(index);
                                    index++;
                                    setTimeout(typeWriter, 50);
                                }
                            };
                            typeWriter();
                            observer.unobserve(element);
                        }
                    });
                }, { threshold: 0.5 });

                observer.observe(element);
            });
        })();

        // Crear partículas flotantes en el hero
        (function() {
            const heroSection = document.getElementById('hero');
            if (!heroSection) return;

            const particleCount = 20;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 15 + 's';
                particle.style.opacity = Math.random() * 0.5 + 0.2;
                heroSection.appendChild(particle);
            }
        })();

        // Efecto de card 3D con mouse tracking
        (function() {
            const cards = document.querySelectorAll('.card-3d');

            cards.forEach(card => {
                // Cachear rect en mouseenter: el card no se mueve durante el hover
                let cachedRect = null;
                card.addEventListener('mouseenter', () => {
                    cachedRect = card.getBoundingClientRect();
                });
                card.addEventListener('mousemove', (e) => {
                    if (!cachedRect) return;
                    const x = e.clientX - cachedRect.left;
                    const y = e.clientY - cachedRect.top;
                    const rotateX = (y - cachedRect.height / 2) / 10;
                    const rotateY = (cachedRect.width / 2 - x) / 10;
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                });
                card.addEventListener('mouseleave', () => {
                    cachedRect = null;
                    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
                });
            });
        })();

        // Agregar clases de animación a elementos cuando son visibles
        (function() {
            const animatedElements = document.querySelectorAll('.will-animate');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.willChange = 'transform, opacity';
                    } else {
                        entry.target.style.willChange = 'auto';
                    }
                });
            }, { threshold: 0.1 });
            
            animatedElements.forEach(el => observer.observe(el));
        })();

        // ============================================
        // NUEVAS FUNCIONALIDADES INTERACTIVAS
        // ============================================

        // Toggle de Modo Oscuro/Claro
        (function() {
            const themeToggle = document.getElementById('themeToggle');
            const mobileThemeToggle = document.getElementById('mobileThemeToggle');

            const html = document.documentElement;
            const lightIcon = themeToggle?.querySelector('.theme-icon-light');
            const darkIcon = themeToggle?.querySelector('.theme-icon-dark');
            const mobileLightIcon = mobileThemeToggle?.querySelector('.mobile-theme-icon-light');
            const mobileDarkIcon = mobileThemeToggle?.querySelector('.mobile-theme-icon-dark');

            // Light mode por defecto
            const savedTheme = localStorage.getItem('theme');

            function updateThemeIcons(isDark) {
                if (isDark) {
                    lightIcon?.classList.add('hidden');
                    darkIcon?.classList.remove('hidden');
                    mobileLightIcon?.classList.add('hidden');
                    mobileDarkIcon?.classList.remove('hidden');
                } else {
                    lightIcon?.classList.remove('hidden');
                    darkIcon?.classList.add('hidden');
                    mobileLightIcon?.classList.remove('hidden');
                    mobileDarkIcon?.classList.add('hidden');
                }
            }

            if (savedTheme === 'dark') {
                html.classList.add('dark');
                updateThemeIcons(true);
            } else {
                html.classList.remove('dark');
                updateThemeIcons(false);
            }

            function toggleTheme() {
                html.classList.toggle('dark');
                const isDark = html.classList.contains('dark');
                
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                updateThemeIcons(isDark);
                // Notify other listeners (e.g., theme-color updater)
                try { document.dispatchEvent(new Event('theme-change')); } catch (e) {}
            }

            themeToggle?.addEventListener('click', toggleTheme);
            mobileThemeToggle?.addEventListener('click', toggleTheme);
        })();

        // Filtros de Proyectos
        (function() {
            const filterBtns = document.querySelectorAll('.filter-btn');
            const projects = document.querySelectorAll('.project-item');
            
            if (filterBtns.length === 0 || projects.length === 0) return;

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const filter = btn.getAttribute('data-filter');
                    
                    // Actualizar botones activos
                    filterBtns.forEach(b => {
                        b.classList.remove('active', 'bg-primary', 'text-white', 'active-filter-glow');
                        b.classList.add('border', 'border-gray-300', 'dark:border-gray-700', 'text-gray-600', 'dark:text-gray-400');
                    });
                    
                    btn.classList.add('active', 'bg-primary', 'text-white', 'active-filter-glow');
                    btn.classList.remove('border', 'border-gray-300', 'dark:border-gray-700', 'text-gray-600', 'dark:text-gray-400');
                    
                    // Filtrar proyectos
                    projects.forEach(project => {
                        const category = project.getAttribute('data-category');
                        
                        if (filter === 'all' || category === filter) {
                            project.style.display = 'block';
                            setTimeout(() => {
                                project.style.opacity = '1';
                                project.style.transform = 'scale(1)';
                            }, 10);
                        } else {
                            project.style.opacity = '0';
                            project.style.transform = 'scale(0.8)';
                            setTimeout(() => {
                                project.style.display = 'none';
                            }, 300);
                        }
                    });
                });
            });
        })();

        // Modal de Proyectos
        const projectData = {
            everglow: {
                title: 'Everglow Spa',
                badge: 'Cliente satisfecho',
                tech: 'Laravel, MySQL, HTML, CSS',
                description: 'Sistema integral para spa de masajes relajantes con gestión completa de citas, control de pacientes y seguimiento personalizado de tratamientos. Incluye panel administrativo para gestión de servicios, horarios y clientes.',
                features: ['Sistema de citas online', 'Gestión de pacientes', 'Historial de tratamientos', 'Panel administrativo', 'Reportes y estadísticas', 'Notificaciones automáticas'],
                website: 'https://everglow.com.mx/',
                images: [
                    '/assets/img/everglow.png',
                    '/assets/img/everglow-movil.png'
                ]
            }
        };

        let currentModalImageIndex = 0;
        let currentProjectImages = [];

        function openProjectModal(projectId) {
            const modal = document.getElementById('projectModal');
            const content = document.getElementById('projectModalContent');
            const modalActions = document.getElementById('modalActions');
            const project = projectData[projectId];
            
            if (!project) return;
            
            // Guardar imágenes del proyecto actual
            currentProjectImages = project.images || [];
            currentModalImageIndex = 0;
            
            // Bloquear scroll del body
            document.body.style.overflow = 'hidden';
            
            // Actualizar imágenes
            updateModalImages();
            
            // Badge
            const badge = document.getElementById('modalBadge');
            if (badge) badge.textContent = project.badge || 'Proyecto completado';

            // Generar contenido dinámico
            const techIcons = { laravel:'deployed_code', mysql:'database', html:'code', css:'css', javascript:'javascript', react:'hub', wordpress:'web', php:'terminal', tailwind:'style', figma:'brush' };
            content.innerHTML = `
                <div>
                    <h2 class="text-2xl sm:text-3xl font-black leading-tight text-text-base">${project.title}</h2>
                </div>

                <div class="space-y-2">
                    <p class="text-[11px] font-bold uppercase tracking-widest text-text-muted">Descripción</p>
                    <p class="text-sm leading-relaxed text-text-secondary">${project.description}</p>
                </div>

                <div class="space-y-3">
                    <p class="text-[11px] font-bold uppercase tracking-widest text-text-muted">Características</p>
                    <ul class="space-y-2">
                        ${project.features.map(f => `
                            <li class="flex items-start gap-2.5">
                                <span class="material-symbols-outlined shrink-0 mt-0.5" style="font-size:16px;color:var(--primary)">check_circle</span>
                                <span class="text-sm text-text-secondary leading-snug">${f}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="space-y-3">
                    <p class="text-[11px] font-bold uppercase tracking-widest text-text-muted">Stack tecnológico</p>
                    <div class="flex flex-wrap gap-2">
                        ${project.tech.split(',').map(t => {
                            const key = t.trim().toLowerCase();
                            const icon = techIcons[key] || 'code';
                            return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style="background:rgba(74,158,255,.10);color:var(--primary);border:1px solid rgba(74,158,255,.18)">
                                <span class="material-symbols-outlined" style="font-size:14px">${icon}</span>
                                ${t.trim()}
                            </span>`;
                        }).join('')}
                    </div>
                </div>
            `;

            // Botones de acción
            modalActions.innerHTML = `
                ${project.website ? `
                    <a href="${project.website}" target="_blank" rel="noopener noreferrer"
                       class="flex-1 animated-gradient-btn text-white py-3.5 rounded-xl font-bold text-sm neon-btn-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                        Ver proyecto
                        <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                ` : ''}
                <button onclick="closeProjectModal()"
                    class="px-5 py-3.5 rounded-xl font-bold text-sm transition-all text-text-secondary hover:text-text-base"
                    style="background:rgba(128,128,128,.1);border:1px solid var(--border)">
                    Cerrar
                </button>
            `;
            
            modal.classList.add('modal-active');
        }

        function updateModalImages() {
            const desktopImg = document.getElementById('modalImageDesktop');
            const mobileImg = document.getElementById('modalImageMobile');
            const dotsContainer = document.getElementById('modalImageDots');
            
            if (currentProjectImages.length > 0) {
                desktopImg.src = currentProjectImages[currentModalImageIndex];
                mobileImg.src = currentProjectImages[currentModalImageIndex === 0 && currentProjectImages.length > 1 ? 1 : currentModalImageIndex];
                
                // Actualizar dots
                dotsContainer.innerHTML = currentProjectImages.map((_, index) => `
                    <span class="size-2 rounded-full ${index === currentModalImageIndex ? 'bg-white shadow-sm' : 'bg-white/40'} transition-all cursor-pointer" 
                          onclick="setModalImage(${index})"></span>
                `).join('');
            }
        }

        function nextModalImage() {
            if (currentProjectImages.length > 1) {
                currentModalImageIndex = (currentModalImageIndex + 1) % currentProjectImages.length;
                updateModalImages();
            }
        }

        function previousModalImage() {
            if (currentProjectImages.length > 1) {
                currentModalImageIndex = (currentModalImageIndex - 1 + currentProjectImages.length) % currentProjectImages.length;
                updateModalImages();
            }
        }

        function setModalImage(index) {
            currentModalImageIndex = index;
            updateModalImages();
        }

        function closeProjectModal() {
            const modal = document.getElementById('projectModal');
            modal.classList.remove('modal-active');
            // Restaurar scroll del body
            document.body.style.overflow = '';
        }

        // Cerrar modal al hacer clic fuera
        document.getElementById('projectModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'projectModal') {
                closeProjectModal();
            }
        });

        // Observar cambios en la clase del modal para bloquear el scroll cuando esté abierto
        (function() {
            const modal = document.getElementById('projectModal');
            if (!modal) return;

            function applyBodyLock(isLocked) {
                if (isLocked) {
                    // Guardar scroll position y bloquear
                    document.documentElement.style.overflow = 'hidden';
                    document.body.style.overflow = 'hidden';
                } else {
                    // Restaurar
                    document.documentElement.style.overflow = '';
                    document.body.style.overflow = '';
                }
            }

            // Inicial
            applyBodyLock(modal.classList.contains('modal-active') || modal.classList.contains('active'));

            const observer = new MutationObserver((mutations) => {
                mutations.forEach(m => {
                    if (m.attributeName === 'class') {
                        const isOpen = modal.classList.contains('modal-active') || modal.classList.contains('active');
                        applyBodyLock(isOpen);
                    }
                });
            });

            observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
        })();

        // Validación de Formulario de Contacto
        (function() {
            const form = document.getElementById('contactForm');
            if (!form) return;

            const nameInput = document.getElementById('contactName');
            const emailInput = document.getElementById('contactEmail');
            const messageInput = document.getElementById('contactMessage');
            const submitBtn = document.getElementById('submitBtn');
            const formSuccess = document.getElementById('formSuccess');

            function showError(input, message) {
                const errorSpan = document.querySelector(`[data-for="${input.name}"]`);
                if (errorSpan) {
                    errorSpan.textContent = message;
                    errorSpan.classList.remove('hidden');
                }
                input.classList.add('border-red-500');
            }

            function clearError(input) {
                const errorSpan = document.querySelector(`[data-for="${input.name}"]`);
                if (errorSpan) {
                    errorSpan.classList.add('hidden');
                }
                input.classList.remove('border-red-500');
            }

            function validateEmail(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            }

            [nameInput, emailInput, messageInput].forEach(input => {
                if (input) {
                    input.addEventListener('input', () => clearError(input));
                    input.addEventListener('blur', () => {
                        if (!input.value.trim()) {
                            showError(input, 'Este campo es requerido');
                        } else if (input.type === 'email' && !validateEmail(input.value)) {
                            showError(input, 'Por favor ingresa un email válido');
                        } else if (input.minLength && input.value.length < input.minLength) {
                            showError(input, `Mínimo ${input.minLength} caracteres`);
                        }
                    });
                }
            });

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                let hasErrors = false;

                // Validar nombre
                if (!nameInput.value.trim()) {
                    showError(nameInput, 'Por favor ingresa tu nombre');
                    hasErrors = true;
                } else if (nameInput.value.trim().length < 2) {
                    showError(nameInput, 'El nombre debe tener al menos 2 caracteres');
                    hasErrors = true;
                }

                // Validar email
                if (!emailInput.value.trim()) {
                    showError(emailInput, 'Por favor ingresa tu email');
                    hasErrors = true;
                } else if (!validateEmail(emailInput.value)) {
                    showError(emailInput, 'Por favor ingresa un email válido');
                    hasErrors = true;
                }

                // Validar mensaje
                if (!messageInput.value.trim()) {
                    showError(messageInput, 'Por favor ingresa un mensaje');
                    hasErrors = true;
                } else if (messageInput.value.trim().length < 10) {
                    showError(messageInput, 'El mensaje debe tener al menos 10 caracteres');
                    hasErrors = true;
                }

                if (hasErrors) return;

                // Simular envío
                submitBtn.classList.add('form-btn-loading');
                submitBtn.querySelector('.btn-text').classList.add('hidden');
                submitBtn.querySelector('.btn-spinner').classList.remove('hidden');
                submitBtn.disabled = true;

                setTimeout(() => {
                    submitBtn.classList.remove('form-btn-loading');
                    submitBtn.querySelector('.btn-text').classList.remove('hidden');
                    submitBtn.querySelector('.btn-spinner').classList.add('hidden');
                    submitBtn.disabled = false;
                    
                    // Mostrar mensaje de éxito
                    formSuccess.classList.remove('hidden');
                    form.reset();
                    
                    // Ocultar mensaje después de 5 segundos
                    setTimeout(() => {
                        formSuccess.classList.add('hidden');
                    }, 5000);
                }, 2000);
            });
        })();


        // NOTE: theme-color is now handled by the header-aware updater above.
        // The older simple updater was removed to avoid overwriting the header-calculated value.

        // ======================
        // TITLE CAROUSEL (tab marquee)
        // ======================
        (function() {
            // Config
            const enabled = true; // set false to disable
            const speedMs = 220; // lower = faster
            const padding = ' \u00A0\u00A0 '; // small gap between loops

            if (!enabled) return;

            const originalTitle = document.title || 'Raúl Web Dev';
            const text = (originalTitle + padding).trim() + padding;
            let idx = 0;
            let timer = null;

            function tick() {
                // rotate left by one character
                const out = text.slice(idx) + text.slice(0, idx);
                document.title = out;
                idx = (idx + 1) % text.length;
            }

            function start() {
                if (timer) return;
                timer = setInterval(tick, speedMs);
            }

            function stop() {
                if (!timer) return;
                clearInterval(timer);
                timer = null;
                document.title = originalTitle;
            }

            // Pause when tab hidden to save resources, resume when visible
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) stop(); else start();
            });

            // Start after load (so the initial title is set first)
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                start();
            } else {
                window.addEventListener('DOMContentLoaded', start);
            }

            // Ensure we restore original on unload
            window.addEventListener('beforeunload', stop);

        // ============================================
        // ACTIVE NAV HIGHLIGHT
        // Uses IntersectionObserver to mark which section is in view.
        // ============================================
        (function() {
            const navIds   = ['sobre-mi', 'servicios', 'proceso', 'proyectos', 'faq'];
            const clearIds = ['hero', 'contacto']; // no active item here
            const desktopLinks = document.querySelectorAll('.nav-link[href^="#"]');
            const mobileLinks  = document.querySelectorAll('.mobile-nav-link[href^="#"]');

            function setActive(id) {
                [...desktopLinks, ...mobileLinks].forEach(link => {
                    link.classList.toggle('nav-active', link.getAttribute('href') === '#' + id);
                });
            }

            function clearActive() {
                [...desktopLinks, ...mobileLinks].forEach(link => link.classList.remove('nav-active'));
            }

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    if (clearIds.includes(entry.target.id)) clearActive();
                    else setActive(entry.target.id);
                });
            }, {
                rootMargin: '-30% 0px -60% 0px',
                threshold: 0
            });

            [...navIds, ...clearIds].forEach(id => {
                const el = document.getElementById(id);
                if (el) observer.observe(el);
            });

            // Set active immediately on click without waiting for scroll
            document.addEventListener('click', function(e) {
                const link = e.target.closest('[href^="#"]');
                if (!link) return;
                const hash = link.getAttribute('href').slice(1);
                if (navIds.includes(hash)) setActive(hash);
                else if (clearIds.includes(hash)) clearActive();
            });
        })();

        // ============================================
        // SMOOTH SCROLL — scrolls to the first heading inside
        // the target section, compensating for the fixed header.
        // ============================================
        (function() {
            function scrollToSection(hash) {
                const section = document.getElementById(hash);
                if (!section) return;
                const header = document.getElementById('mainHeader');
                const headerH = header ? header.getBoundingClientRect().height : 80;
                // Aim at the first section-label or h2 so we land on the heading,
                // not on the blank py-28 padding above it.
                const anchor = section.querySelector('.section-label, h2') || section;
                const targetY = anchor.getBoundingClientRect().top + window.scrollY - headerH - 20;
                window.scrollTo({ top: targetY, behavior: 'smooth' });
            }

            document.addEventListener('click', function(e) {
                const link = e.target.closest('a[href^="#"]');
                if (!link) return;
                const hash = link.getAttribute('href').slice(1);
                if (!hash) return;
                if (!document.getElementById(hash)) return;
                e.preventDefault();
                scrollToSection(hash);
                history.pushState(null, '', '#' + hash);
            });
        })();
        })();