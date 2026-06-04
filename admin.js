import {
  loadPortfolio,
  onAdminAuthChanged,
  resetPortfolio,
  savePortfolio,
  signInAdmin,
  signOutAdmin,
  uploadImageToImgbb
} from "./storage.js";

let content = null;

const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const authStatus = document.getElementById("authStatus");
const adminHeader = document.getElementById("adminHeader");
const adminApp = document.getElementById("adminApp");
const profileForm = document.getElementById("profileForm");
const projectForm = document.getElementById("projectForm");
const projectFormTitle = document.getElementById("projectFormTitle");
const adminProjects = document.getElementById("adminProjects");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const jsonOutput = document.getElementById("jsonOutput");
const avatarUpload = document.getElementById("avatarUpload");
const projectImageUpload = document.getElementById("projectImageUpload");
const avatarUploadStatus = document.getElementById("avatarUploadStatus");
const projectUploadStatus = document.getElementById("projectUploadStatus");

onAdminAuthChanged(async (user) => {
  if (!user) {
    lockAdmin();
    return;
  }

  await unlockAdmin();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  authStatus.textContent = "Connexion en cours...";
  loginForm.querySelector("button").disabled = true;

  try {
    await signInAdmin(formData.get("email"), formData.get("password"));
    authStatus.textContent = "";
  } catch (error) {
    authStatus.textContent = "Email ou mot de passe incorrect, ou Firebase Auth n'est pas encore active.";
    console.error(error);
  } finally {
    loginForm.querySelector("button").disabled = false;
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOutAdmin();
});

function lockAdmin() {
  document.body.classList.add("auth-locked");
  loginScreen.hidden = false;
  adminHeader.hidden = true;
  adminApp.hidden = true;
  content = null;
}

async function unlockAdmin() {
  document.body.classList.remove("auth-locked");
  loginScreen.hidden = true;
  adminHeader.hidden = false;
  adminApp.hidden = false;
  authStatus.textContent = "";
  content = await loadPortfolio({ seedIfMissing: true });
  fillProfileForm();
  renderProjects();
  jsonOutput.value = JSON.stringify(content, null, 2);
}

function csvToArray(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fillProfileForm() {
  profileForm.fullName.value = content.fullName;
  profileForm.role.value = content.role;
  profileForm.tagline.value = content.tagline;
  profileForm.bio.value = content.bio;
  profileForm.location.value = content.location;
  profileForm.email.value = content.email;
  profileForm.avatar.value = content.avatar;
  profileForm.github.value = content.github;
  profileForm.linkedin.value = content.linkedin;
  profileForm.whatsappNumber.value = content.whatsappNumber || "";
  profileForm.whatsappMessage.value = content.whatsappMessage || "";
  profileForm.contactText.value = content.contactText;
  profileForm.skills.value = content.skills.join(", ");
}

async function saveContent(nextContent = content) {
  setBusy(true);
  try {
    content = await savePortfolio(nextContent);
    renderProjects();
    jsonOutput.value = JSON.stringify(content, null, 2);
  } catch (error) {
    alert("Sauvegarde Firebase impossible. Verifiez la connexion et les regles Firestore.");
    console.error(error);
  } finally {
    setBusy(false);
  }
}

function setBusy(isBusy) {
  profileForm.querySelectorAll("button, input, textarea, select").forEach((element) => {
    element.disabled = isBusy;
  });
  projectForm.querySelectorAll("button, input, textarea, select").forEach((element) => {
    element.disabled = isBusy;
  });
}

function renderProjects() {
  if (!content.projects.length) {
    adminProjects.innerHTML = '<p class="muted">Aucun projet pour le moment.</p>';
    return;
  }

  adminProjects.innerHTML = content.projects
    .map(
      (project) => `
        <article class="admin-project">
          <h3>${escapeHtml(project.title)}</h3>
          <p class="muted">${escapeHtml(project.status)} - ${escapeHtml((project.tech || []).join(", "))}</p>
          <div class="form-actions">
            <button class="button secondary" type="button" data-edit="${escapeAttr(project.id)}">Modifier</button>
            <button class="button secondary danger" type="button" data-delete="${escapeAttr(project.id)}">Supprimer</button>
          </div>
        </article>`
    )
    .join("");
}

function resetProjectForm() {
  projectForm.reset();
  projectForm.id.value = "";
  projectFormTitle.textContent = "Ajouter un projet";
  cancelEditBtn.hidden = true;
  projectUploadStatus.textContent = "";
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(profileForm);
  await saveContent({
    ...content,
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    tagline: formData.get("tagline"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    email: formData.get("email"),
    avatar: formData.get("avatar"),
    github: formData.get("github"),
    linkedin: formData.get("linkedin"),
    whatsappNumber: formData.get("whatsappNumber"),
    whatsappMessage: formData.get("whatsappMessage"),
    contactText: formData.get("contactText"),
    skills: csvToArray(formData.get("skills"))
  });
});

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(projectForm);
  const id = formData.get("id") || `project-${Date.now()}`;
  const project = {
    id,
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    tech: csvToArray(formData.get("tech")),
    url: formData.get("url"),
    image: formData.get("image")
  };

  const exists = content.projects.some((item) => item.id === id);
  const projects = exists
    ? content.projects.map((item) => (item.id === id ? project : item))
    : [project, ...content.projects];

  await saveContent({ ...content, projects });
  resetProjectForm();
});

adminProjects.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const project = content.projects.find((item) => item.id === editId);
    if (!project) return;
    projectForm.id.value = project.id;
    projectForm.title.value = project.title;
    projectForm.description.value = project.description;
    projectForm.status.value = project.status;
    projectForm.tech.value = (project.tech || []).join(", ");
    projectForm.url.value = project.url || "";
    projectForm.image.value = project.image || "";
    projectFormTitle.textContent = "Modifier le projet";
    cancelEditBtn.hidden = false;
    projectUploadStatus.textContent = "";
    projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (deleteId && confirm("Supprimer ce projet ?")) {
    await saveContent({ ...content, projects: content.projects.filter((item) => item.id !== deleteId) });
  }
});

cancelEditBtn.addEventListener("click", resetProjectForm);

document.getElementById("resetBtn").addEventListener("click", async () => {
  if (!confirm("Reinitialiser tout le contenu du portfolio ?")) return;
  try {
    content = await resetPortfolio();
    fillProfileForm();
    resetProjectForm();
    renderProjects();
    jsonOutput.value = JSON.stringify(content, null, 2);
  } catch (error) {
    alert("Reinitialisation Firebase impossible.");
    console.error(error);
  }
});

document.getElementById("exportBtn").addEventListener("click", () => {
  jsonOutput.value = JSON.stringify(content, null, 2);
  jsonOutput.select();
});

document.getElementById("importInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    await saveContent(imported);
    fillProfileForm();
    resetProjectForm();
  } catch (error) {
    alert("Le fichier JSON est invalide ou la sauvegarde a echoue.");
    console.error(error);
  } finally {
    event.target.value = "";
  }
});

avatarUpload.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  await uploadIntoField(file, profileForm.avatar, avatarUploadStatus);
  event.target.value = "";
});

projectImageUpload.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  await uploadIntoField(file, projectForm.image, projectUploadStatus);
  event.target.value = "";
});

async function uploadIntoField(file, input, statusElement) {
  statusElement.textContent = "Envoi de l'image sur ImgBB...";
  setBusy(true);
  try {
    input.value = await uploadImageToImgbb(file);
    statusElement.textContent = "Image envoyee. Sauvegardez ensuite le formulaire.";
  } catch (error) {
    statusElement.textContent = "Upload impossible. Verifiez la cle ImgBB et la connexion.";
    console.error(error);
  } finally {
    setBusy(false);
  }
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
