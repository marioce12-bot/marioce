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
  fullName: "Votre Nom",
  role: "Developpeur Web",
  tagline: "Je cree des sites web modernes, rapides et utiles pour transformer des idees en experiences digitales.",
  bio:
    "Remplacez ce texte depuis la page admin par une presentation claire: votre parcours, vos specialites, votre maniere de travailler et ce que vous cherchez actuellement.",
  presentationVideo: "",
  location: "Base a votre ville",
  email: "contact@example.com",
  avatar: "",
  github: "https://github.com/",
  linkedin: "https://www.linkedin.com/",
  facebook: "",
  instagram: "",
  x: "",
  tiktok: "",
  youtube: "",
  website: "",
  whatsappNumber: "",
  whatsappMessage: "Bonjour, je viens de visiter votre portfolio et je souhaite discuter avec vous.",
  contactText: "Disponible pour des missions web, collaborations ou opportunites professionnelles.",
  skills: ["HTML", "CSS", "JavaScript", "Responsive Design"],
  projects: [
    {
      id: "demo-site",
      title: "Site vitrine moderne",
      description:
        "Exemple de projet a remplacer: une page rapide et responsive pour presenter une activite, ses services et ses contacts.",
      status: "Termine",
      tech: ["HTML", "CSS", "JavaScript"],
      url: "#",
      image: ""
    },
    {
      id: "dashboard",
      title: "Dashboard admin",
      description:
        "Exemple de projet en cours: interface de gestion pour suivre du contenu, des utilisateurs ou des statistiques.",
      status: "En cours",
      tech: ["UI", "Data", "Admin"],
      url: "#",
      image: ""
    }
  ]
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
const contentRef = doc(db, ...firestorePath);

export function normalize(data) {
  return {
    ...defaults,
    ...(data || {}),
    skills: Array.isArray(data && data.skills) ? data.skills : defaults.skills,
    projects: Array.isArray(data && data.projects) ? data.projects : defaults.projects
  };
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
    console.warn("Firebase indisponible, utilisation du contenu local", error);
    return loadLocal();
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
