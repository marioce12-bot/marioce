import { defaults, loadPortfolio } from "./storage.js";

let content = defaults;

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value || "";
}

function initials(name) {
  return (name || "Portfolio")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function setHref(id, url, fallbackText) {
  const element = document.getElementById(id);
  if (!element) return;
  element.href = url || "#";
  if (fallbackText) element.textContent = fallbackText;
}

function renderProfile() {
  document.title = `${content.fullName} | Portfolio`;
  setText("brandName", content.fullName);
  setText("footerName", content.fullName);
  setText("fullName", content.fullName);
  setText("role", content.role);
  setText("tagline", content.tagline);
  setText("bio", content.bio);
  setText("location", content.location);
  setText("contactText", content.contactText);
  setText("projectCount", String(content.projects.length));
  setText("skillCount", String(content.skills.length));

  setHref("emailLink", `mailto:${content.email}`, "Me contacter");
  setHref("contactEmail", `mailto:${content.email}`, content.email);
  setHref("githubLink", content.github, "GitHub");
  setHref("linkedinLink", content.linkedin, "LinkedIn");
  renderWhatsappFloat();

  const photo = document.getElementById("profilePhoto");
  if (photo) {
    photo.textContent = initials(content.fullName);
    photo.classList.toggle("has-image", Boolean(content.avatar));
    photo.style.backgroundImage = content.avatar ? `url("${content.avatar}")` : "";
  }

  const skills = document.getElementById("skills");
  if (skills) {
    skills.innerHTML = content.skills.map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`).join("");
  }
}

function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  if (!grid) return;

  grid.innerHTML = content.projects
    .map((project) => {
      const tech = Array.isArray(project.tech) ? project.tech.join(" / ") : project.tech || "";
      const imageStyle = project.image ? ` style="background-image:url('${escapeAttr(project.image)}')"` : "";
      const link = project.url
        ? `<a class="project-link" href="${escapeAttr(project.url)}" target="_blank" rel="noreferrer">Voir le projet</a>`
        : "";

      return `
        <article class="project-card reveal-on-scroll">
          <div class="project-media ${project.image ? "has-image" : ""}"${imageStyle}>${escapeHtml(
            initials(project.title)
          )}</div>
          <div class="project-content">
            <div class="project-meta">
              <span class="status-badge ${statusClass(project.status)}">${escapeHtml(project.status || "Projet")}</span>
              <span class="project-tech">${escapeHtml(tech)}</span>
            </div>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description)}</p>
            ${link}
          </div>
        </article>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("termine")) return "done";
  if (normalized.includes("cours")) return "progress";
  if (normalized.includes("prototype")) return "prototype";
  return "prototype";
}

function renderWhatsappFloat() {
  const link = document.getElementById("whatsappFloat");
  if (!link) return;

  const number = String(content.whatsappNumber || "").replace(/\D/g, "");
  if (!number) {
    link.hidden = true;
    return;
  }

  const message = content.whatsappMessage || "Bonjour, je viens de visiter votre portfolio.";
  link.href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  link.hidden = false;
}

renderProfile();
renderProjects();
initWorldIntro();

loadPortfolio()
  .then((loadedContent) => {
    content = loadedContent;
    renderProfile();
    renderProjects();
  })
  .catch((error) => {
    console.warn("Impossible de charger le contenu Firebase", error);
  })
  .finally(() => {
    initScrollReveal();
  });

function initWorldIntro() {
  const intro = document.getElementById("worldIntro");
  if (!intro) return;

  window.setTimeout(() => {
    intro.classList.add("is-ending");
  }, 1900);

  window.setTimeout(() => {
    intro.remove();
    document.body.classList.add("intro-complete");
  }, 2850);
}

function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!elements.length) return;

  document.body.classList.add("animations-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
  );

  elements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index * 45, 360)}ms`);
    observer.observe(element);
  });
}
