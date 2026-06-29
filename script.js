document.addEventListener('DOMContentLoaded', () => {

  // ---- Loader ----
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 500);
  }

  // ---- Particle Canvas ----
  const canvas = document.getElementById('particleCanvas');
  let ctx, particles, animId;

  if (canvas) {
    ctx = canvas.getContext('2d');
    particles = [];

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(77, 123, 243, ${this.opacity})`;
        ctx.fill();
      }
    }

    const particleCount = Math.min(80, Math.floor(window.innerWidth * 0.05));
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(77, 123, 243, ${0.06 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    let mouse = { x: null, y: null };
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        if (mouse.x !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            p.x -= dx * 0.003;
            p.y -= dy * 0.003;
          }
        }
        p.update();
        p.draw();
      });
      drawLines();
      animId = requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  // ---- Scroll Progress Bar ----
  const progressBar = document.createElement('div');
  progressBar.id = 'scrollProgress';
  document.body.prepend(progressBar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  });

  // ---- Mobile Menu (slide-in drawer) ----
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuBtn.innerHTML = navLinks.classList.contains('active')
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999;display:none';
    document.body.appendChild(overlay);

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
        overlay.style.display = 'none';
      });
    });

    navLinks.addEventListener('click', e => {
      if (e.target === navLinks) {
        navLinks.classList.remove('active');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
      }
    });
  }

  // ---- Smooth Scroll ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
      }
    });
  });

  // ---- Header Scroll ----
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 60);
  });

  // ---- Active Nav Link ----
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (link) link.classList.toggle('active', scrollY >= top && scrollY < bottom);
    });
  });

  // ---- Back to Top ----
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    });
    backToTop.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Theme Toggle ----
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light-theme');
      if (icon) { icon.classList.remove('fa-sun'); icon.classList.add('fa-moon'); }
    }
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-theme');
      const isLight = document.documentElement.classList.contains('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      if (icon) {
        icon.classList.remove('fa-sun', 'fa-moon');
        icon.classList.add(isLight ? 'fa-moon' : 'fa-sun');
      }
    });
  }

  // ---- Typewriter Effect ----
  const subtitleEl = document.querySelector('.subtitle');
  if (subtitleEl) {
    const phrases = [
      'Aspiring Financial Analyst',
      'Data Enthusiast',
      'Future Researcher',
      'Actuarial Analyst Intern'
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let isPaused = false;
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    subtitleEl.appendChild(cursor);

    function type() {
      if (isPaused) {
        setTimeout(type, 2000);
        isPaused = false;
        return;
      }

      const current = phrases[phraseIdx];
      let textBefore = subtitleEl.textContent.replace(cursor.textContent, '');

      if (!isDeleting) {
        textBefore = current.substring(0, charIdx + 1);
        charIdx++;
        if (charIdx === current.length) {
          isPaused = true;
          isDeleting = true;
          setTimeout(type, 2500);
          return;
        }
      } else {
        textBefore = current.substring(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          isPaused = true;
          setTimeout(type, 500);
          return;
        }
      }

      const displayText = document.createTextNode(textBefore);
      subtitleEl.textContent = '';
      subtitleEl.appendChild(displayText);
      subtitleEl.appendChild(cursor);
      setTimeout(type, isDeleting ? 30 : 80);
    }
    setTimeout(type, 1000);
  }

  // ---- 3D Tilt on Cards ----
  document.querySelectorAll('.project-card, .skill-category, .blog-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.01)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ---- Project Filtering ----
  const filterBtns = document.querySelectorAll('.project-filters .filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterBtns.length && projectCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        projectCards.forEach((card, i) => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'flex';
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, i * 80);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => { card.style.display = 'none'; }, 300);
          }
        });
      });
    });
  }

  // ---- Project Details Modal ----
  document.querySelectorAll('.project-details-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const id = btn.dataset.project;
      const modal = document.getElementById(`project-${id}-details`);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.project-detail-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        const videos = modal.querySelectorAll('video');
        videos.forEach(v => v.pause());
      }
    });
  });

  document.querySelectorAll('.project-detail-modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        const videos = modal.querySelectorAll('video');
        videos.forEach(v => v.pause());
      }
    });
  });

  // ---- Skill Bar Animation (animated counter) ----
  const skillBars = document.querySelectorAll('.skill-progress');
  let skillsAnimated = false;

  function animateSkills() {
    if (skillsAnimated) return;
    const trigger = document.querySelector('.skills');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      skillsAnimated = true;
      skillBars.forEach(bar => {
        const target = parseInt(bar.dataset.width);
        bar.style.width = target + '%';

        const info = bar.closest('.skill-item')?.querySelector('.skill-info span:last-child');
        if (info) {
          let current = 0;
          const step = Math.ceil(target / 40);
          const interval = setInterval(() => {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(interval);
            }
            info.textContent = current + '%';
          }, 20);
        }
      });
    }
  }

  window.addEventListener('scroll', animateSkills);
  animateSkills();

  // ---- Fade-up Animations (with stagger support) ----
  const fadeEls = document.querySelectorAll('.fade-up');

  function checkFade() {
    fadeEls.forEach(el => {
      if (el.classList.contains('visible')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        el.classList.add('visible');
      }
    });
  }

  window.addEventListener('scroll', checkFade);
  checkFade();

  // ---- Contact Form ----
  const form = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMessage');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(form);

      formMsg.className = 'form-message';
      formMsg.textContent = 'Sending...';
      formMsg.style.display = 'block';

      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
      .then(res => {
        if (res.ok) {
          formMsg.className = 'form-message success';
          formMsg.textContent = 'Thanks! I\'ll get back to you soon.';
          form.reset();
        } else {
          throw new Error('Network error');
        }
      })
      .catch(() => {
        formMsg.className = 'form-message error';
        formMsg.textContent = 'Something went wrong. Please try again.';
      });
    });
  }

  // ---- Intersection Observer for project grid stagger ----
  const grid = document.querySelector('.projects-grid');
  if (grid) {
    const cards = grid.querySelectorAll('.project-card');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          cards.forEach((card, i) => {
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            }, i * 100);
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(grid);
  }
});
