(function () {
  const HEROES_STORAGE_KEY = "raidex_heroes_v1";
  const HERO_SYSTEM_VERSION = 2;

  const HERO_DEFS = [
    { id: "GARRUK", name: "Garruk", rarity: "epic", basePower: 220 },
    { id: "AIDEN", name: "Aiden", rarity: "rare", basePower: 140 },
    { id: "MIRA", name: "Mira", rarity: "rare", basePower: 150 },
    { id: "BRUTUS", name: "Brutus", rarity: "common", basePower: 90 },
    { id: "PYRAX", name: "Pyrax", rarity: "common", basePower: 100 }
  ];
  const HERO_DEFS_BY_ID = HERO_DEFS.reduce((acc, hero) => {
    acc[hero.id] = hero;
    return acc;
  }, {});

  const defaultState = {
    owned: {
      GARRUK: { level: 1, stars: 1, xp: 0, shards: 0, inTeam: false }
    },
    pvpTeam: [],
    version: HERO_SYSTEM_VERSION
  };

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeHeroId(heroId) {
    return String(heroId || "").trim().toUpperCase();
  }

  function normalizeHeroEntry(entry) {
    const raw = entry || {};
    return {
      level: Math.max(1, Number(raw.level || 1)),
      stars: Math.max(1, Number(raw.stars || 1)),
      xp: Math.max(0, Number(raw.xp || 0)),
      shards: Math.max(0, Number(raw.shards || 0)),
      inTeam: !!raw.inTeam
    };
  }

  function normalizeNumericMap(rawMap) {
    const out = {};
    if (!rawMap || typeof rawMap !== "object") return out;
    Object.keys(rawMap).forEach((rawId) => {
      const heroId = normalizeHeroId(rawId);
      if (!heroId) return;
      out[heroId] = Number(rawMap[rawId] || 0);
    });
    return out;
  }

  function normalizeTeam(team, ownedMap) {
    const picked = [];
    const seen = new Set();
    const src = Array.isArray(team) ? team : [];
    for (let i = 0; i < src.length; i++) {
      const heroId = normalizeHeroId(src[i]);
      if (!heroId || seen.has(heroId) || !ownedMap[heroId]) continue;
      seen.add(heroId);
      picked.push(heroId);
      if (picked.length >= 3) break;
    }
    return picked;
  }

  function normalizeState(rawState) {
    const source = rawState && typeof rawState === "object" ? rawState : {};
    const rawOwned = source.owned && typeof source.owned === "object" ? source.owned : {};
    const owned = {};

    Object.keys(rawOwned).forEach((rawId) => {
      const heroId = normalizeHeroId(rawId);
      if (!heroId) return;
      const incoming = normalizeHeroEntry(rawOwned[rawId]);
      if (!owned[heroId]) {
        owned[heroId] = incoming;
        return;
      }
      // Merge duplicated keys that differ only by case.
      owned[heroId].level = Math.max(owned[heroId].level, incoming.level);
      owned[heroId].stars = Math.max(owned[heroId].stars, incoming.stars);
      owned[heroId].xp = Math.max(owned[heroId].xp, incoming.xp);
      owned[heroId].shards = Math.max(owned[heroId].shards, incoming.shards);
      owned[heroId].inTeam = owned[heroId].inTeam || incoming.inTeam;
    });

    if (!Object.keys(owned).length) {
      owned.GARRUK = deepClone(defaultState.owned.GARRUK);
    }

    let pvpTeam = normalizeTeam(source.pvpTeam, owned);
    if (!pvpTeam.length) {
      pvpTeam = normalizeTeam(
        Object.keys(owned).filter((heroId) => owned[heroId].inTeam),
        owned
      );
    }

    Object.keys(owned).forEach((heroId) => {
      owned[heroId].inTeam = pvpTeam.includes(heroId);
    });

    return {
      owned,
      pvpTeam,
      version: HERO_SYSTEM_VERSION
    };
  }

  function readState() {
    try {
      const raw = localStorage.getItem(HEROES_STORAGE_KEY);
      if (!raw) return deepClone(defaultState);
      const parsed = JSON.parse(raw);
      const normalized = normalizeState(parsed);
      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        writeState(normalized);
      }
      return normalized;
    } catch (e) {
      return deepClone(defaultState);
    }
  }

  function writeState(state) {
    localStorage.setItem(HEROES_STORAGE_KEY, JSON.stringify(state));
  }

  function syncFromLegacyState(legacyState) {
    const state = readState();
    const ownedIds = Array.isArray(legacyState?.owned)
      ? legacyState.owned.map(normalizeHeroId).filter(Boolean)
      : [];
    const heroLevels = normalizeNumericMap(legacyState?.heroLevels);
    const heroShards = normalizeNumericMap(legacyState?.heroShards);
    const teamIds = normalizeTeam(legacyState?.pvpTeam, Object.fromEntries(ownedIds.map((id) => [id, true])));

    ownedIds.forEach((heroId) => {
      ensureHero(state, heroId);
      const h = state.owned[heroId];
      h.level = Math.max(1, Number(heroLevels[heroId] || h.level || 1));
      h.shards = Math.max(0, Number(heroShards[heroId] || h.shards || 0));
      h.inTeam = teamIds.includes(heroId);
    });

    Object.keys(state.owned).forEach((heroId) => {
      state.owned[heroId].inTeam = teamIds.includes(heroId);
    });

    state.pvpTeam = normalizeTeam(teamIds, state.owned);
    writeState(state);
  }

  function ensureHero(state, heroId) {
    const normalizedId = normalizeHeroId(heroId);
    if (!normalizedId) return null;
    if (!state.owned[normalizedId]) {
      state.owned[normalizedId] = { level: 1, stars: 1, xp: 0, shards: 0, inTeam: false };
    }
    return normalizedId;
  }

  function getHeroDef(heroId) {
    return HERO_DEFS_BY_ID[normalizeHeroId(heroId)] || null;
  }

  function getOwnedHeroes() {
    const state = readState();
    return Object.keys(state.owned).map((heroId) => {
      const def = getHeroDef(heroId);
      const hero = state.owned[heroId];
      const basePower = def ? def.basePower : 100;
      const power = Math.floor(basePower * (1 + (hero.level - 1) * 0.15 + (hero.stars - 1) * 0.2));
      return {
        id: heroId,
        name: def ? def.name : heroId,
        rarity: def ? def.rarity : "common",
        level: hero.level,
        stars: hero.stars,
        xp: hero.xp,
        shards: hero.shards,
        inTeam: !!hero.inTeam,
        power
      };
    });
  }

  function summonHero(heroId) {
    const state = readState();
    const normalizedId = ensureHero(state, heroId);
    if (!normalizedId) return { type: "invalid", heroId: null };
    // duplicate -> shards
    if (
      state.owned[normalizedId].level > 1 ||
      state.owned[normalizedId].stars > 1 ||
      state.owned[normalizedId].xp > 0 ||
      state.owned[normalizedId].shards > 0
    ) {
      state.owned[normalizedId].shards += 10;
      writeState(state);
      return { type: "duplicate", heroId: normalizedId, shardsAdded: 10 };
    }
    // first own stays as level 1 hero
    writeState(state);
    return { type: "new", heroId: normalizedId };
  }

  function setInTeam(heroId, value) {
    const state = readState();
    const normalizedId = normalizeHeroId(heroId);
    if (!state.owned[normalizedId]) return false;
    let team = normalizeTeam(state.pvpTeam, state.owned);
    if (value) {
      if (!team.includes(normalizedId)) team.push(normalizedId);
    } else {
      team = team.filter((id) => id !== normalizedId);
    }
    team = team.slice(0, 3);
    Object.keys(state.owned).forEach((id) => {
      state.owned[id].inTeam = team.includes(id);
    });
    state.pvpTeam = team;
    writeState(state);
    return true;
  }

  function getPvpTeam() {
    const state = readState();
    return state.pvpTeam.slice();
  }

  function upgradeHero(heroId) {
    const state = readState();
    const normalizedId = normalizeHeroId(heroId);
    if (!state.owned[normalizedId]) return { ok: false, reason: "NOT_OWNED" };

    const h = state.owned[normalizedId];
    const needShards = h.stars * 20;
    if (h.shards < needShards) return { ok: false, reason: "NOT_ENOUGH_SHARDS", needShards };

    h.shards -= needShards;
    h.stars += 1;
    writeState(state);
    return { ok: true, heroId: normalizedId, stars: h.stars };
  }

  window.HeroSystem = {
    HERO_DEFS,
    normalizeHeroId,
    getOwnedHeroes,
    summonHero,
    setInTeam,
    getPvpTeam,
    upgradeHero,
    syncFromLegacyState
  };
})();