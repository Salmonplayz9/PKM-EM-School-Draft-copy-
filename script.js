const body = document.body;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#navMenu");
const navLinks = [...document.querySelectorAll(".nav-menu a")];
const navDropdowns = [...document.querySelectorAll(".nav-dropdown")];
const navDropdownToggles = [...document.querySelectorAll(".nav-dropdown-toggle")];
const themeToggle = document.querySelector(".theme-toggle");

// Set to "open" to view PDFs in a new tab, or "download" to download them.
const PDF_LINK_MODE = "open";

const syllabusSearch = document.querySelector("#syllabusSearch");
const syllabusRows = [...document.querySelectorAll("#syllabusTableBody tr")];
const syllabusEmpty = document.querySelector("#syllabusEmpty");
const syllabusPageInfo = document.querySelector("#syllabusPageInfo");
const syllabusPagination = document.querySelector("#syllabusPagination");
const accordionItems = [...document.querySelectorAll(".accordion-item")];
const revealItems = [...document.querySelectorAll(".reveal")];
const counters = [...document.querySelectorAll("[data-counter]")];
const noticeItems = [...document.querySelectorAll(".notice-track li")];
const filterButtons = [...document.querySelectorAll(".filter-btn")];
const galleryCards = [...document.querySelectorAll(".gallery-card")];
const forms = [...document.querySelectorAll("form")];
const testimonials = [...document.querySelectorAll(".testimonial")];
const prevTestimonial = document.querySelector(".carousel-btn.prev");
const nextTestimonial = document.querySelector(".carousel-btn.next");
const lightbox = document.querySelector(".lightbox");
const lightboxImg = lightbox?.querySelector("img");
const lightboxCaption = lightbox?.querySelector("p");
const lightboxClose = document.querySelector(".lightbox-close");

let activeNotice = 0;
let activeTestimonial = 0;

const savedTheme = localStorage.getItem("assam-school-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  body.classList.add("dark");
}

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
  document.documentElement.style.setProperty("--scroll", String(window.scrollY));
}

function closeMenu() {
  navMenu.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  closeDropdowns();
}

function closeDropdowns(except) {
  navDropdowns.forEach((dropdown) => {
    if (dropdown === except) return;
    dropdown.classList.remove("is-open");
    dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
  });
}

function isMobileNav() {
  return window.matchMedia("(max-width: 1080px)").matches;
}

function setActiveNav(sectionId) {
  navLinks.forEach((link) => {
    link.classList.toggle("is-current", link.getAttribute("href") === `#${sectionId}`);
  });

  navDropdownToggles.forEach((toggle) => toggle.classList.remove("is-current"));

  navDropdowns.forEach((dropdown) => {
    const childActive = dropdown.querySelector(`.nav-dropdown-menu a[href="#${sectionId}"]`);
    if (childActive) {
      dropdown.querySelector(".nav-dropdown-toggle")?.classList.add("is-current");
    }
  });
}

function showNotice(index) {
  noticeItems.forEach((item, itemIndex) => {
    item.classList.toggle("is-active", itemIndex === index);
  });
}

function animateCounter(counter) {
  const target = Number(counter.dataset.counter || 0);
  const duration = 1300;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.round(target * eased).toLocaleString("en-IN");
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function showTestimonial(index) {
  testimonials.forEach((item, itemIndex) => {
    item.classList.toggle("is-active", itemIndex === index);
  });
}

function openLightbox(card) {
  if (!lightbox || !lightboxImg || !lightboxCaption) return;
  const image = card.querySelector("img");
  const caption = card.querySelector("figcaption");
  lightboxImg.src = image.src;
  lightboxImg.alt = image.alt;
  lightboxCaption.textContent = caption?.textContent || "";
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  lightboxClose.focus();
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  if (lightboxImg) lightboxImg.removeAttribute("src");
}

function configurePdfLinks() {
  document.querySelectorAll(".pdf-link").forEach((link) => {
    const filename = link.dataset.pdf || link.getAttribute("href")?.split("/").pop();
    if (PDF_LINK_MODE === "download") {
      link.setAttribute("download", filename || "");
      link.removeAttribute("target");
      link.removeAttribute("rel");
    } else {
      link.removeAttribute("download");
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });

  document.querySelectorAll(".pdf-download-btn, .nav-pdf-download").forEach((link) => {
    const filename = link.dataset.filename || link.dataset.pdf || link.getAttribute("href")?.split("/").pop();
    link.setAttribute("download", filename || "");
    link.removeAttribute("target");
    link.removeAttribute("rel");
  });
}

function triggerPdfDownload(link) {
  const href = link.getAttribute("href");
  const filename = link.dataset.filename || link.dataset.pdf || href?.split("/").pop();
  if (!href) return;

  const tempLink = document.createElement("a");
  tempLink.href = href;
  tempLink.download = filename || "";
  tempLink.style.display = "none";
  document.body.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();
}

const SYLLABUS_ROWS_PER_PAGE = 5;
let syllabusQuery = "";
let syllabusPage = 1;

function getVisibleSyllabusRows() {
  return syllabusRows.filter((row) => {
    const className = row.dataset.class || row.cells[0]?.textContent || "";
    return className.toLowerCase().includes(syllabusQuery.toLowerCase());
  });
}

function renderSyllabusTable() {
  const visibleRows = getVisibleSyllabusRows();
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / SYLLABUS_ROWS_PER_PAGE));
  syllabusPage = Math.min(syllabusPage, totalPages);

  syllabusRows.forEach((row) => row.classList.add("is-hidden-row"));

  if (visibleRows.length === 0) {
    syllabusEmpty.hidden = false;
    syllabusPageInfo.textContent = "Page 0 of 0";
    syllabusPagination.querySelector('[data-page-action="prev"]').disabled = true;
    syllabusPagination.querySelector('[data-page-action="next"]').disabled = true;
    return;
  }

  syllabusEmpty.hidden = true;
  const start = (syllabusPage - 1) * SYLLABUS_ROWS_PER_PAGE;
  visibleRows.slice(start, start + SYLLABUS_ROWS_PER_PAGE).forEach((row) => {
    row.classList.remove("is-hidden-row");
  });

  syllabusPageInfo.textContent = `Page ${syllabusPage} of ${totalPages}`;
  syllabusPagination.querySelector('[data-page-action="prev"]').disabled = syllabusPage <= 1;
  syllabusPagination.querySelector('[data-page-action="next"]').disabled = syllabusPage >= totalPages;
}

function initSyllabusTable() {
  if (!syllabusRows.length) return;

  syllabusSearch?.addEventListener("input", (event) => {
    syllabusQuery = event.target.value.trim();
    syllabusPage = 1;
    renderSyllabusTable();
  });

  syllabusPagination?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page-action]");
    if (!button || button.disabled) return;

    if (button.dataset.pageAction === "prev") syllabusPage -= 1;
    if (button.dataset.pageAction === "next") syllabusPage += 1;
    renderSyllabusTable();
  });

  renderSyllabusTable();
}

function closeAccordionItem(item) {
  const trigger = item.querySelector(".accordion-trigger");
  const panel = item.querySelector(".accordion-panel");
  trigger?.setAttribute("aria-expanded", "false");
  panel?.classList.remove("is-open");
}

function openAccordionItem(item) {
  const trigger = item.querySelector(".accordion-trigger");
  const panel = item.querySelector(".accordion-panel");
  trigger?.setAttribute("aria-expanded", "true");
  panel?.classList.add("is-open");
}

function initAccordion() {
  accordionItems.forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    trigger?.addEventListener("click", () => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      accordionItems.forEach((otherItem) => {
        if (otherItem !== item) closeAccordionItem(otherItem);
      });

      if (isOpen) {
        closeAccordionItem(item);
      } else {
        openAccordionItem(item);
      }
    });
  });
}

function initPdfDownloads() {
  configurePdfLinks();

  document.querySelectorAll(".nav-pdf-download, .pdf-download-btn").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      triggerPdfDownload(link);
      if (link.classList.contains("nav-pdf-download")) closeMenu();
    });
  });
}

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

navDropdownToggles.forEach((toggle) => {
  const dropdown = toggle.closest(".nav-dropdown");

  toggle.addEventListener("click", () => {
    if (!isMobileNav()) return;

    const willOpen = !dropdown.classList.contains("is-open");
    closeDropdowns(willOpen ? dropdown : null);
    dropdown.classList.toggle("is-open", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
  });
});

navDropdowns.forEach((dropdown) => {
  dropdown.addEventListener("mouseenter", () => {
    if (isMobileNav()) return;
    closeDropdowns(dropdown);
    dropdown.classList.add("is-open");
    dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "true");
  });

  dropdown.addEventListener("mouseleave", () => {
    if (isMobileNav()) return;
    dropdown.classList.remove("is-open");
    dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
  });
});

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  localStorage.setItem("assam-school-theme", body.classList.contains("dark") ? "dark" : "light");
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.45 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      setActiveNav(entry.target.id);
    });
  },
  { rootMargin: "-35% 0px -55% 0px" }
);

document.querySelectorAll("section[id]").forEach((section) => sectionObserver.observe(section));

showNotice(activeNotice);
setInterval(() => {
  activeNotice = (activeNotice + 1) % noticeItems.length;
  showNotice(activeNotice);
}, 3600);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    galleryCards.forEach((card) => {
      const visible = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !visible);
    });
  });
});

galleryCards.forEach((card) => {
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open ${card.querySelector("figcaption")?.textContent || "gallery image"}`);
  card.addEventListener("click", () => openLightbox(card));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(card);
    }
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

prevTestimonial?.addEventListener("click", () => {
  activeTestimonial = (activeTestimonial - 1 + testimonials.length) % testimonials.length;
  showTestimonial(activeTestimonial);
});

nextTestimonial?.addEventListener("click", () => {
  activeTestimonial = (activeTestimonial + 1) % testimonials.length;
  showTestimonial(activeTestimonial);
});

setInterval(() => {
  activeTestimonial = (activeTestimonial + 1) % testimonials.length;
  showTestimonial(activeTestimonial);
}, 6400);

forms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (note) {
      note.textContent = "Thank you. This placeholder form is ready to connect to the school office system.";
    }
    form.reset();
  });
});

window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeDropdowns();
    closeLightbox();
  }
});

window.addEventListener("resize", () => {
  if (!isMobileNav()) closeDropdowns();
});

updateHeader();
showTestimonial(activeTestimonial);
initSyllabusTable();
initAccordion();
initPdfDownloads();
