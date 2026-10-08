(function () {
  const cms = window.PortfolioCMS;
  const client = cms.getClient();
  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    projects: [],
    images: [],
    currentId: null
  };

  const els = {
    loginView: $("#loginView"),
    adminView: $("#adminView"),
    loginForm: $("#loginForm"),
    loginMessage: $("#loginMessage"),
    logoutBtn: $("#logoutBtn"),
    projectList: $("#projectList"),
    projectForm: $("#projectForm"),
    imageForm: $("#imageForm"),
    imageList: $("#imageList"),
    settingsForm: $("#settingsForm"),
    settingsMessage: $("#settingsMessage"),
    saveMessage: $("#saveMessage"),
    editorTitle: $("#editorTitle"),
    newProject: $("#newProject"),
    deleteProject: $("#deleteProject")
  };

  function setMessage(el, message, isError) {
    el.textContent = message || "";
    el.classList.toggle("error", Boolean(isError));
  }

  function formData(form) {
    const data = new FormData(form);
    const title = data.get("title");
    return {
      title,
      slug: cms.slugify(data.get("slug") || title),
      role: data.get("role"),
      platform: data.get("platform"),
      focus: data.get("focus"),
      duration: data.get("duration"),
      tags: cms.splitList(data.get("tags")),
      tools: cms.splitList(data.get("tools")),
      palette: cms.splitList(data.get("palette")),
      sort_order: Number(data.get("sort_order") || 0),
      published: data.get("published") === "on",
      summary: data.get("summary"),
      description: data.get("description")
    };
  }

  function whatsappUrl(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }

  function settingsPayload(form) {
    const data = new FormData(form);
    const phone = data.get("phone");
    return {
      id: "site",
      email: data.get("email") || "hello@example.com",
      phone,
      whatsapp_url: whatsappUrl(phone),
      linkedin_url: data.get("linkedin_url") || "#",
      dribbble_url: data.get("dribbble_url") || "#"
    };
  }

  function fillSettings(settings) {
    if (!els.settingsForm) return;
    const fields = els.settingsForm.elements;
    fields.email.value = settings?.email || "hello@example.com";
    fields.phone.value = settings?.phone || "+92 318 8895244";
    fields.linkedin_url.value = settings?.linkedin_url || "";
    fields.dribbble_url.value = settings?.dribbble_url || "";
  }

  function fillForm(project) {
    const fields = els.projectForm.elements;
    els.projectForm.reset();
    fields.id.value = project?.id || "";
    fields.title.value = project?.title || "";
    fields.slug.value = project?.slug || "";
    fields.role.value = project?.role || "";
    fields.platform.value = project?.platform || "";
    fields.focus.value = project?.focus || "";
    fields.duration.value = project?.duration || "";
    fields.tags.value = (project?.tags || []).join(", ");
    fields.tools.value = (project?.tools || []).join(", ");
    fields.palette.value = (project?.palette || []).join(", ");
    fields.sort_order.value = project?.sort_order || 0;
    fields.published.checked = Boolean(project?.published);
    fields.summary.value = project?.summary || "";
    fields.description.value = project?.description || "";
    els.editorTitle.textContent = project ? `Editing ${project.title}` : "Create a project";
    els.deleteProject.disabled = !project;
  }

  function renderProjects() {
    els.projectList.innerHTML = state.projects.map((project) => `<button class="${project.id === state.currentId ? "active" : ""}" data-id="${project.id}" type="button">
      <strong>${project.title}</strong>
      <span>${project.published ? "Published" : "Draft"} · Order ${project.sort_order || 0}</span>
    </button>`).join("") || `<p class="muted">No projects yet.</p>`;
  }

  function renderImages() {
    const images = state.images.filter((image) => image.project_id === state.currentId);
    els.imageList.innerHTML = images.map((image) => `<article class="admin-image">
      <img src="${image.public_url}" alt="${image.alt || ""}">
      <div>
        <strong>${image.caption || image.alt || "Project image"}</strong>
        <span>${image.is_cover ? "Cover image" : "Gallery image"}</span>
        <div class="mini-actions">
          <button type="button" data-cover="${image.id}">Make Cover</button>
          <button type="button" data-delete-image="${image.id}">Delete</button>
        </div>
      </div>
    </article>`).join("") || `<p class="muted">Save a project, then upload images.</p>`;
  }

  async function loadData(selectId) {
    const { data: projects, error } = await client
      .from(cms.CONFIG.projectTable)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(els.saveMessage, error.message, true);
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
      if (result.error) setMessage(els.saveMessage, result.error.message, true);
      images = result.data || [];
    }

    state.projects = projects || [];
    state.images = images;
    state.currentId = selectId || state.currentId || state.projects[0]?.id || null;
    renderProjects();
    fillForm(state.projects.find((project) => project.id === state.currentId));
    renderImages();
  }

  async function loadSettings() {
    const { data, error } = await client
      .from(cms.CONFIG.settingsTable)
      .select("*")
      .eq("id", "site")
      .maybeSingle();

    if (error) {
      setMessage(els.settingsMessage, error.message, true);
      fillSettings(null);
      return;
    }

    fillSettings(data);
  }

  async function checkSession() {
    if (!client) {
      setMessage(els.loginMessage, "Add your Supabase URL and anon key in assets/js/supabase.js first.", true);
      return;
    }
    const { data } = await client.auth.getSession();
    const signedIn = Boolean(data.session);
    els.loginView.classList.toggle("hidden", signedIn);
    els.adminView.classList.toggle("hidden", !signedIn);
    if (signedIn) {
      loadSettings();
      loadData();
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    const payload = settingsPayload(els.settingsForm);
    const { error } = await client
      .from(cms.CONFIG.settingsTable)
      .upsert(payload, { onConflict: "id" });

    if (error) {
      setMessage(els.settingsMessage, error.message, true);
      return;
    }

    setMessage(els.settingsMessage, "Contact settings saved.");
  }

  async function saveProject(event) {
    event.preventDefault();
    const id = els.projectForm.elements.id.value;
    const payload = formData(els.projectForm);
    const query = id
      ? client.from(cms.CONFIG.projectTable).update(payload).eq("id", id).select().single()
      : client.from(cms.CONFIG.projectTable).insert(payload).select().single();
    const { data, error } = await query;
    if (error) {
      setMessage(els.saveMessage, error.message, true);
      return;
    }
    setMessage(els.saveMessage, "Project saved.");
    await loadData(data.id);
  }

  async function uploadImage(event) {
    event.preventDefault();
    if (!state.currentId) {
      setMessage(els.saveMessage, "Save or select a project before uploading images.", true);
      return;
    }
    const data = new FormData(els.imageForm);
    const file = data.get("image");
    const safeName = file.name.replace(/[^a-z0-9.\-_]+/gi, "-").toLowerCase();
    const path = `${state.currentId}/${Date.now()}-${safeName}`;
    const upload = await client.storage.from(cms.CONFIG.imageBucket).upload(path, file, { upsert: false });
    if (upload.error) {
      setMessage(els.saveMessage, upload.error.message, true);
      return;
    }
    const publicUrl = client.storage.from(cms.CONFIG.imageBucket).getPublicUrl(path).data.publicUrl;
    const imageCount = state.images.filter((image) => image.project_id === state.currentId).length;
    const insert = await client.from(cms.CONFIG.imageTable).insert({
      project_id: state.currentId,
      storage_path: path,
      public_url: publicUrl,
      alt: data.get("alt"),
      caption: data.get("caption"),
      sort_order: imageCount,
      is_cover: imageCount === 0
    });
    if (insert.error) {
      setMessage(els.saveMessage, insert.error.message, true);
      return;
    }
    els.imageForm.reset();
    setMessage(els.saveMessage, "Image uploaded.");
    await loadData(state.currentId);
  }

  async function deleteProject() {
    if (!state.currentId || !confirm("Delete this project and its image records?")) return;
    const { error } = await client.from(cms.CONFIG.projectTable).delete().eq("id", state.currentId);
    if (error) {
      setMessage(els.saveMessage, error.message, true);
      return;
    }
    state.currentId = null;
    setMessage(els.saveMessage, "Project deleted.");
    await loadData();
  }

  async function makeCover(imageId) {
    const projectImages = state.images.filter((image) => image.project_id === state.currentId);
    await Promise.all(projectImages.map((image) => client
      .from(cms.CONFIG.imageTable)
      .update({ is_cover: image.id === imageId })
      .eq("id", image.id)));
    await loadData(state.currentId);
  }

  async function deleteImage(imageId) {
    const image = state.images.find((item) => item.id === imageId);
    if (!image || !confirm("Delete this image?")) return;
    await client.storage.from(cms.CONFIG.imageBucket).remove([image.storage_path]);
    const { error } = await client.from(cms.CONFIG.imageTable).delete().eq("id", imageId);
    if (error) {
      setMessage(els.saveMessage, error.message, true);
      return;
    }
    await loadData(state.currentId);
  }

  function bindEvents() {
    els.loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(els.loginForm);
      const { error } = await client.auth.signInWithPassword({
        email: data.get("email"),
        password: data.get("password")
      });
      if (error) {
        setMessage(els.loginMessage, error.message, true);
        return;
      }
      setMessage(els.loginMessage, "");
      checkSession();
    });

    els.logoutBtn.addEventListener("click", async () => {
      await client.auth.signOut();
      location.reload();
    });

    els.newProject.addEventListener("click", () => {
      state.currentId = null;
      fillForm(null);
      renderProjects();
      renderImages();
    });

    els.projectList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-id]");
      if (!button) return;
      state.currentId = button.dataset.id;
      fillForm(state.projects.find((project) => project.id === state.currentId));
      renderProjects();
      renderImages();
    });

    els.projectForm.addEventListener("submit", saveProject);
    els.settingsForm.addEventListener("submit", saveSettings);
    els.imageForm.addEventListener("submit", uploadImage);
    els.deleteProject.addEventListener("click", deleteProject);

    els.imageList.addEventListener("click", (event) => {
      const cover = event.target.closest("[data-cover]");
      const remove = event.target.closest("[data-delete-image]");
      if (cover) makeCover(cover.dataset.cover);
      if (remove) deleteImage(remove.dataset.deleteImage);
    });
  }

  bindEvents();
  checkSession();
})();
