document.addEventListener('DOMContentLoaded', () => {

  // ---- Loader ----
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => loader.classList.add('hidden'), 500);
  }

  // ---- Antigravity Floating Shapes Canvas ----
  const canvas = document.getElementById('particleCanvas');
  let ctx, particles, animId;

  if (canvas) {
    ctx = canvas.getContext('2d');
    particles = [];

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const config = {
      particleCount: Math.min(45, Math.floor(window.innerWidth * 0.03)),
      speedFactor: 0.8,
      colors: ['#4d7bf3', '#6c63ff', '#00d4aa', '#f72585', '#ffd166', '#4895ef'],
      interactionRadius: 180,
      friction: 0.98,
      gravity: -0.04
    };

    class Particle {
      constructor() {
        this.init(true);
      }

      init(randomY) {
        this.x = Math.random() * window.innerWidth;
        this.y = randomY ? Math.random() * window.innerHeight : window.innerHeight + 50;
        this.size = Math.random() * 12 + 4;
        this.vx = (Math.random() - 0.5) * 1.8 * config.speedFactor;
        this.vy = (Math.random() - 0.5) * 1.8 * config.speedFactor;
        this.vy -= Math.random() * 0.8 * Math.abs(config.gravity) * 20;
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.04;
        this.shapeType = Math.floor(Math.random() * 3);
        this.depth = Math.random() * 0.8 + 0.4;
        this.opacity = Math.random() * 0.35 + 0.25;
      }

      update(mouseX, mouseY) {
        this.vy += config.gravity * 0.04 * this.depth;
        this.x += this.vx * this.depth;
        this.y += this.vy * this.depth;
        this.rotation += this.rotationSpeed;

        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < config.interactionRadius) {
          const force = (config.interactionRadius - dist) / config.interactionRadius;
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force * 3.5;
          this.vy += Math.sin(angle) * force * 3.5;
        }

        this.vx *= config.friction;
        this.vy *= config.friction;

        if (this.x < -60) this.x = window.innerWidth + 60;
        if (this.x > window.innerWidth + 60) this.x = -60;
        if (this.y < -80) this.init(false);
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        const s = this.size * this.depth;

        ctx.beginPath();
        if (this.shapeType === 0) {
          ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        } else if (this.shapeType === 1) {
          ctx.rect(-s / 2, -s / 2, s, s);
        } else {
          ctx.moveTo(0, -s / 2);
          ctx.lineTo(s / 2, s / 2);
          ctx.lineTo(-s / 2, s / 2);
          ctx.closePath();
        }
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    for (let i = 0; i < config.particleCount; i++) particles.push(new Particle());

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(77, 123, 243, ${0.05 * (1 - dist / 180)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
    }

    let mouseX = -1000, mouseY = -1000;
    window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
    window.addEventListener('touchmove', e => {
      if (e.touches.length) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }
    });

    function animate() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach(p => { p.update(mouseX, mouseY); p.draw(); });
      drawLines();
      animId = requestAnimationFrame(animate);
    }
    animate();
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
