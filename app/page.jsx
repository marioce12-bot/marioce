"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import { defaults, loadPortfolio } from "../lib/storage";
import { initials, LinkifiedText, normalizeUrl, statusClass } from "../lib/text";

const minimumIntroTime = 2200;

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function videoEmbedUrl(url) {
  const value = normalizeUrl(url);
  if (!value) return "";

  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : value;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : value;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : value;
    }
  } catch (error) {
    return value;
  }

  return value;
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url || "");
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.34 4.95L2 22l5.29-1.39a9.86 9.86 0 0 0 4.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.51 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.17 8.17 0 0 1-1.25-4.36 8.25 8.25 0 1 1 8.24 8.24Zm4.52-6.18c-.25-.12-1.47-.73-1.7-.81-.23-.08-.4-.12-.56.12-.17.25-.64.81-.79.98-.15.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09 0 1.23.9 2.42 1.02 2.58.12.17 1.76 2.69 4.27 3.77.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  );
}

function SocialIcon({ name }) {
  if (name === "clarivAfrica") {
    return <img src="https://clariv-africa.com/icon-192.png" alt="" loading="lazy" />;
  }

  const icons = {
    github: (
      <path d="M12 .7a11.3 11.3 0 0 0-3.57 22c.57.1.78-.25.78-.55v-2.14c-3.18.7-3.85-1.35-3.85-1.35-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.54-.29-5.21-1.27-5.21-5.64 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.03 0 0 .96-.31 3.13 1.17a10.8 10.8 0 0 1 5.7 0c2.17-1.48 3.13-1.17 3.13-1.17.62 1.57.23 2.74.11 3.03.73.8 1.18 1.82 1.18 3.07 0 4.38-2.67 5.35-5.22 5.63.41.36.78 1.06.78 2.13v3.15c0 .3.21.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
    ),
    linkedin: (
      <path d="M4.98 3.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM.37 8.02h4.2V24H.37V8.02Zm7.24 0h4.02v2.18h.06c.56-1.06 1.93-2.18 3.98-2.18 4.26 0 5.05 2.8 5.05 6.45V24h-4.2v-8.45c0-2.01-.04-4.6-2.8-4.6-2.8 0-3.23 2.19-3.23 4.45V24H7.61V8.02Z" transform="scale(.92) translate(1.1 0)" />
    ),
    facebook: (
      <path d="M14.2 24v-8.7h2.92l.44-3.4H14.2V9.73c0-.98.27-1.65 1.68-1.65h1.79V5.04c-.31-.04-1.37-.13-2.61-.13-2.58 0-4.35 1.58-4.35 4.47v2.5H7.8v3.4h2.9V24h3.5Z" />
    ),
    instagram: (
      <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 2A3.2 3.2 0 0 0 4 7.2v9.6A3.2 3.2 0 0 0 7.2 20h9.6a3.2 3.2 0 0 0 3.2-3.2V7.2A3.2 3.2 0 0 0 16.8 4H7.2Zm4.8 3.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Zm5.1-2.35a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1Z" />
    ),
    x: <path d="M18.25 2h3.38l-7.38 8.43L23 22h-6.86l-5.38-7.03L4.61 22H1.23l7.89-9.02L.75 2h7.03l4.86 6.43L18.25 2Zm-1.19 17.96h1.87L6.76 3.93h-2L17.06 19.96Z" />,
    tiktok: (
      <path d="M16.7 2c.33 2.86 1.93 4.56 4.72 4.74v3.18a7.9 7.9 0 0 1-4.62-1.43v6.03c0 7.66-8.35 10.05-11.7 4.56-2.16-3.54-.84-9.75 6.08-10v3.36c-1.01.16-2.09.41-2.9.95-2.78 1.87-1.86 6.72 1.78 6.24 2.41-.32 3.14-2.19 3.14-4.31V2h3.5Z" />
    ),
    youtube: (
      <path d="M23.5 6.2a3.02 3.02 0 0 0-2.13-2.13C19.48 3.56 12 3.56 12 3.56s-7.48 0-9.37.51A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.13 2.13c1.89.51 9.37.51 9.37.51s7.48 0 9.37-.51a3.02 3.02 0 0 0 2.13-2.13c.5-1.89.5-5.8.5-5.8s0-3.91-.5-5.8ZM9.6 15.64V8.36L15.88 12 9.6 15.64Z" />
    ),
    website: (
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 6h-3.12a15.6 15.6 0 0 0-1.46-3.1A8.05 8.05 0 0 1 18.93 8ZM12 4.04A13.9 13.9 0 0 1 13.74 8h-3.48A13.9 13.9 0 0 1 12 4.04ZM4.26 14a8.32 8.32 0 0 1 0-4h3.53A16.5 16.5 0 0 0 7.67 12c0 .68.04 1.35.12 2H4.26Zm.81 2h3.12c.35 1.16.84 2.22 1.46 3.1A8.05 8.05 0 0 1 5.07 16Zm3.12-8H5.07a8.05 8.05 0 0 1 4.58-3.1A15.6 15.6 0 0 0 8.19 8ZM12 19.96A13.9 13.9 0 0 1 10.26 16h3.48A13.9 13.9 0 0 1 12 19.96ZM14.17 14H9.83A14.7 14.7 0 0 1 9.67 12c0-.69.06-1.36.16-2h4.34c.1.64.16 1.31.16 2 0 .69-.06 1.36-.16 2Zm.18 5.1c.62-.88 1.11-1.94 1.46-3.1h3.12a8.05 8.05 0 0 1-4.58 3.1ZM16.21 14c.08-.65.12-1.32.12-2s-.04-1.35-.12-2h3.53a8.32 8.32 0 0 1 0 4h-3.53Z" />
    )
  };

  return (
    <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
      {icons[name] || icons.website}
    </svg>
  );
}

export default function HomePage() {
  const [content, setContent] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const [animationsReady, setAnimationsReady] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [typedTagline, setTypedTagline] = useState("");
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    let active = true;

    async function initPage() {
      try {
        const [loadedContent] = await Promise.all([loadPortfolio(), wait(minimumIntroTime)]);
        if (active) setContent(loadedContent);
      } catch (error) {
        console.warn("Impossible de charger le contenu Firebase", error);
      }

      if (!active) return;
      setLoading(false);
      window.setTimeout(() => {
        if (!active) return;
        setIntroDone(true);
        setAnimationsReady(true);
      }, 700);
    }

    initPage();
    const fallback = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 7000);

    return () => {
      active = false;
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    document.title = content.fullName ? `${content.fullName} | Portfolio` : "Portfolio";
  }, [content.fullName]);

  useEffect(() => {
    function handleScroll() {
      setShowBackTop(window.scrollY > 520);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (loading) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setTypedName(content.fullName);
      setTypedTagline(content.tagline);
      return;
    }

    let nameIndex = 0;
    let taglineIndex = 0;
    let taglineTimer;

    setTypedName("");
    setTypedTagline("");

    const nameTimer = window.setInterval(() => {
      nameIndex += 1;
      setTypedName(content.fullName.slice(0, nameIndex));

      if (nameIndex >= content.fullName.length) {
        window.clearInterval(nameTimer);
        taglineTimer = window.setInterval(() => {
          taglineIndex += 1;
          setTypedTagline(content.tagline.slice(0, taglineIndex));
          if (taglineIndex >= content.tagline.length) window.clearInterval(taglineTimer);
        }, 22);
      }
    }, 55);

    return () => {
      window.clearInterval(nameTimer);
      if (taglineTimer) window.clearInterval(taglineTimer);
    };
  }, [content.fullName, content.tagline, loading]);

  useEffect(() => {
    if (!animationsReady) return;

    const elements = document.querySelectorAll(".reveal-on-scroll");
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

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
      element.classList.remove("is-visible");
      element.style.setProperty("--reveal-delay", `${Math.min(index * 18, 140)}ms`);
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [animationsReady, content.projects.length]);

  const whatsappNumber = String(content.whatsappNumber || "").replace(/\D/g, "");
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        content.whatsappMessage || "Bonjour, je viens de visiter votre portfolio."
      )}`
    : "";
  const socialLinks = [
    ["github", "GitHub", content.github],
    ["linkedin", "LinkedIn", content.linkedin],
    ["facebook", "Facebook", content.facebook],
    ["instagram", "Instagram", content.instagram],
    ["x", "X", content.x],
    ["tiktok", "TikTok", content.tiktok],
    ["youtube", "YouTube", content.youtube],
    ["website", "Site web", content.website],
    ["clarivAfrica", "Clariv Africa", content.clarivAfrica]
  ]
    .map(([key, label, url]) => [key, label, normalizeUrl(url)])
    .filter(([, , url]) => Boolean(url));
  const presentationVideo = videoEmbedUrl(content.presentationVideo);
  const hasHeroCard = Boolean(content.avatar || content.fullName || content.location || content.projects.length || content.skills.length);
  const contactLinksCount = Number(Boolean(content.email)) + socialLinks.length;
  const hasAbout = Boolean(content.bio || content.skills.length > 0);
  const hasProjects = content.projects.length > 0;
  const hasContact = Boolean(content.contactText || contactLinksCount > 0);
  const sortedProjects = [...content.projects].sort((first, second) => Number(Boolean(second.pinned)) - Number(Boolean(first.pinned)));

  return (
    <div className={`public-body ${loading ? "is-loading" : ""} ${animationsReady ? "animations-ready" : ""}`}>
      {!introDone && (
        <div className={`world-intro ${loading ? "" : "is-ending"}`} id="worldIntro" aria-hidden="true">
          <div className="dev-pattern">
            <span>{"<code />"}</span>
            <span>{"const site = portfolio"}</span>
            <span>{"{ UI: 'clean' }"}</span>
            <span>{"npm run build"}</span>
            <span>{"function create()"}</span>
            <span>{"deploy(main)"}</span>
          </div>
          <div className="world-tunnel" />
          <div className="world-core">Portfolio</div>
          <p>Entree dans mon univers digital</p>
        </div>
      )}

      <header className="site-header">
        <nav className="nav" aria-label="Navigation principale">
          {hasAbout && <a href="#about">Moi</a>}
          {hasProjects && <a href="#projects">Projets</a>}
          {hasContact && <a href="#contact">Contact</a>}
          <ThemeToggle />
        </nav>
      </header>

      <main>
        <section className="hero reveal-on-scroll" id="hero">
          <div className="hero-copy reveal-on-scroll">
            {content.role && <p className="eyebrow">{content.role}</p>}
            {content.fullName && (
              <h1 className="typewriter-text">
                {typedName || content.fullName}
                <span className="typing-caret" aria-hidden="true" />
              </h1>
            )}
            {content.tagline && (
              <p className="lead typewriter-lead">
                <LinkifiedText text={typedTagline || content.tagline} />
                <span className="typing-caret small" aria-hidden="true" />
              </p>
            )}
            <div className="hero-actions">
              {hasProjects && (
                <a className="button primary" href="#projects">
                  Voir mes projets
                </a>
              )}
            </div>
          </div>
          {hasHeroCard && (
            <aside className="hero-card reveal-on-scroll" aria-label="Resume rapide">
              {(content.avatar || content.fullName) && (
                <div
                  className={`profile-photo ${content.avatar ? "has-image" : ""}`}
                  style={content.avatar ? { backgroundImage: `url("${content.avatar}")` } : undefined}
                >
                  {initials(content.fullName)}
                </div>
              )}
              {content.location && <p>{content.location}</p>}
              <div className="stats">
                <span>
                  <strong>{content.projects.length}</strong> projets
                </span>
                <span>
                  <strong>{content.skills.length}</strong> competences
                </span>
              </div>
            </aside>
          )}
        </section>

        {hasAbout && (
          <section className="section reveal-on-scroll" id="about">
            <div className="section-heading">
              <p className="eyebrow">Presentation</p>
              <h2>Qui je suis</h2>
            </div>
            <div className="about-grid">
              {content.bio && (
                <p className="about-text reveal-on-scroll">
                  <LinkifiedText text={content.bio} />
                </p>
              )}
              {content.skills.length > 0 && (
                <div className="skills-card reveal-on-scroll">
                  <h3>Competences</h3>
                  <div className="chips">
                    {content.skills.map((skill) => (
                      <span className="chip" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {presentationVideo && (
          <section className="section video-section reveal-on-scroll" id="presentation-video">
            <div className="section-heading">
              <p className="eyebrow">Video</p>
              <h2>Ma presentation</h2>
            </div>
            <div className="video-card">
              {isDirectVideo(presentationVideo) ? (
                <video src={presentationVideo} controls playsInline preload="metadata" />
              ) : (
                <iframe
                  src={presentationVideo}
                  title="Video de presentation"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
          </section>
        )}

        {hasProjects && (
          <section className="section projects-section reveal-on-scroll" id="projects">
            <div className="section-heading">
              <p className="eyebrow">Travaux</p>
              <h2>Sites et projets</h2>
            </div>
            <div className="projects-grid">
              {sortedProjects.map((project) => {
                const tech = Array.isArray(project.tech) ? project.tech.join(" / ") : project.tech || "";
                const projectUrl = normalizeUrl(project.url);
                return (
                  <article className="project-card reveal-on-scroll" key={project.id}>
                    <div
                      className={`project-media ${project.image ? "has-image" : ""}`}
                      style={project.image ? { backgroundImage: `url('${project.image}')` } : undefined}
                    >
                      {initials(project.title)}
                    </div>
                    <div className="project-content">
                      <div className="project-meta">
                        <span className={`status-badge ${statusClass(project.status)}`}>{project.status || "Projet"}</span>
                        {project.pinned && <span className="pin-badge">Epingle</span>}
                        {tech && <span className="project-tech">{tech}</span>}
                      </div>
                      <h3>{project.title}</h3>
                      {project.description && (
                        <p>
                          <LinkifiedText text={project.description} />
                        </p>
                      )}
                      {projectUrl && (
                        <a className="project-link button secondary" href={projectUrl} target="_blank" rel="noreferrer">
                          Visiter
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {hasContact && (
          <section className="section contact-section reveal-on-scroll" id="contact">
            <div>
              <p className="eyebrow">Contact</p>
              <h2>Discutons de votre prochain projet</h2>
              {content.contactText && (
                <p>
                  <LinkifiedText text={content.contactText} />
                </p>
              )}
            </div>
            <div className="contact-card">
              {content.email && <a href={`mailto:${content.email}`}>{content.email}</a>}
              {socialLinks.length > 0 && (
                <div className="social-icons" aria-label="Liens sociaux">
                  {socialLinks.map(([key, label, url]) => (
                    <a className={`social-icon ${key}`} href={url} target="_blank" rel="noreferrer" aria-label={label} title={label} key={key}>
                      <SocialIcon name={key} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {content.fullName && (
        <footer className="footer">
          <span>{content.fullName}</span>
        </footer>
      )}

      {showBackTop && (
        <button className="back-to-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Retour en haut">
          ↑
        </button>
      )}

      {whatsappHref && (
        <a className="whatsapp-float" href={whatsappHref} target="_blank" rel="noreferrer" aria-label="Contacter sur WhatsApp">
          <span className="whatsapp-badge" aria-hidden="true">
            <WhatsAppIcon />
          </span>
        </a>
      )}
    </div>
  );
}
