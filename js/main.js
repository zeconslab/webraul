
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

                function updateMobileMenuPosition() {
                    if (!headerEl) return;
                    const rect = headerEl.getBoundingClientRect();
                    // small gap (4px) to keep it detached
                    const gap = 4; // smaller gap for a tighter, more elegant look
                    mobileMenu.style.top = rect.bottom + gap + 'px';
                    mobileMenu.style.left = '0';
                    mobileMenu.style.right = '0';
                }

                if (isActive) {
                    // Cerrar menú
                    mobileMenu.classList.remove('active');
                    hamburgerIcon?.classList.remove('hidden');
                    closeIcon?.classList.add('hidden');
                    // remove fixed positioning
                    mobileMenu.style.position = '';
                    mobileMenu.style.top = '';
                    mobileMenu.style.left = '';
                    mobileMenu.style.right = '';
                    mobileMenu.style.transition = '';
                    // remove outside click listener
                    document.removeEventListener('click', handleOutsideClick);
                    // remove scroll listener
                    window.removeEventListener('scroll', updateMobileMenuPosition);
                    window.removeEventListener('resize', updateMobileMenuPosition);
                } else {
                    // Abrir menú
                    mobileMenu.classList.add('active');
                    hamburgerIcon?.classList.add('hidden');
                    closeIcon?.classList.remove('hidden');
                    // fix the menu under the header and keep gap while scrolling
                    mobileMenu.style.position = 'fixed';
                    mobileMenu.style.width = '100%';
                    mobileMenu.style.transition = 'top 180ms ease';
                    updateMobileMenuPosition();
                    // update position on scroll/resize to maintain gap
                    window.addEventListener('scroll', updateMobileMenuPosition, { passive: true });
                    window.addEventListener('resize', updateMobileMenuPosition);
                    // add outside click listener after current event loop to avoid immediate close
                    setTimeout(() => document.addEventListener('click', handleOutsideClick));
                }
                
            }
            
            // Eventos
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
            
            // Cerrar al hacer click en un link
            mobileNavLinks?.forEach(link => {
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
                const header = document.querySelector('header');
                if (!header) return DEFAULT_COLOR;

                // 1) Walk header and its descendants for the first non-transparent background
                const all = [header, ...header.querySelectorAll('*')];
                for (const el of all) {
                    const c = computedBgColor(el);
                    if (c) return c;
                }

                // 2) Walk up to body/root to find a background (helps when header is translucent)
                let el = header.parentElement;
                while (el) {
                    const c = computedBgColor(el);
                    if (c) return c;
                    el = el.parentElement;
                }

                // 3) Try body and documentElement explicitly
                const bodyColor = computedBgColor(document.body);
                if (bodyColor) return bodyColor;
                const rootColor = computedBgColor(document.documentElement);
                if (rootColor) return rootColor;

                // 4) Try some common CSS custom properties that might contain the theme background
                const rootStyle = getComputedStyle(document.documentElement);
                const possibleVars = ['--background-dark', '--background-light', '--bg', '--color-bg', '--color-background'];
                for (const v of possibleVars) {
                    const val = rootStyle.getPropertyValue(v).trim();
                    if (val) return rgbToHex(val);
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

            // Update on load, scroll, resize and theme toggle clicks
            window.addEventListener('load', updateMeta);
            window.addEventListener('resize', updateMeta, { passive: true });
            window.addEventListener('scroll', updateMeta, { passive: true });

            // Listen for theme toggle clicks (desktop and mobile)
            document.addEventListener('click', (e) => {
                if (e.target.closest('#themeToggle') || e.target.closest('#mobileThemeToggle')) {
                    setTimeout(updateMeta, 80);
                }
            });

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
            
            // Animación suave del cursor
            function animateCursor() {
                // Cursor principal con retraso
                cursorX += (mouseX - cursorX) * 0.1;
                cursorY += (mouseY - cursorY) * 0.1;
                cursor.style.left = cursorX - 20 + 'px';
                cursor.style.top = cursorY - 20 + 'px';
                
                // Punto central sin retraso
                dotX += (mouseX - dotX) * 0.3;
                dotY += (mouseY - dotY) * 0.3;
                cursorDot.style.left = dotX - 4 + 'px';
                cursorDot.style.top = dotY - 4 + 'px';
                
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
            
            // Configurar tamaño del canvas
            function resizeCanvas() {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            }
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
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
            createParticles();
            window.addEventListener('resize', createParticles);
            
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

        // ======================
        // ENHANCED SCROLL REVEAL
        // ======================
        (function() {
            const revealElements = document.querySelectorAll('.reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-scale, .reveal-zoom, .reveal-rotate');
            
            if (revealElements.length === 0) return;
            
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -80px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            revealElements.forEach(el => {
                observer.observe(el);
            });
            
            // Verificar elementos que ya están en viewport al cargar
            setTimeout(() => {
                revealElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
                    
                    if (rect.top < windowHeight - 100) {
                        el.classList.add('visible');
                    }
                });
            }, 100);
        })();

        // Scroll to Top Button
        (function() {
            const scrollToTopBtn = document.getElementById('scrollToTopBtn');
            if (!scrollToTopBtn) return;
            
            // Mostrar/ocultar botón basado en la posición del scroll
            function toggleScrollButton() {
                if (window.pageYOffset > 300) {
                    scrollToTopBtn.classList.add('show');
                } else {
                    scrollToTopBtn.classList.remove('show');
                }
            }
            
            // Hacer scroll hacia arriba al hacer clic
            scrollToTopBtn.addEventListener('click', function() {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
            
            // Escuchar el evento de scroll
            window.addEventListener('scroll', toggleScrollButton, { passive: true });
            
            // Verificar posición inicial
            toggleScrollButton();
        })();

        // Progress bar: update width based on scroll progress
        (function () {
            const bar = document.querySelector('.progress-bar-fill');
            if (!bar) return;
            bar.style.transformOrigin = '0% 50%';
            function updateProgress() {
                const doc = document.documentElement;
                const scrollTop = window.scrollY || doc.scrollTop || document.body.scrollTop;
                const max = doc.scrollHeight - window.innerHeight;
                const progress = max > 0 ? Math.min(Math.max(scrollTop / max, 0), 1) : 0;
                bar.style.transform = `scaleX(${progress})`;
            }
            updateProgress();
            window.addEventListener('scroll', updateProgress, { passive: true });
            window.addEventListener('resize', updateProgress);
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
            
            function updateCarousel(newIndex) {
                // Update current index
                currentIndex = newIndex;
                if (currentIndex < 0) currentIndex = totalCards - 1;
                if (currentIndex >= totalCards) currentIndex = 0;
                
                // Simple calculation: shift track based on index
                // The middle card (index 1) should have no offset
                // Index 0 should shift right, index 2 should shift left
                const isMobile = window.innerWidth < 1024;
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

        // Scroll Reveal Animations (Fallback para navegadores sin animation-timeline)
        (function() {
            // Verificar soporte de animation-timeline
            const supportsAnimationTimeline = CSS.supports('animation-timeline: view()');
            
            if (!supportsAnimationTimeline) {
                const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale');
                
                const observerOptions = {
                    threshold: 0.1,
                    rootMargin: '0px 0px -8% 0px'
                };
                
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            // Agregar delay stagger si tiene clase stagger
                            const delay = entry.target.classList.contains('stagger-1') ? 50 :
                                         entry.target.classList.contains('stagger-2') ? 150 :
                                         entry.target.classList.contains('stagger-3') ? 250 :
                                         entry.target.classList.contains('stagger-4') ? 350 : 0;
                            
                            setTimeout(() => {
                                entry.target.classList.add('is-visible');
                            }, delay);
                            
                            observer.unobserve(entry.target);
                        }
                    });
                }, observerOptions);
                
                revealElements.forEach(el => observer.observe(el));
            }
            
            // Agregar animación suave a los elementos hover
            const cards = document.querySelectorAll('.group');
            cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transition = 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
                });
            });
        })();

        // FAQ Accordion behavior: close others when opening one
        (function() {
            const faqDetails = document.querySelectorAll('#faq details');
            let isAnimating = false;
            
            faqDetails.forEach(detail => {
                detail.addEventListener('click', function(e) {
                    // Prevenir el comportamiento por defecto si está animando
                    if (isAnimating) {
                        e.preventDefault();
                        return;
                    }
                    
                    // Si se está cerrando, permitir sin más acciones
                    if (this.open) {
                        return;
                    }
                    
                    // Si se está abriendo
                    e.preventDefault();
                    isAnimating = true;
                    
                    const clickedDetail = this;
                    const wasAnyOpen = Array.from(faqDetails).some(d => d.open);
                    
                    // Cerrar todas las demás primero
                    faqDetails.forEach(otherDetail => {
                        if (otherDetail !== clickedDetail && otherDetail.open) {
                            otherDetail.open = false;
                        }
                    });
                    
                    // Esperar solo 200ms para que las animaciones se solapen
                    setTimeout(() => {
                        clickedDetail.open = true;
                        isAnimating = false;
                        
                        // Solo hacer scroll si no había ninguna abierta antes
                        if (!wasAnyOpen) {
                            setTimeout(() => {
                                clickedDetail.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'nearest',
                                    inline: 'nearest'
                                });
                            }, 200);
                        }
                    }, wasAnyOpen ? 200 : 0);
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

            function updateParallax() {
                parallaxElements.forEach(element => {
                    const rect = element.getBoundingClientRect();
                    const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                    const translateY = (scrollPercent - 0.5) * 50;
                    element.style.transform = `translateY(${translateY}px)`;
                });
            }

            window.addEventListener('scroll', updateParallax, { passive: true });
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
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 10;
                    const rotateY = (centerX - x) / 10;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
                });
                
                card.addEventListener('mouseleave', () => {
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

            // Verificar preferencia guardada o del sistema
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
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
            
            if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                html.classList.add('dark');
                updateThemeIcons(true);
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
                tech: 'Laravel, MySQL, HTML, CSS',
                description: 'Sistema integral para spa de masajes relajantes con gestión completa de citas, control de pacientes y seguimiento personalizado de tratamientos. Incluye panel administrativo para gestión de servicios, horarios y reportes.',
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
            
            // Generar contenido dinámico
            content.innerHTML = `
                <div>
                    <span class="text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                        ${project.tech.split(',')[0].trim()}
                    </span>
                    <h2 class="text-3xl lg:text-4xl font-black mt-4 leading-tight">${project.title}</h2>
                </div>
                <div class="space-y-4">
                    <h4 class="text-sm font-black uppercase text-gray-500 tracking-wider">Descripción del Proyecto</h4>
                    <div class="grid gap-4">
                        <div class="flex items-start gap-3">
                            <span class="material-symbols-outlined text-primary text-xl">check_circle</span>
                            <p class="text-sm text-gray-600 dark:text-gray-400">${project.description}</p>
                        </div>
                    </div>
                </div>
                <div class="space-y-4">
                    <h4 class="text-sm font-black uppercase text-gray-500 tracking-wider">Características Principales</h4>
                    <div class="grid gap-2">
                        ${project.features.map(feature => `
                            <div class="flex items-start gap-3">
                                <span class="material-symbols-outlined text-primary text-xl">check_circle</span>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${feature}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="space-y-4">
                    <h4 class="text-sm font-black uppercase text-gray-500 tracking-wider">Stack Tecnológico</h4>
                    <div class="flex gap-4">
                        ${project.tech.split(',').map((tech, i) => {
                            const icons = ['deployed_code', 'database', 'css', 'javascript'];
                            return `
                            <div class="size-11 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center group hover:bg-primary/10 transition-colors" title="${tech.trim()}">
                                <span class="material-symbols-outlined text-primary">${icons[i] || 'code'}</span>
                            </div>
                        `}).join('')}
                    </div>
                </div>
            `;
            
            // Generar botones de acción
            modalActions.innerHTML = `
                ${project.website ? `
                    <a href="${project.website}" target="_blank" rel="noopener noreferrer" 
                       class="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm lg:text-base neon-btn-glow hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        Visitar Sitio Web
                        <span class="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                ` : ''}
                <button class="px-6 py-4 rounded-xl font-bold text-sm lg:text-base border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-all" 
                        onclick="closeProjectModal()">
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


        function updateThemeColor() {
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (!metaTheme) return;
            const isDark = document.documentElement.classList.contains('dark');

            metaTheme.setAttribute('content', isDark ? '#101622' : '#135bec');
        }

        // Al cargar
        updateThemeColor();

        // Cuando cambias el tema manualmente
        document.addEventListener('theme-change', updateThemeColor);