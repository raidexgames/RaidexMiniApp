/**
 * State-based arena combat rendering on HTMLCanvasElement.
 * States: idle | walk | attack | death
 * — walk frame index synced to path progress (no teleport)
 * — requestAnimationFrame game loop
 * — designed for multiple CombatSpriteEntity instances (player + enemy + future slots)
 */
(function (global) {
  "use strict";

  const ST = Object.freeze({
    IDLE: "idle",
    WALK: "walk",
    ATTACK: "attack",
    DEATH: "death",
  });

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      if (!src) {
        reject(new Error("no src"));
        return;
      }
      const im = new Image();
      im.decoding = "async";
      im.onload = function () {
        resolve(im);
      };
      im.onerror = function () {
        reject(new Error("fail " + src));
      };
      im.src = src;
    });
  }

  function getCtx() {
    return typeof window.__raidexArenaCanvasContext === "function"
      ? window.__raidexArenaCanvasContext()
      : null;
  }

  function SpriteSheet(img, cols, rows) {
    this.img = img;
    this.cols = Math.max(1, cols | 0);
    this.rows = Math.max(1, rows | 0);
    this.count = this.cols * this.rows;
    this.fw = img.naturalWidth / this.cols;
    this.fh = img.naturalHeight / this.rows;
  }

  SpriteSheet.prototype.draw = function (ctx, frameIndex, anchorX, anchorY, drawH, flipH) {
    if (!this.img || !this.img.naturalWidth) return;
    const f = ((frameIndex % this.count) + this.count) % this.count;
    const col = f % this.cols;
    const row = (f / this.cols) | 0;
    const sx = col * this.fw;
    const sy = row * this.fh;
    const dh = drawH;
    const dw = dh * (this.fw / this.fh);
    ctx.save();
    ctx.translate(anchorX, anchorY);
    if (flipH) ctx.scale(-1, 1);
    ctx.drawImage(this.img, sx, sy, this.fw, this.fh, -dw * 0.5, -dh, dw, dh);
    ctx.restore();
  };

  function CombatSpriteEntity(options) {
    this.id = options.id;
    this.flip = !!options.flip;
    this.drawH = options.drawH || 128;
    this.sheets = options.sheets || {};
    this.state = ST.IDLE;
    this.anchorX = 0;
    this.anchorY = 0;
    this.idleFps = options.idleFps || 12;
    this.attackFps = options.attackFps || 14;
    this._idleAcc = 0;
    this._attackAcc = 0;
    this._idleFrame = 0;
    this._attackFrame = 0;
    this._walkStartX = 0;
    this._walkEndX = 0;
    this._walkStartY = 0;
    this._walkEndY = 0;
    this._walkT0 = 0;
    this._walkDurMs = 0;
    this._walkFrameCount = 1;
    this.deathAlpha = 1;
    this.visible = true;
  }

  CombatSpriteEntity.prototype.setState = function (s, payload) {
    this.state = s;
    if (s === ST.WALK && payload) {
      this._walkStartX = payload.startX;
      this._walkEndX = payload.endX;
      this._walkT0 = payload.t0;
      this._walkDurMs = Math.max(1, payload.durMs);
      this._walkFrameCount = Math.max(1, payload.frameCount | 0);
      if (typeof payload.startGroundY === "number") {
        this._walkStartY = payload.startGroundY;
      }
      if (typeof payload.endGroundY === "number") {
        this._walkEndY = payload.endGroundY;
      } else if (typeof payload.startGroundY === "number") {
        this._walkEndY = payload.startGroundY;
      }
      if (typeof payload.groundY === "number") {
        this._lockedGroundY = payload.groundY;
      }
    }
    if (s === ST.DEATH) {
      this.deathAlpha = 1;
    }
    if (s === ST.IDLE) {
      this._idleAcc = 0;
    }
    if (s === ST.ATTACK) {
      this._attackAcc = 0;
    }
  };

  CombatSpriteEntity.prototype.update = function (now, dtMs) {
    const idleSheet = this.sheets.idle;
    const walkSheet = this.sheets.walk;
    const attackSheet = this.sheets.attack;

    if (this.state === ST.DEATH) {
      this.deathAlpha = Math.max(0, this.deathAlpha - dtMs * 0.0018);
      if (this.deathAlpha <= 0) this.visible = false;
      return;
    }

    if (this.state === ST.IDLE && idleSheet) {
      if (typeof this._lockedGroundY === "number") {
        this.anchorY = this._lockedGroundY;
      }
      this._idleAcc += dtMs;
      const step = 1000 / this.idleFps;
      while (this._idleAcc >= step) {
        this._idleAcc -= step;
        this._idleFrame = (this._idleFrame + 1) % idleSheet.count;
      }
    }

    if (this.state === ST.WALK && walkSheet) {
      const t = Math.min(1, (now - this._walkT0) / this._walkDurMs);
      this.anchorX = this._walkStartX + (this._walkEndX - this._walkStartX) * t;
      if (typeof this._walkStartY === "number" && typeof this._walkEndY === "number") {
        this.anchorY = this._walkStartY + (this._walkEndY - this._walkStartY) * t;
      } else if (typeof this._lockedGroundY === "number") {
        this.anchorY = this._lockedGroundY;
      }
      const fi = Math.min(
        this._walkFrameCount - 1,
        Math.floor(t * this._walkFrameCount)
      );
      this._idleFrame = fi;
    }

    if (this.state === ST.ATTACK && attackSheet) {
      if (typeof this._lockedGroundY === "number") {
        this.anchorY = this._lockedGroundY;
      }
      this._attackAcc += dtMs;
      const step = 1000 / this.attackFps;
      while (this._attackAcc >= step) {
        this._attackAcc -= step;
        this._attackFrame = (this._attackFrame + 1) % attackSheet.count;
      }
    }
  };

  CombatSpriteEntity.prototype.draw = function (ctx) {
    if (!this.visible) return;
    const idleSheet = this.sheets.idle;
    const walkSheet = this.sheets.walk;
    const attackSheet = this.sheets.attack;
    ctx.save();
    const prevA = ctx.globalAlpha;
    ctx.globalAlpha = prevA * (this.state === ST.DEATH ? Math.max(0, this.deathAlpha) : 1);

    const ax = Math.round(this.anchorX * 10) / 10;
    const ay = Math.round(this.anchorY * 10) / 10;
    if (this.state === ST.WALK && walkSheet) {
      walkSheet.draw(ctx, this._idleFrame, ax, ay, this.drawH, this.flip);
    } else if (this.state === ST.ATTACK && attackSheet) {
      attackSheet.draw(ctx, this._attackFrame, ax, ay, this.drawH, this.flip);
    } else if (idleSheet) {
      idleSheet.draw(ctx, this._idleFrame, ax, ay, this.drawH, this.flip);
    }

    ctx.restore();
  };

  function ArenaCanvasCombatCore() {
    this.canvas = null;
    this.stageEl = null;
    this.ctx = null;
    this.dpr = 1;
    this._lastStageCssW = 0;
    this._lastStageCssH = 0;
    this.entities = [];
    this.player = null;
    this.enemy = null;
    this.rafId = null;
    this.lastNow = 0;
    this.engaged = false;
    this.walkPxPerSec = 238;
    this._ready = false;
    this._booting = false;
    this._pendingMelee = null;
    this._boundTick = this._tick.bind(this);
  }

  ArenaCanvasCombatCore.prototype._findCanvas = function () {
    return document.getElementById("arena-combat-canvas");
  };

  ArenaCanvasCombatCore.prototype._setHandoff = function (on) {
    const pArt = document.querySelector("#hero-player-1 .battle-hero-art");
    const eArt = document.querySelector("#hero-enemy-1 .battle-hero-art");
    [pArt, eArt].forEach(function (el) {
      if (!el) return;
      if (on) el.dataset.arenaCanvasHandoff = "1";
      else delete el.dataset.arenaCanvasHandoff;
    });
    if (this.stageEl) {
      this.stageEl.classList.toggle("arena-canvas-combat-on", !!on);
    }
  };

  ArenaCanvasCombatCore.prototype.ensureStage = function () {
    this.canvas = this._findCanvas();
    this.stageEl = document.querySelector("#arena-battle-page .arena-battle-stage");
    if (!this.canvas || !this.stageEl) return false;
    this.ctx = this.canvas.getContext("2d", { alpha: true });
    return !!this.ctx;
  };

  ArenaCanvasCombatCore.prototype.resize = function () {
    if (!this.canvas || !this.stageEl) return;
    const r = this.stageEl.getBoundingClientRect();
    const rw = r.width;
    const rh = r.height;
    if (
      this._lastStageCssW > 0 &&
      Math.abs(rw - this._lastStageCssW) < 0.5 &&
      Math.abs(rh - this._lastStageCssH) < 0.5
    ) {
      return;
    }
    this._lastStageCssW = rw;
    this._lastStageCssH = rh;
    this.dpr = Math.min(2.5, global.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rw * this.dpr));
    const h = Math.max(1, Math.floor(rh * this.dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.canvas.style.width = rw + "px";
    this.canvas.style.height = rh + "px";
  };

  ArenaCanvasCombatCore.prototype.syncAnchorsFromDom = function (opts) {
    opts = opts || {};
    if (!this.stageEl) return;
    const st = this.stageEl.getBoundingClientRect();
    const pArt = document.querySelector("#hero-player-1 .battle-hero-art");
    const eArt = document.querySelector("#hero-enemy-1 .battle-hero-art");
    if (!opts.skipPlayer && pArt && this.player) {
      const b = pArt.getBoundingClientRect();
      this.player.anchorX = b.left + b.width * 0.5 - st.left;
      this.player.anchorY = b.bottom - st.top;
    }
    if (!opts.skipEnemy && eArt && this.enemy) {
      const b = eArt.getBoundingClientRect();
      this.enemy.anchorX = b.left + b.width * 0.5 - st.left;
      this.enemy.anchorY = b.bottom - st.top;
    }
  };

  /**
   * مسار المشي على عرض المسرح (نفس إحداثيات الخلفية)، مش بس المسافة بين حافتي صندوقي الـ DOM.
   * يبدأ من مركز مجسم اللاعب وينتهي قدام مركز العدو على خط الأرض.
   */
  ArenaCanvasCombatCore.prototype._computeWalkEndPlayer = function () {
    const pArt = document.querySelector("#hero-player-1 .battle-hero-art");
    const eArt = document.querySelector("#hero-enemy-1 .battle-hero-art");
    if (!pArt || !eArt || !this.stageEl) return { endX: 0, startCss: 0 };
    const pr = pArt.getBoundingClientRect();
    const er = eArt.getBoundingClientRect();
    const st = this.stageEl.getBoundingClientRect();
    const stw = Math.max(1, st.width);
    const playerCx = pr.left + pr.width * 0.5 - st.left;
    const enemyCx = er.left + er.width * 0.5 - st.left;
    const standoff = Math.max(28, Math.min(96, er.width * 0.36));
    const span = enemyCx - playerCx;
    let endX;
    if (span > 12) {
      endX = enemyCx - standoff;
      const minWalk = Math.max(120, stw * 0.2);
      if (endX - playerCx < minWalk) {
        endX = playerCx + Math.min(minWalk, span * 0.85);
      }
      endX = Math.min(endX, enemyCx - standoff * 0.65);
    } else if (span < -12) {
      const spanL = playerCx - enemyCx;
      endX = enemyCx + standoff;
      const minWalk = Math.max(120, stw * 0.2);
      if (playerCx - endX < minWalk) {
        endX = playerCx - Math.min(minWalk, spanL * 0.85);
      }
      endX = Math.max(endX, enemyCx + standoff * 0.65);
    } else {
      endX = playerCx + Math.min(stw * 0.35, 220);
    }
    endX = Math.round(Math.min(stw - 10, Math.max(10, endX)));
    return { endX: endX, startCss: playerCx };
  };

  ArenaCanvasCombatCore.prototype._tick = function (now) {
    if (!this._ready || !this.ctx) return;
    const dt = this.lastNow ? Math.min(48, now - this.lastNow) : 16;
    this.lastNow = now;
    this.resize();

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const list = [];
    if (this.enemy) list.push(this.enemy);
    if (this.player) list.push(this.player);
    for (let i = 0; i < list.length; i++) {
      list[i].update(now, dt);
    }

    for (let j = 0; j < list.length; j++) {
      list[j].draw(this.ctx);
    }

    if (this.player && this.player.state === ST.WALK) {
      const t = (now - this.player._walkT0) / this.player._walkDurMs;
      if (t >= 1) {
        this.player.anchorX = this.player._walkEndX;
        if (typeof this.player._walkEndY === "number") {
          this.player.anchorY = this.player._walkEndY;
        }
        this.player._lockedGroundY = this.player.anchorY;
        this.player.setState(ST.IDLE);
        this.engaged = true;
        if (this._pendingMelee && this._pendingMelee.onEngaged) {
          try {
            this._pendingMelee.onEngaged();
          } catch (e) {}
        }
        this._pendingMelee = null;
      }
    }

    this.rafId = global.requestAnimationFrame(this._boundTick);
  };

  ArenaCanvasCombatCore.prototype.startLoop = function () {
    if (this.rafId != null) return;
    this.lastNow = 0;
    this.rafId = global.requestAnimationFrame(this._boundTick);
  };

  ArenaCanvasCombatCore.prototype.stopLoop = function () {
    if (this.rafId != null) {
      global.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastNow = 0;
  };

  ArenaCanvasCombatCore.prototype.resetForMatch = function () {
    this.stopLoop();
    this.engaged = false;
    this._ready = false;
    this._booting = false;
    this._pendingMelee = null;
    this.player = null;
    this.enemy = null;
    this.entities.length = 0;
    this._lastStageCssW = 0;
    this._lastStageCssH = 0;
    this._setHandoff(false);
    if (this.ctx && this.canvas) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  };

  ArenaCanvasCombatCore.prototype.freezeAfterBattle = function () {
    this.stopLoop();
    if (this.player && this.player.state !== ST.DEATH) {
      this.player.setState(ST.IDLE);
    }
    if (this.enemy && this.enemy.state !== ST.DEATH) {
      this.enemy.setState(ST.IDLE);
    }
    this._ready = true;
    this.lastNow = 0;
    this.rafId = global.requestAnimationFrame(this._boundTick);
  };

  ArenaCanvasCombatCore.prototype.markDead = function (side) {
    if (side === "player" && this.player) this.player.setState(ST.DEATH);
    if (side === "enemy" && this.enemy) this.enemy.setState(ST.DEATH);
  };

  ArenaCanvasCombatCore.prototype._buildEntity = function (cfg) {
    const sheets = {};
    if (cfg.idle) sheets.idle = new SpriteSheet(cfg.idle.img, cfg.idle.cols, cfg.idle.rows);
    if (cfg.walk) sheets.walk = new SpriteSheet(cfg.walk.img, cfg.walk.cols, cfg.walk.rows);
    if (cfg.attack) sheets.attack = new SpriteSheet(cfg.attack.img, cfg.attack.cols, cfg.attack.rows);
    return new CombatSpriteEntity({
      id: cfg.id,
      flip: cfg.flip,
      drawH: cfg.drawH,
      sheets: sheets,
      idleFps: cfg.idleFps,
      attackFps: cfg.attackFps,
    });
  };

  ArenaCanvasCombatCore.prototype.prepareBattle = function (playerHeroId, enemyHeroId) {
    const cx = getCtx();
    if (!cx) return Promise.reject();
    const pack = cx.spritePackForHero && cx.spritePackForHero(playerHeroId);
    if (!pack || !pack.walk || !pack.idle) return Promise.reject();

    const self = this;
    if (!this.ensureStage()) return Promise.reject();

    const layoutIdle = cx.layoutForUrl(pack.idle) || { cols: 8, rows: 8 };
    const layoutWalk = cx.layoutForUrl(pack.walk) || { cols: 8, rows: 8 };

    const enemyPack = cx.spritePackForHero && cx.spritePackForHero(enemyHeroId);
    const enemyFromSheet =
      (enemyPack && enemyPack.idle) ||
      (cx.idleSheetForHero && cx.idleSheetForHero(enemyHeroId)) ||
      null;
    const enemyIdleUrl =
      enemyFromSheet ||
      (cx.fallbackEnemyPortraitUrl && cx.fallbackEnemyPortraitUrl()) ||
      null;

    const loads = [loadImage(pack.idle), loadImage(pack.walk)];
    let enemyLayout = { cols: 1, rows: 1 };
    let enemyImgPromise = Promise.resolve(null);
    if (enemyIdleUrl) {
      enemyLayout = enemyFromSheet
        ? cx.layoutForUrl(enemyIdleUrl) || { cols: 5, rows: 5 }
        : { cols: 1, rows: 1 };
      if (enemyLayout.cols * enemyLayout.rows < 1) enemyLayout = { cols: 1, rows: 1 };
      enemyImgPromise = loadImage(enemyIdleUrl);
      loads.push(enemyImgPromise);
    }

    return Promise.all(loads).then(function (imgs) {
      const pIdle = imgs[0];
      const pWalk = imgs[1];
      const eIdle = enemyIdleUrl ? imgs[2] : null;

      self.resize();
      const cssH = self.stageEl.getBoundingClientRect().height;

      self.player = self._buildEntity({
        id: "player",
        flip: false,
        drawH: Math.min(200, cssH * 0.42),
        idle: { img: pIdle, cols: layoutIdle.cols, rows: layoutIdle.rows },
        walk: { img: pWalk, cols: layoutWalk.cols, rows: layoutWalk.rows },
        idleFps: cx.fps || 12,
        attackFps: cx.fps || 14,
      });
      self.syncAnchorsFromDom();

      if (eIdle) {
        self.enemy = self._buildEntity({
          id: "enemy",
          flip: true,
          drawH: self.player.drawH,
          idle: { img: eIdle, cols: enemyLayout.cols, rows: enemyLayout.rows },
          idleFps: cx.fps || 12,
        });
        self.syncAnchorsFromDom();
      } else {
        self.enemy = null;
      }

      const pathIdle = cx.getArenaWalkPath && cx.getArenaWalkPath();
      if (pathIdle && pathIdle.start && self.stageEl && self.player) {
        const stp = self.stageEl.getBoundingClientRect();
        self.player.anchorX = stp.width * pathIdle.start.x;
        self.player.anchorY = stp.height * pathIdle.start.y;
        self.player._lockedGroundY = self.player.anchorY;
      }

      self.player.setState(ST.IDLE);
      if (self.enemy) self.enemy.setState(ST.IDLE);
      self._setHandoff(true);
      self._ready = true;
      self.startLoop();
      return true;
    });
  };

  ArenaCanvasCombatCore.prototype.handlePackMelee = function (options) {
    const attackerEl = options.attackerEl;
    const artEl = options.artEl;
    const targetEl = options.targetEl;
    const onEngaged = options.onEngaged;
    const playerHeroId = options.playerHeroId;
    const enemyHeroId = options.enemyHeroId;
    const gameLeadEngaged = !!options.leadEngaged;

    if (!attackerEl || attackerEl.id !== "hero-player-1" || !artEl || !artEl.dataset.arenaPackWalk) {
      return false;
    }

    const self = this;
    if (!this.ensureStage()) return false;

    if (gameLeadEngaged) {
      this.engaged = true;
    }

    function goWalk() {
      if (!self.player) return;
      self.resize();
      if (self.player.state === ST.WALK) {
        return;
      }
      const cx = getCtx();
      const st = self.stageEl.getBoundingClientRect();
      const pch = cx.getArenaWalkPath && cx.getArenaWalkPath();
      const pathOk =
        pch &&
        pch.start &&
        pch.end &&
        typeof pch.start.x === "number" &&
        typeof pch.start.y === "number" &&
        typeof pch.end.x === "number" &&
        typeof pch.end.y === "number";

      let startX;
      let startY;
      let endX;
      let endY;

      if (pathOk) {
        startX = st.width * pch.start.x;
        startY = st.height * pch.start.y;
        endX = st.width * pch.end.x;
        endY = st.height * pch.end.y;
        self.player.anchorX = startX;
        self.player.anchorY = startY;
        self.player._lockedGroundY = startY;
      } else {
        self.syncAnchorsFromDom();
        startY = self.player.anchorY;
        const w = self._computeWalkEndPlayer();
        startX = self.player.anchorX;
        endX = w.endX;
        endY = startY;
      }

      const distCss = Math.hypot(endX - startX, endY - startY);
      const durMs = Math.max(520, (distCss / self.walkPxPerSec) * 1000);
      const walkCount = self.player.sheets.walk ? self.player.sheets.walk.count : 1;
      self.player.setState(ST.WALK, {
        startX: startX,
        endX: endX,
        startGroundY: startY,
        endGroundY: endY,
        t0: performance.now(),
        durMs: durMs,
        frameCount: walkCount,
        groundY: startY,
      });
      self._pendingMelee = {
        onEngaged: typeof onEngaged === "function" ? onEngaged : null,
      };
    }

    if (this._booting) {
      return true;
    }

    if (!this._ready || !this.player) {
      this._booting = true;
      this.prepareBattle(playerHeroId, enemyHeroId)
        .then(function () {
          self._booting = false;
          goWalk();
        })
        .catch(function () {
          self._booting = false;
          self._setHandoff(false);
        });
      return true;
    }

    if (this.engaged || gameLeadEngaged) {
      this.syncAnchorsFromDom({ skipPlayer: true });
      if (this.player) {
        this.player.setState(ST.IDLE);
      }
      return true;
    }

    goWalk();
    return true;
  };

  const core = new ArenaCanvasCombatCore();

  global.addEventListener("resize", function () {
    if (core._ready) core.resize();
  });

  global.ArenaCanvasCombat = {
    handlePackMelee: function (opts) {
      return core.handlePackMelee(opts);
    },
    resetForMatch: function () {
      core.resetForMatch();
    },
    freezeAfterBattle: function () {
      if (core._ready) core.freezeAfterBattle();
    },
    markDead: function (side) {
      core.markDead(side);
    },
    refreshLayout: function () {
      if (core._ready) {
        core.resize();
        core.syncAnchorsFromDom({ skipPlayer: !!core.engaged });
      }
    },
    isHandoffActive: function () {
      return !!core._ready && core.stageEl && core.stageEl.classList.contains("arena-canvas-combat-on");
    },
  };
})(typeof window !== "undefined" ? window : this);
