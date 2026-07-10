import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

const localKey = "portfolioContent.v1";
const firestorePath = ["portfolio", "content"];
const firestoreRestUrl = "https://firestore.googleapis.com/v1/projects/marioce-e7c62/databases/(default)/documents/portfolio/content";

const firebaseConfig = {
  apiKey: "AIzaSyAH8061x3RQ5W8L8ywqSNjslcq9pETpOAo",
  authDomain: "marioce-e7c62.firebaseapp.com",
  projectId: "marioce-e7c62",
  storageBucket: "marioce-e7c62.firebasestorage.app",
  messagingSenderId: "217230082763",
  appId: "1:217230082763:web:7a3e0028be2ce434ce114e"
};

export const imgbbApiKey = "af6d7113f6f4673b0ab9084960da124e";

export const defaults = {
  fullName: "",
  role: "",
  tagline: "",
  bio: "",
  presentationVideo: "",
  location: "",
  email: "",
  avatar: "",
  github: "",
  linkedin: "",
  facebook: "",
  instagram: "",
  x: "",
  tiktok: "",
  youtube: "",
  website: "",
  clarivAfrica: "",
  whatsappNumber: "",
  whatsappMessage: "",
  contactText: "",
  skills: [],
  projects: []
};

const placeholderValues = new Set([
  "Votre Nom",
  "Developpeur Web",
  "Je cree des sites web modernes, rapides et utiles pour transformer des idees en experiences digitales.",
  "Remplacez ce texte depuis la page admin par une presentation claire: votre parcours, vos specialites, votre maniere de travailler et ce que vous cherchez actuellement.",
  "Base a votre ville",
  "contact@example.com",
  "https://github.com/",
  "https://www.linkedin.com/",
  "Bonjour, je viens de visiter votre portfolio et je souhaite discuter avec vous.",
  "Disponible pour des missions web, collaborations ou opportunites professionnelles."
]);

const placeholderProjectIds = new Set(["demo-site", "dashboard"]);
const defaultSkillSignature = "CSS|HTML|JavaScript|Responsive Design";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
const contentRef = doc(db, ...firestorePath);

function decodeFirestoreValue(value) {
  if (!value || typeof value !== "object") return undefined;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return value.stringValue;
  if ("bytesValue" in value) return value.bytesValue;
  if ("referenceValue" in value) return value.referenceValue;
  if ("geoPointValue" in value) return value.geoPointValue;

  if ("arrayValue" in value) {
    const values = Array.isArray(value.arrayValue && value.arrayValue.values) ? value.arrayValue.values : [];
    return values.map((item) => decodeFirestoreValue(item));
  }

  if ("mapValue" in value) {
    const fields = value.mapValue && value.mapValue.fields ? value.mapValue.fields : {};
    return Object.fromEntries(Object.entries(fields).map(([key, fieldValue]) => [key, decodeFirestoreValue(fieldValue)]));
  }

  return undefined;
}

async function loadPortfolioFromRest() {
  const response = await fetch(firestoreRestUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Firestore REST ${response.status}`);
  }

  const payload = await response.json();
  const fields = payload && payload.fields ? payload.fields : {};
  const decoded = decodeFirestoreValue({ mapValue: { fields } }) || {};
  return normalize(decoded);
}

export function normalize(data) {
  const content = {
    ...defaults,
    ...(data || {}),
    skills: Array.isArray(data && data.skills) ? data.skills : defaults.skills,
    projects: Array.isArray(data && data.projects) ? data.projects : defaults.projects
  };

  Object.keys(defaults).forEach((key) => {
    if (typeof content[key] === "string" && placeholderValues.has(content[key])) {
      content[key] = "";
    }
  });

  const skillSignature = [...content.skills].sort().join("|");
  if (skillSignature === defaultSkillSignature) {
    content.skills = [];
  }
  content.projects = content.projects
    .filter((project) => !placeholderProjectIds.has(project.id))
    .map((project) => ({ ...project, pinned: Boolean(project.pinned) }));

  return content;
}

function loadLocal() {
  try {
    const saved = localStorage.getItem(localKey);
    return saved ? normalize(JSON.parse(saved)) : defaults;
  } catch (error) {
    console.warn("Impossible de lire le contenu local du portfolio", error);
    return defaults;
  }
}

function saveLocal(data) {
  localStorage.setItem(localKey, JSON.stringify(data));
}

export async function loadPortfolio(options = {}) {
  const { seedIfMissing = false } = options;
  try {
    const snapshot = await getDoc(contentRef);
    if (snapshot.exists()) {
      const content = normalize(snapshot.data());
      saveLocal(content);
      return content;
    }

    const content = loadLocal();
    if (seedIfMissing) await savePortfolio(content);
    return content;
  } catch (error) {
    console.warn("Firebase SDK indisponible, tentative REST", error);
    try {
      const restContent = await loadPortfolioFromRest();
      saveLocal(restContent);
      return restContent;
    } catch (restError) {
      console.warn("REST indisponible, utilisation du contenu local", restError);
      return loadLocal();
    }
  }
}

export function onAdminAuthChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export function signInAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutAdmin() {
  return signOut(auth);
}

export async function savePortfolio(data) {
  const content = normalize(data);
  saveLocal(content);
  await setDoc(contentRef, { ...content, updatedAt: serverTimestamp() }, { merge: true });
  return content;
}

export async function resetPortfolio() {
  localStorage.removeItem(localKey);
  await savePortfolio(defaults);
  return defaults;
}

export async function uploadImageToImgbb(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
    method: "POST",
    body: formData
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error && result.error.message ? result.error.message : "Upload ImgBB impossible");
  }

  return result.data.display_url || result.data.url;
}
