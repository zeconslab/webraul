
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
