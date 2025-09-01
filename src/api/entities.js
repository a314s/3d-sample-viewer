/**
 * Local, dependency-free data layer replacing Base44 SDK.
 * Persists Tutorials, Steps, and Tools into localStorage.
 * API surface mirrors the previous usage:
 *  - Tutorial.list(order?)
 *  - Tutorial.create(payload)
 *  - Tutorial.update(id, payload)
 *  - Step.filter(criteria, orderBy?)
 *  - Step.create(payload)
 *  - Step.update(id, payload)
 *  - Tool.list()
 *  - Tool.create(payload)
 *  - Tool.update(id, payload)
 *  - User.me()
 */

const STORAGE_KEYS = {
  tutorials: 'db.tutorials',
  steps: 'db.steps',
  tools: 'db.tools',
};

function load(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function sortBy(arr, order) {
  if (!order) return arr;
  const desc = order.startsWith('-');
  const key = desc ? order.slice(1) : order;

  const sorted = [...arr].sort((a, b) => {
    const av = a?.[key];
    const bv = b?.[key];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;

    if (typeof av === 'number' && typeof bv === 'number') {
      return av - bv;
    }
    const as = String(av);
    const bs = String(bv);
    return as.localeCompare(bs, undefined, { numeric: true, sensitivity: 'base' });
  });
  return desc ? sorted.reverse() : sorted;
}

function matches(item, criteria = {}) {
  return Object.entries(criteria).every(([k, v]) => {
    // Normalize to string compare when either is string/number
    const iv = item?.[k];
    if (typeof v === 'number' || typeof v === 'string') {
      return String(iv) === String(v);
    }
    return iv === v;
  });
}

/* Tutorials */
export const Tutorial = {
  async list(order = '-created_date') {
    const data = load(STORAGE_KEYS.tutorials, []);
    return sortBy(data, order).map(clone);
  },

  async create(payload) {
    const data = load(STORAGE_KEYS.tutorials, []);
    const now = new Date().toISOString();
    const rec = {
      id: genId(),
      title: '',
      part_number: '',
      id_number: '',
      description: '',
      model_file_url: '',
      total_steps: 0,
      created_date: now,
      ...clone(payload),
    };
    data.push(rec);
    save(STORAGE_KEYS.tutorials, data);
    return clone(rec);
  },

  async update(id, payload) {
    const data = load(STORAGE_KEYS.tutorials, []);
    const idx = data.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) throw new Error('Tutorial not found');
    data[idx] = { ...data[idx], ...clone(payload) };
    save(STORAGE_KEYS.tutorials, data);
    return clone(data[idx]);
  },

  async filter(criteria = {}, order) {
    const data = load(STORAGE_KEYS.tutorials, []);
    const filtered = data.filter((t) => matches(t, criteria));
    const ordered = order ? sortBy(filtered, order) : filtered;
    return ordered.map(clone);
  },
};

/* Steps */
export const Step = {
  async list(order) {
    const data = load(STORAGE_KEYS.steps, []);
    const ordered = order ? sortBy(data, order) : data;
    return ordered.map(clone);
  },

  async filter(criteria = {}, order) {
    const data = load(STORAGE_KEYS.steps, []);
    const filtered = data.filter((s) => matches(s, criteria));
    const ordered = order ? sortBy(filtered, order) : filtered;
    return ordered.map(clone);
  },

  async create(payload) {
    const data = load(STORAGE_KEYS.steps, []);
    const now = new Date().toISOString();
    const rec = {
      id: genId(),
      tutorial_id: null,
      step_number: 1,
      title: '',
      sub_step: '',
      specific_notes: '',
      video_url: '',
      required_tools: [],
      created_date: now,
      ...clone(payload),
    };
    // Normalize types
    rec.step_number = Number(rec.step_number) || 1;
    rec.required_tools = (rec.required_tools || []).map((id) => String(id));
    data.push(rec);
    save(STORAGE_KEYS.steps, data);

    // Update tutorial step count if applicable
    if (rec.tutorial_id) {
      const stepsForTut = data.filter((s) => String(s.tutorial_id) === String(rec.tutorial_id));
      const tutorials = load(STORAGE_KEYS.tutorials, []);
      const tIdx = tutorials.findIndex((t) => String(t.id) === String(rec.tutorial_id));
      if (tIdx !== -1) {
        tutorials[tIdx] = { ...tutorials[tIdx], total_steps: stepsForTut.length };
        save(STORAGE_KEYS.tutorials, tutorials);
      }
    }

    return clone(rec);
  },

  async update(id, payload) {
    const data = load(STORAGE_KEYS.steps, []);
    const idx = data.findIndex((s) => String(s.id) === String(id));
    if (idx === -1) throw new Error('Step not found');
    const next = { ...data[idx], ...clone(payload) };
    // Normalize types
    next.step_number = Number(next.step_number) || 1;
    next.required_tools = (next.required_tools || []).map((id) => String(id));

    data[idx] = next;
    save(STORAGE_KEYS.steps, data);

    // Update tutorial step count if applicable
    if (next.tutorial_id) {
      const stepsForTut = data.filter((s) => String(s.tutorial_id) === String(next.tutorial_id));
      const tutorials = load(STORAGE_KEYS.tutorials, []);
      const tIdx = tutorials.findIndex((t) => String(t.id) === String(next.tutorial_id));
      if (tIdx !== -1) {
        tutorials[tIdx] = { ...tutorials[tIdx], total_steps: stepsForTut.length };
        save(STORAGE_KEYS.tutorials, tutorials);
      }
    }

    return clone(next);
  },
};

/* Tools */
export const Tool = {
  async list(order) {
    const data = load(STORAGE_KEYS.tools, []);
    const ordered = order ? sortBy(data, order) : data;
    return ordered.map(clone);
  },

  async create(payload) {
    const data = load(STORAGE_KEYS.tools, []);
    const now = new Date().toISOString();
    const rec = {
      id: genId(),
      name: '',
      set_designator: null,
      color: null,
      image_url: null,
      created_date: now,
      ...clone(payload),
    };
    data.push(rec);
    save(STORAGE_KEYS.tools, data);
    return clone(rec);
  },

  async update(id, payload) {
    const data = load(STORAGE_KEYS.tools, []);
    const idx = data.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) throw new Error('Tool not found');
    data[idx] = { ...data[idx], ...clone(payload) };
    save(STORAGE_KEYS.tools, data);
    return clone(data[idx]);
  },
};

/* Auth stub */
export const User = {
  async me() {
    // Local dev: always admin
    return { id: 'local-admin', email: 'admin@local', role: 'admin', name: 'Local Admin' };
  },
};