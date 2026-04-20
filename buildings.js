function isClickOnSprite(img, clientX, clientY) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const rect = img.getBoundingClientRect();
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;

    const px = Math.floor((clientX - rect.left) * scaleX);
    const py = Math.floor((clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(px, py, 1, 1).data;
    return pixel[3] > 10; // لو الـ alpha أكبر من 10 يعني مش شفاف
  } catch (e) {
    return true; // لو في error نعتبره كليك صح
  }
}
let buildingPanelExtra = null;
let buildingPanelTitle = null;
let buildingPanelImage = null;
let buildingPanelDesc = null;

const MINES_CONFIG = {
  goldMine: {
    buildingId: "building-1",
    img: "goldmine.png",
    requiredCastleLevel: 2,
    resource: "gold",
    statusBoxId: "gold-mine-status-box",
    collectHintId: "gold-mine-collect-hint",
    collectImg: "gold.png",
    uniBar: ["gold-mine-uni-bar", "gold-mine-uni-fill", "gold-mine-uni-text"],
    width: "130px",
    height: "150px",
    name: "منجم الذهب",
  },
  woodMine: {
    buildingId: "building-2",
    img: "woodmine.png",
    requiredCastleLevel: 2,
    resource: "wood",
    statusBoxId: "wood-mine-status-box",
    collectHintId: "wood-mine-collect-hint",
    collectImg: "wood.png",
    uniBar: ["wood-mine-uni-bar", "wood-mine-uni-fill", "wood-mine-uni-text"],
    width: "170px",
    height: "150px",
    name: "منجم الخشب",
  },
  meatFarm: {
    buildingId: "building-6",
    img: "meatfarm.png",
    requiredCastleLevel: 2,
    resource: "food",
    statusBoxId: "meat-farm-status-box",
    collectHintId: "meat-farm-collect-hint",
    collectImg: "food.png",
    uniBar: ["meat-farm-uni-bar", "meat-farm-uni-fill", "meat-farm-uni-text"],
    width: "180px",
    height: "180px",
    name: "مزرعة اللحم",
  },
};
const BUILDINGS_CONFIG = {
    castle: {
  buildingId: "castle-building",
  img: "elephant_castle.png",
  requiredCastleLevel: 1,
  statusBoxId: "castle-status-box",
  uniBar: ["castle-uni-bar", "castle-uni-fill", "castle-uni-text"],
  width: "210px", height: "210px",
  name: "القلعة",
  popupKey: "castle",
},
  attackTower: {
    buildingId: "building-4",
    img: "attack_tower.png",
    requiredCastleLevel: 2,
    statusBoxId: "attack-tower-status-box",
    uniBar: ["attack-tower-uni-bar", "attack-tower-uni-fill", "attack-tower-uni-text"],
    width: "240px", height: "200px",
    name: "برج الهجوم",
    popupKey: "attackTower",
  },
  defenseTower: {
    buildingId: "building-5",
    img: "defense_tower.png",
    requiredCastleLevel: 3,
    statusBoxId: "defense-tower-status-box",
    uniBar: ["defense-tower-uni-bar", "defense-tower-uni-fill", "defense-tower-uni-text"],
    width: "220px", height: "200px",
    name: "برج الدفاع",
    popupKey: "defenseTower",
  },
  school: {
    buildingId: "building-3",
    img: "school.png",
    requiredCastleLevel: 4,
    statusBoxId: "school-status-box",
    uniBar: ["school-uni-bar", "school-uni-fill", "school-uni-text"],
    width: "160px", height: "160px",
    name: "المدرسة",
    popupKey: "school",
  },
  market: {
    buildingId: "building-8",
    img: "market.png",
    requiredCastleLevel: 4,
    statusBoxId: "market-status-box",
    uniBar: ["market-uni-bar", "market-uni-fill", "market-uni-text"],
    width: "180px", height: "200px",
    name: "السوق",
    popupKey: "market",
  },
  heroesHall: {
    buildingId: "building-7",
    img: "heroes_hall.png",
    requiredCastleLevel: 5,
    statusBoxId: "heroes-hall-status-box",
    uniBar: ["heroes-hall-uni-bar", "heroes-hall-uni-fill", "heroes-hall-uni-text"],
    width: "180px", height: "200px",
    name: "قاعة الأبطال",
    popupKey: "heroesHall",
  },
  hospital: {
    buildingId: "building-10",
    img: "hospital.png",
    requiredCastleLevel: 5,
    statusBoxId: "hospital-status-box",
    uniBar: ["hospital-uni-bar", "hospital-uni-fill", "hospital-uni-text"],
    width: "195px", height: "175px",
    name: "المستشفى",
    popupKey: "hospital",
  },
  hunterCamp: {
    buildingId: "building-12",
    img: "hunter_camp.png",
    requiredCastleLevel: 6,
    statusBoxId: "hunter-camp-status-box",
    uniBar: ["hunter-camp-uni-bar", "hunter-camp-uni-fill", "hunter-camp-uni-text"],
    width: "180px", height: "180px",
    name: "Hunter Camp",
    popupKey: "hunterCamp",
  },
  prison: {
    buildingId: "building-13",
    img: "prison.png",
    requiredCastleLevel: 6,
    statusBoxId: "prison-status-box",
    uniBar: ["prison-uni-bar", "prison-uni-fill", "prison-uni-text"],
    width: "180px", height: "180px",
    name: "Prison",
    popupKey: "prison",
  },
  dragonTower: {
    buildingId: "building-11",
    img: "dragontower.png",
    requiredCastleLevel: 7,
    statusBoxId: "dragon-tower-status-box",
    uniBar: ["dragon-tower-uni-bar", "dragon-tower-uni-fill", "dragon-tower-uni-text"],
    width: "190px", height: "190px",
    name: "برج التنانين",
    popupKey: "dragonTower",
  },
  booster: {
    buildingId: "building-9",
    img: "booster_tower.png",
    requiredCastleLevel: 8,
    statusBoxId: "booster-tower-status-box",
    uniBar: ["booster-uni-bar", "booster-uni-fill", "booster-uni-text"],
    width: "130px", height: "130px",
    name: "برج البوست",
    popupKey: "booster",
  },
};

function setupMineBuilding(mineKey, pos) {
  const cfg = MINES_CONFIG[mineKey];
  const el = document.getElementById(cfg.buildingId);
  if (!el) return;

  el.style.border = "none";
  el.style.background = "transparent";
  el.style.width = cfg.width;
  el.style.height = cfg.height;
  el.style.position = "absolute";
  el.style.left = pos.left;
  el.style.top = pos.top;
  el.style.transform = "translate(-50%, -50%)";
  el.style.zIndex = 95;
  el.innerHTML = "";

  const img = document.createElement("img");
  img.src = cfg.img;
  img.crossOrigin = "anonymous";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.pointerEvents = "none";
  el.appendChild(img);

  const statusBox = document.createElement("div");
  statusBox.id = cfg.statusBoxId;
  statusBox.style.cssText = "position:absolute;bottom:0%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:8px;font-size:10px;min-width:70px;text-align:center;pointer-events:none;";

  createUnifiedBar(el, cfg.uniBar[0], cfg.uniBar[1], cfg.uniBar[2]);

  if (castleLevel < cfg.requiredCastleLevel) {
    el.style.filter = "grayscale(1)";
    el.style.opacity = "0.5";
    const lock = document.createElement("div");
    lock.textContent = "🔒 Lv." + cfg.requiredCastleLevel;
    lock.style.cssText = "position:absolute;bottom:4px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:8px;font-size:10px;pointer-events:none;";
    el.appendChild(lock);
    el.onclick = function(e) {
      e.stopPropagation();
      alert(`${cfg.name || mineKey} مقفول.\nقم بترقية القلعة إلى المستوى ${cfg.requiredCastleLevel} أولاً.`);
    };
  } else {
    el.style.filter = "none";
    el.style.opacity = "1";
    el.onclick = function(e) {
      e.stopPropagation();
      const img = el.querySelector("img");
      if (img && !isClickOnSprite(img, e.clientX, e.clientY)) return;
      showBuildingPopup(mineKey);
    };

    let collectHint = document.getElementById(cfg.collectHintId);
    if (!collectHint) {
      collectHint = document.createElement("div");
      collectHint.id = cfg.collectHintId;
      collectHint.style.cssText = "position:absolute;top:-10px;left:50%;transform:translateX(-50%);animation:bounce 1s infinite;cursor:pointer;display:none;pointer-events:auto;";
      collectHint.innerHTML = `<img src="${cfg.collectImg}" style="width:32px;height:32px;object-fit:contain;">`;
      el.appendChild(collectHint);
    }
    collectHint.onclick = function(e) {
      e.stopPropagation();
      const stored = Math.floor(miningStored[mineKey] || 0);
      if (stored <= 0) return;
      if (mineKey === "goldMine") {
        collectGoldFromMine(stored);
      } else {
        resources[cfg.resource] += stored;
        miningStored[mineKey] = 0;
        if (typeof updateTopBar === "function") updateTopBar();
        updateGoldMineUI();
      }
    };

    statusBox.textContent = "Lv." + (buildingLevels[mineKey] || 1);
    el.appendChild(statusBox);
  }
}

function setupBuilding(buildingKey, pos) {
  const cfg = BUILDINGS_CONFIG[buildingKey];
  if (!cfg) return;
  const el = document.getElementById(cfg.buildingId);
  if (!el) return;

  el.style.border = "none";
  el.style.background = "transparent";
  el.style.width = cfg.width;
  el.style.height = cfg.height;
  el.style.position = "absolute";
  el.style.left = pos.left;
  el.style.top = pos.top;
  el.style.transform = "translate(-50%, -50%)";
  el.style.zIndex = 95;
  el.innerHTML = "";

  const img = document.createElement("img");
  img.src = cfg.img;
  img.crossOrigin = "anonymous";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "contain";
  img.style.pointerEvents = "none";
  el.appendChild(img);

  const statusBox = document.createElement("div");
  statusBox.id = cfg.statusBoxId;

  createUnifiedBar(el, cfg.uniBar[0], cfg.uniBar[1], cfg.uniBar[2]);

  if (castleLevel < cfg.requiredCastleLevel) {
    el.style.filter = "grayscale(1)";
    el.style.opacity = "0.5";
    const lock = document.createElement("div");
    lock.textContent = "🔒 Lv." + cfg.requiredCastleLevel;
    lock.style.cssText = "position:absolute;bottom:4px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:8px;font-size:10px;pointer-events:none;";
    el.appendChild(lock);
    el.onclick = function(e) {
      e.stopPropagation();
      alert(`${cfg.name} مقفول.\nقم بترقية القلعة إلى المستوى ${cfg.requiredCastleLevel} أولاً.`);
    };
  } else {
    el.style.filter = "none";
    el.style.opacity = "1";
el.onclick = function(e) {
  e.stopPropagation();
  const img = el.querySelector("img");
  if (img && !isClickOnSprite(img, e.clientX, e.clientY)) return;
  showBuildingPopup(cfg.popupKey);
};
    statusBox.textContent = "Lv." + (buildingLevels[buildingKey] || 1);
    statusBox.style.cssText = "position:absolute;bottom:0%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);padding:2px 6px;border-radius:8px;font-size:10px;min-width:70px;text-align:center;pointer-events:none;";
    el.appendChild(statusBox);
  }
}
function getBuildingNameByKey(key) {
  if (BUILDINGS_CONFIG[key]) return BUILDINGS_CONFIG[key].name;
  if (MINES_CONFIG[key]) return MINES_CONFIG[key].name;
  if (key === "castle") return "القلعة";
  return key;
}

function getBuildingImageByKey(key) {
  if (BUILDINGS_CONFIG[key]) return BUILDINGS_CONFIG[key].img;
  if (MINES_CONFIG[key]) return MINES_CONFIG[key].img;
  if (key === "castle") return currentHero ? `${currentHero}_castle.png` : "elephant_castle.png";
  return "";
}
const MARKET_SHOP_STORAGE_KEY = "raidex_market_shop_v1";
const MARKET_SHOP_REFRESH_SECONDS = 900; // 15 minutes
const MARKET_SHOP_CARD_COUNT = 12;
const MARKET_RESOURCE_MIN = 10000;
const MARKET_RESOURCE_MAX = 200000;

function getMarketShopIcon(resourceKey) {
  const iconMap = {
    gold: "gold.png",
    wood: "wood.png",
    food: "food.png",
    gem: "gem.png"
  };
  return iconMap[resourceKey] || "gold.png";
}

function getMarketResourceLabel(resourceKey) {
  const labels = {
    gold: "ذهب",
    wood: "خشب",
    food: "غذاء",
    gem: "جواهر"
  };
  return labels[resourceKey] || resourceKey;
}

function getCurrentMarketHeroKey() {
  const heroKey = String(currentHero || "").toLowerCase();
  if (heroKey === "elephant" || heroKey === "tiger" || heroKey === "kong") return heroKey;
  return "elephant";
}

function getMarketShopAvailableSlots(level) {
  const lvl = Math.max(1, Number(level || 1));
  const fromTable = typeof getMarketLevelData === "function"
    ? Number(getMarketLevelData(lvl)?.slots || 2)
    : 2;
  return Math.max(2, Math.min(MARKET_SHOP_CARD_COUNT, fromTable));
}

function getCommonSoldierMetaByHero(heroKey) {
  const map = {
    elephant: { key: "ele_atk_soldier_1", img: "elephant_atk_soldier1.png", label: "جندي (Common)" },
    tiger: { key: "tig_soldier_1", img: "tiger_atk_soldier1.png", label: "جندي (Common)" },
    kong: { key: "kong_atk_soldier_1", img: "kong_atk_soldier1.png", label: "جندي (Common)" }
  };
  return map[heroKey] || map.elephant;
}

function getCommonHeroIdsForMarket() {
  try {
    const fromConfig = Object.values(HEROES_CONFIG || {})
      .filter((h) => String(h?.rarity || "").toLowerCase() === "common")
      .map((h) => h.id)
      .filter(Boolean);
    if (fromConfig.length) return fromConfig;
  } catch (e) {}
  return ["SYLVAN", "GARRUK", "PYRAX"];
}

function getMarketSoldierCatalogByHero(heroKey) {
  const perHero = {
    elephant: [
      { armyType: "attack", key: "ele_atk_soldier_1", img: "elephant_atk_soldier1.png", label: "جندي هجوم T1", rarity: "common", levelRequired: 1 },
      { armyType: "attack", key: "ele_atk_soldier_2", img: "elephant_atk_soldier2.png", label: "جندي هجوم T2", rarity: "rare", levelRequired: 10 },
      { armyType: "attack", key: "ele_atk_soldier_3", img: "elephant_atk_soldier3.png", label: "جندي هجوم T3", rarity: "epic", levelRequired: 25 },
      { armyType: "attack", key: "ele_atk_soldier_4", img: "elephant_atk_soldier4.png", label: "جندي هجوم T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "health", key: "ele_health_soldier_1", img: "elephant_health_soldier1.png", label: "جندي صحة T1", rarity: "common", levelRequired: 1 },
      { armyType: "health", key: "ele_health_soldier_2", img: "elephant_health_soldier2.png", label: "جندي صحة T2", rarity: "rare", levelRequired: 10 },
      { armyType: "health", key: "ele_health_soldier_3", img: "elephant_health_soldier3.png", label: "جندي صحة T3", rarity: "epic", levelRequired: 25 },
      { armyType: "health", key: "ele_health_soldier_4", img: "elephant_health_soldier4.png", label: "جندي صحة T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "dragon", key: "eledragon1", img: "elephantatksoldier1.png", label: "تنين T1", rarity: "common", levelRequired: 1 },
      { armyType: "dragon", key: "eledragon2", img: "elephantatksoldier2.png", label: "تنين T2", rarity: "rare", levelRequired: 10 },
      { armyType: "dragon", key: "eledragon3", img: "elephantatksoldier3.png", label: "تنين T3", rarity: "epic", levelRequired: 25 },
      { armyType: "dragon", key: "eledragon4", img: "elephantatksoldier4.png", label: "تنين T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "hunter", key: "ele_hunter_1", img: "hunter_elephant_1.png", label: "صياد T1", rarity: "common", levelRequired: 1 },
      { armyType: "hunter", key: "ele_hunter_2", img: "hunter_elephant_2.png", label: "صياد T2", rarity: "rare", levelRequired: 10 },
      { armyType: "hunter", key: "ele_hunter_3", img: "hunter_elephant_3.png", label: "صياد T3", rarity: "epic", levelRequired: 25 },
      { armyType: "hunter", key: "ele_hunter_4", img: "hunter_elephant_4.png", label: "صياد T4", rarity: "legendary", levelRequired: 35 }
    ],
    tiger: [
      { armyType: "attack", key: "tig_soldier_1", img: "tiger_atk_soldier1.png", label: "جندي هجوم T1", rarity: "common", levelRequired: 1 },
      { armyType: "attack", key: "tig_soldier_2", img: "tiger_atk_soldier2.png", label: "جندي هجوم T2", rarity: "rare", levelRequired: 10 },
      { armyType: "attack", key: "tig_soldier_3", img: "tiger_atk_soldier3.png", label: "جندي هجوم T3", rarity: "epic", levelRequired: 25 },
      { armyType: "attack", key: "tig_soldier_4", img: "tiger_atk_soldier4.png", label: "جندي هجوم T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "health", key: "tig_health_soldier_1", img: "tiger_health_soldier1.png", label: "جندي صحة T1", rarity: "common", levelRequired: 1 },
      { armyType: "health", key: "tig_health_soldier_2", img: "tiger_health_soldier2.png", label: "جندي صحة T2", rarity: "rare", levelRequired: 10 },
      { armyType: "health", key: "tig_health_soldier_3", img: "tiger_health_soldier3.png", label: "جندي صحة T3", rarity: "epic", levelRequired: 25 },
      { armyType: "health", key: "tig_health_soldier_4", img: "tiger_health_soldier4.png", label: "جندي صحة T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "dragon", key: "tigdragon1", img: "tigeratksoldier1.png", label: "تنين T1", rarity: "common", levelRequired: 1 },
      { armyType: "dragon", key: "tigdragon2", img: "tigeratksoldier2.png", label: "تنين T2", rarity: "rare", levelRequired: 10 },
      { armyType: "dragon", key: "tigdragon3", img: "tigeratksoldier3.png", label: "تنين T3", rarity: "epic", levelRequired: 25 },
      { armyType: "dragon", key: "tigdragon4", img: "tigeratksoldier4.png", label: "تنين T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "hunter", key: "tig_hunter_1", img: "hunter_tiger_1.png", label: "صياد T1", rarity: "common", levelRequired: 1 },
      { armyType: "hunter", key: "tig_hunter_2", img: "hunter_tiger_2.png", label: "صياد T2", rarity: "rare", levelRequired: 10 },
      { armyType: "hunter", key: "tig_hunter_3", img: "hunter_tiger_3.png", label: "صياد T3", rarity: "epic", levelRequired: 25 },
      { armyType: "hunter", key: "tig_hunter_4", img: "hunter_tiger_4.png", label: "صياد T4", rarity: "legendary", levelRequired: 35 }
    ],
    kong: [
      { armyType: "attack", key: "kong_atk_soldier_1", img: "kong_atk_soldier1.png", label: "جندي هجوم T1", rarity: "common", levelRequired: 1 },
      { armyType: "attack", key: "kong_atk_soldier_2", img: "kong_atk_soldier2.png", label: "جندي هجوم T2", rarity: "rare", levelRequired: 10 },
      { armyType: "attack", key: "kong_atk_soldier_3", img: "kong_atk_soldier3.png", label: "جندي هجوم T3", rarity: "epic", levelRequired: 25 },
      { armyType: "attack", key: "kong_atk_soldier_4", img: "kong_atk_soldier4.png", label: "جندي هجوم T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "health", key: "kong_health_soldier_1", img: "kong_health_soldier1.png", label: "جندي صحة T1", rarity: "common", levelRequired: 1 },
      { armyType: "health", key: "kong_health_soldier_2", img: "kong_health_soldier2.png", label: "جندي صحة T2", rarity: "rare", levelRequired: 10 },
      { armyType: "health", key: "kong_health_soldier_3", img: "kong_health_soldier3.png", label: "جندي صحة T3", rarity: "epic", levelRequired: 25 },
      { armyType: "health", key: "kong_health_soldier_4", img: "kong_health_soldier4.png", label: "جندي صحة T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "dragon", key: "kongdragon1", img: "kongatksoldier1.png", label: "تنين T1", rarity: "common", levelRequired: 1 },
      { armyType: "dragon", key: "kongdragon2", img: "kongatksoldier2.png", label: "تنين T2", rarity: "rare", levelRequired: 10 },
      { armyType: "dragon", key: "kongdragon3", img: "kongatksoldier3.png", label: "تنين T3", rarity: "epic", levelRequired: 25 },
      { armyType: "dragon", key: "kongdragon4", img: "kongatksoldier4.png", label: "تنين T4", rarity: "legendary", levelRequired: 35 },
      { armyType: "hunter", key: "kong_hunter_1", img: "hunter_gorilla_1.png", label: "صياد T1", rarity: "common", levelRequired: 1 },
      { armyType: "hunter", key: "kong_hunter_2", img: "hunter_gorilla_2.png", label: "صياد T2", rarity: "rare", levelRequired: 10 },
      { armyType: "hunter", key: "kong_hunter_3", img: "hunter_gorilla_3.png", label: "صياد T3", rarity: "epic", levelRequired: 25 },
      { armyType: "hunter", key: "kong_hunter_4", img: "hunter_gorilla_4.png", label: "صياد T4", rarity: "legendary", levelRequired: 35 }
    ]
  };
  return perHero[heroKey] || perHero.elephant;
}

function pickMarketSoldierOffer(heroKey, marketLevel) {
  const catalog = getMarketSoldierCatalogByHero(heroKey).filter((s) => (s.levelRequired || 1) <= marketLevel);
  if (!catalog.length) return getCommonSoldierMetaByHero(heroKey);

  const rarityWeight = { common: 82, rare: 13, epic: 4, legendary: 1 };
  const pool = [];
  catalog.forEach((s) => {
    const w = rarityWeight[s.rarity] || 1;
    for (let i = 0; i < w; i++) pool.push(s);
  });
  const picked = pool[Math.floor(Math.random() * pool.length)] || catalog[0];
  return picked;
}

function marketResourceRewardByLevel(level) {
  const lvl = Math.max(1, Number(level || 1));
  const growth = MARKET_RESOURCE_MIN + lvl * 4800;
  return Math.max(MARKET_RESOURCE_MIN, Math.min(MARKET_RESOURCE_MAX, growth));
}

function marketResourceCostForReward(amount) {
  const a = Math.max(MARKET_RESOURCE_MIN, Math.min(MARKET_RESOURCE_MAX, Number(amount || MARKET_RESOURCE_MIN)));
  return Math.floor(a * 0.75);
}

function getMarketOfferRewardIcon(offer) {
  if (!offer) return "gold.png";
  if (offer.rewardType === "soldier") {
    return offer.rewardImg || "elephant_atk_soldier1.png";
  }
  if (offer.rewardType === "heroShard") {
    const cfg = (typeof HEROES_CONFIG !== "undefined" && HEROES_CONFIG[offer.heroId]) ? HEROES_CONFIG[offer.heroId] : null;
    return cfg?.img || "sylvan.png";
  }
  return getMarketShopIcon(offer.reward);
}

function getMarketOfferRewardLabel(offer) {
  if (!offer) return "";
  if (offer.rewardType === "soldier") {
    return `${offer.rewardAmount.toLocaleString()} ${offer.rewardLabel || "جندي"}`;
  }
  if (offer.rewardType === "heroShard") {
    const cfg = (typeof HEROES_CONFIG !== "undefined" && HEROES_CONFIG[offer.heroId]) ? HEROES_CONFIG[offer.heroId] : null;
    const heroName = cfg?.name || offer.heroId || "Hero";
    return `${offer.rewardAmount.toLocaleString()} شظية ${heroName}`;
  }
  return `${offer.rewardAmount.toLocaleString()} ${getMarketResourceLabel(offer.reward)}`;
}

function grantMarketSoldiers(offer) {
  const heroKey = getCurrentMarketHeroKey();
  const gain = Math.max(1, Math.floor(Number(offer?.rewardAmount || 0)));
  const armyType = offer?.soldierArmyType || "attack";
  const soldierKey = offer?.soldierKey || getCommonSoldierMetaByHero(heroKey).key;

  const persist = (storageKey, bucketName) => {
    try {
      if (typeof window[bucketName] !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(window[bucketName]));
      }
    } catch (e) {}
  };

  if (armyType === "health" && typeof trainedHealthArmy !== "undefined") {
    if (!trainedHealthArmy[heroKey]) trainedHealthArmy[heroKey] = {};
    trainedHealthArmy[heroKey][soldierKey] = (trainedHealthArmy[heroKey][soldierKey] || 0) + gain;
    persist("raidex_trainedHealthArmy_v1", "trainedHealthArmy");
  } else if (armyType === "dragon" && typeof trainedDragonArmy !== "undefined") {
    if (!trainedDragonArmy[heroKey]) trainedDragonArmy[heroKey] = {};
    trainedDragonArmy[heroKey][soldierKey] = (trainedDragonArmy[heroKey][soldierKey] || 0) + gain;
    persist("raidex_dragon_army_v1", "trainedDragonArmy");
  } else if (armyType === "hunter" && typeof trainedHunterArmy !== "undefined") {
    if (!trainedHunterArmy[heroKey]) trainedHunterArmy[heroKey] = {};
    trainedHunterArmy[heroKey][soldierKey] = (trainedHunterArmy[heroKey][soldierKey] || 0) + gain;
    persist("raidex_hunterArmy_v1", "trainedHunterArmy");
  } else if (typeof trainedArmy !== "undefined") {
    if (!trainedArmy[heroKey]) trainedArmy[heroKey] = {};
    trainedArmy[heroKey][soldierKey] = (trainedArmy[heroKey][soldierKey] || 0) + gain;
    persist("raidex_trainedArmy_v1", "trainedArmy");
  }

  return { heroKey, soldierKey, gained: gain, armyType };
}

function grantMarketHeroShards(heroId, amount) {
  const normalizedId =
    (window.HeroSystem && typeof window.HeroSystem.normalizeHeroId === "function")
      ? window.HeroSystem.normalizeHeroId(heroId)
      : String(heroId || "").trim().toUpperCase();
  const gain = Math.max(1, Math.floor(Number(amount || 0)));
  if (!normalizedId) return null;
  if (typeof playerHeroesState !== "undefined") {
    if (!playerHeroesState.heroShards) playerHeroesState.heroShards = {};
    playerHeroesState.heroShards[normalizedId] = (playerHeroesState.heroShards[normalizedId] || 0) + gain;
  }
  if (window.HeroSystem && typeof HeroSystem.syncFromLegacyState === "function" && typeof playerHeroesState !== "undefined") {
    try {
      HeroSystem.syncFromLegacyState(playerHeroesState);
    } catch (e) {}
  }
  return { heroId: normalizedId, gained: gain };
}

function generateMarketOffers(slots, marketLevel) {
  const lvl = Math.max(1, Number(marketLevel || 1));
  const heroKey = getCurrentMarketHeroKey();
  const pickedSoldier = () => pickMarketSoldierOffer(heroKey, lvl);
  const commonHeroes = getCommonHeroIdsForMarket();
  const pickCommonHero = () => commonHeroes[Math.floor(Math.random() * commonHeroes.length)] || "SYLVAN";
  const baseResource = marketResourceRewardByLevel(lvl);
  const resAmount = () => {
    const variance = Math.floor((Math.random() - 0.5) * 50000);
    return Math.max(MARKET_RESOURCE_MIN, Math.min(MARKET_RESOURCE_MAX, baseResource + variance));
  };
  const templates = [
    () => { const a = resAmount(); return { reward: "gold", rewardAmount: a, cost: "wood", costAmount: marketResourceCostForReward(a) }; },
    () => { const a = resAmount(); return { reward: "wood", rewardAmount: a, cost: "food", costAmount: marketResourceCostForReward(a) }; },
    () => { const a = resAmount(); return { reward: "food", rewardAmount: a, cost: "gold", costAmount: marketResourceCostForReward(a) }; },
    () => ({ reward: "gem", rewardAmount: Math.max(5, Math.floor(lvl / 3)), cost: "gold", costAmount: 60000 + lvl * 2500 }),
    () => { const a = resAmount(); return { reward: "gold", rewardAmount: a, cost: "gem", costAmount: Math.max(5, Math.floor(a / 20000)) }; },
    () => { const s = pickedSoldier(); const useGem = Math.random() < 0.45; return {
      rewardType: "soldier",
      rewardAmount: 30 + lvl * 6,
      rewardLabel: s.label,
      rewardImg: s.img,
      soldierKey: s.key,
      soldierArmyType: s.armyType,
      soldierRarity: s.rarity,
      cost: useGem ? "gem" : "gold",
      costAmount: useGem ? Math.max(2, Math.floor((30 + lvl * 6) / 8)) : 30000 + lvl * 2200
    }; },
    () => { const useGem = Math.random() < 0.55; return ({
      rewardType: "heroShard",
      heroId: pickCommonHero(),
      rewardAmount: 5 + Math.floor(lvl / 4),
      cost: useGem ? "gem" : "food",
      costAmount: useGem ? 2 + Math.floor(lvl / 7) : 70000 + lvl * 3000
    }); }
  ];
  const offers = [];
  for (let i = 0; i < MARKET_SHOP_CARD_COUNT; i++) {
    const t = templates[Math.floor(Math.random() * templates.length)]();
    offers.push({
      id: `offer_${Date.now()}_${i}_${Math.floor(Math.random() * 9999)}`,
      ...t,
      reward: t.reward,
      rewardAmount: Math.floor(t.rewardAmount),
      cost: t.cost,
      costAmount: Math.floor(t.costAmount),
      discountPct: [10, 20, 30, 40][Math.floor(Math.random() * 4)],
      bought: false
    });
  }
  return offers;
}

function loadMarketShopState() {
  try {
    const raw = localStorage.getItem(MARKET_SHOP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveMarketShopState(state) {
  try {
    localStorage.setItem(MARKET_SHOP_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function ensureMarketShopState() {
  const marketLevel = buildingLevels.market || 1;
  const marketData = typeof getMarketLevelData === "function" ? getMarketLevelData(marketLevel) : null;
  const slots = getMarketShopAvailableSlots(marketLevel);
  const purchaseCap = Math.max(1, Number(marketData?.purchases || 3));
  let state = loadMarketShopState();
  const now = Date.now();
  const shouldRefresh =
    !state ||
    !Array.isArray(state.offers) ||
    state.offers.length !== MARKET_SHOP_CARD_COUNT ||
    !state.refreshAt ||
    now >= Number(state.refreshAt);

  if (shouldRefresh) {
    state = {
      refreshAt: now + MARKET_SHOP_REFRESH_SECONDS * 1000,
      offers: generateMarketOffers(slots, marketLevel),
      purchasesUsed: 0
    };
    saveMarketShopState(state);
  }
  return { state, slots, purchaseCap };
}

function getMarketSlotUnlockLevel(slotNumber) {
  const targetSlot = Math.max(1, Number(slotNumber || 1));
  for (let lvl = 1; lvl <= 50; lvl++) {
    if (getMarketShopAvailableSlots(lvl) >= targetSlot) return lvl;
  }
  return 50;
}

function formatMarketTimeLeft(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function buyMarketOffer(offerId) {
  const info = ensureMarketShopState();
  const state = info.state;
  const purchaseCap = info.purchaseCap;
  if ((state.purchasesUsed || 0) >= purchaseCap) {
    if (typeof showToast === "function") showToast("وصلت للحد الأقصى للشراء في هذه الدورة.");
    return;
  }
  const offer = (state.offers || []).find((o) => o.id === offerId);
  if (!offer || offer.bought) return;

  if ((resources?.[offer.cost] || 0) < offer.costAmount) {
    if (typeof showToast === "function") showToast(`تحتاج ${offer.costAmount.toLocaleString()} ${offer.cost}.`);
    return;
  }

  resources[offer.cost] = Math.max(0, (resources[offer.cost] || 0) - offer.costAmount);
  if (offer.rewardType === "soldier") {
    const grant = grantMarketSoldiers(offer);
    if (typeof showToast === "function") showToast(`+${grant.gained} ${offer.rewardLabel || "جندي"}`);
  } else if (offer.rewardType === "heroShard") {
    const grant = grantMarketHeroShards(offer.heroId, offer.rewardAmount);
    const heroName =
      (typeof HEROES_CONFIG !== "undefined" && HEROES_CONFIG[grant?.heroId]?.name)
        ? HEROES_CONFIG[grant.heroId].name
        : (grant?.heroId || offer.heroId);
    if (typeof showToast === "function") showToast(`+${offer.rewardAmount} شظايا ${heroName}`);
  } else {
    resources[offer.reward] = (resources[offer.reward] || 0) + offer.rewardAmount;
  }
  offer.bought = true;
  state.purchasesUsed = (state.purchasesUsed || 0) + 1;
  saveMarketShopState(state);
  if (typeof updateTopBar === "function") updateTopBar();
  if (typeof saveHeroState === "function" && offer.rewardType === "heroShard") saveHeroState();
  if (typeof saveGameState === "function") saveGameState();
  if (window.marketPanelMode === "shop") refreshBuildingPanel("market");
}

function forceRefreshMarketShop() {
  const state = loadMarketShopState() || {};
  state.refreshAt = 0;
  saveMarketShopState(state);
  ensureMarketShopState();
  if (window.marketPanelMode === "shop") refreshBuildingPanel("market");
}

function stopMarketPanelShopTicker() {
  if (window._marketPanelShopTick) {
    clearInterval(window._marketPanelShopTick);
    window._marketPanelShopTick = null;
  }
}

function startMarketPanelShopTicker() {
  stopMarketPanelShopTicker();
  window._marketPanelShopTick = setInterval(() => {
    const panel = document.getElementById("market-panel");
    if (!panel || panel.style.display === "none" || window.marketPanelMode !== "shop") {
      stopMarketPanelShopTicker();
      return;
    }
    refreshBuildingPanel("market");
  }, 1000);
}

function renderMarketShopPanelContent(container) {
  if (!container) return;
  const info = ensureMarketShopState();
  const state = info.state;
  const slots = info.slots;
  const purchaseCap = info.purchaseCap;
  const now = Date.now();
  const leftSec = Math.max(0, Math.floor((Number(state.refreshAt) - now) / 1000));
  const purchasesLeft = Math.max(0, purchaseCap - (state.purchasesUsed || 0));

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border:1px solid rgba(148,163,184,0.25);border-radius:12px;background:rgba(15,23,42,0.88);">
      <button onclick="forceRefreshMarketShop()" style="padding:8px 10px;border:none;border-radius:999px;background:linear-gradient(135deg,#38bdf8,#22d3ee);color:#0b1120;font-size:12px;font-weight:800;cursor:pointer;">تحديث مجاني</button>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;font-size:12px;">
        <div style="color:#9ca3af;">عروض جديدة:</div>
        <div style="color:#f59e0b;font-weight:800;">${formatMarketTimeLeft(leftSec)}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;font-size:12px;">
        <div style="color:#9ca3af;">المتاح:</div>
        <div style="color:#facc15;font-weight:800;">${purchasesLeft}/${purchaseCap}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">
      ${(state.offers || []).map((offer, index) => {
    const unlocked = index < slots;
    const requiredLevel = getMarketSlotUnlockLevel(index + 1);
    const disabled = !unlocked || offer.bought || purchasesLeft <= 0;
    return `
      <div style="display:flex;flex-direction:column;gap:6px;padding:6px;border:1px solid rgba(148,163,184,0.25);border-radius:10px;background:#f8fafc;position:relative;min-height:176px;">
        <div style="position:absolute;top:0;left:0;background:#60a5fa;color:white;font-size:10px;font-weight:900;padding:2px 6px;border-bottom-right-radius:8px;">-${offer.discountPct || 10}%</div>
        ${unlocked ? "" : `<div style="position:absolute;inset:0;background:rgba(2,6,23,0.58);display:flex;align-items:center;justify-content:center;z-index:2;border-radius:10px;font-size:12px;font-weight:800;color:#f8fafc;text-align:center;padding:8px;">🔒 يفتح عند Lv.${requiredLevel}</div>`}
        <div style="height:94px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${offer.rewardType === "soldier" ? "#dbeafe" : offer.rewardType === "heroShard" ? "#fee2e2" : offer.reward === "wood" ? "#cfeadf" : offer.reward === "gold" ? "#fde68a" : offer.reward === "gem" ? "#fecaca" : "#bfdbfe"};">
          <img src="${getMarketOfferRewardIcon(offer)}" style="width:64px;height:64px;object-fit:contain;">
        </div>
        <div style="font-size:14px;color:#111827;font-weight:800;text-align:center;">${getMarketOfferRewardLabel(offer)}</div>
        <button
          ${disabled ? "disabled" : ""}
          onclick="buyMarketOffer('${offer.id}')"
          style="margin-top:auto;padding:7px 8px;border:none;border-radius:999px;background:${disabled ? "rgba(107,114,128,0.7)" : "linear-gradient(135deg,#22c55e,#16a34a)"};color:white;font-size:12px;font-weight:900;cursor:${disabled ? "not-allowed" : "pointer"};">
          ${!unlocked ? `مقفول Lv.${requiredLevel}` : offer.bought ? "تم الشراء" : `شراء ${offer.costAmount.toLocaleString()} <img src="${getMarketShopIcon(offer.cost)}" style="width:12px;height:12px;vertical-align:middle;">`}
        </button>
      </div>
    `;
  }).join("")}
    </div>
  `;
}

function renderMarketModeTabs(upgradeSection) {
  const isShop = window.marketPanelMode === "shop";
  const tabsRow = document.createElement("div");
  tabsRow.style.cssText = "display:flex; gap:8px; margin-bottom:4px;";

  const upgradeTabBtn = document.createElement("button");
  upgradeTabBtn.textContent = "Upgrade";
  upgradeTabBtn.style.cssText = `flex:1; padding:10px 0; border:1px solid ${isShop ? "rgba(148,163,184,0.35)" : "rgba(250,204,21,0.45)"}; border-radius:999px; background:${isShop ? "rgba(15,23,42,0.65)" : "linear-gradient(135deg,#facc15,#f97316)"}; color:${isShop ? "#d1d5db" : "#0b1120"}; font-weight:800; font-size:13px; cursor:pointer;`;
  upgradeTabBtn.onclick = () => {
    window.marketPanelMode = "upgrade";
    refreshBuildingPanel("market");
  };

  const shopTabBtn = document.createElement("button");
  shopTabBtn.textContent = "Shop";
  shopTabBtn.style.cssText = `flex:1; padding:10px 0; border:1px solid ${isShop ? "rgba(34,197,94,0.45)" : "rgba(148,163,184,0.35)"}; border-radius:999px; background:${isShop ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(15,23,42,0.65)"}; color:#f8fafc; font-weight:800; font-size:13px; cursor:pointer;`;
  shopTabBtn.onclick = () => {
    window.marketPanelMode = "shop";
    refreshBuildingPanel("market");
  };

  tabsRow.appendChild(upgradeTabBtn);
  tabsRow.appendChild(shopTabBtn);
  upgradeSection.appendChild(tabsRow);
}

function configureBuildingInfoButton(infoBtn) {
  if (!infoBtn) return;
  infoBtn.textContent = "!";
  infoBtn.style.width = "32px";
  infoBtn.style.fontSize = "16px";
  infoBtn.style.fontWeight = "bold";
}

window.buyMarketOffer = buyMarketOffer;
window.forceRefreshMarketShop = forceRefreshMarketShop;
function handleBuildingInfoClick(buildingKey) {
  if (buildingKey === 'heroesHall') {
    heroesHallActiveTab = 'all';

    const heroesPanel = document.getElementById('heroesHall-panel');
    if (heroesPanel) {
      heroesPanel.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }

    refreshBuildingPanel('heroesHall');
    return;
  }

  openBuildingInfoModal(buildingKey);
}
function createBuildingPanel(buildingKey) {
  const panelId = buildingKey + "-panel";
  const existingPanel = document.getElementById(panelId);

  if (existingPanel) {
    existingPanel.style.display = "block";
    document.body.style.overflow = "hidden";

    const infoBtn = existingPanel.querySelector("button:first-child");
  if (infoBtn) {
    configureBuildingInfoButton(infoBtn);
    infoBtn.onclick = () => handleBuildingInfoClick(buildingKey);
  }

    refreshBuildingPanel(buildingKey);
    setTimeout(() => {
      updateBuildingUpgradePanelForTimer(buildingKey);
    }, 50);
    return;
  }

  const cfg = BUILDINGS_CONFIG[buildingKey] || MINES_CONFIG[buildingKey];
  if (!cfg) return;

  const panel = document.createElement("div");
  panel.id = panelId;
  panel.className = "building-panel";

  const header = document.createElement("div");
  header.style.cssText = `
    display:flex; align-items:center; justify-content:space-between;
    padding:12px 14px;
    background:linear-gradient(135deg,#0f172a,#1e293b);
    border-bottom:1px solid rgba(250,204,21,0.2);
  `;

  const infoBtn = document.createElement("button");
  infoBtn.textContent = "!";
  infoBtn.style.cssText = `
    width:32px; height:32px; border-radius:999px;
    background:rgba(250,204,21,0.15);
    border:1px solid rgba(250,204,21,0.3);
    color:#facc15; font-weight:bold; font-size:16px;
    cursor:pointer;
  `;
  configureBuildingInfoButton(infoBtn);

  const titleBox = document.createElement("div");
  titleBox.style.cssText = `flex:1; text-align:center;`;
  const titleInner = document.createElement("div");
  titleInner.textContent = cfg.name;
  titleInner.style.cssText = `
    display:inline-block;
    padding:6px 20px;
    background:rgba(250,204,21,0.1);
    border:1px solid rgba(250,204,21,0.3);
    border-radius:999px;
    font-weight:bold; font-size:16px;
    color:#facc15;
  `;
  titleBox.appendChild(titleInner);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✖";
  closeBtn.style.cssText = `
    width:32px; height:32px; border-radius:999px;
    background:rgba(239,68,68,0.15);
    border:1px solid rgba(239,68,68,0.3);
    color:#ef4444; font-size:14px;
    cursor:pointer;
  `;
  closeBtn.onclick = () => {
    panel.style.display = "none";
    document.body.style.overflow = "auto";
    if (buildingKey === "market") stopMarketPanelShopTicker();
    showSummonButton(true);
  };

  header.appendChild(infoBtn);
  header.appendChild(titleBox);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const body = document.createElement("div");
  body.id = panelId + "-body";
  body.className = "building-panel-body";
  panel.appendChild(body);

  document.body.appendChild(panel);
  document.body.style.overflow = "hidden";

  // أهم سطرين: نحسب ارتفاع الجزء اللي تحت الهيدر
  requestAnimationFrame(() => {
    const panelRect = panel.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const h = panelRect.height - headerRect.height;
    body.style.height = h + "px";
    body.style.overflowY = "auto";
  });

infoBtn.onclick = () => handleBuildingInfoClick(buildingKey);

  refreshBuildingPanel(buildingKey);
  setTimeout(() => {
    updateBuildingUpgradePanelForTimer(buildingKey);
  }, 50);
}
function refreshBuildingPanel(buildingKey) {
  const panelId = buildingKey + "-panel";
  const body = document.getElementById(panelId + "-body");
  if (!body) return;

  const cfg = BUILDINGS_CONFIG[buildingKey] || MINES_CONFIG[buildingKey];
  if (!cfg) return;

  if (buildingKey === "market") {
    const panel = document.getElementById(panelId);
    const infoBtn = panel ? panel.querySelector("button:first-child") : null;
    const isMarketInfoMode = window.marketPanelMode === "shop";
    if (infoBtn) {
      if (isMarketInfoMode) {
        infoBtn.style.display = "none";
      } else {
        infoBtn.style.display = "";
        infoBtn.textContent = "!";
        infoBtn.style.width = "32px";
        infoBtn.style.fontSize = "16px";
        infoBtn.style.fontWeight = "bold";
        infoBtn.onclick = () => handleBuildingInfoClick(buildingKey);
      }
    }
  }

  if (buildingKey === "market" && window.marketPanelMode === "shop") {
    body.innerHTML = "";
    const shopWrap = document.createElement("div");
    shopWrap.style.cssText = "padding:12px; display:flex; flex-direction:column; gap:8px;";
    body.appendChild(shopWrap);
    renderMarketShopPanelContent(shopWrap);
    startMarketPanelShopTicker();
    return;
  }

  if (buildingKey === "heroesHall") {
    const forceUpgradeActive = (window.heroesHallForceUpgradeUntil || 0) > Date.now();
    const mode = forceUpgradeActive ? "upgrade" : (window.heroesHallPanelMode || "info");
    if (mode === "info") {
      body.innerHTML = `
        <div id="heroes-grid" style="padding:14px;"></div>
      `;
      renderHeroesHallPanel();
      return;
    }
    // في وضع الترقية لازم نمسح أي UI قديم خاص بالـ info
    body.innerHTML = "";
  }

  const level = buildingLevels[buildingKey] || 1;
  const nextLevel = level + 1;
  const cost = calcGenericUpgradeCost(buildingKey, level);
  const time = calcGenericUpgradeTime(buildingKey, level);
  const gemCost = Math.max(1, Math.ceil(time / 30));

  // ===== لو الجزء العلوي مش موجود، ابنيه =====
  if (!document.getElementById(panelId + "-toprow")) {

    const topRow = document.createElement("div");
    topRow.id = panelId + "-toprow";
  topRow.style.cssText = `
  display:flex;
  gap:0;
  height: 200px;            /* كان 250، كبرناه */
  margin-bottom: 12px;      /* مسافة بسيطة تحت البلوك */
  position:relative;
  overflow:hidden;
  margin-left:-14px;
  margin-right:-14px;
  border-bottom:1px solid rgba(148,163,184,0.2);
`;
    const videoEl = document.createElement("video");
    videoEl.src = "smoke.mp4";
    videoEl.autoplay = true;
    videoEl.loop = true;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.style.cssText = `
      position:absolute; left:0; top:0;
      width:100%; height:100%;
      object-fit:cover; opacity:0.4;
      pointer-events:none; z-index:0;
      mix-blend-mode:screen;
    `;
    topRow.appendChild(videoEl);

    const img = document.createElement("img");
    img.src = cfg.img;
    img.style.cssText = `
      width:55%; height:100%; object-fit:contain;
      object-position:bottom; position:relative; z-index:1;
      filter: drop-shadow(0 0 6px rgba(255,255,255,0.15));
    `;

    const statsBox = document.createElement("div");
    statsBox.id = panelId + "-statsbox";
    statsBox.style.cssText = `
      flex:1; display:flex; flex-direction:column;
      gap:10px; padding:14px; justify-content:center;
      position:relative; z-index:1;
    `;

    topRow.appendChild(img);
    topRow.appendChild(statsBox);
    body.appendChild(topRow);
  }

  // ===== تحديث البيانات (stats) دايمًا =====
  const statsBox = document.getElementById(panelId + "-statsbox");
  if (statsBox) {
    statsBox.innerHTML = "";

    const lvlBadge = document.createElement("div");
    lvlBadge.style.cssText = `
  display:inline-flex; align-items:center;
  padding:4px 10px; border-radius:999px;
  background:rgba(250,204,21,0.1);
  border:1px solid rgba(250,204,21,0.3);
  font-size:12px; color:#facc15; font-weight:bold;
  width:fit-content; margin-bottom:4px;
  align-self:center;
`;
    lvlBadge.textContent = `Lv.${level} → Lv.${nextLevel}`;
    statsBox.appendChild(lvlBadge);

    const statsData = getBuildingStats(buildingKey, level, nextLevel);
    statsData.forEach(stat => {
      const row = document.createElement("div");
      row.style.cssText = `
        display:flex; justify-content:space-between; align-items:center;
        padding:6px 10px; border-radius:10px;
       background:rgba(15,23,42,0.9);
border:2px solid rgba(250,204,21,0.3);
        font-size:12px;
      `;
      row.innerHTML = `
        <span style="color:#9ca3af;">${stat.icon} ${stat.label}</span>
        <span style="color:${stat.color}; font-weight:bold;">${stat.current} → ${stat.next}</span>
      `;
      statsBox.appendChild(row);
    });
  }

  // ===== الجزء السفلي (upgrade section) - بيتحدث دايمًا =====
  let upgradeSection = document.getElementById(panelId + "-upgrade-section");
  if (!upgradeSection) {
    upgradeSection = document.createElement("div");
    upgradeSection.id = panelId + "-upgrade-section";
    body.appendChild(upgradeSection);
  }
 upgradeSection.innerHTML = "";
upgradeSection.style.cssText = "display:flex; flex-direction:column; gap:10px; padding-top:10px;";

if (buildingKey === "market") {
  if (!window.marketPanelMode) window.marketPanelMode = "upgrade";
  renderMarketModeTabs(upgradeSection);
  if (window.marketPanelMode === "shop") {
    const shopWrap = document.createElement("div");
    shopWrap.style.cssText = "display:flex; flex-direction:column; gap:8px;";
    upgradeSection.appendChild(shopWrap);
    renderMarketShopPanelContent(shopWrap);
    startMarketPanelShopTicker();
    return;
  }
  stopMarketPanelShopTicker();
}

const upgrade = buildingUpgrades[buildingKey];
const inProgress = upgrade && upgrade.inProgress;

if (!inProgress) {
  // ===== Upgrade Label =====
  const upgradeLabel = document.createElement("div");
  upgradeLabel.textContent = "Upgrade";
  upgradeLabel.style.cssText = "font-size:13px; color:#ffffff; font-weight:bold; text-align:center;";
  upgradeSection.appendChild(upgradeLabel);

  // ===== الموارد =====
  const resourcesRow = document.createElement("div");
  resourcesRow.style.cssText = "display:flex; gap:8px; justify-content:center;";
  [
    { img: "gold.png", val: cost.gold, color: "#facc15" },
    { img: "wood.png", val: cost.wood, color: "#4ade80" },
    { img: "food.png", val: cost.food, color: "#f97316" },
  ].forEach(r => {
    if (!r.val) return;
    const box = document.createElement("div");
    box.style.cssText = `display:flex; align-items:center; gap:4px; padding:6px 10px; border-radius:10px; background:rgba(15,23,42,0.9); border:1px solid rgba(250,204,21,0.2); font-size:12px; color:${r.color}; font-weight:bold;`;
    box.innerHTML = `<img src="${r.img}" style="width:16px;height:16px;"> ${r.val.toLocaleString()}`;
    resourcesRow.appendChild(box);
  });
  upgradeSection.appendChild(resourcesRow);

  // ===== الوقت =====
  const timeBox = document.createElement("div");
  timeBox.className = "upgrade-timer";
  timeBox.style.cssText = `display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 12px; border-radius:10px; background:rgba(15,23,42,0.9); border:1px solid rgba(250,204,21,0.3); font-size:12px; color:#ffffff; text-align:center;`;
  timeBox.innerHTML = `⏱ ${formatDuration(time)}`;
  upgradeSection.appendChild(timeBox);

  // ===== المباني المطلوبة =====
  const reqItems = getUpgradeRequirements(buildingKey, nextLevel);
  if (reqItems && Object.keys(reqItems).length > 0) {
    const reqTitle = document.createElement("div");
    reqTitle.style.cssText = "font-size:11px; color:#9ca3af; text-align:center;";
    reqTitle.textContent = "المباني المطلوبة:";
    upgradeSection.appendChild(reqTitle);
    const reqRow = document.createElement("div");
    reqRow.style.cssText = "display:flex; gap:8px; justify-content:center; flex-wrap:wrap;";
    for (const [key, neededLevel] of Object.entries(reqItems)) {
      const curLvl = key === "castle" ? castleLevel : (buildingLevels[key] || 0);
      const ok = curLvl >= neededLevel;
      const box = document.createElement("div");
      box.style.cssText = `display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 12px; border-radius:10px; background:rgba(15,23,42,0.9); border:1px solid ${ok ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}; font-size:11px; cursor:pointer; min-width:80px;`;
      box.innerHTML = `<img src="${getBuildingImageByKey(key)}" style="width:32px;height:32px;object-fit:contain;"><div style="color:#e5e7eb;">${getBuildingNameByKey(key)}</div><div style="color:${ok ? "#22c55e" : "#ef4444"};">Lv.${curLvl}/${neededLevel}</div>`;
      reqRow.appendChild(box);
    }
    upgradeSection.appendChild(reqRow);
  }

  // ===== التحقق من الشروط =====
  const reqData = getUpgradeRequirements(buildingKey, nextLevel);
  let reqsMet = true;
  if (reqData) {
    for (const [key, neededLevel] of Object.entries(reqData)) {
      const curLvl = key === "castle" ? castleLevel : (buildingLevels[key] || 0);
      if (curLvl < neededLevel) { reqsMet = false; break; }
    }
  }

  // ===== الأزرار =====
  const btnsRow = document.createElement("div");
  btnsRow.style.cssText = "display:flex; gap:8px;";

  const upgradeBtn = document.createElement("button");
  upgradeBtn.style.cssText = `flex:1; padding:12px 0; border:none; border-radius:999px; background:${reqsMet ? "linear-gradient(135deg,#facc15,#f97316)" : "rgba(55,65,81,0.8)"}; color:${reqsMet ? "#0b1120" : "#6b7280"}; font-weight:bold; font-size:14px; cursor:${reqsMet ? "pointer" : "not-allowed"};`;
  upgradeBtn.textContent = "⬆️ ترقية";
  upgradeBtn.disabled = !reqsMet;
  upgradeBtn.onclick = () => {
    if (!reqsMet) return;
    startGenericBuildingUpgrade(buildingKey);
  };

  const gemBtn = document.createElement("button");
  gemBtn.style.cssText = `flex:1; padding:12px 0; border:none; border-radius:999px; background:${reqsMet ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(55,65,81,0.8)"}; color:${reqsMet ? "#fff" : "#6b7280"}; font-weight:bold; font-size:13px; cursor:${reqsMet ? "pointer" : "not-allowed"}; display:flex; align-items:center; justify-content:center; gap:4px;`;
  gemBtn.innerHTML = `ترقية فورية <img src="gem.png" style="width:16px;height:16px;"> ${gemCost}`;
  gemBtn.disabled = !reqsMet;
  gemBtn.onclick = () => {
    if (!reqsMet) return;
    if (resources.gem < gemCost) { showToast(`تحتاج ${gemCost} جواهر!`); return; }
    resources.gem -= gemCost;
    buildingLevels[buildingKey] = nextLevel;
    saveGameState();
    if (typeof updateTopBar === "function") updateTopBar();
    if (typeof recalculatePower === "function") recalculatePower();
    refreshBuildingPanel(buildingKey);
  };

  btnsRow.appendChild(upgradeBtn);
  btnsRow.appendChild(gemBtn);
  upgradeSection.appendChild(btnsRow);

} else {
  // ===== جاري الترقية =====
  const timeBox = document.createElement("div");
  timeBox.className = "upgrade-timer";
  timeBox.style.cssText = `display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 12px; border-radius:10px; background:rgba(15,23,42,0.9); border:1px solid rgba(250,204,21,0.3); font-size:12px; color:#ffffff; text-align:center;`;
  timeBox.innerHTML = `⏱ ${formatDuration(upgrade.remainingTime)}`;
  upgradeSection.appendChild(timeBox);

  const cancelBtn = document.createElement("button");
  cancelBtn.style.cssText = `width:100%; padding:12px 0; border:none; border-radius:999px; background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#ef4444; font-weight:bold; font-size:14px; cursor:pointer;`;
  cancelBtn.textContent = "❌ إيقاف الترقية";
  cancelBtn.onclick = () => {
    cancelBuildingUpgrade(buildingKey);
    refreshBuildingPanel(buildingKey);
  };
  upgradeSection.appendChild(cancelBtn);
  }
}
function getUpgradeRequirements(buildingKey, nextLevel) {
  let row = null;
  if (buildingKey === "attackTower")  row = getAttackArmyBuildingLevel(nextLevel);
  else if (buildingKey === "defenseTower") row = getHealthArmyBuildingLevel(nextLevel);
  else if (buildingKey === "dragonTower")  row = getDragonArmyBuildingLevel(nextLevel);
  else if (buildingKey === "goldMine")  row = getGoldMineLevelData(nextLevel);
  else if (buildingKey === "woodMine")  row = getWoodMineLevelData(nextLevel);
  else if (buildingKey === "meatFarm")  row = getMeatFarmLevelData(nextLevel);

  // لو لقينا row من الجداول
  if (row && row.req) return row.req;

  // باقي المباني - شرط القلعة بس
  const castleReqs = {
    school:      { castle: 4 },
    market:      { castle: 4 },
    heroesHall:  { castle: 5 },
    hospital:    { castle: 5 },
    hunterCamp:  { castle: 6 },
    prison:      { castle: 6 },
    booster:     { castle: 8 },
  };

  return castleReqs[buildingKey] || null;
}
function getBuildingStats(buildingKey, level, nextLevel) {

  if (buildingKey === "castle") {
    return [
      { icon: "⚔️", label: "القوة", current: getCastlePowerForLevel(level).toLocaleString(), next: getCastlePowerForLevel(nextLevel).toLocaleString(), color: "#a78bfa" },
      { icon: "🗄️", label: "سعة التخزين", current: getCastleStorageCapacity(level).toLocaleString(), next: getCastleStorageCapacity(nextLevel).toLocaleString(), color: "#38bdf8" },
    ];
  }

  const isMine = ["goldMine", "woodMine", "meatFarm"].includes(buildingKey);
  const isArmy = ["attackTower", "defenseTower", "dragonTower"].includes(buildingKey);

  if (isMine) {
    let cur, nxt;
    if (buildingKey === "goldMine") { cur = getGoldMineLevelData(level); nxt = getGoldMineLevelData(nextLevel); }
    else if (buildingKey === "woodMine") { cur = getWoodMineLevelData(level); nxt = getWoodMineLevelData(nextLevel); }
    else { cur = getMeatFarmLevelData(level); nxt = getMeatFarmLevelData(nextLevel); }
    const color = buildingKey === "goldMine" ? "#facc15" : buildingKey === "woodMine" ? "#4ade80" : "#f97316";
    return [
      { icon: "⚡", label: "إنتاج/ساعة", current: cur.production.toLocaleString(), next: nxt.production.toLocaleString(), color },
      { icon: "🗄️", label: "سعة التخزين", current: cur.storage.toLocaleString(), next: nxt.storage.toLocaleString(), color: "#38bdf8" },
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
    ];
  }

  if (isArmy) {
    let cur, nxt;
    if (buildingKey === "attackTower") { cur = getAttackArmyBuildingLevel(level); nxt = getAttackArmyBuildingLevel(nextLevel); }
    else if (buildingKey === "defenseTower") { cur = getHealthArmyBuildingLevel(level); nxt = getHealthArmyBuildingLevel(nextLevel); }
    else { cur = getDragonArmyBuildingLevel(level); nxt = getDragonArmyBuildingLevel(nextLevel); }
    return [
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
      { icon: "🏠", label: "السعة", current: cur.capacity.toLocaleString(), next: nxt.capacity.toLocaleString(), color: "#38bdf8" },
      { icon: "🎯", label: "أقصى تدريب", current: cur.train.toLocaleString(), next: nxt.train.toLocaleString(), color: "#22c55e" },
    ];
  }

  if (buildingKey === "school") {
    const cur = getSchoolLevelData(level); const nxt = getSchoolLevelData(nextLevel);
    return [
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
      { icon: "🎓", label: "سعة التعليم", current: cur.capacity.toLocaleString(), next: nxt.capacity.toLocaleString(), color: "#38bdf8" },
    ];
  }

  if (buildingKey === "market") {
    const cur = getMarketLevelData(level); const nxt = getMarketLevelData(nextLevel);
    return [
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
      { icon: "🛒", label: "مرات الشراء", current: cur.purchases.toLocaleString(), next: nxt.purchases.toLocaleString(), color: "#facc15" },
      { icon: "🏪", label: "الفتحات", current: cur.slots.toLocaleString(), next: nxt.slots.toLocaleString(), color: "#22c55e" },
    ];
  }

  if (buildingKey === "heroesHall") {
    const cur = getHeroesHallLevelData(level); const nxt = getHeroesHallLevelData(nextLevel);
    return [
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
      { icon: "👑", label: "فتحات الأبطال", current: cur.heroSlots.toLocaleString(), next: nxt.heroSlots.toLocaleString(), color: "#facc15" },
    ];
  }

  if (buildingKey === "hospital") {
    const cur = getHospitalLevelData(level); const nxt = getHospitalLevelData(nextLevel);
    return [
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
      { icon: "🏥", label: "السعة", current: cur.capacity.toLocaleString(), next: nxt.capacity.toLocaleString(), color: "#38bdf8" },
      { icon: "🛡️", label: "تقليل خسائر دفاع", current: cur.defLossReduction + "%", next: nxt.defLossReduction + "%", color: "#22c55e" },
      { icon: "⚔️", label: "تقليل خسائر هجوم", current: cur.atkLossReduction + "%", next: nxt.atkLossReduction + "%", color: "#f97316" },
    ];
  }

  if (buildingKey === "booster") {
    const cur = getBoosterLevelData(level); const nxt = getBoosterLevelData(nextLevel);
    return [
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
      { icon: "⛏️", label: "تسريع المناجم", current: cur.mineBoost + "x", next: nxt.mineBoost + "x", color: "#facc15" },
      { icon: "👷", label: "تسريع العمال", current: cur.workerBoost + "x", next: nxt.workerBoost + "x", color: "#38bdf8" },
      { icon: "🎯", label: "تسريع التدريب", current: cur.trainBoost + "x", next: nxt.trainBoost + "x", color: "#22c55e" },
    ];
  }

  if (buildingKey === "prison") {
    const cur = getPrisonLevelData(level); const nxt = getPrisonLevelData(nextLevel);
    return [
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
      { icon: "🔒", label: "السعة", current: cur.capacity.toLocaleString(), next: nxt.capacity.toLocaleString(), color: "#38bdf8" },
    ];
  }

  if (buildingKey === "hunterCamp") {
    const cur = getHunterCampLevelData(level); const nxt = getHunterCampLevelData(nextLevel);
    return [
      { icon: "⚔️", label: "القوة", current: cur.power.toLocaleString(), next: nxt.power.toLocaleString(), color: "#a78bfa" },
      { icon: "🏕️", label: "السعة", current: cur.capacity.toLocaleString(), next: nxt.capacity.toLocaleString(), color: "#38bdf8" },
      { icon: "🎯", label: "أقصى تدريب", current: cur.train.toLocaleString(), next: nxt.train.toLocaleString(), color: "#22c55e" },
    ];
  }

  return [
    { icon: "⚔️", label: "القوة", current: ((level) * 25).toLocaleString(), next: ((nextLevel) * 25).toLocaleString(), color: "#a78bfa" },
  ];
}


function getGenericBuildingLevelData(buildingKey, level) {
  const cfg = GENERIC_BUILDING_CONFIG[buildingKey];
  if (!cfg) return null;
  const factor = Math.pow(cfg.costFactor, level - 1);
  const timeFactor = Math.pow(cfg.timeFactor, level - 1);
  return {
    level,
    power: level * 25,
    gold: Math.round(cfg.baseGold * factor),
    wood: Math.round(cfg.baseWood * factor),
    food: Math.round(cfg.baseFood * factor),
    time: Math.round(cfg.baseTime * timeFactor),
    req: { castle: level }
  };
}
function openBuildingInfoModal(buildingKey) {
  const key = buildingKey || currentBuildingKey;
  if (!key) return;

  const isMine = ["goldMine", "woodMine", "meatFarm"].includes(key);
  const isArmyBuilding = ["attackTower", "defenseTower", "dragonTower"].includes(key);
  const isGeneric = ["school", "market", "heroesHall", "hospital", "booster", "hunterCamp", "prison"].includes(key);
  const isCastle = key === "castle";

  if (!isMine && !isArmyBuilding && !isGeneric && !isCastle) return;

  const currentLevel = isCastle ? castleLevel : (buildingLevels[key] || 1);
  const color =
    key === "goldMine" ? "#facc15" :
    key === "woodMine" ? "#4ade80" :
    key === "meatFarm" ? "#f97316" :
    key === "castle"   ? "#facc15" : "#ef4444";

  const buildingName = getBuildingNameByKey(key);

  if (isCastle) {
    const old = document.getElementById("castle-info-modal");
    if (old) old.remove();

    const nextLevel = Math.min(castleLevel + 1, typeof castleMaxLevel === "number" ? castleMaxLevel : 50);
    const nextGold = getCastleGoldCost(castleLevel);
    const nextWood = getCastleWoodCost(castleLevel);
    const nextFood = getCastleFoodCost(castleLevel);
    const nextTime = getCastleUpgradeTime(castleLevel);
    const hasEnough =
      (resources?.gold || 0) >= nextGold &&
      (resources?.wood || 0) >= nextWood &&
      (resources?.food || 0) >= nextFood;

    const allBuildingKeys = Object.keys(BUILDINGS_CONFIG || {}).filter((k) => k !== "castle");
    const upgradableNow = allBuildingKeys.filter((bKey) => {
      const lvl = buildingLevels[bKey] || 1;
      if (lvl >= 50) return false;
      const up = buildingUpgrades[bKey];
      if (up && up.inProgress) return false;
      const reqs = getUpgradeRequirements(bKey, lvl + 1);
      if (!reqs) return true;
      return Object.entries(reqs).every(([rk, needLv]) => {
        const cur = rk === "castle" ? castleLevel : (buildingLevels[rk] || 0);
        return cur >= needLv;
      });
    }).slice(0, 8);

    const busyEntries = Object.entries(buildingUpgrades || {}).filter(([, up]) => up && up.inProgress);
    const busyBuilders = busyEntries.length;
    const availableBuilders = Math.max(0, (maxBuilders || 1) - busyBuilders);

    const workersHtml = busyEntries.length
      ? busyEntries.map(([bKey, up], idx) => {
          const remaining = Math.max(0, Math.ceil(((up.finishAt || 0) - Date.now()) / 1000));
          return `
            <div style="padding:9px 11px;border-radius:12px;background:linear-gradient(180deg,rgba(15,23,42,0.78),rgba(9,14,28,0.82));border:1px solid rgba(148,163,184,0.26);">
              <div style="font-size:12px;color:#e5e7eb;font-weight:700;">👷 عامل ${idx + 1} - ${getBuildingNameByKey(bKey)}</div>
              <div style="font-size:11px;color:#93c5fd;margin-top:3px;">⏱ ${formatDuration(remaining)}</div>
            </div>
          `;
        }).join("")
      : `<div style="padding:9px 11px;border-radius:12px;background:linear-gradient(180deg,rgba(15,23,42,0.78),rgba(9,14,28,0.82));border:1px solid rgba(34,197,94,0.35);font-size:12px;color:#86efac;">✅ لا يوجد عمال مشغولين الآن</div>`;

    const upgradableHtml = upgradableNow.length
      ? upgradableNow.map((bKey) => `
          <div style="width:72px;flex:0 0 auto;">
            <div style="width:72px;height:72px;border-radius:14px;overflow:hidden;border:1px solid rgba(148,163,184,0.3);background:linear-gradient(180deg,rgba(15,23,42,0.8),rgba(9,14,28,0.84));box-shadow:0 6px 16px rgba(0,0,0,0.35);">
              <img src="${getBuildingImageByKey(bKey)}" style="width:100%;height:100%;object-fit:contain;display:block;padding:4px;">
            </div>
            <div style="font-size:9px;line-height:1.2;color:#d1d5db;text-align:center;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${getBuildingNameByKey(bKey)}
            </div>
            <div style="font-size:9px;color:#93c5fd;text-align:center;">Lv.${buildingLevels[bKey] || 1}</div>
          </div>
        `).join("")
      : `<div style="font-size:12px;color:#9ca3af;">لا يوجد مبانٍ قابلة للترقية حالياً</div>`;

    const modal = document.createElement("div");
    modal.id = "castle-info-modal";
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.84);backdrop-filter:blur(2px);z-index:99999;display:flex;align-items:center;justify-content:center;";
    modal.innerHTML = `
      <div style="background:radial-gradient(130% 120% at 0% 0%,#12213a 0%,#0b1220 45%,#090f1b 100%);border:1px solid rgba(250,204,21,0.55);border-radius:18px;width:calc(100% - 20px);max-width:440px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 14px 44px rgba(0,0,0,0.78);">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:13px 16px;border-bottom:1px solid rgba(148,163,184,0.22);background:linear-gradient(135deg,rgba(250,204,21,0.15),rgba(15,23,42,0.2));">
          <span style="font-weight:900;font-size:16px;color:#facc15;letter-spacing:0.2px;">ⓘ ${buildingName} - Info</span>
          <button onclick="document.getElementById('castle-info-modal')?.remove()" style="width:32px;height:32px;border-radius:10px;border:1px solid rgba(148,163,184,0.25);background:rgba(15,23,42,0.72);color:#e5e7eb;font-size:18px;cursor:pointer;">✕</button>
        </div>
        <div style="padding:10px;overflow-y:auto;overflow-x:hidden;display:grid;gap:8px;max-height:calc(88vh - 64px);">
          <div style="display:flex;gap:10px;height:156px;border-radius:14px;overflow:hidden;border:1px solid rgba(148,163,184,0.28);background:rgba(2,6,23,0.88);position:relative;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.02);">
            <video src="smoke.mp4" autoplay loop muted playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.36;pointer-events:none;"></video>
            <img src="${getBuildingImageByKey("castle")}" style="width:46%;height:100%;object-fit:contain;object-position:bottom;z-index:1;filter:drop-shadow(0 0 8px rgba(250,204,21,0.25));">
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px;padding-right:10px;z-index:1;">
              <div style="padding:7px 10px;border-radius:10px;background:rgba(15,23,42,0.72);border:1px solid rgba(148,163,184,0.28);font-size:12px;color:#e5e7eb;">🏰 Lv.${castleLevel} → Lv.${nextLevel}</div>
              <div style="padding:7px 10px;border-radius:10px;background:rgba(15,23,42,0.72);border:1px solid rgba(167,139,250,0.35);font-size:12px;color:#c4b5fd;">⚔️ قوة: ${getCastlePowerForLevel(castleLevel).toLocaleString()}</div>
              <div style="padding:7px 10px;border-radius:10px;background:rgba(15,23,42,0.72);border:1px solid rgba(56,189,248,0.35);font-size:12px;color:#7dd3fc;">🗄️ سعة: ${getCastleStorageCapacity(castleLevel).toLocaleString()}</div>
            </div>
          </div>

          <div style="padding:10px;border-radius:13px;background:linear-gradient(180deg,rgba(15,23,42,0.76),rgba(9,14,28,0.82));border:1px solid rgba(148,163,184,0.24);">
            <div style="font-size:12px;color:#facc15;font-weight:800;margin-bottom:7px;">تكلفة الترقية القادمة</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:10px;color:#e5e7eb;overflow:hidden;">
              <span style="white-space:nowrap;"><img src="gold.png" style="width:13px;height:13px;vertical-align:middle;"> ${nextGold.toLocaleString()}</span>
              <span style="white-space:nowrap;"><img src="wood.png" style="width:13px;height:13px;vertical-align:middle;"> ${nextWood.toLocaleString()}</span>
              <span style="white-space:nowrap;"><img src="food.png" style="width:13px;height:13px;vertical-align:middle;"> ${nextFood.toLocaleString()}</span>
              <span style="color:#f97316;white-space:nowrap;">⏱ ${formatDuration(nextTime)}</span>
              <span style="color:${hasEnough ? "#22c55e" : "#ef4444"};white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;">${hasEnough ? "✅ الموارد كافية" : "❌ الموارد غير كافية"}</span>
            </div>
          </div>

          <div style="padding:10px;border-radius:13px;background:linear-gradient(180deg,rgba(15,23,42,0.76),rgba(9,14,28,0.82));border:1px solid rgba(148,163,184,0.24);">
            <div style="font-size:12px;color:#facc15;font-weight:800;margin-bottom:8px;">مواردك الحالية</div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">
              <div style="display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:11px;background:rgba(15,23,42,0.72);border:1px solid rgba(250,204,21,0.28);min-width:0;">
                <img src="gold.png" style="width:20px;height:20px;object-fit:contain;">
                <div style="font-size:11px;color:#fef3c7;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;">${(resources?.gold || 0).toLocaleString()}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:11px;background:rgba(15,23,42,0.72);border:1px solid rgba(74,222,128,0.28);min-width:0;">
                <img src="wood.png" style="width:20px;height:20px;object-fit:contain;">
                <div style="font-size:11px;color:#bbf7d0;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;">${(resources?.wood || 0).toLocaleString()}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:11px;background:rgba(15,23,42,0.72);border:1px solid rgba(249,115,22,0.28);min-width:0;">
                <img src="food.png" style="width:20px;height:20px;object-fit:contain;">
                <div style="font-size:11px;color:#fed7aa;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;">${(resources?.food || 0).toLocaleString()}</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:11px;background:rgba(15,23,42,0.72);border:1px solid rgba(96,165,250,0.28);min-width:0;">
                <img src="gem.png" style="width:20px;height:20px;object-fit:contain;">
                <div style="font-size:11px;color:#bfdbfe;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;">${(resources?.gem || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div style="padding:10px;border-radius:13px;background:linear-gradient(180deg,rgba(15,23,42,0.76),rgba(9,14,28,0.82));border:1px solid rgba(148,163,184,0.24);">
            <div style="font-size:12px;color:#facc15;font-weight:800;margin-bottom:7px;">المباني القابلة للترقية الآن</div>
            <div style="overflow-x:auto;overflow-y:hidden;padding:2px 0 8px;scrollbar-width:thin;">
              <div style="display:flex;gap:8px;min-width:max-content;">${upgradableHtml}</div>
            </div>
          </div>

          <div style="padding:11px;border-radius:13px;background:linear-gradient(180deg,rgba(15,23,42,0.76),rgba(9,14,28,0.82));border:1px solid rgba(148,163,184,0.24);">
            <div style="font-size:12px;color:#facc15;font-weight:800;margin-bottom:7px;">العمال</div>
            <div style="font-size:11px;color:#d1d5db;margin-bottom:7px;overflow:hidden;text-overflow:ellipsis;">المتاح: <span style="color:#22c55e;font-weight:700;">${availableBuilders}</span> / ${maxBuilders || 1}</div>
            <div style="display:grid;gap:6px;">${workersHtml}</div>
          </div>
        </div>
      </div>
    `;
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
    return;
  }

  let headers = "";
  let rows = "";

  // مباني الجيش
  if (isArmyBuilding) {
    const buildingData =
      key === "attackTower"  ? ATTACK_ARMY_BUILDING_LEVELS :
      key === "defenseTower" ? HEALTH_ARMY_BUILDING_LEVELS :
                               DRAGON_ARMY_BUILDING_LEVELS;

    buildingData.forEach((cfg) => {
      if (!cfg) return;
      const isCurrentLevel = cfg.level === currentLevel;
      const costStr = `
        <img src="gold.png" style="width:12px;height:12px;vertical-align:middle;"> ${cfg.gold  >= 1000000 ? (cfg.gold /1000000).toFixed(1) + "M" : cfg.gold  >= 1000 ? (cfg.gold /1000).toFixed(0) + "K" : cfg.gold}
        <img src="wood.png" style="width:12px;height:12px;vertical-align:middle;"> ${cfg.wood  >= 1000000 ? (cfg.wood /1000000).toFixed(1) + "M" : cfg.wood  >= 1000 ? (cfg.wood /1000).toFixed(0) + "K" : cfg.wood}
        <img src="food.png" style="width:12px;height:12px;vertical-align:middle;"> ${cfg.food  >= 1000000 ? (cfg.food /1000000).toFixed(1) + "M" : cfg.food  >= 1000 ? (cfg.food /1000).toFixed(0) + "K" : cfg.food}
      `;
      const reqStr = Object.entries(cfg.req || {})
        .map(([k, v]) => `${getBuildingNameByKey(k)} ${v}`)
        .join(" + ");

      rows += `
        <tr style="${isCurrentLevel ? "background:rgba(239,68,68,0.15);" : "border-bottom:1px solid rgba(55,65,81,0.5);"}">
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:${isCurrentLevel ? "#ef4444" : "#e5e7eb"};font-weight:${isCurrentLevel ? "bold" : "normal"};">${isCurrentLevel ? "▶ " : ""}${cfg.level}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#38bdf8;">${Number(cfg.capacity || 0).toLocaleString()}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#a78bfa;">${Number(cfg.power   || 0).toLocaleString()}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#22c55e;">${Number(cfg.train   || 0).toLocaleString()}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#e5e7eb;font-size:11px;">${costStr}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#f97316;">${formatDuration(cfg.time || 0)}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#e5e7eb;font-size:11px;">${reqStr}</td>
        </tr>`;
    });

  // المناجم
  } else if (isMine) {
    headers = `
      <tr style="color:#e5e7eb;">
        <th style="padding:8px;text-align:center;border:1px solid #374151;">Lv</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">إنتاج/ساعة</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">تخزين</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">قوة</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">تكلفة الترقية</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">الوقت</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">متطلبات</th>
      </tr>`;

    const mineData =
      key === "goldMine" ? GOLD_MINE_LEVELS :
      key === "woodMine" ? WOOD_MINE_LEVELS : MEAT_FARM_LEVELS;

    mineData.forEach((cfg) => {
      if (!cfg) return;
      const isCurrentLevel = cfg.level === currentLevel;
      const costStr =
        cfg.level < 50
          ? `
        <img src="gold.png" style="width:12px;height:12px;vertical-align:middle;"> ${cfg.gold >= 1000000 ? (cfg.gold /1000000).toFixed(1) + "M" : cfg.gold >= 1000 ? (cfg.gold /1000).toFixed(0) + "K" : cfg.gold}
        <img src="wood.png" style="width:12px;height:12px;vertical-align:middle;"> ${cfg.wood >= 1000000 ? (cfg.wood /1000000).toFixed(1) + "M" : cfg.wood >= 1000 ? (cfg.wood /1000).toFixed(0) + "K" : cfg.wood}
        <img src="food.png" style="width:12px;height:12px;vertical-align:middle;"> ${cfg.food >= 1000000 ? (cfg.food /1000000).toFixed(1) + "M" : cfg.food >= 1000 ? (cfg.food /1000).toFixed(0) + "K" : cfg.food}
      `
          : "MAX";

      const reqStr = Object.entries(cfg.req || {})
        .map(([k, v]) => `${getBuildingNameByKey(k)} ${v}`)
        .join(" + ");

      rows += `
        <tr style="${isCurrentLevel ? "background:rgba(250,204,21,0.15);" : "border-bottom:1px solid rgba(55,65,81,0.5);"}">
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:${isCurrentLevel ? "#facc15" : "#e5e7eb"};font-weight:${isCurrentLevel ? "bold" : "normal"};">${isCurrentLevel ? "▶ " : ""}${cfg.level}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:${color};">${Number(cfg.production || 0).toLocaleString()}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#38bdf8;">${Number(cfg.storage    || 0).toLocaleString()}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#a78bfa;">${Number(cfg.power      || 0).toLocaleString()}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#e5e7eb;font-size:11px;">${costStr}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#f97316;">${formatDuration(cfg.time || 0)}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#e5e7eb;font-size:11px;">${reqStr}</td>
        </tr>`;
    });

  // باقي المباني (generic)
  } else if (isGeneric) {
    const levelDataFn = {
      school:     getSchoolLevelData,
      market:     getMarketLevelData,
      heroesHall: getHeroesHallLevelData,
      hospital:   getHospitalLevelData,
      booster:    getBoosterLevelData,
      prison:     getPrisonLevelData,
      hunterCamp: getHunterCampLevelData,
    }[key];

    if (!levelDataFn) return;

    const extraHeaders = {
      school:     `<th style="padding:8px;text-align:center;border:1px solid #374151;">سعة التعليم</th>`,
      market:     `<th style="padding:8px;text-align:center;border:1px solid #374151;">فتحات</th><th style="padding:8px;text-align:center;border:1px solid #374151;">مشتريات</th>`,
      heroesHall: `<th style="padding:8px;text-align:center;border:1px solid #374151;">فتحات أبطال</th>`,
      hospital:   `<th style="padding:8px;text-align:center;border:1px solid #374151;">سعة</th><th style="padding:8px;text-align:center;border:1px solid #374151;">تقليل هجوم%</th><th style="padding:8px;text-align:center;border:1px solid #374151;">تقليل دفاع%</th>`,
      booster:    `<th style="padding:8px;text-align:center;border:1px solid #374151;">مناجم</th><th style="padding:8px;text-align:center;border:1px solid #374151;">عمال</th><th style="padding:8px;text-align:center;border:1px solid #374151;">تدريب</th>`,
      prison:     `<th style="padding:8px;text-align:center;border:1px solid #374151;">سعة</th>`,
      hunterCamp: `<th style="padding:8px;text-align:center;border:1px solid #374151;">سعة</th><th style="padding:8px;text-align:center;border:1px solid #374151;">تدريب</th>`,
    }[key] || "";

    headers = `
      <tr style="color:#e5e7eb;">
        <th style="padding:8px;text-align:center;border:1px solid #374151;">Lv</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">القوة</th>
        ${extraHeaders}
        <th style="padding:8px;text-align:center;border:1px solid #374151;">تكلفة</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">وقت</th>
        <th style="padding:8px;text-align:center;border:1px solid #374151;">متطلبات</th>
      </tr>`;

    for (let lvl = 1; lvl <= 50; lvl++) {
      const cfg = levelDataFn(lvl);
      if (!cfg) continue;

      const isCurrentLevel = lvl === currentLevel;
      const gold = cfg.gold || 0;
      const wood = cfg.wood || 0;
      const food = cfg.food || 0;

      const costStr =
        lvl < 50
          ? `
        ${gold > 0 ? `<img src="gold.png" style="width:12px;height:12px;vertical-align:middle;"> ${formatShortNumber(gold)}` : ""}
        ${wood > 0 ? `<img src="wood.png" style="width:12px;height:12px;vertical-align:middle;"> ${formatShortNumber(wood)}` : ""}
        ${food > 0 ? `<img src="food.png" style="width:12px;height:12px;vertical-align:middle;"> ${formatShortNumber(food)}` : ""}
      `
          : "MAX";

      const reqStr = Object.entries(cfg.req || {})
        .map(([k, v]) => `${getBuildingNameByKey(k)} ${v}`)
        .join(" + ");

      const extraCells = {
        school:
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#38bdf8;">${cfg.capacity}</td>`,
        market:
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#38bdf8;">${cfg.slots}</td>` +
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#22c55e;">${cfg.purchases}</td>`,
        heroesHall:
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#facc15;">${cfg.heroSlots}</td>`,
        hospital:
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#38bdf8;">${Number(cfg.capacity || 0).toLocaleString()}</td>` +
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#f97316;">${cfg.atkLossReduction}%</td>` +
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#22c55e;">${cfg.defLossReduction}%</td>`,
        booster:
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#facc15;">${cfg.mineBoost}x</td>` +
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#38bdf8;">${cfg.workerBoost}x</td>` +
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#22c55e;">${cfg.trainBoost}x</td>`,
        prison:
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#38bdf8;">${Number(cfg.capacity || 0).toLocaleString()}</td>`,
        hunterCamp:
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#38bdf8;">${Number(cfg.capacity || 0).toLocaleString()}</td>` +
          `<td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#22c55e;">${cfg.train}</td>`,
      }[key] || "";

      rows += `
        <tr style="${isCurrentLevel ? "background:rgba(250,204,21,0.15);" : "border-bottom:1px solid rgba(55,65,81,0.5);"}">
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:${isCurrentLevel ? "#facc15" : "#e5e7eb"};font-weight:${isCurrentLevel ? "bold" : "normal"};">${isCurrentLevel ? "▶ " : ""}${lvl}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#a78bfa;">${Number(cfg.power || 0).toLocaleString()}</td>
          ${extraCells}
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#e5e7eb;font-size:11px;">${costStr}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#f97316;">${formatDuration(cfg.time || 0)}</td>
          <td style="padding:5px 8px;text-align:center;border:1px solid #374151;color:#e5e7eb;font-size:11px;">${reqStr}</td>
        </tr>`;
    }
  }

  const modal = document.createElement("div");
  modal.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;";
  modal.innerHTML = `
    <div style="background:#111827;border:2px solid ${color};border-radius:16px;width:calc(100% - 20px);max-height:85vh;margin:auto;
      display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.8);">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #374151;flex-shrink:0;">
        <span style="font-weight:bold;font-size:16px;color:${color};">ⓘ ${buildingName} - المستويات</span>
        <button onclick="this.closest('[style*=inset]').remove()" style="background:none;border:none;color:#e5e7eb;font-size:20px;cursor:pointer;">✕</button>
      </div>
      <div style="overflow-y:auto;flex:1;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead style="position:sticky;top:0;background:#1f2937;">${headers}</thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="padding:8px 16px;border-top:1px solid #374151;font-size:11px;color:#e5e7eb;text-align:center;flex-shrink:0;">
        المستوى الحالي: <span style="color:${color};font-weight:bold;">${currentLevel}</span>
      </div>
    </div>
  `;
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  document.body.appendChild(modal);
}

function enterCity() {
  cityScreen.style.display = "block";

  let cityMapContainer = document.getElementById("city-map-container");
  if (!cityMapContainer) {
    cityMapContainer = document.createElement("div");
    cityMapContainer.id = "city-map-container";
    cityMapContainer.style.position = "absolute";
    cityMapContainer.style.top = "0px";
    cityMapContainer.style.left = "0";
    cityMapContainer.style.right = "0";
    cityMapContainer.style.bottom = "0px";
    cityMapContainer.style.height = "auto";
    cityMapContainer.style.overflowY = "auto";
    cityMapContainer.style.overflowX = "hidden";
    cityScreen.appendChild(cityMapContainer);
  }

  if (!document.getElementById("city-bg")) {
    const cityMap = document.createElement("img");
    cityMap.id = "city-bg";
    cityMap.src = "city-bg.png";
    cityMap.style.position = "absolute";
    cityMap.style.top = "0px";
    cityMap.style.left = "0";
    cityMap.style.width = "100%";
    cityMap.style.height = "auto";
    cityMap.style.objectFit = "fill";
    cityMap.style.minHeight = "1280px";
    cityMap.style.objectPosition = "top";
    cityMap.style.display = "block";
    cityMap.style.zIndex = "0";
    cityMapContainer.prepend(cityMap);
  }

// القلعة في النص
const castleWrapper = document.createElement("div");
castleWrapper.id = "castle-building";
castleWrapper.style.position = "absolute";
castleWrapper.style.width = "210px";
castleWrapper.style.left = "50%";
castleWrapper.style.top = "48%"; // كان 50%، عدلناه ليناسب التصميم الجديد
castleWrapper.style.transform = "translate(-50%, -50%)";
castleWrapper.style.zIndex = 80;            // كان 100

const castle = document.createElement("img");
castle.src = currentHero + "_castle.png";
castle.crossOrigin = "anonymous";
castle.style.width = "100%";
castle.style.height = "100%";
castle.style.objectFit = "contain";
castle.style.pointerEvents = "none";
castleWrapper.appendChild(castle);

const castleStatusBox = document.createElement("div");
castleStatusBox.id = "castle-status-box";
castleStatusBox.style.position = "absolute";
castleStatusBox.style.bottom = "0%";
castleStatusBox.style.left = "50%";
castleStatusBox.style.transform = "translateX(-50%)";
castleStatusBox.style.background = "rgba(0,0,0,0.7)";
castleStatusBox.style.padding = "3px 8px";
castleStatusBox.style.borderRadius = "8px";
castleStatusBox.style.fontSize = "11px";
castleStatusBox.style.minWidth = "80px";
castleStatusBox.style.textAlign = "center";
castleStatusBox.style.pointerEvents = "none";
castleStatusBox.style.zIndex = 81;          // أضفناها
castleStatusBox.textContent = "Castle Lv." + castleLevel;
castleWrapper.appendChild(castleStatusBox);

createUnifiedBar(castleWrapper, "castle-uni-bar", "castle-uni-fill", "castle-uni-text");

castleWrapper.addEventListener("click", function(e) {
  e.stopPropagation();
  const img = castleWrapper.querySelector("img");
  if (img && !isClickOnSprite(img, e.clientX, e.clientY)) return;
  showBuildingPopup("castle");
});

cityMapContainer.appendChild(castleWrapper);

  const buildingPositions = [
    { left: "25%", top: "80%" },// الذهب
    { left: "19%", top: "105%" },// الخشب
    { left: "63%", top: "27%" },// المدرسه
    { left: "80%", top: "62%" },// ألهجوم
    { left: "24%", top: "32%" },// ألصحه
    { left: "30%", top: "81%" },// للحم
    { left: "84%", top: "34%" },// الابطال
    { left: "70%", top: "122%" },// السوق
    { left: "84%", top: "105%" },// أضفناها
    { left: "26%", top: "122%" },// أضفناها
    { left: "51%", top: "97%" },// أضفناها
    { left: "20%", top: "60%" },// أضفناها
    { left: "75%", top: "80%" },// أضفناها
  ];

  buildingPositions.forEach((pos, index) => {
    const id = "building-" + (index + 1);
    let b = document.getElementById(id);
    if (!b) {
      b = document.createElement("div");
      b.id = id;
      b.className = "city-building";
      cityMapContainer.appendChild(b);
    }

    b.style.position = "absolute";
    b.style.width = "60px";
    b.style.height = "60px";
    b.style.left = pos.left;
    b.style.top = pos.top;
    b.style.transform = "translate(-50%, -50%)";
    b.style.borderRadius = "12px";
    b.style.background = "rgba(0,0,0,0.6)";
    b.style.border = "2px solid #facc15";
    b.style.display = "flex";
    b.style.alignItems = "center";
    b.style.justifyContent = "center";
    b.style.color = "#fff";
    b.style.fontWeight = "bold";
    b.style.fontSize = "16px";
    b.style.zIndex = 90;
    b.textContent = index + 1;

    let upgradeBar = b.querySelector(".building-upgrade-bar");
    if (!upgradeBar) {
      console.log("Creating upgrade bar for", id);
      upgradeBar = document.createElement("div");
      upgradeBar.className = "building-upgrade-bar";
      upgradeBar.style.position = "absolute";
      upgradeBar.style.left = "10%";
      upgradeBar.style.right = "10%";
      upgradeBar.style.bottom = "4px";
      upgradeBar.style.height = "4px";
      upgradeBar.style.background = "rgba(15,23,42,0.8)";
      upgradeBar.style.borderRadius = "999px";
      upgradeBar.style.overflow = "hidden";
      upgradeBar.style.display = "none";

      const fill = document.createElement("div");
      fill.className = "building-upgrade-bar-fill";
      fill.style.width = "0%";
      fill.style.height = "100%";
      fill.style.background = "#0ea5e9";

      upgradeBar.appendChild(fill);
      b.appendChild(upgradeBar);
    } else {
      console.log("Upgrade bar already exists for", id);
    }
  });

  // المناجم
  setupMineBuilding("goldMine",  buildingPositions[0]);
  setupMineBuilding("woodMine",  buildingPositions[1]);
  setupMineBuilding("meatFarm",  buildingPositions[5]);

  // باقي المباني
  setupBuilding("school",       buildingPositions[2]);
  setupBuilding("attackTower",  buildingPositions[3]);
  setupBuilding("defenseTower", buildingPositions[4]);
  setupBuilding("heroesHall",   buildingPositions[6]);
  setupBuilding("market",       buildingPositions[7]);
  setupBuilding("booster",      buildingPositions[8]);
  setupBuilding("hospital",     buildingPositions[9]);
  setupBuilding("dragonTower",  buildingPositions[10]);
  setupBuilding("hunterCamp",   buildingPositions[11]);
  setupBuilding("prison",       buildingPositions[12]);

  addTopBar();
  addBottomBar();

  const rightArrowMenu = document.querySelector(".right-arrow-menu");
  if (rightArrowMenu) {
    rightArrowMenu.style.display = "block";
  }

  const tutorialDone = localStorage.getItem(TUTORIAL_DONE_KEY) === "1";
  if (!tutorialDone) {
    showTutorialStep();
  }

  // الكليك على الأرض يغلق البانل
  cityMapContainer.addEventListener("click", function(e) {
    if (e.target === cityMapContainer || e.target.id === "city-bg") {
      document.querySelectorAll(".building-panel").forEach(p => {
        p.style.display = "none";
      });
      document.body.style.overflow = "auto";
      showSummonButton(true);
    }
  });

} // نهاية function enterCity
function showBuildingPopup(buildingKey) {
  console.log("showBuildingPopup CALLED with", buildingKey);
  currentBuildingKey = buildingKey;

  showBuildingActions(buildingKey);

  if (buildingKey === "castle") {
    const oldHighlight = document.querySelector(".building-highlight");
    if (oldHighlight) oldHighlight.classList.remove("building-highlight");
    const castleEl = document.getElementById("castle-building");
    if (castleEl) {
      const castleImg = castleEl.querySelector("img");
      if (castleImg) castleImg.classList.add("building-highlight");
      else castleEl.classList.add("building-highlight");

      const old = document.getElementById("building-popup");
      if (old) old.parentNode.removeChild(old);

      const popup = document.createElement("div");
      popup.id = "building-popup";
      popup.style.cssText = "position:absolute;left:50%;top:0;transform:translate(-50%,-110%);background:rgba(15,23,42,0.98);border:2px solid #0ea5e9;border-radius:16px;padding:8px 12px;width:fit-content;white-space:nowrap;color:#e5e7eb;font-size:12px;z-index:9999;box-shadow:0 14px 30px rgba(0,0,0,0.85);";

      popup.innerHTML = `
        <div style="display:flex;align-items:center;gap:6px;">
          <img src="${getBuildingImageByKey('castle')}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid rgba(148,163,184,0.8);">
          <div>
            <div style="font-weight:bold;font-size:12px;">القلعة</div>
            <div style="font-size:11px;color:#22c55e;margin-top:2px;">LVL ${castleLevel}</div>
          </div>
        </div>
      `;

      const cityMapContainer = document.getElementById("city-map-container");
      if (cityMapContainer) {
        const rect = castleEl.getBoundingClientRect();
        const containerRect = cityMapContainer.getBoundingClientRect();
        popup.style.position = "absolute";
        popup.style.left = (rect.left - containerRect.left + rect.width / 2) + "px";
        popup.style.top = (rect.top - containerRect.top + cityMapContainer.scrollTop) + "px";
        popup.style.transform = "translate(-50%, -110%)";
        cityMapContainer.appendChild(popup);
      } else {
        castleEl.appendChild(popup);
      }
    }
    return;
  }

  const old = document.getElementById("building-popup");
  if (old) old.parentNode.removeChild(old);

  let buildingId = null;
if (BUILDINGS_CONFIG[buildingKey]) {
  buildingId = BUILDINGS_CONFIG[buildingKey].buildingId;
} else if (MINES_CONFIG[buildingKey]) {
  buildingId = MINES_CONFIG[buildingKey].buildingId;
}
if (!buildingId) return;

  const el = document.getElementById(buildingId);
  if (!el) return;

  const oldHighlight = document.querySelector(".building-highlight");
  if (oldHighlight) oldHighlight.classList.remove("building-highlight");

  const imgEl = el.querySelector("img");
  if (imgEl) {
    imgEl.classList.add("building-highlight");
  } else {
    el.classList.add("building-highlight");
  }

  const popup = document.createElement("div");
  popup.id = "building-popup";
  popup.style.zIndex = "9999";
  popup.style.background = "rgba(15,23,42,0.98)";
  popup.style.border = "2px solid #0ea5e9";
  popup.style.borderRadius = "16px";
  popup.style.padding = "8px 12px";
  popup.style.width = "fit-content";
  popup.style.whiteSpace = "nowrap";
  popup.style.color = "#e5e7eb";
  popup.style.fontSize = "12px";
  popup.style.boxShadow = "0 14px 30px rgba(0,0,0,0.85)";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "6px";

  const img = document.createElement("img");
img.style.width = "40px";
img.style.height = "40px";
  img.style.borderRadius = "8px";
  img.style.objectFit = "cover";
  img.style.border = "1px solid rgba(148,163,184,0.8)";
  img.src = getBuildingImageByKey(buildingKey);

  const titleBox = document.createElement("div");
  titleBox.style.display = "flex";
  titleBox.style.flexDirection = "column";

  const nameEl = document.createElement("div");
  nameEl.style.fontWeight = "bold";
  nameEl.style.fontSize = "12px";
  nameEl.style.letterSpacing = "0.5px";
  nameEl.textContent = getBuildingNameByKey(buildingKey);

  const levelEl = document.createElement("div");
  levelEl.style.fontSize = "11px";
  levelEl.style.color = "#22c55e";
  levelEl.style.marginTop = "2px";
  const lvl = buildingLevels[buildingKey] || 1;
  levelEl.textContent = "LVL " + lvl;

  titleBox.appendChild(nameEl);
  titleBox.appendChild(levelEl);
  header.appendChild(img);
  header.appendChild(titleBox);
  popup.appendChild(header);

  const cityMapContainer = document.getElementById("city-map-container");
  if (cityMapContainer) {
    const rect = el.getBoundingClientRect();
    const containerRect = cityMapContainer.getBoundingClientRect();
    popup.style.position = "absolute";
    popup.style.left = (rect.left - containerRect.left + rect.width / 2) + "px";
    popup.style.top = (rect.top - containerRect.top + cityMapContainer.scrollTop) + "px";
    popup.style.transform = "translate(-50%, -110%)";
    cityMapContainer.appendChild(popup);
  } else {
    popup.style.position = "absolute";
    popup.style.left = "50%";
    popup.style.top = "0";
    popup.style.transform = "translate(-50%, -110%)";
    el.appendChild(popup);
  }
}
function openBuildingPanel(buildingKey) {
  const oldPopup = document.getElementById("building-popup");
  if (oldPopup && oldPopup.parentNode) oldPopup.parentNode.removeChild(oldPopup);
  showSummonButton(false);

if (buildingKey === "castle") {
  createBuildingPanel("castle");
  document.getElementById("castle-panel").style.display = "block";
  return;
}

if (buildingKey === "heroesHall") {
  createBuildingPanel("heroesHall");
  refreshBuildingPanel("heroesHall");
  const panel = document.getElementById("heroesHall-panel");
  if (panel) panel.style.display = "block";
  return;
}


 
  console.log("Open building panel for:", buildingKey);
  currentBuildingKey = buildingKey;

 const cfg = BUILDINGS_CONFIG[buildingKey] || MINES_CONFIG[buildingKey];
if (!cfg) return;

  if (buildingPanelTitle) buildingPanelTitle.textContent = cfg.name;
  if (buildingPanelImage) {
    buildingPanelImage.src = getBuildingImageByKey(buildingKey);
    buildingPanelImage.alt = cfg.name;
  }
  if (buildingPanelDesc) buildingPanelDesc.textContent = "";
  if (buildingPanelExtra) updateBuildingInfoTab(buildingKey);

  fillGenericUpgradeTab(buildingKey);
  updateBuildingUpgradePanelForTimer(buildingKey);

  const cancelBtn = document.getElementById("building-panel-cancel-upgrade-btn");
  if (cancelBtn) {
    const up = buildingUpgrades[buildingKey];
    if (up && up.inProgress) {
      cancelBtn.style.display = "block";
      cancelBtn.onclick = function () {
        cancelBuildingUpgrade(buildingKey);
        cancelBtn.style.display = "none";
        updateBuildingUpgradePanelForTimer(buildingKey);
      };
    } else {
      cancelBtn.style.display = "none";
      cancelBtn.onclick = null;
    }
  }

  const panelInner = document.getElementById("building-panel-inner");
  if (panelInner) {
    panelInner.style.position = "fixed";
    panelInner.style.top = "80px";
    panelInner.style.left = "10px";
    panelInner.style.right = "10px";
    panelInner.style.bottom = "150px";
    panelInner.style.width = "auto";
    panelInner.style.maxWidth = "100%";
    panelInner.style.transform = "none";
    panelInner.style.overflowY = "auto";
  }

  createBuildingPanel(buildingKey);
document.getElementById(buildingKey + "-panel").style.display = "block";
}
function openMiningBuildingPanel(buildingKey) {
  console.log("openMiningBuildingPanel CALLED with", buildingKey);

  currentMiningBuildingKey = buildingKey;
  const config = MININGBUILDINGSCONFIG[buildingKey];
  const info   = MININGBUILDINGSINFO[buildingKey];

  if (!info) {
    console.warn("missing info for", buildingKey, info);
    return;
  }
  const currentLevel = buildingLevels[buildingKey] || 1;
  let currentProd = 0;

  if (buildingKey === "goldMine" || buildingKey === "woodMine" || buildingKey === "meatFarm") {
    currentProd = calcMiningProductionPerHour(buildingKey, currentLevel);
  } else {
    currentProd = 0;
  }

  buildingPanelTitle.textContent = info.name;
  buildingPanelImage.src = info.image;
  buildingPanelImage.alt = info.name;
  buildingPanelDesc.textContent = info.desc;

  window.currentMiningBuildingKey = buildingKey;
  updateGoldMineUI();

  fillGenericUpgradeTab(buildingKey);
  switchBuildingPanelTab("info");
  buildingPanel.classList.remove("hidden"); // نرجعها زي ما كانت
}
function updateGoldMineUI() {
  const goldStored = Math.floor(miningStored.goldMine || 0);
  const goldLevel = buildingLevels.goldMine || 1;
  const goldPerHour = calcMiningProductionPerHour("goldMine", goldLevel);
  const goldCap = getCastleStorageCapacity(goldLevel) * GOLD_MINE_CAPACITY_FACTOR;

  const woodStored = Math.floor(miningStored.woodMine || 0);
  const woodLevel = buildingLevels.woodMine || 1;
  const woodPerHour = calcMiningProductionPerHour("woodMine", woodLevel);
  const woodCap = getCastleStorageCapacity(woodLevel) * GOLD_MINE_CAPACITY_FACTOR;

  const meatStored = Math.floor(miningStored.meatFarm || 0);
  const meatLevel = buildingLevels.meatFarm || 1;
  const meatPerHour = calcMiningProductionPerHour("meatFarm", meatLevel);
  const meatCap = getCastleStorageCapacity(meatLevel) * GOLD_MINE_CAPACITY_FACTOR;

  // إيموجي منجم الذهب
  const goldHint = document.getElementById("gold-mine-collect-hint");
  if (goldHint) {
    const now = Date.now();
    const sinceLastCollect = now - (window.lastGoldMineCollectAt || 0);
    goldHint.style.display = goldStored > 0 ? "block" : "none";
  }

  // إيموجي منجم الخشب
  const woodHint = document.getElementById("wood-mine-collect-hint");
  if (woodHint) {
    woodHint.style.display = woodStored > 0 ? "block" : "none";
  }

  // إيموجي مزرعة اللحم
  const meatHint = document.getElementById("meat-farm-collect-hint");
  if (meatHint) {
    meatHint.style.display = meatStored > 0 ? "block" : "none";
  }

  if (!buildingPanelExtra) return;

  const currentMine = window.currentMiningBuildingKey || "goldMine";
  let stored, level, perHour, cap, color, resourceName;

  if (currentMine === "woodMine") {
    stored = woodStored; level = woodLevel; perHour = woodPerHour;
    cap = woodCap; color = "#4ade80"; resourceName = "خشب";
  } else if (currentMine === "meatFarm") {
    stored = meatStored; level = meatLevel; perHour = meatPerHour;
    cap = meatCap; color = "#f97316"; resourceName = "لحم";
  } else {
    stored = goldStored; level = goldLevel; perHour = goldPerHour;
    cap = goldCap; color = "#facc15"; resourceName = "ذهب";
  }

  const percent = cap > 0 ? Math.max(0, Math.min(100, (stored / cap) * 100)) : 0;

  buildingPanelExtra.innerHTML = `
    <div style="margin-bottom:6px;">المستوى الحالي: <b>${level}</b></div>
    <div style="margin-bottom:6px;">الإنتاج في الساعة: <span style="color:${color};">${perHour.toLocaleString()}</span> ${resourceName}</div>
    <div style="margin-bottom:6px;">السعة القصوى: <span style="color:#38bdf8;">${cap.toLocaleString()}</span> ${resourceName}</div>
    <div style="margin-bottom:4px;">المخزون الحالي: <span style="color:#22c55e;">${stored.toLocaleString()}</span> ${resourceName}</div>
    <div style="margin-top:4px;">
      <div style="height:10px; border-radius:999px; background:rgba(15,23,42,0.8); overflow:hidden;">
        <div style="height:100%; width:${percent}%; background:${color}; transition:width 0.3s;"></div>
      </div>
      <div style="font-size:11px; color:#9ca3af; margin-top:3px;">${percent.toFixed(0)}% ممتلئ</div>
    </div>
  `;
}
function createUnifiedBar(buildingEl, barId, fillId, textId) {
  let uniBar = document.getElementById(barId);
  if (uniBar) return;

  uniBar = document.createElement("div");
  uniBar.id = barId;
  uniBar.style.cssText = `
    position:absolute;
    bottom:-34px;
    left:50%;
    transform:translateX(-50%);
    width:110px;
    height:16px;
    background:rgba(15,23,42,0.85);
    border-radius:999px;
    overflow:hidden;
    display:none;
    border:1px solid rgba(148,163,184,0.2);
  `;

  const fill = document.createElement("div");
  fill.id = fillId;
  fill.style.cssText = `
    width:0%;
    height:100%;
    border-radius:999px;
    transition:width 1s linear;
    background:linear-gradient(90deg,#facc15,#f97316);
  `;
  uniBar.appendChild(fill);

  const text = document.createElement("div");
  text.id = textId;
  text.style.cssText = `
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:9px;
    font-weight:bold;
    color:white;
    text-shadow:0 1px 2px rgba(0,0,0,0.8);
    white-space:nowrap;
    pointer-events:none;
  `;
  text.textContent = "";
  uniBar.appendChild(text);

  buildingEl.appendChild(uniBar);
}

function updateUniBar(barId, fillId, textId, percent, timeText, icon, color) {
  const bar  = document.getElementById(barId);
  const fill = document.getElementById(fillId);
  const text = document.getElementById(textId);
  if (!bar || !fill || !text) return;
  bar.style.display     = "block";
  fill.style.background = color;
  fill.style.width      = percent + "%";
  text.textContent      = icon + " " + timeText;
}

function hideUniBar(barId, fillId, textId) {
  const bar  = document.getElementById(barId);
  const fill = document.getElementById(fillId);
  const text = document.getElementById(textId);
  if (bar)  bar.style.display = "none";
  if (fill) fill.style.width  = "0%";
  if (text) text.textContent  = "";
}

function highlightBuildingInCity(buildingKey) {
 let buildingId = null;
// ابحث في BUILDINGS_CONFIG الجديد
if (BUILDINGS_CONFIG[buildingKey]) {
  buildingId = BUILDINGS_CONFIG[buildingKey].buildingId;
}
// لو مش لاقيه، ابحث في MINES_CONFIG
if (!buildingId && MINES_CONFIG[buildingKey]) {
  buildingId = MINES_CONFIG[buildingKey].buildingId;
}
if (!buildingId) return;
  if (!buildingId) {
    console.warn("No building id found for key:", buildingKey);
    return;
  }

  const el = document.getElementById(buildingId);
  if (!el) {
    console.warn("Building element not found:", buildingId);
    return;
  }

  const oldPointer = el.querySelector(".building-pointer");
  if (oldPointer) {
    oldPointer.remove();
  }

  el.style.position = el.style.position || "absolute";

  const pointer = document.createElement("div");
  pointer.className = "building-pointer";
  pointer.style.position = "absolute";
  pointer.style.left = "50%";
  pointer.style.top = "50%";
  pointer.style.transform = "translate(-50%, -50%) scale(1)";
  pointer.style.width = "40px";
  pointer.style.height = "40px";
  pointer.style.borderRadius = "50%";
  pointer.style.background = "rgba(0,0,0,0.6)";
  pointer.style.display = "flex";
  pointer.style.alignItems = "center";
  pointer.style.justifyContent = "center";
  pointer.style.zIndex = "999";
  pointer.style.cursor = "pointer";

  const icon = document.createElement("div");
  icon.textContent = "👆";
  icon.style.fontSize = "22px";
  pointer.appendChild(icon);

  el.appendChild(pointer);

  let elapsed = 0;
  const duration = 5000;
  const interval = 200;

  const pulse = setInterval(() => {
    elapsed += interval;
    const scale = pointer.style.transform.includes("scale(1.1)")
      ? "translate(-50%, -50%) scale(1)"
      : "translate(-50%, -50%) scale(1.1)";
    pointer.style.transform = scale;

    if (elapsed >= duration) {
      clearInterval(pulse);
      if (pointer && pointer.parentNode) {
        pointer.remove();
      }
    }
  }, interval);

  pointer.onclick = () => {
    clearInterval(pulse);
    if (pointer && pointer.parentNode) {
      pointer.remove();
    }
  };
}
function lockCityScroll() {
  const cs = document.querySelector("#city-screen");
  if (cs) {
    cs.style.overflowY = "hidden";
    cs.style.overflowX = "hidden";
  }
}

function unlockCityScroll() {
  const cs = document.querySelector("#city-screen");
  if (cs) {
    cs.style.overflowY = "auto";
    cs.style.overflowX = "hidden";
  }
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
}
function openCastlePanel() {
  const oldPopup = document.getElementById("building-popup");
  if (oldPopup && oldPopup.parentNode) oldPopup.parentNode.removeChild(oldPopup);
  showSummonButton(false);
  createBuildingPanel("castle");
  const panel = document.getElementById("castle-panel");
  if (panel) panel.style.display = "block";
}

function switchCastleTab(tab) {
  const infoTab    = document.getElementById("castle-tab-info");
  const upgradeTab = document.getElementById("castle-tab-upgrade");
  const infoBtn    = document.getElementById("castle-tab-info-btn");
  const upgradeBtn = document.getElementById("castle-tab-upgrade-btn");

  // بعض التدفقات تنده قبل ما عناصر تبويبات القلعة تتبني بالكامل
  if (!infoTab || !upgradeTab || !infoBtn || !upgradeBtn) {
    return;
  }

  if (tab === "info") {
    infoTab.style.display       = "block";
    upgradeTab.style.display    = "none";
    infoBtn.style.color         = "#facc15";
    infoBtn.style.fontWeight    = "bold";
    upgradeBtn.style.color      = "#9ca3af";
    upgradeBtn.style.fontWeight = "normal";
    updateCastleInfoTab();
  } else {
    infoTab.style.display       = "none";
    upgradeTab.style.display    = "block";
    upgradeBtn.style.color      = "#facc15";
    upgradeBtn.style.fontWeight = "bold";
    infoBtn.style.color         = "#9ca3af";
    infoBtn.style.fontWeight    = "normal";
    updateCastleUpgradeTab();
  }
}


function closeCastlePanel() {
  const panel = document.getElementById("castle-panel");
  if (!panel) return;
  panel.classList.remove("castle-visible");
  panel.classList.add("castle-hidden");
  showSummonButton(true);
}
// تحديث تبويب "معلومات"
function updateCastleInfoTab() {
  const levelEl = document.getElementById("castle-info-level");
  const powerEl = document.getElementById("castle-info-power");
  const storageEl = document.getElementById("castle-info-storage");

  if (levelEl) levelEl.textContent = castleLevel.toString();
  if (powerEl) powerEl.textContent = getCastlePowerForLevel(castleLevel).toString();
  if (storageEl) storageEl.textContent = getCastleStorageCapacity(castleLevel).toString();
}
// تحديث تبويب "ترقية"
function updateCastleUpgradeTab() {
  const currentLevelEl = document.getElementById("castle-upgrade-current-level");
  const nextLevelEl = document.getElementById("castle-upgrade-next-level");
  const goldCostEl = document.getElementById("castle-upgrade-gold-cost");
  const woodCostEl = document.getElementById("castle-upgrade-wood-cost");
  const foodCostEl = document.getElementById("castle-upgrade-food-cost");
  const timeEl = document.getElementById("castle-upgrade-time");

  const currentLevel = castleLevel;
  const nextLevel = Math.min(castleLevel + 1, castleMaxLevel);

  const goldCost = getCastleGoldCost(currentLevel);
  const woodCost = getCastleWoodCost(currentLevel);
  const foodCost = getCastleFoodCost(currentLevel);
  const upgradeTimeSec = getCastleUpgradeTime(currentLevel);

  if (currentLevelEl) currentLevelEl.textContent = currentLevel.toString();
  if (nextLevelEl) nextLevelEl.textContent = nextLevel.toString();
  if (goldCostEl) goldCostEl.textContent = goldCost.toString();
  if (woodCostEl) woodCostEl.textContent = woodCost.toString();
  if (foodCostEl) foodCostEl.textContent = foodCost.toString();
  if (timeEl) timeEl.textContent = formatDuration(upgradeTimeSec);
  // ----- عرض المباني المطلوبة للترقية -----
  const reqContainer = document.getElementById("castle-upgrade-required-buildings");
  if (!reqContainer) return;

  reqContainer.innerHTML = "";

  const requirements = getCastleRequirementsForLevel(nextLevel);
  if (!requirements) {
    return; // مفيش متطلبات خاصة للمستوى ده
  }

  const title = document.createElement("div");
  title.textContent = "لترقية القلعة يجب تطوير هذه المباني:";
  title.style.fontSize = "12px";
  title.style.margin = "6px 0 4px 0";
  reqContainer.appendChild(title);

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.flexWrap = "wrap";
  row.style.gap = "6px";
  reqContainer.appendChild(row);

  for (const [key, neededLevel] of Object.entries(requirements)) {
    const currentLvl = buildingLevels[key] || 0;
    const ok = currentLvl >= neededLevel;

    const item = document.createElement("div");
    item.style.minWidth = "90px";
    item.style.padding = "4px 6px";
    item.style.borderRadius = "8px";
    item.style.background = "rgba(15, 23, 42, 0.9)";
    item.style.fontSize = "11px";
    item.style.textAlign = "center";
item.style.cursor = "pointer";
item.onclick = () => {
  openBuildingPanel(key);
};

    const img = document.createElement("img");
    img.src = getBuildingImageByKey(key);
    img.style.width = "28px";
    img.style.height = "28px";
    img.style.objectFit = "contain";
    img.style.display = "block";
    img.style.margin = "0 auto 2px auto";

    const name = document.createElement("div");
    name.style.marginBottom = "2px";
    name.textContent = getBuildingNameByKey(key);

    const status = document.createElement("div");
    status.textContent = `المطلوب: ${neededLevel} - الحالي: ${currentLvl}`;
    status.style.color = ok ? "#22c55e" : "#ef4444";

    item.appendChild(img);
    item.appendChild(name);
    item.appendChild(status);
    row.appendChild(item);
  }
}
function startCastlePanelUpgrade() {
  if (upgradeInProgress) {
    return; // في ترقية شغالة بالفعل
  }

  if (castleLevel >= castleMaxLevel) {
    alert("وصلت لأقصى مستوى للقلعة");
    return;
  }

  const nextLevel = castleLevel + 1;
  if (!canUpgradeCastleTo(nextLevel)) {
    alert("طوّر مباني الموارد (والشروط المطلوبة) قبل ترقية القلعة.");
    return;
  }

  const level = castleLevel;
  const goldCost = getCastleGoldCost(level);
  const woodCost = getCastleWoodCost(level);
  const foodCost = getCastleFoodCost(level);
  const upgradeTimeSec = getCastleUpgradeTime(level);

  console.log("DEBUG resources:", resources);
  console.log("DEBUG cost:", { goldCost, woodCost, foodCost });

  // تأكد إن الموارد كفاية
  if (resources.gold < goldCost || resources.wood < woodCost || resources.food < foodCost) {
    alert("Not enough resources!");
    return;
  }

  // تأكد إن فيه عامل متاح
  if (busyBuilders >= maxBuilders) {
    alert("No free builders available!");
    return;
  }

  // خصم الموارد
  resources.gold -= goldCost;
  resources.wood -= woodCost;
  resources.food -= foodCost;

  // حفظ آخر تكلفة (للإرجاع عند الإلغاء)
  lastUpgradeGoldCost = goldCost;
  lastUpgradeWoodCost = woodCost;
  lastUpgradeFoodCost = foodCost;

  // تحديث شريط الموارد فوق لو عندك دالة
  if (typeof updateTopBar === "function") {
    updateTopBar();
  }

  // حجز عامل
  busyBuilders++;

  // تجهيز حالة الترقية
  upgradeInProgress = true;
  upgradeRemainingTime = upgradeTimeSec;
  upgradeFinishAt = Date.now() + upgradeTimeSec * 1000;

  // حفظ الحالة بعد خصم الموارد وبدء الترقية
  saveGameState();

  // إظهار شريط التقدم
  const progressWrapper = document.getElementById("castle-upgrade-progress-wrapper");
  const progressFill = document.getElementById("castle-upgrade-progress-fill");
  const remainingTimeEl = document.getElementById("castle-upgrade-remaining-time");

  if (progressWrapper) progressWrapper.style.display = "block";

  const totalTime = upgradeTimeSec;
  if (progressFill) progressFill.style.width = "100%";
  if (remainingTimeEl) remainingTimeEl.textContent = formatDuration(upgradeRemainingTime);

  // نحدّث تبويب الترقية بالبداية
  updateCastleUpgradeTab();

  // مؤقت الترقية
  if (upgradeInterval) clearInterval(upgradeInterval);

  upgradeInterval = setInterval(() => {
    upgradeRemainingTime -= 1;
    if (upgradeRemainingTime < 0) upgradeRemainingTime = 0;

    if (remainingTimeEl) remainingTimeEl.textContent = formatDuration(upgradeRemainingTime);

    const ratio = totalTime > 0 ? upgradeRemainingTime / totalTime : 0;
    if (progressFill) {
      const percent = Math.max(0, Math.min(100, ratio * 100));
      progressFill.style.width = percent + "%";
    }

    if (upgradeRemainingTime <= 0) {
      clearInterval(upgradeInterval);
      upgradeInterval = null;
      finishCastlePanelUpgrade();
    }
  }, 1000);
}
function cancelCastlePanelUpgrade() {
  if (!upgradeInProgress) return;

  if (!window.castleCancelPopup || !window.castleCancelConfirmBtn || !window.castleCancelDismissBtn) {
    return;
  }

  // إظهار الـ popup
  window.castleCancelPopup.style.display = "flex";

  // زر "إلغاء" في popup
  window.castleCancelDismissBtn.onclick = () => {
    window.castleCancelPopup.style.display = "none";
  };

  // زر "موافق" في popup
  window.castleCancelConfirmBtn.onclick = () => {
    window.castleCancelPopup.style.display = "none";

    // استرجاع 50% من الموارد المنفقة
    resources.gold += Math.floor(lastUpgradeGoldCost * 0.5);
    resources.wood += Math.floor(lastUpgradeWoodCost * 0.5);
    resources.food += Math.floor(lastUpgradeFoodCost * 0.5);

    if (upgradeInterval) {
      clearInterval(upgradeInterval);
      upgradeInterval = null;
    }

    upgradeInProgress = false;

    const progressWrapper = document.getElementById("castle-upgrade-progress-wrapper");
    const progressFill = document.getElementById("castle-upgrade-progress-fill");
    const remainingTimeEl = document.getElementById("castle-upgrade-remaining-time");

    if (progressWrapper) progressWrapper.style.display = "none";
    if (progressFill) progressFill.style.width = "0%";
    if (remainingTimeEl) remainingTimeEl.textContent = formatDuration(0);

    updateCastleInfoTab();
    updateCastleUpgradeTab();
    saveGameState();
  };
}

function finishCastlePanelUpgrade() {
  upgradeInProgress = false;
  currentUpgradeType = null;

  if (castleLevel < castleMaxLevel) {
    castleLevel += 1;

    // مهمة طوّر أي مبنى (تحسب القلعة كمان)
    addProgressToTasksByType("upgrade_building", 1);
  }

  busyBuilders--;
  if (busyBuilders < 0) busyBuilders = 0;

  recalculatePower();
  updateCastleInfoTab();
  updateCastleUpgradeTab();

  const progressWrapper = document.getElementById("castle-upgrade-progress-wrapper");
  const progressFill = document.getElementById("castle-upgrade-progress-fill");
  const remainingTimeEl = document.getElementById("castle-upgrade-remaining-time");

  if (progressWrapper) progressWrapper.style.display = "none";
  if (progressFill) progressFill.style.width = "0";
  if (remainingTimeEl) remainingTimeEl.textContent = formatDuration(0);

  saveGameState();
}
function openTestPanel() {
  const p = document.createElement("div");
  p.className = "test-panel";

  const h = document.createElement("div");
  h.className = "test-panel-header";
  h.textContent = "Test Panel";
  p.appendChild(h);

  const b = document.createElement("div");
  b.className = "test-panel-body";
  // نضيف محتوى طويل عشان يسكروّل
  for (let i = 1; i <= 40; i++) {
    const row = document.createElement("div");
    row.textContent = "Row " + i;
    row.style.padding = "8px 0";
    b.appendChild(row);
  }
  p.appendChild(b);

  document.body.appendChild(p);
}