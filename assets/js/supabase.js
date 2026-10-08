(function () {
  const CONFIG = {
    url: "https://dhbrjurebzxaoofjllfn.supabase.co",
    anonKey: "sb_publishable_pxN67Zd_AbDpolD6FCr1kA_XbYqhwJe",
    projectTable: "projects",
    imageTable: "project_images",
    settingsTable: "site_settings",
    imageBucket: "project-images"
  };

  function isConfigured() {
    return CONFIG.url.startsWith("https://") && CONFIG.anonKey.length > 30;
  }

  function getClient() {
    if (!isConfigured() || !window.supabase) return null;
    return window.supabase.createClient(CONFIG.url, CONFIG.anonKey);
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function splitList(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  window.PortfolioCMS = {
    CONFIG,
    isConfigured,
    getClient,
    slugify,
    splitList
  };
})();
