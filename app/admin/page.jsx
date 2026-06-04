"use client";

import { useEffect, useState } from "react";
import ThemeToggle from "../../components/ThemeToggle";
import {
  loadPortfolio,
  onAdminAuthChanged,
  resetPortfolio,
  savePortfolio,
  signInAdmin,
  signOutAdmin,
  uploadImageToImgbb
} from "../../lib/storage";

const emptyProject = {
  id: "",
  title: "",
  description: "",
  status: "Termine",
  tech: "",
  url: "",
  image: ""
};

function csvToArray(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToCsv(value) {
  return Array.isArray(value) ? value.join(", ") : value || "";
}

function pressFeedback(event) {
  const button = event.currentTarget;
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 180);
}

function contentToProfile(content) {
  return {
    fullName: content.fullName || "",
    role: content.role || "",
    tagline: content.tagline || "",
    bio: content.bio || "",
    location: content.location || "",
    email: content.email || "",
    avatar: content.avatar || "",
    skills: arrayToCsv(content.skills),
    github: content.github || "",
    linkedin: content.linkedin || "",
    facebook: content.facebook || "",
    instagram: content.instagram || "",
    x: content.x || "",
    tiktok: content.tiktok || "",
    youtube: content.youtube || "",
    website: content.website || "",
    whatsappNumber: content.whatsappNumber || "",
    whatsappMessage: content.whatsappMessage || "",
    contactText: content.contactText || ""
  };
}

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [content, setContent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [project, setProject] = useState(emptyProject);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [authStatus, setAuthStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [avatarUploadStatus, setAvatarUploadStatus] = useState("");
  const [projectUploadStatus, setProjectUploadStatus] = useState("");

  useEffect(() => {
    return onAdminAuthChanged((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    let active = true;
    async function loadContent() {
      setBusy(true);
      try {
        const loadedContent = await loadPortfolio({ seedIfMissing: true });
        if (!active) return;
        setContent(loadedContent);
        setProfile(contentToProfile(loadedContent));
      } catch (error) {
        setSaveStatus("Chargement Firebase impossible.");
        console.error(error);
      } finally {
        if (active) setBusy(false);
      }
    }

    loadContent();
    return () => {
      active = false;
    };
  }, [user]);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthStatus("Connexion en cours...");
    setBusy(true);

    try {
      await signInAdmin(login.email, login.password);
      setAuthStatus("");
    } catch (error) {
      setAuthStatus("Email ou mot de passe incorrect, ou Firebase Auth n'est pas encore active.");
      console.error(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await signOutAdmin();
    setContent(null);
    setProfile(null);
  }

  async function saveContent(nextContent, message = "Sauvegarde terminee.") {
    setBusy(true);
    setSaveStatus("Sauvegarde en cours...");
    try {
      const savedContent = await savePortfolio(nextContent);
      setContent(savedContent);
      setProfile(contentToProfile(savedContent));
      setSaveStatus(message);
    } catch (error) {
      setSaveStatus("Sauvegarde Firebase impossible. Verifiez la connexion et les regles Firestore.");
      console.error(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    await saveContent({
      ...content,
      fullName: profile.fullName,
      role: profile.role,
      tagline: profile.tagline,
      bio: profile.bio,
      location: profile.location,
      email: profile.email,
      avatar: profile.avatar,
      github: profile.github,
      linkedin: profile.linkedin,
      facebook: profile.facebook,
      instagram: profile.instagram,
      x: profile.x,
      tiktok: profile.tiktok,
      youtube: profile.youtube,
      website: profile.website,
      whatsappNumber: profile.whatsappNumber,
      whatsappMessage: profile.whatsappMessage,
      contactText: profile.contactText,
      skills: csvToArray(profile.skills)
    });
  }

  async function handleProjectSubmit(event) {
    event.preventDefault();
    const id = project.id || `project-${Date.now()}`;
    const nextProject = {
      id,
      title: project.title,
      description: project.description,
      status: project.status,
      tech: csvToArray(project.tech),
      url: project.url,
      image: project.image
    };
    const exists = content.projects.some((item) => item.id === id);
    const projects = exists
      ? content.projects.map((item) => (item.id === id ? nextProject : item))
      : [nextProject, ...content.projects];

    await saveContent({ ...content, projects }, "Projet enregistre.");
    resetProjectForm();
  }

  function editProject(projectToEdit) {
    setProject({
      id: projectToEdit.id,
      title: projectToEdit.title || "",
      description: projectToEdit.description || "",
      status: projectToEdit.status || "Termine",
      tech: arrayToCsv(projectToEdit.tech),
      url: projectToEdit.url || "",
      image: projectToEdit.image || ""
    });
    setProjectUploadStatus("");
    document.getElementById("projectForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteProject(projectId) {
    if (!confirm("Supprimer ce projet ?")) return;
    await saveContent({ ...content, projects: content.projects.filter((item) => item.id !== projectId) }, "Projet supprime.");
  }

  function resetProjectForm() {
    setProject(emptyProject);
    setProjectUploadStatus("");
  }

  async function resetAllContent() {
    if (!confirm("Reinitialiser tout le contenu du portfolio ?")) return;
    setBusy(true);
    try {
      const resetContent = await resetPortfolio();
      setContent(resetContent);
      setProfile(contentToProfile(resetContent));
      setProject(emptyProject);
      setSaveStatus("Contenu reinitialise.");
    } catch (error) {
      setSaveStatus("Reinitialisation Firebase impossible.");
      console.error(error);
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    const json = JSON.stringify(content, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `portfolio-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function importJson(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      await saveContent(imported, "Import JSON termine.");
      resetProjectForm();
    } catch (error) {
      setSaveStatus("Le fichier JSON est invalide ou la sauvegarde a echoue.");
      console.error(error);
    } finally {
      event.target.value = "";
    }
  }

  async function uploadIntoField(file, target) {
    const setStatus = target === "avatar" ? setAvatarUploadStatus : setProjectUploadStatus;
    setStatus("Envoi de l'image sur ImgBB...");
    setBusy(true);
    try {
      const imageUrl = await uploadImageToImgbb(file);
      if (target === "avatar") {
        setProfile((current) => ({ ...current, avatar: imageUrl }));
      } else {
        setProject((current) => ({ ...current, image: imageUrl }));
      }
      setStatus("Image envoyee. Sauvegardez ensuite le formulaire.");
    } catch (error) {
      setStatus("Upload impossible. Verifiez la cle ImgBB et la connexion.");
      console.error(error);
    } finally {
      setBusy(false);
    }
  }

  if (!authReady || !user) {
    return (
      <div className="admin-body auth-locked">
        <main className="login-screen" id="loginScreen">
          <form className="login-card" onSubmit={handleLogin}>
            <span className="brand-mark">P</span>
            <ThemeToggle className="login-theme-toggle" />
            <p className="eyebrow">Acces protege</p>
            <h1>Connexion admin</h1>
            <p className="muted">Connectez-vous avec l'email et le mot de passe autorises dans Firebase Auth.</p>
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={login.email}
                onChange={(event) => setLogin({ ...login, email: event.target.value })}
              />
            </label>
            <label>
              Mot de passe
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={login.password}
                onChange={(event) => setLogin({ ...login, password: event.target.value })}
              />
            </label>
            <button className="button primary" type="submit" disabled={busy} onClick={pressFeedback}>
              Se connecter
            </button>
            <p className="auth-status" aria-live="polite">{authStatus}</p>
          </form>
        </main>
      </div>
    );
  }

  if (!content || !profile) {
    return (
      <div className="admin-body">
        <main className="login-screen">
          <div className="login-card">
            <span className="brand-mark">P</span>
            <p className="eyebrow">Chargement</p>
            <h1>Administration</h1>
            <p className="muted">Chargement du contenu Firebase...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-body">
      <header className="site-header admin-shell">
        <a className="brand" href="/">
          <span className="brand-mark">P</span>
          <span>Administration</span>
        </a>
        <nav className="nav" aria-label="Navigation admin">
          <a href="/">Voir le site</a>
          <ThemeToggle />
          <button className="link-button" type="button" onClick={resetAllContent} disabled={busy}>
            Reinitialiser
          </button>
          <button className="link-button" type="button" onClick={handleLogout}>
            Deconnexion
          </button>
        </nav>
      </header>

      <main className="admin-layout admin-shell">
        <section className="admin-panel">
          <div className="section-heading compact">
            <p className="eyebrow">Contenu public</p>
            <h1>Gerer le portfolio</h1>
            <p>Les changements sont sauvegardes dans Firebase. Exportez le JSON pour garder une copie.</p>
            <p className="upload-status" aria-live="polite">{saveStatus}</p>
          </div>

          <form className="form-card" onSubmit={handleProfileSubmit}>
            <h2>Presentation</h2>
            <div className="form-section">
              <div className="form-section-heading">
                <h3>Identite</h3>
                <p>Informations principales affichees dans le hero et la presentation.</p>
              </div>
              <label>
                Nom complet
                <input value={profile.fullName} required onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} />
              </label>
              <label>
                Role / titre
                <input value={profile.role} required onChange={(event) => setProfile({ ...profile, role: event.target.value })} />
              </label>
              <label>
                Phrase d'accroche
                <textarea value={profile.tagline} rows="3" required onChange={(event) => setProfile({ ...profile, tagline: event.target.value })} />
              </label>
              <label>
                Bio
                <textarea value={profile.bio} rows="6" required onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
              </label>
              <div className="form-row">
                <label>
                  Ville / pays
                  <input value={profile.location} onChange={(event) => setProfile({ ...profile, location: event.target.value })} />
                </label>
                <label>
                  Email
                  <input value={profile.email} type="email" onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
                </label>
              </div>
              <label>
                Photo de profil ou logo (URL d'image, optionnel)
                <input value={profile.avatar} placeholder="https://..." onChange={(event) => setProfile({ ...profile, avatar: event.target.value })} />
              </label>
              <label>
                Envoyer une photo de profil sur ImgBB
                <input type="file" accept="image/*" onChange={(event) => event.target.files[0] && uploadIntoField(event.target.files[0], "avatar")} />
              </label>
              <p className="upload-status" aria-live="polite">{avatarUploadStatus}</p>
              <label>
                Competences (separees par des virgules)
                <input value={profile.skills} placeholder="HTML, CSS, JavaScript" onChange={(event) => setProfile({ ...profile, skills: event.target.value })} />
              </label>
            </div>

            <div className="form-section">
              <div className="form-section-heading">
                <h3>Reseaux sociaux</h3>
                <p>Les icones apparaissent sur le site public seulement quand un lien est renseigne.</p>
              </div>
              <div className="form-row">
                <label>
                  GitHub
                  <input value={profile.github} placeholder="https://github.com/..." onChange={(event) => setProfile({ ...profile, github: event.target.value })} />
                </label>
                <label>
                  LinkedIn
                  <input value={profile.linkedin} placeholder="https://linkedin.com/in/..." onChange={(event) => setProfile({ ...profile, linkedin: event.target.value })} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Facebook
                  <input value={profile.facebook} placeholder="https://facebook.com/..." onChange={(event) => setProfile({ ...profile, facebook: event.target.value })} />
                </label>
                <label>
                  Instagram
                  <input value={profile.instagram} placeholder="https://instagram.com/..." onChange={(event) => setProfile({ ...profile, instagram: event.target.value })} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  X / Twitter
                  <input value={profile.x} placeholder="https://x.com/..." onChange={(event) => setProfile({ ...profile, x: event.target.value })} />
                </label>
                <label>
                  TikTok
                  <input value={profile.tiktok} placeholder="https://tiktok.com/@..." onChange={(event) => setProfile({ ...profile, tiktok: event.target.value })} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  YouTube
                  <input value={profile.youtube} placeholder="https://youtube.com/@..." onChange={(event) => setProfile({ ...profile, youtube: event.target.value })} />
                </label>
                <label>
                  Site web / autre
                  <input value={profile.website} placeholder="https://..." onChange={(event) => setProfile({ ...profile, website: event.target.value })} />
                </label>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-heading">
                <h3>Contact</h3>
                <p>Email, WhatsApp et message d'approche pour les visiteurs.</p>
              </div>
              <div className="form-row">
                <label>
                  Numero WhatsApp
                  <input value={profile.whatsappNumber} placeholder="Ex: 2250700000000" onChange={(event) => setProfile({ ...profile, whatsappNumber: event.target.value })} />
                </label>
                <label>
                  Message WhatsApp preregle
                  <input value={profile.whatsappMessage} placeholder="Bonjour, je viens de visiter votre portfolio..." onChange={(event) => setProfile({ ...profile, whatsappMessage: event.target.value })} />
                </label>
              </div>
              <label>
                Texte de contact
                <textarea value={profile.contactText} rows="3" onChange={(event) => setProfile({ ...profile, contactText: event.target.value })} />
              </label>
            </div>
            <button className={`button primary ${busy ? "is-busy" : ""}`} type="submit" disabled={busy} onClick={pressFeedback}>
              Sauvegarder la presentation
            </button>
          </form>

          <form className="form-card" id="projectForm" onSubmit={handleProjectSubmit}>
            <h2>{project.id ? "Modifier le projet" : "Ajouter un projet"}</h2>
            <label>
              Titre
              <input value={project.title} required onChange={(event) => setProject({ ...project, title: event.target.value })} />
            </label>
            <label>
              Description
              <textarea value={project.description} rows="4" required onChange={(event) => setProject({ ...project, description: event.target.value })} />
            </label>
            <div className="form-row">
              <label>
                Statut
                <select value={project.status} onChange={(event) => setProject({ ...project, status: event.target.value })}>
                  <option>Termine</option>
                  <option>En cours</option>
                  <option>Prototype</option>
                </select>
              </label>
              <label>
                Technologies
                <input value={project.tech} placeholder="React, Node, CSS" onChange={(event) => setProject({ ...project, tech: event.target.value })} />
              </label>
            </div>
            <label>
              Lien du projet pour le bouton Visiter
              <input value={project.url} placeholder="https://exemple.com" onChange={(event) => setProject({ ...project, url: event.target.value })} />
            </label>
            <label>
              Image du projet (URL)
              <input value={project.image} placeholder="https://..." onChange={(event) => setProject({ ...project, image: event.target.value })} />
            </label>
            <label>
              Envoyer une image du projet sur ImgBB
              <input type="file" accept="image/*" onChange={(event) => event.target.files[0] && uploadIntoField(event.target.files[0], "project")} />
            </label>
            <p className="upload-status" aria-live="polite">{projectUploadStatus}</p>
            <div className="form-actions">
              <button className={`button primary ${busy ? "is-busy" : ""}`} type="submit" disabled={busy} onClick={pressFeedback}>
                Enregistrer le projet
              </button>
              {project.id && (
                <button className="button secondary" type="button" onClick={resetProjectForm} disabled={busy}>
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>

        <aside className="admin-panel side-panel">
          <div className="form-card">
            <h2>Projets existants</h2>
            <div className="admin-projects">
              {!content.projects.length && <p className="muted">Aucun projet pour le moment.</p>}
              {content.projects.map((item) => (
                <article className="admin-project" key={item.id}>
                  <h3>{item.title}</h3>
                  <p className="muted">{item.status} - {arrayToCsv(item.tech)}</p>
                  <div className="form-actions">
                    <button className="button secondary" type="button" onClick={() => editProject(item)} disabled={busy}>
                      Modifier
                    </button>
                    <button className="button secondary danger" type="button" onClick={() => deleteProject(item.id)} disabled={busy}>
                      Supprimer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="form-card">
            <h2>Sauvegarde</h2>
            <p className="muted">Utilisez l'export pour transferer le contenu ou garder une sauvegarde.</p>
            <div className="form-actions">
              <button className="button secondary" type="button" onClick={exportJson} disabled={busy}>
                Exporter JSON
              </button>
              <label className="button secondary file-button">
                Importer JSON
                <input type="file" accept="application/json" onChange={importJson} />
              </label>
            </div>
            <textarea className="json-output" rows="8" readOnly value={JSON.stringify(content, null, 2)} />
          </div>
        </aside>
      </main>
    </div>
  );
}
