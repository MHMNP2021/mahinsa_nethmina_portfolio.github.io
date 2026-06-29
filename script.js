document.addEventListener('DOMContentLoaded', () => {

  // ---- Loader ----
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }, 600);

  // ---- Mobile Menu ----
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuBtn.innerHTML = navLinks.classList.contains('active')
        ? '<i class="fas fa-times"></i>'
        : '<i class="fas fa-bars"></i>';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        if (menuBtn) menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
      });
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
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });

  // ---- Header Scroll Effect ----
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }
  });

  // ---- Active Nav Link on Scroll ----
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (link) {
        link.classList.toggle('active', scrollY >= top && scrollY < bottom);
      }
    });
  });

  // ---- Back to Top ----
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('visible', window.scrollY > 300);
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

  // ---- Project Filtering ----
  const filterBtns = document.querySelectorAll('.project-filters .filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (filterBtns.length && projectCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        projectCards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'flex';
            requestAnimationFrame(() => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
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

  // ---- Skill Bar Animation ----
  const skillBars = document.querySelectorAll('.skill-progress');
  let skillsAnimated = false;

  function animateSkills() {
    if (skillsAnimated) return;
    const trigger = document.querySelector('.skills');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      skillsAnimated = true;
      skillBars.forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    }
  }

  window.addEventListener('scroll', animateSkills);
  animateSkills();

  // ---- Fade-up Animations ----
  const fadeEls = document.querySelectorAll('.fade-up');

  function checkFade() {
    fadeEls.forEach(el => {
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
});
