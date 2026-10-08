(function () {
  const cms = window.PortfolioCMS;
  const client = cms.getClient();
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    projects: [],
    activeFilter: "all",
    projectSlides: {},
    animatingProject: null,
    settings: {
      email: "hello@example.com",
      phone: "+92 318 8895244",
      whatsapp_url: "https://wa.me/923188895244",
      linkedin_url: "#",
      dribbble_url: "#"
    },
    modalProject: null,
    modalSlide: 0
  };

  const els = {
    nav: $("#nav"),
    progress: $("#progress"),
    links: $("#links"),
    projects: $("#projects"),
    filters: $("#filters"),
    status: $("#projectStatus"),
    modal: $("#projectModal"),
    modalBody: $("#modalBody"),
    modalClose: $("#modalClose"),
    typedPhrase: $("#typedPhrase"),
    emailText: $("[data-contact-email]"),
    emailLinks: $$("[data-contact-email-link]"),
    whatsappLinks: $$("[data-contact-whatsapp-link]"),
    linkedinLinks: $$("[data-contact-linkedin]"),
    dribbbleLinks: $$("[data-contact-dribbble]")
  };

  function esc(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function projectCover(project) {
    const cover = (project.images || []).find((image) => image.is_cover) || (project.images || [])[0];
    if (!cover) return "";
    return `<img src="${esc(cover.public_url)}" alt="${esc(cover.alt || project.title)}" loading="lazy">`;
  }

  function projectTools(project) {
    return (project.tools && project.tools.length ? project.tools : project.tags) || [];
  }

  function whatsappUrl(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "#";
  }

  function applySettings() {
    const settings = state.settings;
    if (els.emailText) els.emailText.textContent = settings.email || "hello@example.com";
    els.emailLinks.forEach((link) => {
      link.href = `mailto:${settings.email || "hello@example.com"}`;
    });
    els.whatsappLinks.forEach((link) => {
      link.href = settings.whatsapp_url || whatsappUrl(settings.phone);
      link.setAttribute("aria-label", `WhatsApp ${settings.phone || ""}`.trim());
    });
    els.linkedinLinks.forEach((link) => {
      link.href = settings.linkedin_url || "#";
    });
    els.dribbbleLinks.forEach((link) => {
      link.href = settings.dribbble_url || "#";
    });
  }

  function currentProjectImage(project) {
    const images = project.images || [];
    if (!images.length) return null;
    const index = state.projectSlides[project.id] || 0;
    return images[index] || images[0];
  }

  function renderProjectImage(project) {
    const image = currentProjectImage(project);
    if (!image) return `<span>${esc(project.title).slice(0, 2).toUpperCase()}</span>`;
    return `<img src="${esc(image.public_url)}" alt="${esc(image.alt || project.title)}" loading="lazy">`;
  }

  function renderFilters() {
    const tags = [...new Set(state.projects.flatMap((project) => project.tags || []))].sort();
    els.filters.innerHTML = [`<button class="filter active" data-filter="all">All</button>`]
      .concat(tags.map((tag) => `<button class="filter" data-filter="${esc(tag)}">${esc(tag)}</button>`))
      .join("");
  }

  function renderProjects() {
    const projects = state.activeFilter === "all"
      ? state.projects
      : state.projects.filter((project) => (project.tags || []).includes(state.activeFilter));

    els.status.hidden = projects.length > 0;
    els.status.textContent = state.projects.length ? "No projects match this filter." : "No published projects yet.";

    els.projects.innerHTML = projects.map((project, index) => {
      const tools = projectTools(project).slice(0, 5);
      const imageCount = (project.images || []).length;
      const slideIndex = state.projectSlides[project.id] || 0;
      return `<article class="project-row ${index % 2 ? "flip" : ""} ${state.animatingProject === project.id ? "slide-animating" : ""}" data-project-row="${project.id}">
        <div class="project-body">
          <div class="project-meta"><span>${esc(project.platform)}</span><span>${esc(project.focus)}</span></div>
          <h3>${esc(project.title)}</h3>
          <p>${esc(project.summary)}</p>
          <div class="project-tools">
            <strong>Tools used</strong>
            <div>${tools.map((tool) => `<span>${esc(tool)}</span>`).join("") || "<span>Case study</span>"}</div>
          </div>
          <button class="btn primary" type="button" data-project="${project.id}">View Project</button>
        </div>
        <div class="project-showcase" aria-label="${esc(project.title)} image carousel">
          <div class="project-cover">
            ${renderProjectImage(project)}
          </div>
          ${imageCount > 1 ? `<div class="project-slide-controls">
            <button type="button" data-project-slide="${project.id}" data-dir="-1" aria-label="Previous ${esc(project.title)} image">←</button>
            <button type="button" data-project-slide="${project.id}" data-dir="1" aria-label="Next ${esc(project.title)} image">→</button>
          </div>
          <div class="project-slide-count">${slideIndex + 1} / ${imageCount}</div>` : ""}
        </div>
      </article>`;
    }).join("");
  }

  function changeProjectSlide(projectId, direction, trigger) {
    const project = state.projects.find((item) => item.id === projectId);
    const images = project?.images || [];
    if (images.length < 2) return;
    const current = state.projectSlides[projectId] || 0;
    state.projectSlides[projectId] = (current + direction + images.length) % images.length;
    state.animatingProject = projectId;
    renderProjects();
    window.setTimeout(() => {
      state.animatingProject = null;
      $(`[data-project-row="${projectId}"]`)?.classList.remove("slide-animating");
    }, 520);
  }

  function openProject(id) {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    state.modalProject = project;
    state.modalSlide = 0;
    renderProjectModal();
    els.modal.classList.add("open");
    els.modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-lock");
    els.modalClose.focus();
  }

  function renderProjectModal() {
    const project = state.modalProject;
    if (!project) return;
    const images = project.images && project.images.length ? project.images : [];
    const slide = images[state.modalSlide];
    const total = images.length;
    const tools = projectTools(project);
    const mainImage = slide
      ? `<img src="${esc(slide.public_url)}" alt="${esc(slide.alt || project.title)}">`
      : `<span>${esc(project.title).slice(0, 2).toUpperCase()}</span>`;

    els.modalBody.innerHTML = `<div class="project-modal-layout">
      <section class="carousel-panel">
        <div class="carousel-stage">
          ${mainImage}
          ${total > 1 ? `<button class="carousel-btn prev" type="button" data-slide-dir="-1" aria-label="Previous image">‹</button>
          <button class="carousel-btn next" type="button" data-slide-dir="1" aria-label="Next image">›</button>` : ""}
          <div class="carousel-count">${total ? state.modalSlide + 1 : 0} / ${Math.max(total, 1)}</div>
        </div>
        <div class="carousel-thumbs">
          ${images.map((image, index) => `<button class="${index === state.modalSlide ? "active" : ""}" type="button" data-slide="${index}" aria-label="Show image ${index + 1}">
            <img src="${esc(image.public_url)}" alt="${esc(image.alt || project.title)}">
          </button>`).join("")}
        </div>
      </section>
      <section class="modal-details">
        <p class="eyebrow">${esc(project.role || "Selected Project")}</p>
        <h2>${esc(project.title)}</h2>
        <p class="modal-summary">${esc(project.summary)}</p>
        <div class="case-facts">
          <span><i>◎</i><b>Platform</b>${esc(project.platform || "Web")}</span>
          <span><i>◉</i><b>Focus</b>${esc(project.focus || "Interface Design")}</span>
          <span><i>▣</i><b>Duration</b>${esc(project.duration || "Selected work")}</span>
        </div>
        <div class="project-overview">
          <h3>Project Overview</h3>
          <p>${esc(project.description || project.summary)}</p>
        </div>
        <div class="modal-tools">
          <h3>Tools Used</h3>
          <div>${tools.map((tool) => `<span>${esc(tool)}</span>`).join("") || "<span>Design process</span>"}</div>
        </div>
      </section>
    </div>`;
  }

  function changeSlide(nextIndex) {
    const images = state.modalProject?.images || [];
    if (!images.length) return;
    state.modalSlide = (nextIndex + images.length) % images.length;
    renderProjectModal();
  }

  function closeProject() {
    els.modal.classList.remove("open");
    els.modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-lock");
  }

  async function loadProjects() {
    if (!client) {
      els.status.textContent = "Add your Supabase URL and anon key in assets/js/supabase.js to load portfolio projects.";
      return;
    }

    const { data: projects, error } = await client
      .from(cms.CONFIG.projectTable)
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      els.status.textContent = `Could not load projects: ${error.message}`;
      return;
    }

    const ids = (projects || []).map((project) => project.id);
    let images = [];
    if (ids.length) {
      const result = await client
        .from(cms.CONFIG.imageTable)
        .select("*")
        .in("project_id", ids)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (!result.error) images = result.data || [];
    }

    state.projects = (projects || []).map((project) => ({
      ...project,
      images: images.filter((image) => image.project_id === project.id)
    }));

    renderFilters();
    renderProjects();
  }

  async function loadSettings() {
    applySettings();
    if (!client) return;
    const { data, error } = await client
      .from(cms.CONFIG.settingsTable)
      .select("*")
      .eq("id", "site")
      .maybeSingle();
    if (!error && data) {
      state.settings = {
        ...state.settings,
        ...data,
        whatsapp_url: data.whatsapp_url || whatsappUrl(data.phone)
      };
      applySettings();
    }
  }

  function bindUi() {
    $("#themeToggle").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("portfolio-theme", next);
    });

    $("#menuToggle").addEventListener("click", () => els.links.classList.toggle("open"));
    els.links.addEventListener("click", () => els.links.classList.remove("open"));

    els.filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      state.activeFilter = button.dataset.filter;
      $$(".filter", els.filters).forEach((item) => item.classList.toggle("active", item === button));
      renderProjects();
    });

    els.projects.addEventListener("click", (event) => {
      const slideButton = event.target.closest("[data-project-slide]");
      if (slideButton) {
        changeProjectSlide(slideButton.dataset.projectSlide, Number(slideButton.dataset.dir), slideButton);
        return;
      }
      const button = event.target.closest("[data-project]");
      if (button) openProject(button.dataset.project);
    });

    els.modalClose.addEventListener("click", closeProject);
    els.modal.addEventListener("click", (event) => {
      if (event.target === els.modal) closeProject();
    });
    els.modalBody.addEventListener("click", (event) => {
      const dir = event.target.closest("[data-slide-dir]");
      const thumb = event.target.closest("[data-slide]");
      if (dir) changeSlide(state.modalSlide + Number(dir.dataset.slideDir));
      if (thumb) changeSlide(Number(thumb.dataset.slide));
    });
    window.addEventListener("keydown", (event) => {
      if (!els.modal.classList.contains("open")) return;
      if (event.key === "Escape") closeProject();
      if (event.key === "ArrowLeft") changeSlide(state.modalSlide - 1);
      if (event.key === "ArrowRight") changeSlide(state.modalSlide + 1);
    });

    window.addEventListener("scroll", () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      els.progress.style.width = `${pct}%`;
      els.nav.classList.toggle("stuck", window.scrollY > 24);
    }, { passive: true });
  }

  function typeHeroPhrases() {
    if (!els.typedPhrase) return;
    const phrases = [
      "UI/UX designer crafting intuitive product experiences",
      "Designing digital products that connect with people",
      "Building dashboard experiences that make data clear",
      "Creating web and mobile apps that feel effortless"
    ];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.typedPhrase.textContent = phrases[0];
      return;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      const phrase = phrases[phraseIndex];
      els.typedPhrase.textContent = phrase.slice(0, charIndex);

      if (!deleting && charIndex < phrase.length) {
        charIndex += 1;
        window.setTimeout(tick, 82);
        return;
      }

      if (!deleting) {
        deleting = true;
        window.setTimeout(tick, 1350);
        return;
      }

      if (charIndex > 0) {
        charIndex -= 1;
        window.setTimeout(tick, 38);
        return;
      }

      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      window.setTimeout(tick, 240);
    };

    window.setTimeout(tick, 350);
  }

  try {
    const savedTheme = localStorage.getItem("portfolio-theme");
    if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  } catch (error) {}

  bindUi();
  typeHeroPhrases();
  loadSettings();
  loadProjects();
})();
