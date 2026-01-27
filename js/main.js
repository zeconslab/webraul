
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
            if (!themeToggle) return;

            const html = document.documentElement;
            const lightIcon = themeToggle.querySelector('.theme-icon-light');
            const darkIcon = themeToggle.querySelector('.theme-icon-dark');

            // Verificar preferencia guardada o del sistema
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                html.classList.add('dark');
                lightIcon.classList.add('hidden');
                darkIcon.classList.remove('hidden');
            }

            themeToggle.addEventListener('click', () => {
                html.classList.toggle('dark');
                
                if (html.classList.contains('dark')) {
                    localStorage.setItem('theme', 'dark');
                    lightIcon.classList.add('hidden');
                    darkIcon.classList.remove('hidden');
                } else {
                    localStorage.setItem('theme', 'light');
                    lightIcon.classList.remove('hidden');
                    darkIcon.classList.add('hidden');
                }
            });
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
            neobank: {
                title: 'Plataforma NeoBank',
                tech: 'React, Next.js, Tailwind CSS',
                description: 'Una plataforma fintech completa con gestión de cuentas, transferencias y análisis financiero en tiempo real.',
                features: ['Dashboard interactivo', 'Transferencias seguras', 'Análisis de gastos', 'Multi-currency'],
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTzivLt9EbuH3ibaRyZ-4aDZ9aUpEWu5dTLM40YrPqdVcrxQBeEzyde2skiA1OhusDbXg54neDUbNOJLpHpqFS4myUO1Y6PI9TpfVRsH9gWUu7CtXllWY89P4Cdwse3MHbx6mqODquEqd2oe46ujFt0lV-FbINxUwDpvUJshA5tMRCZS0p0mt4IXquvOPT7-3PoTle9ZD5gkBWEnwgWt_-JpB2hwj8Jm0cAuq8Bn2JlAgPhQYEOtGgo8m77dQqRsddBQIbiw4svXOp'
            },
            fashion: {
                title: 'Fashion Store Hub',
                tech: 'Headless Shopify, Vue.js',
                description: 'E-commerce de moda con experiencia de compra personalizada y sistema de recomendaciones basado en IA.',
                features: ['Carrito inteligente', 'Búsqueda visual', 'Wish list', 'Checkout optimizado'],
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAFOhakrl1NjgFnMWe7gHoJhOErMupU9Dc0g0iPEj6CfSA5PG1jKD0npoNLuUNNNi2qoQcN6NkOfeUTbz4-bAzsDnvd5SCBfG_vEmx5g26N11kkGd4Kf-3PYZ7qvEWvPAX4A40iYdr4K7QjrRvTfpU6RN9I0DMYhWBmqcv_Anqd4KFLHPth4HNSuiNjBxpWUUru3VS937frLvfp_aVYrTWn0LlJ2yQrMsD8YbhqX2iLDr5PRN8m0DVgm_2De6dRmmDaHIMJi_j8LzK'
            },
            inmopremium: {
                title: 'InmoPremium Pro',
                tech: 'Astro, TypeScript, Sanity CMS',
                description: 'Portal inmobiliario con búsqueda avanzada, tours virtuales 360° y sistema de gestión de propiedades.',
                features: ['Tours virtuales', 'Geolocalización', 'Filtros avanzados', 'CRM integrado'],
                image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxEmJjZvDOsCKQTeivaqQhI3Sgc6t6i6nS1XXvy1F7DDCSOTNzEoY1qHb1A5UgT85bT6h7P8GeXoHsNDl-WE7XwuepgRoiRPpg5uiC-nvEMT50q_lv6c03n2q8_6EVvz4KFqjODo3aacN26_u3ILij5swWdW_fONOFejdCyuj6PmifJdo08bpX9Biecpafd58f2Mpg5VKMj3HUjw_cwHb7NH-G4BesdE0kT7MtVDeAAZlurhmwIS6TAqCnK3MBHnzS_LkF_RfOUuWH'
            },
            agency: {
                title: 'Creative Agency',
                tech: 'HTML5, GSAP, Three.js',
                description: 'Landing page innovadora con animaciones 3D, efectos parallax y experiencias interactivas inmersivas.',
                features: ['Animaciones 3D', 'WebGL effects', 'Scroll interactivo', 'Performance optimizado'],
                image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80'
            },
            techstore: {
                title: 'Tech Gadgets Pro',
                tech: 'WooCommerce, WordPress',
                description: 'Tienda online especializada en tecnología con comparador de productos y reseñas verificadas.',
                features: ['Comparador', 'Reseñas verificadas', 'Soporte live chat', 'Envío tracking'],
                image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80'
            },
            lawfirm: {
                title: 'Bufete Legal Pro',
                tech: 'PHP, Laravel',
                description: 'Portal corporativo para bufete de abogados con sistema de citas online y gestión documental.',
                features: ['Reserva de citas', 'Gestión documental', 'Chat consultas', 'Blog legal'],
                image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80'
            }
        };

        function openProjectModal(projectId) {
            const modal = document.getElementById('projectModal');
            const content = document.getElementById('projectModalContent');
            const project = projectData[projectId];
            
            if (!project) return;
            
            content.innerHTML = `
                <div class="space-y-6">
                    <img src="${project.image}" alt="${project.title}" class="w-full aspect-video object-cover rounded-2xl shadow-xl">
                    <div class="space-y-4">
                        <h3 class="text-3xl md:text-4xl font-black">${project.title}</h3>
                        <p class="text-primary font-bold">${project.tech}</p>
                        <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">${project.description}</p>
                        <div class="space-y-3">
                            <h4 class="font-bold text-xl">Características principales:</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                ${project.features.map(feature => `
                                    <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <span class="material-symbols-outlined text-primary text-xl">check_circle</span>
                                        <span>${feature}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button class="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all neon-btn-glow flex items-center gap-2">
                                Ver Demo
                                <span class="material-symbols-outlined">open_in_new</span>
                            </button>
                            <button class="border-2 border-primary text-primary px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all">
                                Contactar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
        }

        function closeProjectModal() {
            const modal = document.getElementById('projectModal');
            modal.classList.remove('active');
        }

        // Cerrar modal al hacer clic fuera
        document.getElementById('projectModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'projectModal') {
                closeProjectModal();
            }
        });

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
