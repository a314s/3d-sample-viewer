// Lightweight, dependency-free file "uploader"
// - Stores images as data URLs (base64) in localStorage for persistence
// - Returns { file_url } compatible with previous UploadFile({ file }) contract
// Notes:
//   - Great for images/docs. For large 3D assets, prefer hosting files on a server/CDN and paste URL.
//   - Data URLs work well for <img>. Some engines may not support GLTF with external .bin via data URL.

const FILES_KEY = 'db.files'; // { id: dataUrl }

function loadFiles() {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFiles(map) {
  localStorage.setItem(FILES_KEY, JSON.stringify(map));
}

function genId() {
  return (
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Failed to read file'));
    r.onload = () => resolve(String(r.result || ''));
    r.readAsDataURL(file);
  });
}

/**
 * Upload a file and persist as data URL in localStorage.
 * Returns: { file_url: string }
 */
export async function UploadFile({ file }) {
  if (!file) throw new Error('No file provided');
  const dataUrl = await readFileAsDataUrl(file);
  const id = genId();

  const map = loadFiles();
  map[id] = dataUrl;
  saveFiles(map);

  // Use a custom scheme-like identifier we can store anywhere.
  // For <img>, you can use the data URL directly (faster).
  // Here we return the data URL for simplicity.
  return { file_url: dataUrl, id };
}

/**
 * Optional helper to fetch by id (if you prefer ids over raw data URLs).
 */
export function getFileDataUrlById(id) {
  const map = loadFiles();
  return map[id] || null;
}