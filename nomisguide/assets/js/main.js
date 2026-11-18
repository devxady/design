/* Nomisguide — interactive navigation, sliders, motion and responsive controls. No dependencies. */
(() => {
  'use strict';
  const header = document.querySelector('#siteHeader');
  const mobileToggle = document.querySelector('#mobileMenuToggle');
  const mobileMenu = document.querySelector('#mobileMenu');
  const dropdown = document.querySelector('.nav-dropdown');
  const servicesToggle = document.querySelector('#servicesToggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const setMobile = (open) => {
    mobileMenu.hidden = !open;
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    if (!open) setMobileServices(false);
  };
  mobileToggle.addEventListener('click', () => setMobile(mobileMenu.hidden));
  mobileMenu.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => setMobile(false)));
  const mobileServicesToggle = document.querySelector('#mobileServicesToggle');
  const mobileServicesPanel = document.querySelector('#mobileServicesPanel');
  const setMobileServices = open => {
    mobileServicesToggle?.setAttribute('aria-expanded', String(open));
    mobileServicesPanel?.classList.toggle('is-expanded', open);
    if (mobileServicesPanel) mobileServicesPanel.inert = !open;
  };
  mobileServicesToggle?.addEventListener('click', () => setMobileServices(mobileServicesToggle.getAttribute('aria-expanded') !== 'true'));


  const setMega = (open) => {
    dropdown.classList.toggle('is-open', open);
    servicesToggle.setAttribute('aria-expanded', String(open));
    if (open) positionMega();
  };
  const positionMega = () => {
    const menu = dropdown.querySelector('.mega-menu');
    if (!menu || window.innerWidth <= 900) return;
    const button = servicesToggle.getBoundingClientRect();
    const width = Math.min(695, window.innerWidth - 32);
    const left = Math.min(Math.max(16, button.left - 22), window.innerWidth - width - 16);
    menu.style.setProperty('--mega-left', `${left}px`);
    menu.style.setProperty('--mega-top', `${header.getBoundingClientRect().bottom - 1}px`);
  };
  servicesToggle.addEventListener('click', e => { e.stopPropagation(); setMega(!dropdown.classList.contains('is-open')); });
  dropdown.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover) and (min-width:901px)').matches) setMega(true); });
  dropdown.addEventListener('mouseleave', e => { if (!dropdown.contains(e.relatedTarget)) setMega(false); });
  document.addEventListener('pointerdown', e => { if (!dropdown.contains(e.target)) setMega(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMega(false); setMobile(false); } });
  dropdown.querySelectorAll('.mega-menu a').forEach(a => a.addEventListener('click', () => setMega(false)));
  const updateHeader = () => { header.classList.toggle('is-scrolled', window.scrollY > 30); if (dropdown.classList.contains('is-open')) positionMega(); };
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', () => { positionMega(); if (innerWidth > 900) setMobile(false); }, { passive: true });
  updateHeader();

  // Independent native carousel scroll positions; controls always within the corresponding slider wrapper.
  document.querySelectorAll('[data-slider]').forEach(slider => {
    const track = slider.querySelector('.card-track');
    const footer = slider.nextElementSibling;
    const prev = footer?.querySelector('[data-prev]');
    const next = footer?.querySelector('[data-next]');
    const progress = footer?.querySelector('.progress-thumb');
    if (!track || !prev || !next) return;
    const getStep = () => {
      const card = track.querySelector('article');
      return card ? card.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).gap) || 0) : 300;
    };
    const move = direction => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const target = Math.max(0, Math.min(max, track.scrollLeft + getStep() * direction));
      track.scrollTo({left: target, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    };
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    const update = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      prev.disabled = track.scrollLeft < 3;
      next.disabled = track.scrollLeft >= max - 3;
      if (progress) {
        const width = max > 0 ? Math.max(20, (track.clientWidth / track.scrollWidth) * 100) : 100;
        progress.style.width = `${width}%`;
        progress.style.left = `${max ? (track.scrollLeft / max) * (100 - width) : 0}%`;
      }
    };
    track.addEventListener('scroll', update, {passive:true});
    window.addEventListener('resize', update, {passive:true});
    document.fonts?.ready.then(update);
    update();
  });

  // Use native browser wheel and touch scrolling. No preventDefault, RAF damping, or snapping.
  // Anchor links are smoothly scrolled by CSS scroll-behavior only.

  // Exactly one FAQ item open. Height + opacity animation on open/close.
  const faqItems = Array.from(document.querySelectorAll('.faq-items details'));
  const faqAnimations = new WeakMap();
  function toggleFaq(item, shouldOpen) {
    const paragraph = item.querySelector('p');
    if (!paragraph) { item.open = shouldOpen; return; }
    const existing = faqAnimations.get(item);
    if (existing) { existing.cancel(); faqAnimations.delete(item); }
    const duration = reducedMotion.matches ? 0 : 300;
    if (shouldOpen) {
      item.open = true;
      if (!duration) return;
      const height = paragraph.scrollHeight;
      const animation = paragraph.animate([
        {height:'0px',opacity:0}, {height:`${height}px`,opacity:1}
      ], {duration,easing:'cubic-bezier(.2,.75,.25,1)'});
      faqAnimations.set(item, animation);
      animation.finished.then(() => { if(faqAnimations.get(item)===animation) faqAnimations.delete(item); }).catch(()=>{});
    } else if (item.open) {
      if (!duration) {item.open=false;return;}
      const height = paragraph.getBoundingClientRect().height;
      const animation = paragraph.animate([
        {height:`${height}px`,opacity:1}, {height:'0px',opacity:0}
      ], {duration:260,easing:'ease-in-out'});
      faqAnimations.set(item, animation);
      animation.finished.then(()=>{
        if(faqAnimations.get(item)===animation){item.open=false;faqAnimations.delete(item);}
      }).catch(()=>{});
    }
  }
  faqItems.forEach(item => {
    item.querySelector('summary')?.addEventListener('click', event => {
      event.preventDefault();
      const willOpen = !item.open;
      faqItems.forEach(other => { if(other!==item && other.open) toggleFaq(other,false); });
      toggleFaq(item, willOpen);
    });
  });
  // First question starts open, so visitors have a visible example of the interaction.
  if(faqItems.length){faqItems.forEach((item,index)=>item.open=index===0);}

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const targets = document.querySelectorAll('.section-heading,.value-card,.service-card,.work-card,.industry-card,.quote-box,.faq-layout,.footer-main');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), {threshold:.07, rootMargin:'0px 0px -24px 0px'});
    targets.forEach(el => {el.classList.add('reveal-on-scroll'); observer.observe(el);});
  }
  const year = document.querySelector('#year'); if (year) year.textContent=String(new Date().getFullYear());
})();
