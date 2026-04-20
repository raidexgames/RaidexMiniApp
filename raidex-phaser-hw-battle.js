/**
 * Raidex — Hero Wars–style auto battle (Phaser 3)
 * - 3v3 lanes, same-lane targeting (logic unchanged)
 * - Embedded in index: transparent canvas over colosseum; standalone: full decor
 */
(function () {
  "use strict";

  const HW = Object.freeze({
    IDLE: "idle",
    WALK: "walk",
    ATTACK: "attack",
    SKILL: "skill",
    HURT: "hurt",
    DEATH: "death",
  });

  /** Pixels moved during one full walk cycle (must match leg cycle; tune visually) */
  const DEFAULT_PIXELS_PER_WALK_CYCLE = 54;
  const HIT_STOP_MS = 70;
  const OPENING_WALK_MS = 780;
  const OPENING_IDLE_PAUSE_MS = 500;
  const OPENING_MELEE_STEP_PX = 16;
  const OPENING_MELEE_STEP_MS = 170;
  const MIN_MELEE_EDGE_GAP = 6;
  const MELEE_ENTER_EDGE_GAP = 10;
  const MELEE_EXIT_EDGE_GAP = 28;
  const GARRUK_EDGE_OVERLAP_PAD = 0;
  const GARRUK_DEBUG_EDGE = false;
  const GARRUK_LOG_INTERVAL_MS = 120;
  const WALK_ANIM_BASE_SPEED = 1.0;
  const TARGET_HERO_DISPLAY_HEIGHT = 132;
  const ARENA_LAYOUT_DEBUG = false;
  /** خطوط خفيفة بين كل بطل والخصم في نفس الممر (للتنسيق البصري؛ اضبطها من مشهد HWBattleScene لو حبيت) */
  const SHOW_LANE_PAIR_LINES = false;
  /** ظلال الأبطال الواقفين على أرض المعركة (Ellipse تحت كل بطل) */
  const SHOW_STANDING_HERO_SHADOW = false;
  const MOVE_EASE_DISTANCE_PX = 170;
  const MOVE_MIN_EASE_RATIO = 0.22;
  const MOVE_SNAP_PX = 0.35;
  const ATTACK_PREP_MS = 70;
  const ATTACK_LUNGE_MS = 92;
  const ATTACK_RETURN_MS = 126;
  const ATTACK_INTERVAL_MS = 540;
  const SKILL_INTERVAL_MS = 620;
  const ATTACK_HIT_DELAY_MS = 190;
  const ATTACK_RECOVER_MS = 180;
  const RETURN_SLOT_EPSILON = 0.45;
  const WALK_ANIM_TIME_SCALE = 1.03;
  const IDLE_ANIM_TIME_SCALE = 1.0;
  const ATTACK_ANIM_TIME_SCALE = 1.0;
  const HP_SMOOTH_LERP = 0.22;
  const ENERGY_SMOOTH_LERP = 0.2;

  function getMoveSpeedForRole(role, melee) {
    const base = 102;
    if (role === "Tank") return base - 6;
    if (role === "Support") return base - 3;
    if (role === "Fighter" || role === "Breaker") return base + 2;
    return melee ? base + 1 : base;
  }

  /** مرجع المقياس — نفس `transform: scale(...)` للمجسم الأمامي في واجهة الأرينا (index) */
  const UNIFORM_HERO_SCALE = 0.6;

  /**
   * منظور أرضي تدريجي (V خفيف مثل Hero Wars):
   * — فريق يسار: من الجناح للـVS ينزل الـY (أمام أوضح عند الوسط).
   * — فريق يمين: معكوس (الأمام عند الـVS أنزل، الجناح أعلى).
   * المواضع نسبية لـ h/w عشان الموبايل يبان التدرّج زي المرجع.
   */
  const LANE_VISUAL = [
    { scaleMul: 1 },
    { scaleMul: 1 },
    { scaleMul: 1 },
  ];
  /** خط الأرضية ≈ نسبة من ارتفاع الكانفس */
  const FORMATION_GROUND_Y_NORM = 0.565;
  /** فرق رأسي بين كل ممر كنسبة من الارتفاع (~4.8% ≈ 20px على 412px) */
  const FORMATION_Y_STAGGER_NORM = 0.030;
  const LANE_GROUND_Y_OFFSET = [.2, .4, .6];
  const BACK_LANE_EXTRA_PUSH_RATIO = 0;
  const BACK_LANE_SCALE_BOOST = 1;
  const MELEE_MAX_ADVANCE_PX = 180;
  /** فريق اللاعب فقط: إزاحة SYLVAN قليلًا لليسار (سالب = نحو حافة الشاشة). */
  const SYLVAN_PLAYER_X_NUDGE_PX = -200;

  const TEAM_SIZE = 3;
  const CENTER_GAP_LEFT_BOUND_NORM = 0.48;
  const CENTER_GAP_RIGHT_BOUND_NORM = 0.52;

  const HW_ARENA_BG_KEY = "hw_arena_perspective";
  const HW_ARENA_BG_URL = "arena-bg-perspective.png";

  /**
   * مواضع X نسبية (0–1): lane0 جناح بعيد عن VS، lane2 قدام عند الـVS.
   * انتشار أوضح على X يقوّي خط الـV مع التدرّج الرأسي.
   */
  const ARENA_SLOT_NORM_PLAYER = [
    { x: 0.1, y: 0.56 },
    { x: 0.225, y: 0.56 },
    { x: 0.355, y: 0.56 },
  ];
  const ARENA_SLOT_NORM_ENEMY = [
    { x: 0.635, y: 0.56 },
    { x: 0.76, y: 0.56 },
    { x: 0.895, y: 0.56 },
  ];

  function computeFormationSlots(w, h) {

    const slots = [];
    for (let lane = 0; lane < TEAM_SIZE; lane++) {
      const p = ARENA_SLOT_NORM_PLAYER[lane];
      const e = ARENA_SLOT_NORM_ENEMY[lane];
      const lv = LANE_VISUAL[lane];
      const off = LANE_GROUND_Y_OFFSET[lane] || 0;
      const baseY = h * FORMATION_GROUND_Y_NORM;
      const st = h * FORMATION_Y_STAGGER_NORM;
      const yPlayer = baseY + (lane - 1) * st + off;
      const yEnemy = baseY + (1 - lane) * st + off;
      const isBackLane = lane === 2;
      const scaleMul = lv.scaleMul * (isBackLane ? BACK_LANE_SCALE_BOOST : 1);
      const leftNormX = p.x;
      const rightNormX = e.x;
      const leftX = leftNormX * w;
      const rightX = rightNormX * w;
      slots.push({
        leftX,
        rightX,
        y: yPlayer,
        yEnemy: yEnemy,
        groundY: yPlayer,
        scalePlayer: UNIFORM_HERO_SCALE * scaleMul,
        scaleEnemy: UNIFORM_HERO_SCALE * scaleMul,
      });
    }
    return slots;
  }

  /** ترتيب الممر = ترتيب مصفوفة الفريق كما في الكروت (1→lane0 …)، بدون إعادة ترتيب حسب الدور */
  function orderTeamIdsIntoLanes(teamIds) {
    const padded = padTeamIds(teamIds);
    return padded.map((heroId, lane) => ({ heroId, lane }));
  }

  /**
   * شيتات جاهزة للمعركة (نفس مسارات الأرينا في index).
   * بطل بلا شيت: يُستنتج من HEROES_CONFIG.role → حزمة بديلة.
   */
  const PHASER_SPRITE_PACKS = {
    GARRUK: {
      melee: true,
      grid: { cols: 7, rows: 7 },
      atkGrid: { cols: 8, rows: 8 },
      urls: {
        idle: "images/garruk/garruk-idle.png",
        walk: "images/garruk/garruk-walk.png",
        attack: "images/garruk/garruk-attack.png",
      },
    },
    PYRAX: {
      melee: true,
      grid: { cols: 5, rows: 5 },
      urls: {
        idle: "images/pyrax/pyrax-idle.png",
        walk: "images/pyrax/pyrax-walk.png",
        attack: "images/pyrax/pyrax-attack.png",
      },
    },
    MORVEX: {
      melee: true,
      grid: { cols: 8, rows: 8 },
      urls: {
        idle: "images/morvex/morvex-idle.png",
        walk: "images/morvex/morvex-walk.png",
        attack: "images/morvex/morvex-walk.png",
      },
    },
    KAYAN: {
      melee: false,
      grid: { cols: 8, rows: 8 },
      atkGrid: { cols: 7, rows: 7 },
      urls: {
        idle: "images/kayan/kayan-idle.png",
        walk: "images/kayan/kayan-walk.png",
        attack: "images/kayan/kayan-iso_custom_يقذف_السهام_علي_العدو_right.png",
      },
    },
    SYLVAN: {
      melee: false,
      grid: { cols: 7, rows: 7 },
      urls: {
        idle: "images/sylvan/sylvan-idle.png",
        walk: "images/sylvan/sylvan-idle.png",
        attack: "images/sylvan/sylvan-idle.png",
      },
    },
  };

  /** تعويض بصري رأسي لكل باك (فقط للـ grounding بسبب اختلاف padding في الشيتات) */
  const PACK_GROUND_PUSH_RATIO = {
    SYLVAN: 0.04,
    GARRUK: 0.36,
    /** مع تكبير PYRAX: تثبيت «الوقفة» على الأرض */
    PYRAX: 0.12,
    MORVEX: 0.2,
    KAYAN: 0.24,
  };

  /**
   * رفع بصري للأبطال الواقفين (Phaser فقط): قيمة سالبة = لفوق على الشاشة.
   * يطبق على كل من يستخدم نفس الـ pack (لاعب + عدو).
   */
  const PACK_STANDING_LIFT_PX = {
    GARRUK: -96,
    PYRAX: -46,
    SYLVAN: 46,
  };

  /** تعويض حجم بصري لكل باك لتوحيد حجم الأبطال داخل المعركة (الواقفين في Phaser فقط، مش الكروت) */
  const PACK_VISUAL_SCALE_RATIO = {
    SYLVAN: 1.0,
    KAYAN: 1.0,
    MORVEX: 1.0,
    GARRUK: 1.0,
    /** تقريب ارتفاع ظهور PYRAX لـ GARRUK — ظبط الرقم لو لسه فرق بسيط */
    PYRAX: 1.38,
  };

  function getPackKeyForHeroId(heroId) {
    const id = String(heroId || "GARRUK")
      .toUpperCase()
      .trim();
    if (PHASER_SPRITE_PACKS[id]) return id;
    const cfg = typeof window !== "undefined" && window.HEROES_CONFIG && window.HEROES_CONFIG[id];
    if (cfg && cfg.role) {
      const role = cfg.role;
      if (role === "Tank" || role === "Fighter") return "PYRAX";
      if (role === "Support" || role === "Control") return "MORVEX";
      return "KAYAN";
    }
    return "GARRUK";
  }

  function getRoleForHeroId(heroId) {
    const id = String(heroId || "")
      .toUpperCase()
      .trim();
    const cfg = typeof window !== "undefined" && window.HEROES_CONFIG && window.HEROES_CONFIG[id];
    return (cfg && cfg.role) || "";
  }

  function readTeamIdsForPhaser() {
    const raw = typeof window !== "undefined" ? window.__raidexHWBattleTeamIds : null;
    if (Array.isArray(raw) && raw.length) {
      return raw
        .map((id) => String(id || "")
          .toUpperCase()
          .trim())
        .filter(Boolean)
        .slice(0, TEAM_SIZE);
    }
    return ["GARRUK", "PYRAX", "MORVEX"];
  }

  /** عدو فقط: تبديل موضع SYLVAN و PYRAX في المصفوفة (نفس الفريق غير ذلك). */
  function swapSylvanPyraxInEnemyTeamIds(ids) {
    if (!Array.isArray(ids) || ids.length < 2) return ids;
    const out = ids.slice();
    const norm = (id) => String(id || "").toUpperCase().trim();
    const iS = out.findIndex((id) => norm(id) === "SYLVAN");
    const iP = out.findIndex((id) => norm(id) === "PYRAX");
    if (iS < 0 || iP < 0 || iS === iP) return out;
    const t = out[iS];
    out[iS] = out[iP];
    out[iP] = t;
    return out;
  }

  function readEnemyTeamIdsForPhaser() {
    const raw = typeof window !== "undefined" ? window.__raidexHWBattleEnemyTeamIds : null;
    let ids;
    if (Array.isArray(raw) && raw.length) {
      ids = raw
        .map((id) => String(id || "")
          .toUpperCase()
          .trim())
        .filter(Boolean)
        .slice(0, TEAM_SIZE);
    } else {
      ids = readTeamIdsForPhaser();
    }
    return swapSylvanPyraxInEnemyTeamIds(ids);
  }

  function padTeamIds(ids) {
    const base = ids.length ? ids : ["GARRUK", "PYRAX", "MORVEX"];
    const out = base.slice(0, TEAM_SIZE);
    while (out.length < TEAM_SIZE) {
      out.push(out[0] || "GARRUK");
    }
    return out;
  }

  function buildBattleRoster(teamIds) {
    const ordered = orderTeamIdsIntoLanes(teamIds);
    return ordered.map(({ heroId, lane }) => {
      const packKey = getPackKeyForHeroId(heroId);
      const pack = PHASER_SPRITE_PACKS[packKey];
      const atkGrid = pack.atkGrid || pack.grid;
      const role = getRoleForHeroId(heroId);
      return {
        heroId,
        role,
        packKey,
        lane,
        melee: pack.melee,
        grid: pack.grid,
        atkGrid,
        urls: pack.urls,
      };
    });
  }

  function addSpriteSheetFromImageKey(scene, sheetKey, loadedImageKey, cols, rows) {
    const tex = scene.textures.get(loadedImageKey);
    const src = tex.getSourceImage();
    const fw = Math.max(1, Math.floor(src.width / cols));
    const fh = Math.max(1, Math.floor(src.height / rows));
    const endFrame = cols * rows - 1;
    scene.textures.addSpriteSheet(sheetKey, src, {
      frameWidth: fw,
      frameHeight: fh,
      endFrame: endFrame,
    });
    return { fw, fh, endFrame, cols, rows };
  }

  function ensureAnimLoop(scene, key, sheetKey, endFrame, fps) {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 0, end: endFrame }),
      frameRate: fps,
      repeat: -1,
    });
  }

  function ensureAnimOnce(scene, key, sheetKey, endFrame, fps) {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 0, end: endFrame }),
      frameRate: fps,
      repeat: 0,
    });
  }

  function isSylvanPackOrId(heroId, packKey) {
    const id = String(heroId || "").toUpperCase().trim();
    const pk = String(packKey || "").toUpperCase().trim();
    return id === "SYLVAN" || pk === "SYLVAN";
  }

  class HWHero {
    constructor(scene, cfg) {
      this.scene = scene;
      this.team = cfg.team;
      this.lane = cfg.lane;
      this._spawnOrder = cfg.spawnOrder != null ? cfg.spawnOrder : cfg.lane;
      this.roster = cfg.roster;
      this.heroId = cfg.roster.heroId || "GARRUK";
      this.packKey = cfg.roster.packKey || "GARRUK";
      this.role = cfg.roster.role || "";
      this.isSupport = this.role === "Support";
      this.isGarruk = this.heroId === "GARRUK";
      this.melee = !!cfg.roster.melee;
      this.moveSpeedPx = getMoveSpeedForRole(this.role, this.melee);
      this.animKeys = cfg.animKeys;
      this.sheetKeys = cfg.sheetKeys;
      this.animFrameHeights = cfg.animFrameHeights || {};
      this.slotScale = cfg.slotScale != null ? cfg.slotScale : UNIFORM_HERO_SCALE;
      this.visualScale = this.slotScale;
      this.packScaleAdjust = PACK_VISUAL_SCALE_RATIO[this.packKey] != null ? PACK_VISUAL_SCALE_RATIO[this.packKey] : 1;
      this.autoScaleAdjust = 1;
      this._sylvanVsEnemyDisplayMul = 1;
      this.baseScale = this.slotScale * this.packScaleAdjust * this.autoScaleAdjust;
      this._activeAnimScaleFix = 1;
      this.pixelsPerWalkCycle = cfg.pixelsPerWalkCycle != null ? cfg.pixelsPerWalkCycle : DEFAULT_PIXELS_PER_WALK_CYCLE;

      this.maxHp = cfg.maxHp || 800;
      this.hp = this.maxHp;
      this.maxEnergy = 100;
      this.energy = 0;
      this.damage = cfg.damage || 16;
      this.meleeRange = this.melee ? 68 : 210;
      this.meleeExitPad = this.melee ? 44 : 120;
      this.lungePx = 0;

      this.state = HW.IDLE;
      this._prevState = HW.IDLE;
      this._moveDir = this.team === "player" ? 1 : -1;
      this.anchorX = cfg.x;
      this.groundY = cfg.y;
      this._shadowYOff = 0;

      this.sprite = scene.add.sprite(cfg.x, cfg.y, this.sheetKeys.idle, 0);
      this._setVisualScale();
      this.sprite.setAlpha(1);
      this._refFrameHeight = Math.max(
        1,
        this.sprite.frame ? this.sprite.frame.realHeight || this.sprite.frame.cutHeight || this.sprite.frame.height : 1
      );
      // Keep identical scaling policy for all heroes.
      this.autoScaleAdjust = 1;
      this.baseScale = this.slotScale * this.packScaleAdjust * this.autoScaleAdjust;
      this._setVisualScale();
      this._recalcFootAnchor();
      this.sprite.setPosition(this.anchorX, this.anchorY);
      this._applyDepthSort();
      scene.physics.add.existing(this.sprite, false);
      this.body = this.sprite.body;
      this.body.setAllowGravity(false);
      this.body.setCollideWorldBounds(true);
      this.body.setDrag(0, 0);
      this.body.setMaxVelocity(520, 520);
      this._resizeBodyToSprite();
      this._debugGarrukMetrics("spawn");

      this.target = null;
      this.enemies = [];
      this.allies = [];
      this._battleEnded = false;
      this._atkTimer = null;
      this._atkFinishTimer = null;
      this._strikeCount = 0;
      this.combatAnchorX = this.anchorX;
      this._hurtTimer = null;
      this._lungeTween = null;
      this._frozen = false;
      this._breathPhase = 0;
      this._hitStopUntil = 0;
      this._debugLastLogAt = 0;
      this._attackPrepUntil = 0;
      this._postAttackPauseUntil = 0;
      this._nextAttackAt = 0;
      this._returningToSlot = false;
      this._relocating = false;
      this.visualWidth = 1;
      this.visualHeight = 1;
      this._debugBoundsG = this.isGarruk && GARRUK_DEBUG_EDGE ? scene.add.graphics().setDepth(10000) : null;

      const sw = Math.max(24, this.sprite.displayWidth);
      this.shadow = scene.add.ellipse(this.anchorX, this.groundY, sw * 0.52, Math.max(6, sw * 0.13), 0x000000);
      this.shadow.setAlpha(0.3);
      this.shadow.setOrigin(0.5, 0.5);
      if (!SHOW_STANDING_HERO_SHADOW) this.shadow.setVisible(false);
      // Keep visual references grouped per-hero.
      this.container = {
        sprite: this.sprite,
        shadow: this.shadow,
        bars: [],
      };

      this._buildHpBar();
      this._playIdle();
    }

    _recalcFootAnchor() {
      // Move sprite center down per-sheet so feet touch lane ground visually.
      const ratio = PACK_GROUND_PUSH_RATIO[this.packKey] != null ? PACK_GROUND_PUSH_RATIO[this.packKey] : 0.18;
      const laneExtra = this.lane === 2 ? BACK_LANE_EXTRA_PUSH_RATIO : 0;
      this.anchorY = this.groundY + this.sprite.displayHeight * (ratio + laneExtra);
      const lift = PACK_STANDING_LIFT_PX[this.packKey];
      if (lift != null && lift !== 0) this.anchorY += lift;
      this._shadowYOff = 2;
    }

    _resizeBodyToSprite() {
      const dw = this.sprite.displayWidth;
      const dh = this.sprite.displayHeight;
      const bw = Math.max(24, dw * 0.3);
      const bh = Math.max(36, dh * 0.35);
      this.body.setSize(bw, bh);
      this.body.setOffset((dw - bw) / 2, dh - bh * 0.92);
    }

    _feetY() {
      const originY = this.sprite && this.sprite.originY != null ? this.sprite.originY : 0.5;
      return this.sprite.y + this.sprite.displayHeight * (1 - originY);
    }

    _applyDepthSort() {
      // Depth should follow bottom-center (feet), not sprite center.
      // للعرض الثابت على الأرض: depth ثابت من groundY حتى لا يهتز الترتيب مع تغيّر ارتفاع الإطار.
      let ySort;
      if (this.scene && this.scene.groundHeroesIdleOnlyVisual) {
        ySort = Math.floor(this.groundY * 1.5) + this.lane * 6 + (this.team === "enemy" ? 1 : 0);
      } else {
        ySort = Math.floor(this._feetY() * 1.5);
      }
      const d = 200 + ySort + this.lane * 2;
      if (this.shadow) this.shadow.setDepth(d - 1);
      this.sprite.setDepth(d);
      const barD = d + 80;
      if (this.hpFrame) this.hpFrame.setDepth(barD);
      if (this.hpBg) this.hpBg.setDepth(barD + 1);
      if (this.hpFill) this.hpFill.setDepth(barD + 2);
      if (this.enFrame) this.enFrame.setDepth(barD + 3);
      if (this.enBg) this.enBg.setDepth(barD + 4);
      if (this.enFill) this.enFill.setDepth(barD + 5);
    }

    setFormation(x, y, slotScale) {
      let px = x;
      if (this.team === "player" && isSylvanPackOrId(this.heroId, this.packKey)) px += SYLVAN_PLAYER_X_NUDGE_PX;
      this.anchorX = px;
      this.groundY = y;
      this.combatAnchorX = px;
      if (slotScale != null) {
        this.slotScale = slotScale;
        this.visualScale = slotScale;
        this.baseScale = slotScale * this.packScaleAdjust * this.autoScaleAdjust;
      }
      this._setVisualScale();
      this._recalcFootAnchor();
      this.sprite.setPosition(this.anchorX, this.anchorY);
      this._resizeBodyToSprite();
      this._updateHpBarPos();
      this._applyDepthSort();
      this._debugGarrukMetrics("setFormation");
    }

    setFormationSmooth(x, y, slotScale) {
      const previousX = this.sprite.x;
      this.setFormation(x, y, slotScale);
      this.sprite.x = previousX;
      this._relocating = true;
    }

    setEnemies(list) {
      this.enemies = list.filter((h) => h !== this && h.team !== this.team);
    }

    setAllies(list) {
      this.allies = list.filter((h) => h !== this && h.team === this.team);
    }

    _buildHpBar() {
      const wBar = 62;
      const hHp = 5;
      const hEn = 4;
      const gap = 2;
      const yOffHp = -Math.round(this.sprite.displayHeight * 0.54);
      const yOffEn = yOffHp + hHp + gap + 2;
      const x = this.sprite.x;
      const yHp = this.sprite.y + yOffHp;
      const yEn = this.sprite.y + yOffEn;

      this.hpFrame = this.scene.add.rectangle(x, yHp, wBar + 4, hHp + 4, 0x1a1510);
      this.hpFrame.setStrokeStyle(2, 0xc9a227, 0.95);
      this.hpBg = this.scene.add.rectangle(x, yHp, wBar, hHp, 0x0f172a);
      this.hpFill = this.scene.add.rectangle(x - wBar / 2 + 1, yHp, wBar - 2, hHp - 2, 0x22c55e);
      this.hpFill.setOrigin(0, 0.5);

      this.enFrame = this.scene.add.rectangle(x, yEn, wBar + 4, hEn + 4, 0x1a1510);
      this.enFrame.setStrokeStyle(2, 0x64748b, 0.85);
      this.enBg = this.scene.add.rectangle(x, yEn, wBar, hEn, 0x0f172a);
      this.enFill = this.scene.add.rectangle(x - wBar / 2 + 1, yEn, wBar - 2, hEn - 2, 0x38bdf8);
      this.enFill.setOrigin(0, 0.5);

      this._hpW = wBar - 2;
      this._enW = wBar - 2;
      this._hpYOff = yOffHp;
      this._enYOff = yOffEn;
      this._hpRatioTarget = 1;
      this._hpRatioVisual = 1;
      this._enRatioTarget = 0;
      this._enRatioVisual = 0;
      this._refreshEnergyBar();
      this._applyDepthSort();
      this.container.bars = [this.hpFrame, this.hpBg, this.hpFill, this.enFrame, this.enBg, this.enFill];
      // Keep skill/energy bar in bottom UI only (not above heroes).
      if (this.enFrame) this.enFrame.setVisible(false);
      if (this.enBg) this.enBg.setVisible(false);
      if (this.enFill) this.enFill.setVisible(false);
      if (this.scene && this.scene.hideWorldBars) {
        if (this.hpFrame) this.hpFrame.setVisible(false);
        if (this.hpBg) this.hpBg.setVisible(false);
        if (this.hpFill) this.hpFill.setVisible(false);
      }
    }

    _refreshHpBar() {
      const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
      this._hpRatioTarget = Phaser.Math.Clamp(ratio, 0, 1);
      this.hpFill.fillColor = this._hpRatioTarget > 0.35 ? 0x22c55e : this._hpRatioTarget > 0.15 ? 0xeab308 : 0xef4444;
    }

    _refreshEnergyBar() {
      if (!this.enFill) return;
      const ratio = this.maxEnergy > 0 ? this.energy / this.maxEnergy : 0;
      this._enRatioTarget = Phaser.Math.Clamp(ratio, 0, 1);
      this.enFill.fillColor = this._enRatioTarget >= 0.99 ? 0xfacc15 : 0x38bdf8;
    }

    _tickBarsSmoothing() {
      if (this.hpFill) {
        const hpL = 1 - Math.pow(1 - HP_SMOOTH_LERP, 60 * ((this.scene.game.loop.delta || 16.67) / 1000));
        this._hpRatioVisual = Phaser.Math.Linear(this._hpRatioVisual, this._hpRatioTarget, hpL);
        this.hpFill.width = Math.max(0, this._hpW * this._hpRatioVisual);
      }
      if (this.enFill) {
        const enL = 1 - Math.pow(1 - ENERGY_SMOOTH_LERP, 60 * ((this.scene.game.loop.delta || 16.67) / 1000));
        this._enRatioVisual = Phaser.Math.Linear(this._enRatioVisual, this._enRatioTarget, enL);
        this.enFill.width = Math.max(0, this._enW * this._enRatioVisual);
      }
    }

    _updateHpBarPos() {
      const x = this.sprite.x;
      const yHp = this.sprite.y + this._hpYOff;
      const yEn = this.sprite.y + this._enYOff;
      if (this.shadow) {
        const sw = Math.max(24, this.sprite.displayWidth);
        this.shadow.setPosition(x, this.groundY + this._shadowYOff);
        this.shadow.width = sw * 0.52;
        this.shadow.height = Math.max(6, sw * 0.13);
      }
      if (this.hpFrame) this.hpFrame.setPosition(x, yHp);
      if (this.hpBg) this.hpBg.setPosition(x, yHp);
      if (this.hpFill) this.hpFill.setPosition(x - this._hpW / 2 - 1, yHp);
      if (this.enFrame) this.enFrame.setPosition(x, yEn);
      if (this.enBg) this.enBg.setPosition(x, yEn);
      if (this.enFill) this.enFill.setPosition(x - this._enW / 2 - 1, yEn);
      this._applyDepthSort();
    }

    setBarsAlpha(alpha) {
      const a = Math.max(0, Math.min(1, Number(alpha) || 0));
      if (this.hpFrame) this.hpFrame.setAlpha(a);
      if (this.hpBg) this.hpBg.setAlpha(a);
      if (this.hpFill) this.hpFill.setAlpha(a);
      if (this.enFrame) this.enFrame.setAlpha(a);
      if (this.enBg) this.enBg.setAlpha(a);
      if (this.enFill) this.enFill.setAlpha(a);
    }

    playWalkCinematic() {
      this._activeAnimScaleFix = this._getAnimScaleFix("idle");
      this.sprite.anims.play(this.animKeys.idle, true);
      this.sprite.anims.timeScale = WALK_ANIM_TIME_SCALE;
      this._setVisualScale();
    }

    playIdleCinematic() {
      this._activeAnimScaleFix = this._getAnimScaleFix("idle");
      this.sprite.anims.play(this.animKeys.idle, true);
      this.sprite.anims.timeScale = IDLE_ANIM_TIME_SCALE;
      this._setVisualScale();
    }

    lockNearestTargetByRange() {
      this.selectCombatTarget();
    }

    _stopAtkTimer() {
      if (this._atkTimer) {
        this._atkTimer.remove(false);
        this._atkTimer = null;
      }
      if (this._atkFinishTimer) {
        this._atkFinishTimer.remove(false);
        this._atkFinishTimer = null;
      }
    }

    applyHitStop(ms) {
      const dur = Math.max(0, Number(ms) || 0);
      if (!dur) return;
      this._hitStopUntil = Math.max(this._hitStopUntil || 0, this.scene.time.now + dur);
    }

    _isInHitStop() {
      return (this._hitStopUntil || 0) > this.scene.time.now;
    }

    _horizontalDistTo(other) {
      return Math.abs(this.sprite.x - other.sprite.x);
    }

    _halfWidth() {
      return Math.max(1, this.sprite.displayWidth * 0.5);
    }

    _getAnimScaleFix(kind) {
      const ref = Math.max(1, this.animFrameHeights.idle || this._refFrameHeight || 1);
      const current = Math.max(1, this.animFrameHeights[kind] || ref);
      return Phaser.Math.Clamp(ref / current, 0.75, 1.35);
    }

    _setVisualScale(multiplier) {
      const mul = multiplier == null ? 1 : multiplier;
      const vs = this._sylvanVsEnemyDisplayMul != null ? this._sylvanVsEnemyDisplayMul : 1;
      this.sprite.setScale(this.baseScale * this._activeAnimScaleFix * mul * vs);
      this.visualWidth = Math.max(1, this.sprite.displayWidth);
      this.visualHeight = Math.max(1, this.sprite.displayHeight);
    }

    _edgeDistanceTo(other) {
      if (!other || !other.sprite) return Number.POSITIVE_INFINITY;
      const centerDist = this._horizontalDistTo(other);
      return centerDist - (this._halfWidth() + Math.max(1, other.sprite.displayWidth * 0.5));
    }

    _visualHalfWidth() {
      return Math.max(1, (this.visualWidth || this.sprite.displayWidth) * 0.5);
    }

    _computeStopDistanceTo(target) {
      if (!target || !target.sprite) return Number.POSITIVE_INFINITY;
      const myHalf = this._visualHalfWidth();
      const enemyHalf = typeof target._visualHalfWidth === "function"
        ? target._visualHalfWidth()
        : Math.max(1, (target.visualWidth || target.sprite.displayWidth) * 0.5);
      return Math.max(4, myHalf + enemyHalf - GARRUK_EDGE_OVERLAP_PAD);
    }

    _aliveEnemies() {
      return this.enemies.filter((e) => e && e.sprite && e.sprite.active && e.hp > 0 && e.state !== HW.DEATH);
    }

    _nearestByDistance(list) {
      if (!list || !list.length) return null;
      let best = null;
      let bestD = Number.POSITIVE_INFINITY;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        const d = this._horizontalDistTo(e);
        if (d < bestD) {
          best = e;
          bestD = d;
        }
      }
      return best;
    }

    selectCombatTarget() {
      const alive = this._aliveEnemies();
      if (!alive.length) {
        this.target = null;
        return;
      }
      // New battle model: every hero attacks the mirrored enemy in same lane.
      const laneEnemy = alive.find((e) => e.lane === this.lane);
      if (laneEnemy) {
        this.target = laneEnemy;
        return;
      }
      // If mirrored enemy died, fall back to nearest alive enemy.
      this.target = this._nearestByDistance(alive);
    }

    selectSupportAllyTarget() {
      if (!this.isSupport) return null;
      const allies = this.allies.filter((a) => a && a.sprite && a.sprite.active && a.hp > 0 && a.state !== HW.DEATH);
      if (!allies.length) return null;
      const injured = allies.filter((a) => a.hp < a.maxHp);
      const pool = injured.length ? injured : allies;
      pool.sort((a, b) => {
        const ra = a.maxHp > 0 ? a.hp / a.maxHp : 0;
        const rb = b.maxHp > 0 ? b.hp / b.maxHp : 0;
        if (ra !== rb) return ra - rb;
        return this._horizontalDistTo(a) - this._horizontalDistTo(b);
      });
      return pool[0] || null;
    }

    _playIdle() {
      this._stopAtkTimer();
      this.state = HW.IDLE;
      this.body.setVelocity(0, 0);
      this.sprite.anims.timeScale = IDLE_ANIM_TIME_SCALE;
      this._activeAnimScaleFix = this._getAnimScaleFix("idle");
      const ik = this.animKeys.idle;
      if (this.scene && this.scene.groundHeroesIdleOnlyVisual) {
        const cur = this.sprite.anims.currentAnim;
        if (!cur || cur.key !== ik) this.sprite.anims.play(ik, true);
      } else {
        this.sprite.anims.play(ik, true);
      }
      this._setVisualScale();
    }

    _playWalk() {
      if (this.state === HW.DEATH) return;
      if (this.state === HW.WALK) return;
      this._stopAtkTimer();
      this.state = HW.WALK;
      this._activeAnimScaleFix = this._getAnimScaleFix("walk");
      this.sprite.anims.play(this.animKeys.walk, true);
      this.sprite.anims.timeScale = WALK_ANIM_BASE_SPEED;
      this._setVisualScale();
    }

    _holdAtAttackRange() {
      if (!this.target || this.target.hp <= 0 || this.target.state === HW.DEATH) return;
      const tx = this.target.sprite.x;
      const stopDistance = this._computeStopDistanceTo(this.target);
      const desiredX = this.team === "player" ? tx - stopDistance : tx + stopDistance;
      const minX = this.anchorX - (this.team === "player" ? 0 : MELEE_MAX_ADVANCE_PX);
      const maxX = this.anchorX + (this.team === "player" ? MELEE_MAX_ADVANCE_PX : 0);
      const boundedDesiredX = Phaser.Math.Clamp(desiredX, minX, maxX);
      this._easeMoveTowardX(boundedDesiredX);
      this._clampMeleeAdvanceAgainstTarget();
      this._preventBBoxOverlap();
      this.body.setVelocity(0, 0);
      this.combatAnchorX = this.sprite.x;
      if (this.isGarruk) {
        this.sprite.setAlpha(1);
        this._setVisualScale();
      }
    }

    _clampMeleeAdvanceAgainstTarget() {
      if (!this.melee || !this.target || !this.target.sprite) return;
      const centerGap = this._computeStopDistanceTo(this.target);
      if (this.team === "player") {
        const maxForwardX = this.target.sprite.x - centerGap;
        this.sprite.x = Math.min(this.sprite.x, maxForwardX);
      } else {
        const minForwardX = this.target.sprite.x + centerGap;
        this.sprite.x = Math.max(this.sprite.x, minForwardX);
      }
    }

    _preventBBoxOverlap() {
      if (!this.target || !this.target.sprite || !this.sprite || !this.sprite.active || !this.target.sprite.active) return;
      const a = this.sprite.getBounds();
      const b = this.target.sprite.getBounds();
      if (!Phaser.Geom.Intersects.RectangleToRectangle(a, b)) return;
      if (this.team === "player") {
        const overlap = a.right - b.left;
        if (overlap > 0) this.sprite.x -= overlap + 1;
      } else {
        const overlap = b.right - a.left;
        if (overlap > 0) this.sprite.x += overlap + 1;
      }
    }

    /**
     * سرعة المشي من تعريف أنيميشن المشي في المشهد (مش من currentAnim — أول فريم غالبًا لسه idle فكانوا يمشوا في مكانهم).
     */
    _applySyncedWalkVelocity() {
      this.body.setVelocity(0, 0);
    }

    _easeMoveTowardX(targetX) {
      const dtSec = Math.max(0.001, (this.scene.game && this.scene.game.loop ? this.scene.game.loop.delta : 16.67) / 1000);
      const dx = targetX - this.sprite.x;
      const ad = Math.abs(dx);
      const ease = Phaser.Math.Clamp(ad / MOVE_EASE_DISTANCE_PX, MOVE_MIN_EASE_RATIO, 1);
      const step = this.moveSpeedPx * ease * dtSec;
      const realSpeed = step / dtSec;
      const speedRatio = Phaser.Math.Clamp(realSpeed / Math.max(1, this.moveSpeedPx), 0.66, 1.25);
      if (this.state === HW.WALK && this.sprite.anims && this.sprite.anims.isPlaying) {
        this.sprite.anims.timeScale = WALK_ANIM_BASE_SPEED * speedRatio;
      }
      if (ad <= Math.max(MOVE_SNAP_PX, step)) {
        this.sprite.x = targetX;
        return true;
      }
      this.sprite.x += Math.sign(dx) * step;
      return false;
    }

    _playAttack(useSkill) {
      if (this.state === HW.DEATH) return;
      const canUseSkill = !!useSkill && !!this.animKeys.skill && this.energy >= 40;
      const usingSkill = canUseSkill;
      this._stopAtkTimer();
      this.state = usingSkill ? HW.SKILL : HW.ATTACK;
      this.body.setVelocity(0, 0);
      if (this.scene && this.scene.groundHeroesIdleOnlyVisual) {
        this.sprite.anims.timeScale = IDLE_ANIM_TIME_SCALE;
        this._activeAnimScaleFix = this._getAnimScaleFix("idle");
        const ik = this.animKeys.idle;
        const cur = this.sprite.anims.currentAnim;
        if (!cur || cur.key !== ik) this.sprite.anims.play(ik, true);
      } else {
        this.sprite.anims.timeScale = ATTACK_ANIM_TIME_SCALE;
        const key = usingSkill && this.animKeys.skill ? this.animKeys.skill : this.animKeys.attack;
        this._activeAnimScaleFix = this._getAnimScaleFix(usingSkill ? "skill" : "attack");
        this.sprite.anims.play(key, true);
      }
      this._setVisualScale();

      if (usingSkill) {
        this.energy = Math.max(0, this.energy - 40);
        this._refreshEnergyBar();
      }

      const cycleMs = usingSkill ? SKILL_INTERVAL_MS : ATTACK_INTERVAL_MS;
      const hitDelay = usingSkill ? Math.round(ATTACK_HIT_DELAY_MS * 1.15) : ATTACK_HIT_DELAY_MS;
      const dmgMul = usingSkill ? 1.35 : 1;
      this._nextAttackAt = this.scene.time.now + cycleMs;
      this._atkTimer = this.scene.time.delayedCall(hitDelay, () => {
        if (this.state !== HW.ATTACK && this.state !== HW.SKILL) return;
        if (!this.target || this.target.hp <= 0 || this.target.state === HW.DEATH) {
          this.selectCombatTarget();
          if (!this.target || this.target.hp <= 0 || this.target.state === HW.DEATH) return;
        }
        if (this.scene.combatFrozen) return;

        const hitStop = Phaser.Math.Clamp(Math.round(40 + this.damage * dmgMul * 0.9), 40, 80);
        this.applyHitStop(Math.round(hitStop * 0.55));
        if (usingSkill && this.isSupport) {
          const ally = this.selectSupportAllyTarget();
          if (ally) {
            const heal = Math.max(1, Math.round(this.damage * 1.35));
            ally.hp = Math.min(ally.maxHp, ally.hp + heal);
            ally._refreshHpBar();
            if (typeof this.scene.spawnDamageFloat === "function") {
              const dy = Math.max(40, ally.sprite.displayHeight * 0.42);
              this.scene.spawnDamageFloat(ally.sprite.x, ally.sprite.y - dy, -heal);
            }
          }
        } else {
          this.target.applyHitStop(hitStop);
          this.target.takeDamage(this.damage * dmgMul);
        }

        if (!usingSkill) {
          this.energy = Math.min(100, this.energy + 10);
          this._refreshEnergyBar();
        }
        if (!this.scene.groundHeroesIdleOnlyVisual) this._meleeLungeIfNeeded();
        this._postAttackPauseUntil = this.scene.time.now + ATTACK_RECOVER_MS;
        this._returningToSlot = false;
      });
      this._atkFinishTimer = this.scene.time.delayedCall(hitDelay + 90, () => {
        if (this.state === HW.ATTACK || this.state === HW.SKILL) this._playIdle();
      });
    }

    _meleeLungeIfNeeded() {
      if (this.scene && this.scene.groundHeroesIdleOnlyVisual) return;
      if (!this.melee || this.lungePx <= 0) return;
      if (!this.target || this.target.hp <= 0 || this.target.state === HW.DEATH) return;
      if (this._lungeTween) this._lungeTween.stop();
      const baseX = this.combatAnchorX != null ? this.combatAnchorX : this.sprite.x;
      const dir = this._moveDir;
      const desiredPeak = baseX + dir * this.lungePx;
      const gap = Math.max(2, MIN_MELEE_EDGE_GAP);
      const centerGap = this._halfWidth() + Math.max(1, this.target.sprite.displayWidth * 0.5) + gap;
      const peak =
        this.team === "player"
          ? Math.min(desiredPeak, this.target.sprite.x - centerGap)
          : Math.max(desiredPeak, this.target.sprite.x + centerGap);
      this._lungeTween = this.scene.tweens.add({
        targets: this.sprite,
        x: peak,
        duration: ATTACK_LUNGE_MS,
        ease: "Cubic.easeOut",
        yoyo: true,
        hold: 18,
        yoyoEase: "Cubic.easeIn",
        completeDelay: ATTACK_RETURN_MS - ATTACK_LUNGE_MS,
        onUpdate: () => {
          if (this.isGarruk) {
            this.sprite.setAlpha(1);
            this._setVisualScale();
          }
        },
        onYoyo: () => {
          this.sprite.x = baseX;
        },
        onComplete: () => {
          this.sprite.x = baseX;
          if (this.isGarruk) {
            this.sprite.setAlpha(1);
            this._setVisualScale();
          }
        },
      });
    }

    _clampAgainstTargetBounds() {}

    _debugGarrukMetrics(stage) {
      if (!this.isGarruk || typeof console === "undefined") return;
      const ox = this.sprite.originX != null ? this.sprite.originX : 0.5;
      const oy = this.sprite.originY != null ? this.sprite.originY : 0.5;
      console.debug("[GARRUK]", stage, {
        x: Math.round(this.sprite.x),
        y: Math.round(this.sprite.y),
        depth: this.sprite.depth,
        alpha: Number(this.sprite.alpha).toFixed(2),
        scale: Number(this.sprite.scaleX).toFixed(3),
        w: Math.round(this.sprite.displayWidth),
        h: Math.round(this.sprite.displayHeight),
        pivotX: ox,
        pivotY: oy,
      });
    }

    debugGarrukFrame() {
      if (!this.isGarruk || !GARRUK_DEBUG_EDGE || !this.sprite || !this.sprite.active) return;
      const target = this.target && this.target.sprite && this.target.sprite.active ? this.target : null;
      if (this._debugBoundsG) {
        this._debugBoundsG.clear();
        const gb = this.sprite.getBounds();
        this._debugBoundsG.lineStyle(2, 0x22d3ee, 0.95);
        this._debugBoundsG.strokeRect(gb.x, gb.y, gb.width, gb.height);
        if (target) {
          const eb = target.sprite.getBounds();
          this._debugBoundsG.lineStyle(2, 0xfb7185, 0.95);
          this._debugBoundsG.strokeRect(eb.x, eb.y, eb.width, eb.height);
        }
      }
      if (target && typeof console !== "undefined") {
        const stopDistance = this._computeStopDistanceTo(target);
        console.debug("[GARRUK_EDGE]", {
          garrukX: Math.round(this.sprite.x),
          enemyX: Math.round(target.sprite.x),
          stopDistance: Math.round(stopDistance),
          deltaX: Math.round(target.sprite.x - this.sprite.x),
        });
      }
    }

    takeDamage(amount) {
      if (this.state === HW.DEATH || this._battleEnded) return;
      if (this.scene.combatFrozen) return;
      const dmg = Number(amount) || 0;
      this.hp = Math.max(0, this.hp - dmg);
      this._refreshHpBar();
      this._hurtFlash();
      if (dmg > 0 && !this.scene.groundHeroesIdleOnlyVisual && typeof this.scene.spawnHitImpact === "function") {
        const iy = this.sprite.y - Math.max(16, this.sprite.displayHeight * 0.22);
        this.scene.spawnHitImpact(this.sprite.x, iy);
      }
      if (dmg > 0 && !this.scene.groundHeroesIdleOnlyVisual && this.scene && typeof this.scene.triggerHitFeedback === "function") {
        const strength = Phaser.Math.Clamp(dmg / 30, 0.35, 1.1);
        this.scene.triggerHitFeedback(strength);
      }
      if (dmg > 0 && !this.scene.groundHeroesIdleOnlyVisual && typeof this.scene.spawnDamageFloat === "function") {
        const dy = Math.max(40, this.sprite.displayHeight * 0.42);
        this.scene.spawnDamageFloat(this.sprite.x, this.sprite.y - dy, dmg);
      }
      if (this.hp <= 0) this.die();
    }

    /** Brief hurt — does not reset attack loop */
    _hurtFlash() {
      if (this.state === HW.DEATH) return;
      if (this.scene && this.scene.groundHeroesIdleOnlyVisual) return;
      this.sprite.setTint(0xff6666);
      if (this._hurtTimer) this._hurtTimer.remove(false);
      this._hurtTimer = this.scene.time.delayedCall(100, () => {
        this.sprite.clearTint();
      });
    }

    die() {
      if (this.state === HW.DEATH) return;
      this._stopAtkTimer();
      if (this._lungeTween) this._lungeTween.stop();
      this._returningToSlot = false;
      this.state = HW.DEATH;
      this.body.setVelocity(0, 0);
      this.sprite.anims.stop();
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 380,
        onComplete: () => {
          this.sprite.setVisible(false);
          if (this._debugBoundsG) this._debugBoundsG.clear();
          if (this.shadow) this.shadow.setVisible(false);
          if (this.hpFrame) this.hpFrame.setVisible(false);
          this.hpBg.setVisible(false);
          this.hpFill.setVisible(false);
          if (this.enFrame) this.enFrame.setVisible(false);
          if (this.enBg) this.enBg.setVisible(false);
          if (this.enFill) this.enFill.setVisible(false);
        },
      });
    }

    _applyIdleBreathing() {
      if (this.scene && this.scene.groundHeroesIdleOnlyVisual) {
        this.sprite.y = this.anchorY;
        this._setVisualScale();
        return;
      }
      const idleLike = this.state === HW.IDLE || (this._frozen && this.state !== HW.DEATH);
      const allowBreath = idleLike && !this._lungeTween;
      // SYLVAN: إلغاء yBob + نبضة المقياس في الـ idle — تسبب رجفة عمودية واضحة؛ الأنيميشن تظل تعمل.
      if (isSylvanPackOrId(this.heroId, this.packKey)) {
        if (allowBreath) this.sprite.y = Math.round(this.anchorY);
        this._setVisualScale();
        return;
      }
      if (allowBreath) {
        const t = this.scene.time.now * 0.0022 + this.lane * 0.7;
        const breath = 1 + Math.sin(t) * 0.013;
        const yBob = Math.sin(t * 1.15) * 1.8;
        this.sprite.y = this.anchorY + yBob;
        this._setVisualScale(breath);
      } else
        this._setVisualScale();
    }

    update() {
      if (this.state === HW.DEATH || !this.sprite.active) {
        this._updateHpBarPos();
        return;
      }
      if (this._frozen || this.scene.combatFrozen || this._isInHitStop()) {
        this.body.setVelocity(0, 0);
        if (this.state === HW.WALK) this._playIdle();
        this.sprite.y = this.anchorY;
        this._applyIdleBreathing();
        this._tickBarsSmoothing();
        this._updateHpBarPos();
        return;
      }

      this.sprite.y = this.anchorY;
      this.sprite.setAlpha(1);
      this.sprite.setVisible(true);
      this._setVisualScale();

      if (this._relocating) {
        if (this._easeMoveTowardX(this.anchorX)) {
          this._relocating = false;
          if (this.state === HW.WALK) this._playIdle();
        } else {
          this.body.setVelocity(0, 0);
          this._activeAnimScaleFix = this._getAnimScaleFix("walk");
          this.sprite.anims.play(this.animKeys.walk, true);
          this.sprite.anims.timeScale = WALK_ANIM_TIME_SCALE;
        }
        this._tickBarsSmoothing();
        this._updateHpBarPos();
        return;
      }

      this.selectCombatTarget();

      const now = this.scene.time.now;
      if (!this.target || this.target.hp <= 0 || this.target.state === HW.DEATH) {
        this._attackPrepUntil = 0;
        if (this.state !== HW.IDLE) this._playIdle();
        this._applyIdleBreathing();
        this._tickBarsSmoothing();
        this._updateHpBarPos();
        return;
      }

      const inAttackWindow = true;

      if (this.state === HW.ATTACK || this.state === HW.SKILL) {
        this.body.setVelocity(0, 0);
        const lungePlaying = this._lungeTween && this._lungeTween.isPlaying();
        if (!lungePlaying) this.sprite.x = this.anchorX;
        this.sprite.setAlpha(1);
        this._setVisualScale();
        this._tickBarsSmoothing();
        this._updateHpBarPos();
        return;
      }
      this.sprite.x = this.anchorX;
      this.body.setVelocity(0, 0);

      if (!inAttackWindow) {
        this._attackPrepUntil = 0;
        if (this.state !== HW.IDLE) this._playIdle();
        this._applyIdleBreathing();
        this._tickBarsSmoothing();
        this._updateHpBarPos();
        return;
      }

      if (now < this._nextAttackAt || now < this._postAttackPauseUntil) {
        this._attackPrepUntil = 0;
        if (this.state !== HW.IDLE) this._playIdle();
        this._applyIdleBreathing();
        this._tickBarsSmoothing();
        this._updateHpBarPos();
        return;
      }

      if ((this._attackPrepUntil || 0) === 0) {
        this._attackPrepUntil = now + ATTACK_PREP_MS;
        if (this.state !== HW.IDLE) this._playIdle();
        this._applyIdleBreathing();
        this._tickBarsSmoothing();
        this._updateHpBarPos();
        return;
      }

      if (now >= this._attackPrepUntil) {
        this._attackPrepUntil = 0;
        this.combatAnchorX = this.sprite.x;
        this._playAttack(false);
        this._strikeCount++;
      } else {
        if (this.state !== HW.IDLE) this._playIdle();
      }

      this._applyIdleBreathing();
      this._tickBarsSmoothing();
      this._updateHpBarPos();
    }

    castSkillManual() {
      if (this.state === HW.DEATH || this._battleEnded) return false;
      if (this.energy < this.maxEnergy) return false;
      if (!this.animKeys.skill) return false;
      if (this.scene.combatFrozen) return false;
      this._playAttack(true);
      return true;
    }

    freezeAtSpot() {
      this._frozen = true;
      this._stopAtkTimer();
      this._returningToSlot = false;
      this.body.setVelocity(0, 0);
      this._playIdle();
    }
  }

  function spawnLaneHero(scene, rosterRow, lane, team, slot, sideTag, animFps) {
    const r = rosterRow;
    const pk = r.packKey;
    const p = `ph_${sideTag}${lane}_`;
    const g = r.grid;
    const gAtk = r.atkGrid || g;
    const shIdle = `sh_${sideTag}${lane}_${pk}_idle`;
    const shWalk = `sh_${sideTag}${lane}_${pk}_walk`;
    const shAtk = `sh_${sideTag}${lane}_${pk}_atk`;
    const idleMeta = addSpriteSheetFromImageKey(scene, shIdle, p + "idle", g.cols, g.rows);
    const walkMeta = addSpriteSheetFromImageKey(scene, shWalk, p + "walk", g.cols, g.rows);
    const atkMeta = addSpriteSheetFromImageKey(scene, shAtk, p + "atk", gAtk.cols, gAtk.rows);

    const ak = {
      idle: `a_${sideTag}${lane}_${pk}_idle`,
      walk: `a_${sideTag}${lane}_${pk}_walk`,
      attack: `a_${sideTag}${lane}_${pk}_atk`,
      skill: `a_${sideTag}${lane}_${pk}_skill`,
    };

    ensureAnimLoop(scene, ak.idle, shIdle, idleMeta.endFrame, animFps.idle);
    ensureAnimLoop(scene, ak.walk, shWalk, walkMeta.endFrame, animFps.walk);
    ensureAnimLoop(scene, ak.attack, shAtk, atkMeta.endFrame, animFps.attack);
    ensureAnimLoop(scene, ak.skill, shAtk, atkMeta.endFrame, animFps.skill);

    const sheetKeys = { idle: shIdle, walk: shWalk, attack: shAtk };
    const animFrameHeights = {
      idle: idleMeta.fh,
      walk: walkMeta.fh,
      attack: atkMeta.fh,
      skill: atkMeta.fh,
    };
    const rosterCfg = { melee: r.melee, heroId: r.heroId, packKey: r.packKey, role: r.role };

    let x = team === "player" ? slot.leftX : slot.rightX;
    if (team === "player" && isSylvanPackOrId(r.heroId, r.packKey)) {
      x += SYLVAN_PLAYER_X_NUDGE_PX;
    }
    const y = team === "player" ? slot.y : slot.yEnemy;
    const sc = team === "player" ? slot.scalePlayer : slot.scaleEnemy;

    const hero = new HWHero(scene, {
      team,
      lane,
      spawnOrder: lane,
      roster: rosterCfg,
      x,
      y,
      slotScale: sc,
      animKeys: { idle: ak.idle, walk: ak.walk, attack: ak.attack, skill: ak.skill },
      sheetKeys,
      animFrameHeights,
      maxHp: team === "player" ? 900 + lane * 40 : 850 + lane * 35,
      damage: team === "player" ? 14 + lane : 13 + lane,
    });
    if (team === "player") {
      hero.sprite.setFlipX(false);
    } else {
      hero.sprite.setFlipX(true);
      hero._moveDir = -1;
    }
    return hero;
  }

  class HWBattleScene extends Phaser.Scene {
    constructor() {
      super({ key: "HWBattleScene" });
    }

    preload() {
      this.load.image(HW_ARENA_BG_KEY, HW_ARENA_BG_URL);
      const playerRoster = buildBattleRoster(readTeamIdsForPhaser());
      const enemyRoster = buildBattleRoster(readEnemyTeamIdsForPhaser());
      this._preloadPlayerRoster = playerRoster;
      this._preloadEnemyRoster = enemyRoster;
      const queueImages = (roster, tag) => {
        roster.forEach((r, lane) => {
          const p = `ph_${tag}${lane}_`;
          this.load.image(p + "idle", r.urls.idle);
          this.load.image(p + "walk", r.urls.walk);
          this.load.image(p + "atk", r.urls.attack);
        });
      };
      queueImages(playerRoster, "P");
      queueImages(enemyRoster, "E");
    }

    spawnDamageFloat(x, y, amount) {
      const raw = Math.round(Number(amount) || 0);
      const isHeal = raw < 0;
      const n = Math.max(1, Math.abs(raw));
      const txt = this.add
        .text(x, y, isHeal ? `+${n}` : String(n), {
          fontFamily: "system-ui, Segoe UI, sans-serif",
          fontSize: "20px",
          fontStyle: "bold",
          color: isHeal ? "#86efac" : "#fff8e7",
          stroke: "#1a0a0a",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(9000);
      this.tweens.add({
        targets: txt,
        y: y - 58,
        alpha: 0,
        duration: 800,
        ease: "Cubic.easeOut",
        onComplete: () => {
          try {
            txt.destroy();
          } catch (e) {
            /* ignore */
          }
        },
      });
      this.tweens.add({
        targets: txt,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 110,
        ease: "Sine.easeOut",
        yoyo: true,
      });
    }

    spawnHitImpact(x, y) {
      const burst = this.add.graphics().setDepth(9020);
      burst.lineStyle(3, 0xfff8dc, 0.95);
      burst.strokeCircle(0, 0, 8);
      burst.lineStyle(2, 0xffffff, 0.8);
      burst.beginPath();
      burst.moveTo(-10, 0);
      burst.lineTo(10, 0);
      burst.moveTo(0, -10);
      burst.lineTo(0, 10);
      burst.strokePath();
      burst.setPosition(x, y);

      const flash = this.add.circle(x, y, 7, 0xfff8dc, 0.45).setDepth(9018);
      this.tweens.add({
        targets: burst,
        scaleX: 1.75,
        scaleY: 1.75,
        alpha: 0,
        duration: 140,
        ease: "Quad.easeOut",
        onComplete: () => {
          try {
            burst.destroy();
          } catch (e) {
            /* ignore */
          }
        },
      });
      this.tweens.add({
        targets: flash,
        scaleX: 1.9,
        scaleY: 1.9,
        alpha: 0,
        duration: 120,
        ease: "Quad.easeOut",
        onComplete: () => {
          try {
            flash.destroy();
          } catch (e) {
            /* ignore */
          }
        },
      });
    }

    triggerHitFeedback(strength) {
      const s = Phaser.Math.Clamp(Number(strength) || 0.5, 0.2, 1.2);
      if (this.cameras && this.cameras.main) {
        this.cameras.main.shake(52 * s, 0.0019 * s, false);
      }
      if (this._hitFlashRect) {
        this._hitFlashRect.alpha = Math.max(this._hitFlashRect.alpha || 0, 0.12 * s);
      }
    }

    _clearArenaDecor() {
      if (!this._arenaDecor || !this._arenaDecor.length) return;
      this._arenaDecor.forEach((o) => {
        try {
          if (o && o.destroy) o.destroy();
        } catch (e) {
          /* ignore */
        }
      });
      this._arenaDecor = [];
    }

    /** أرضية بمنظور منخفض (كاميرا أمامية) + إضاءة */
    _drawBattleField(w, h) {
      // Intentionally empty: keep standalone scene free of black floor overlays.
    }

    /**
     * طبقة عرض أقرب لـ Hero Wars: خلفية (صفحة اختبار فقط)، فينيت، VS، تسميات الفريق.
     * داخل التطبيق الخلفية من DOM (arena-bg-perspective) + طبقة خفيفة هنا.
     */
    _setupArenaDecor(w, h) {
      this._clearArenaDecor();
      this._arenaDecor = [];
      const embedded = typeof document !== "undefined" && !!document.getElementById("arena-battle-page");
      if (embedded) {
        return;
      }

      this._drawBattleField(w, h);

      if (this.textures.exists(HW_ARENA_BG_KEY)) {
        const bg = this.add.image(w / 2, h / 2, HW_ARENA_BG_KEY);
        const tex = this.textures.get(HW_ARENA_BG_KEY).getSourceImage();
        const sc = Math.max(w / tex.width, h / tex.height);
        bg.setScale(sc);
        bg.setDepth(0);
        this._arenaDecor.push(bg);
      }

      const fs = Math.max(18, Math.round(Math.min(w, h) * 0.048));
      const vs = this.add
        .text(w / 2, h * 0.052, "VS", {
          fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
          fontSize: fs + "px",
          color: "#fde68a",
          stroke: "#1a0a05",
          strokeThickness: Math.max(4, Math.round(fs * 0.14)),
        })
        .setOrigin(0.5)
        .setDepth(6);
      this._arenaDecor.push(vs);

      const sub = this.add
        .text(w / 2, h * 0.052 + fs * 0.92, "Arena", {
          fontFamily: "system-ui, Segoe UI, sans-serif",
          fontSize: Math.round(fs * 0.34) + "px",
          color: "#cbd5e1",
        })
        .setOrigin(0.5)
        .setDepth(6)
        .setAlpha(0.88);
      this._arenaDecor.push(sub);

      const fsLbl = Math.round(fs * 0.42);
      const you = this.add
        .text(w * 0.07, h * 0.052, "YOU", {
          fontFamily: "system-ui, Segoe UI, sans-serif",
          fontSize: fsLbl + "px",
          color: "#93c5fd",
          stroke: "#0f172a",
          strokeThickness: 3,
        })
        .setOrigin(0, 0.5)
        .setDepth(6);
      const foe = this.add
        .text(w * 0.93, h * 0.052, "FOE", {
          fontFamily: "system-ui, Segoe UI, sans-serif",
          fontSize: fsLbl + "px",
          color: "#fca5a5",
          stroke: "#0f172a",
          strokeThickness: 3,
        })
        .setOrigin(1, 0.5)
        .setDepth(6);
      this._arenaDecor.push(you, foe);
    }

    _updateLaneLines() {
      const g = this._laneLinesG;
      if (!g || !this.heroes || !this.showLanePairLines) {
        if (g) g.clear();
        return;
      }
      g.clear();
      g.setDepth(22);
      /** نقطة على محور الجسم (صدر ≈) من السبرايت نفسه — كل بطل له ارتفاعه */
      const torsoYWorld = (h) => {
        const s = h.sprite;
        if (!s) return 0;
        const oy = s.originY != null ? s.originY : 0.5;
        const dh = s.displayHeight;
        const top = s.y - dh * oy;
        const feet = s.y + dh * (1 - oy);
        return top + (feet - top) * 0.4;
      };
      for (let lane = 0; lane < TEAM_SIZE; lane++) {
        const pl = this.heroes.find((h) => h.team === "player" && h.lane === lane);
        const en = this.heroes.find((h) => h.team === "enemy" && h.lane === lane);
        if (!pl || !en || !pl.sprite || !en.sprite || !pl.sprite.active || !en.sprite.active) continue;
        if (pl.hp <= 0 || en.hp <= 0 || pl.state === HW.DEATH || en.state === HW.DEATH) continue;
        const yPl = torsoYWorld(pl);
        const yEn = torsoYWorld(en);
        const yLine = (yPl + yEn) / 2;
        const x1 = pl.sprite.x;
        const x2 = en.sprite.x;
        g.lineStyle(2.4, 0xfbbf24, 0.45);
        g.beginPath();
        g.moveTo(x1, yLine);
        g.lineTo(x2, yLine);
        g.strokePath();
      }
    }

    _computeTeamFocusTargets() {
      if (!this.heroes || !this.heroes.length) {
        this._focusTargetPlayer = null;
        this._focusTargetEnemy = null;
        return;
      }
      const alivePlayers = this.heroes.filter((h) => h.team === "player" && h.hp > 0 && h.state !== HW.DEATH);
      const aliveEnemies = this.heroes.filter((h) => h.team === "enemy" && h.hp > 0 && h.state !== HW.DEATH);
      if (!alivePlayers.length || !aliveEnemies.length) {
        this._focusTargetPlayer = null;
        this._focusTargetEnemy = null;
        return;
      }

      const chooseFront = (list) => {
        return list
          .slice()
          .sort((a, b) => {
            if (a.lane !== b.lane) return a.lane - b.lane;
            return a._spawnOrder - b._spawnOrder;
          })[0] || null;
      };

      this._focusTargetPlayer = chooseFront(aliveEnemies);
      this._focusTargetEnemy = chooseFront(alivePlayers);
    }

    getFocusTargetForTeam(team) {
      return team === "player" ? this._focusTargetPlayer : this._focusTargetEnemy;
    }

    _getArenaLayoutMetrics() {
      if (this._arenaLayoutMetrics) return this._arenaLayoutMetrics;
      return { heroWidth: 72, heroHeight: 100 };
    }

    _getArenaSlots(w, h) {
      return computeFormationSlots(w, h, this._getArenaLayoutMetrics());
    }

    _drawLayoutDebug() {
      if (!ARENA_LAYOUT_DEBUG || !this._layoutDebugG || !this.heroes) return;
      this._layoutDebugG.clear();
      this.heroes.forEach((h) => {
        if (!h || !h.sprite || !h.sprite.active || h.state === HW.DEATH) return;
        const b = h.sprite.getBounds();
        this._layoutDebugG.lineStyle(2, h.team === "player" ? 0x22c55e : 0xef4444, 0.8);
        this._layoutDebugG.strokeRect(b.x, b.y, b.width, b.height);
      });
    }

    _applyWorldBarsVisibility() {
      if (!this.heroes || !this.heroes.length) return;
      const showBars = !this.hideWorldBars;
      this.heroes.forEach((h) => {
        if (!h) return;
        if (h.hpFrame) h.hpFrame.setVisible(showBars);
        if (h.hpBg) h.hpBg.setVisible(showBars);
        if (h.hpFill) h.hpFill.setVisible(showBars);
      });
    }

    _logLayoutSpacing() {
      if (!ARENA_LAYOUT_DEBUG || !this.heroes || typeof console === "undefined") return;
      const now = this.time.now;
      if (now - (this._layoutLogAt || 0) < 260) return;
      this._layoutLogAt = now;

      const logTeam = (team) => {
        const list = this.heroes.filter((h) => h.team === team && h.hp > 0 && h.state !== HW.DEATH && h.sprite && h.sprite.active);
        if (list.length < 2) return;
        let min = Number.POSITIVE_INFINITY;
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const dx = list[i].sprite.x - list[j].sprite.x;
            const dy = list[i].sprite.y - list[j].sprite.y;
            const d = Math.hypot(dx, dy);
            if (d < min) min = d;
          }
        }
        console.debug("[ARENA_SPACING]", team, { minDistance: Math.round(min) });
      };

      logTeam("player");
      logTeam("enemy");
    }

    _rebalanceAliveSlots() {
      if (!this.heroes || !this.heroes.length || this._openingActive) return;
      const aliveKey = this.heroes
        .map((h) => `${h.team}:${h.heroId}:${h.hp > 0 && h.state !== HW.DEATH ? 1 : 0}`)
        .join("|");
      if (aliveKey === this._aliveLayoutKey) return;
      this._aliveLayoutKey = aliveKey;

      const slots = this._getArenaSlots(this.scale.width, this.scale.height);
      ["player", "enemy"].forEach((team) => {
        const alive = this.heroes
          .filter((h) => h.team === team && h.hp > 0 && h.state !== HW.DEATH)
          .sort((a, b) => a.lane - b.lane);

        alive.forEach((hero) => {
          const li = hero.lane;
          const slot = slots[li];
          if (!slot) return;
          const tx = team === "player" ? slot.leftX : slot.rightX;
          const ty = team === "player" ? slot.y : slot.yEnemy;
          const sc = team === "player" ? slot.scalePlayer : slot.scaleEnemy;
          const needsShift =
            Math.abs(hero.anchorX - tx) > 1 ||
            Math.abs(hero.groundY - ty) > 1 ||
            Math.abs(hero.slotScale - sc) > 0.001;
          if (!needsShift) return;
          hero.setFormationSmooth(tx, ty, sc);
        });
      });
    }

    _onResize(gameSize) {
      const w = gameSize.width;
      const h = gameSize.height;
      this.physics.world.setBounds(0, 0, w, h);
      this._setupArenaDecor(w, h);
      if (!this.heroes || !this.heroes.length) return;
      if (this._formationLocked) return;
      const slots = this._getArenaSlots(w, h);
      this.heroes.forEach((hero) => {
        const s = slots[hero.lane];
        if (!s) return;
        const x = hero.team === "player" ? s.leftX : s.rightX;
        const y = hero.team === "player" ? s.y : s.yEnemy;
        const sc = hero.team === "player" ? s.scalePlayer : s.scaleEnemy;
        hero.setFormation(x, y, sc);
      });
    }

    _startBattleOpeningSequence(slots) {
      this._openingActive = true;
      this.combatFrozen = true;
      this.heroes.forEach((hero) => {
        const s = slots[hero.lane];
        if (!s) return;
        const tx = hero.team === "player" ? s.leftX : s.rightX;
        const ty = hero.team === "player" ? s.y : s.yEnemy;
        const sc = hero.team === "player" ? s.scalePlayer : s.scaleEnemy;
        hero.setFormation(tx, ty, sc);
        hero.sprite.setVisible(true);
        hero.sprite.setAlpha(1);
        hero.playIdleCinematic();
        hero.setBarsAlpha(1);
        hero._updateHpBarPos();
      });

      this.time.delayedCall(5000, () => {
        if (!this.sys.isActive()) return;
        this.heroes.forEach((h) => h.lockNearestTargetByRange());
        this._openingActive = false;
        this.combatFrozen = false;
        this._formationLocked = true;
      });
    }

    /** يوحّد مقاس SYLVAN اللاعب مع SYLVAN العدو (نفس الشيت) إن وُجد الاثنان. */
    _applyPlayerSylvanSizeMatchToEnemy() {
      if (!this.heroes || !this.heroes.length) return;
      const pSyl = this.heroes.find((h) => h && h.team === "player" && isSylvanPackOrId(h.heroId, h.packKey));
      const eSyl = this.heroes.find((h) => h && h.team === "enemy" && isSylvanPackOrId(h.heroId, h.packKey));
      if (!pSyl || !eSyl || !pSyl.sprite || !eSyl.sprite || !pSyl.sprite.active || !eSyl.sprite.active) return;
      const eh = Math.max(1, eSyl.sprite.displayHeight);
      const ph = Math.max(1, pSyl.sprite.displayHeight);
      const ew = Math.max(1, eSyl.sprite.displayWidth);
      const pw = Math.max(1, pSyl.sprite.displayWidth);
      const th = eh / ph;
      const tw = ew / pw;
      let t = Math.sqrt(th * tw);
      if (!Number.isFinite(t) || t <= 0) return;
      t = Phaser.Math.Clamp(t, 0.88, 1.22);
      if (Math.abs(t - 1) < 0.003) return;
      pSyl._sylvanVsEnemyDisplayMul = t;
      pSyl._setVisualScale();
      pSyl._recalcFootAnchor();
      pSyl.sprite.setPosition(pSyl.anchorX, pSyl.anchorY);
      if (pSyl.body && typeof pSyl.body.reset === "function") {
        pSyl.body.setVelocity(0, 0);
        pSyl.body.reset(pSyl.anchorX, pSyl.anchorY);
      }
      pSyl._resizeBodyToSprite();
      pSyl._updateHpBarPos();
    }

    create() {
      const w = this.scale.width;
      const h = this.scale.height;
      this.physics.world.setBounds(0, 0, w, h);
      this._setupArenaDecor(w, h);
      this.scale.on("resize", this._onResize, this);
      this.events.once("shutdown", () => {
        this.scale.off("resize", this._onResize, this);
      });

      const playerRoster = this._preloadPlayerRoster || buildBattleRoster(readTeamIdsForPhaser());
      const enemyRoster = this._preloadEnemyRoster || buildBattleRoster(readEnemyTeamIdsForPhaser());
      const sampleWidths = [];
      const sampleHeights = [];
      const pushSamples = (roster, tag) => {
        roster.forEach((r, lane) => {
          const key = `ph_${tag}${lane}_idle`;
          if (!this.textures.exists(key)) return;
          const src = this.textures.get(key).getSourceImage();
          const fw = Math.max(1, Math.floor(src.width / r.grid.cols));
          const fh = Math.max(1, Math.floor(src.height / r.grid.rows));
          sampleWidths.push(fw * UNIFORM_HERO_SCALE);
          sampleHeights.push(fh * UNIFORM_HERO_SCALE);
        });
      };
      pushSamples(playerRoster, "P");
      pushSamples(enemyRoster, "E");
      const avg = (arr, fallback) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : fallback);
      const heroWidth = avg(sampleWidths, 72);
      const heroHeight = avg(sampleHeights, 100);
      this._arenaLayoutMetrics = {
        heroWidth,
        heroHeight,
        horizontalSpacing: heroWidth * 1.15,
        verticalSpacing: heroHeight * 0.75,
        centerGap: heroWidth * 1.55,
        minDistance: heroWidth * 0.82,
      };
      if (ARENA_LAYOUT_DEBUG && typeof console !== "undefined") {
        console.debug("[ARENA_LAYOUT_METRICS]", this._arenaLayoutMetrics);
      }
      const slots = this._getArenaSlots(w, h);
      const animFps = { idle: 11, walk: 14, attack: 18, skill: 14 };

      this.hideWorldBars = true;
      this.groundHeroesIdleOnlyVisual = true;

      const heroes = [];

      for (let lane = 0; lane < TEAM_SIZE; lane++) {
        const slot = slots[lane];
        const rp = playerRoster[lane];
        const re = enemyRoster[lane];
        if (!slot || !rp || !re) continue;
        heroes.push(spawnLaneHero(this, rp, lane, "player", slot, "P", animFps));
        heroes.push(spawnLaneHero(this, re, lane, "enemy", slot, "E", animFps));
      }

      heroes.forEach((h) => {
        h.setEnemies(heroes);
        h.setAllies(heroes);
      });
      this.heroes = heroes;
      this.combatFrozen = true;
      this._settled = false;
      this._openingActive = true;
      this._formationLocked = false;
      this._aliveLayoutKey = "";
      this._applyWorldBarsVisibility();

      this.showLanePairLines = SHOW_LANE_PAIR_LINES;
      this._laneLinesG = this.add.graphics();
      this._laneLinesG.setDepth(22);
      this._hitFlashRect = this.add
        .rectangle(w * 0.5, h * 0.5, w, h, 0xffffff, 0)
        .setDepth(9800)
        .setScrollFactor(0);
      this._layoutDebugG = ARENA_LAYOUT_DEBUG ? this.add.graphics().setDepth(9995) : null;
      this._layoutLogAt = 0;
      this._startBattleOpeningSequence(slots);
      this._applyPlayerSylvanSizeMatchToEnemy();
      if (this.heroes) {
        this.heroes.forEach((h) => {
          if (h && h.sprite && typeof h.sprite.setRoundPixels === "function") h.sprite.setRoundPixels(true);
        });
      }
    }

    update() {
      if (this._openingActive) {
        this.heroes.forEach((h) => {
          if (!h || !h.sprite || !h.sprite.active) return;
          h.sprite.y = h.anchorY;
          h._updateHpBarPos();
          if (typeof h.debugGarrukFrame === "function") h.debugGarrukFrame();
        });
        this._drawLayoutDebug();
        this._logLayoutSpacing();
        if (this._hitFlashRect && this._hitFlashRect.alpha > 0) {
          this._hitFlashRect.alpha = Math.max(0, this._hitFlashRect.alpha - 0.035);
        }
        this._updateLaneLines();
        return;
      }
      this._computeTeamFocusTargets();
      if (!this._settled) {
        this.heroes.forEach((h) => {
          h.update();
          if (typeof h.debugGarrukFrame === "function") h.debugGarrukFrame();
        });

        const aliveP = this.heroes.filter((h) => h.team === "player" && h.hp > 0 && h.state !== HW.DEATH);
        const aliveE = this.heroes.filter((h) => h.team === "enemy" && h.hp > 0 && h.state !== HW.DEATH);

        if (aliveP.length === 0 || aliveE.length === 0) {
          this._settled = true;
          this.combatFrozen = true;
          const victory = aliveP.length > 0;
          const defeat = aliveE.length > 0 && !victory;
          const msg = victory ? "VICTORY" : defeat ? "DEFEAT" : "DRAW";
          const col = victory ? "#fef08a" : defeat ? "#fca5a5" : "#e2e8f0";
          this.heroes.forEach((h) => {
            h._battleEnded = true;
            if (h.hp > 0 && h.state !== HW.DEATH) h.freezeAtSpot();
          });
          this.add
            .text(this.scale.width / 2, this.scale.height * 0.48, msg, {
              fontFamily: "Georgia, Cambria, serif",
              fontSize: Math.round(Math.min(this.scale.width, this.scale.height) * 0.09) + "px",
              color: col,
              stroke: "#0f172a",
              strokeThickness: 8,
            })
            .setOrigin(0.5)
            .setDepth(200)
            .setAlpha(0.95);
        }
      }

      this._drawLayoutDebug();
      this._logLayoutSpacing();
      if (this._hitFlashRect && this._hitFlashRect.alpha > 0) {
        this._hitFlashRect.alpha = Math.max(0, this._hitFlashRect.alpha - 0.04);
      }
      this._updateLaneLines();
    }
  }

  let _hwGame = null;

  function createHWGame(parentEl) {
    if (!parentEl || typeof Phaser === "undefined") return null;
    const rect = parentEl.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width) || window.innerWidth);
    const h = Math.max(240, Math.floor(rect.height) || 480);

    const config = {
      type: Phaser.AUTO,
      parent: parentEl,
      width: w,
      height: h,
      transparent: true,
      backgroundColor: "#00000000",
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
      scene: [HWBattleScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: parentEl,
        width: w,
        height: h,
      },
    };

    return new Phaser.Game(config);
  }

  window.RaidexHWBattle = {
    castPlayerSkill: function (slotIndex) {
      if (!_hwGame) return false;
      const scene = _hwGame.scene.getScene("HWBattleScene");
      if (!scene || !scene.heroes) return false;
      const playerHeroes = scene.heroes.filter((h) => h.team === "player");
      const hero = playerHeroes[slotIndex];
      if (!hero) return false;
      return hero.castSkillManual();
    },
    getStateSnapshot: function () {
      if (!_hwGame) return null;
      const scene = _hwGame.scene.getScene("HWBattleScene");
      if (!scene || !scene.heroes) return null;
      const mapHero = function (h) {
        if (!h) return null;
        const alive = !!(h.hp > 0 && h.state !== HW.DEATH && h.sprite && h.sprite.visible);
        return {
          id: h.heroId || "GARRUK",
          hp: Math.max(0, Math.round(h.hp || 0)),
          maxHp: Math.max(1, Math.round(h.maxHp || 1)),
          energy: Math.max(0, Math.round(h.energy || 0)),
          maxEnergy: Math.max(1, Math.round(h.maxEnergy || 100)),
          alive,
        };
      };
      const players = scene.heroes
        .filter((h) => h.team === "player")
        .slice()
        .sort((a, b) => a.lane - b.lane)
        .map(mapHero);
      const enemies = scene.heroes
        .filter((h) => h.team === "enemy")
        .slice()
        .sort((a, b) => a.lane - b.lane)
        .map(mapHero);
      return {
        player: players,
        enemy: enemies,
        combatStarted: !scene.combatFrozen && !scene._openingActive,
      };
    },
    start: function (parentEl, opts) {
      if (!parentEl) return;
      let ids =
        opts && Array.isArray(opts.teamIds) && opts.teamIds.length
          ? opts.teamIds
              .map((id) => String(id || "")
                .toUpperCase()
                .trim())
              .filter(Boolean)
              .slice(0, TEAM_SIZE)
          : null;
      if (!ids || !ids.length) {
        ids = readTeamIdsForPhaser();
      }
      let enemyIds =
        opts && Array.isArray(opts.enemyTeamIds) && opts.enemyTeamIds.length
          ? opts.enemyTeamIds
              .map((id) => String(id || "")
                .toUpperCase()
                .trim())
              .filter(Boolean)
              .slice(0, TEAM_SIZE)
          : null;
      this.destroy();
      if (typeof window !== "undefined") {
        const padded = padTeamIds(ids);
        window.__raidexHWBattleTeamIds = padded;
        window.__raidexHWBattleEnemyTeamIds =
          enemyIds && enemyIds.length ? padTeamIds(enemyIds) : padTeamIds(padded);
      }
      parentEl.innerHTML = "";
      _hwGame = createHWGame(parentEl);
    },
    destroy: function () {
      if (_hwGame) {
        try {
          _hwGame.destroy(true);
        } catch (e) {
          /* ignore */
        }
        _hwGame = null;
      }
      if (typeof window !== "undefined") {
        try {
          delete window.__raidexHWBattleTeamIds;
        } catch (e) {
          window.__raidexHWBattleTeamIds = null;
        }
        try {
          delete window.__raidexHWBattleEnemyTeamIds;
        } catch (e) {
          window.__raidexHWBattleEnemyTeamIds = null;
        }
      }
    },
  };

  /** صفحة phaser-battle.html فقط — index يستدعي RaidexHWBattle.start يدويًا */
  function bootStandalone() {
    const parent = document.getElementById("game-container");
    if (!parent || document.getElementById("arena-battle-page")) return;
    if (typeof Phaser === "undefined") return;
    if (typeof window !== "undefined" && !window.__raidexHWBattleTeamIds) {
      window.__raidexHWBattleTeamIds = ["GARRUK", "PYRAX", "MORVEX"];
    }
    window.RaidexHWBattle.start(parent);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootStandalone);
  } else {
    bootStandalone();
  }
})();
