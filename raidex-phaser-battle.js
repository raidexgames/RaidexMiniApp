/**
 * Raidex Phaser 3 Battle — test scene (Garruk vs Orc).
 * Modular Hero + state machine: idle → walk → attack → death
 */
(function () {
  "use strict";

  const STATES = Object.freeze({
    IDLE: "idle",
    WALK: "walk",
    ATTACK: "attack",
    DEATH: "death",
  });

  /** شبكة الشيت (متوافقة مع garruk 8×8 في المشروع) */
  const DEFAULT_GRID = { cols: 8, rows: 8 };

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

  function createLoopAnim(scene, animKey, sheetKey, endFrame, frameRate) {
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(sheetKey, { start: 0, end: endFrame }),
        frameRate: frameRate,
        repeat: -1,
      });
    }
  }

  function createOnceAnim(scene, animKey, sheetKey, endFrame, frameRate) {
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(sheetKey, { start: 0, end: endFrame }),
        frameRate: frameRate,
        repeat: 0,
      });
    }
  }

  class Hero {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} cfg
     */
    constructor(scene, cfg) {
      this.scene = scene;
      this.team = cfg.team;
      this.displayName = cfg.displayName || "Hero";
      this.maxHp = cfg.maxHp || 100;
      this.hp = this.maxHp;
      this.damage = cfg.damage || 12;
      this.attackRange = cfg.attackRange || 140;
      this.walkSpeed = cfg.walkSpeed || 220;
      this.animKeys = cfg.animKeys;
      this.sheetKeys = cfg.sheetKeys;
      this.visualScale = cfg.visualScale != null ? cfg.visualScale : 0.32;
      this._meleeExitPad = cfg.meleeExitPad != null ? cfg.meleeExitPad : 42;
      this.sprite = scene.add.sprite(cfg.x, cfg.y, cfg.sheetKeys.idle, 0);
      this.sprite.setScale(this.visualScale);
      this.sprite.setDepth(cfg.depth != null ? cfg.depth : 0);
      scene.physics.add.existing(this.sprite, false);
      this.body = this.sprite.body;
      this.body.setCollideWorldBounds(true);
      const bw = Math.max(28, Math.round(this.sprite.displayWidth * 0.28));
      const bh = Math.max(40, Math.round(this.sprite.displayHeight * 0.38));
      this.body.setSize(bw, bh);
      const dw = this.sprite.displayWidth;
      const dh = this.sprite.displayHeight;
      this.body.setOffset(Math.max(0, (dw - bw) * 0.5), Math.max(0, dh - bh * 0.92));
      if (typeof this.sprite.refreshBody === "function") {
        this.sprite.refreshBody();
      }

      this._dragIdle = 120;
      this.body.setDrag(this._dragIdle, this._dragIdle);
      this.body.setMaxVelocity(this.walkSpeed * 1.35, this.walkSpeed * 1.35);

      this.state = STATES.IDLE;
      this.target = null;
      this.enemies = [];
      this._battleEnded = false;
      this._atkDmgEvent = null;

      this._buildHpBar();
      this._playIdle();
    }

    _edgeDistanceTo(other) {
      const hwA = this.sprite.displayWidth * 0.38;
      const hwB = other.sprite.displayWidth * 0.38;
      const cx = this.sprite.x - other.sprite.x;
      const cy = this.sprite.y - other.sprite.y;
      const center = Math.sqrt(cx * cx + cy * cy);
      return Math.max(0, center - hwA - hwB);
    }

    _buildHpBar() {
      const w = 72;
      const h = 8;
      const yOff = -76;
      this.hpBg = this.scene.add.rectangle(this.sprite.x, this.sprite.y + yOff, w, h, 0x374151);
      this.hpFill = this.scene.add.rectangle(
        this.sprite.x - w / 2,
        this.sprite.y + yOff,
        w - 2,
        h - 2,
        0x22c55e
      );
      this.hpFill.setOrigin(0, 0.5);
      this.hpBg.setDepth(this.sprite.depth + 10);
      this.hpFill.setDepth(this.sprite.depth + 11);
      this._hpW = w - 2;
      this._hpYOff = yOff;
    }

    setEnemies(list) {
      this.enemies = list.filter((h) => h !== this);
    }

    _safePlayAnim(key) {
      const cur = this.sprite.anims.currentAnim;
      if (cur && cur.key === key) return;
      this.sprite.anims.play(key);
    }

    _stopAttackDamageLoop() {
      if (this._atkDmgEvent) {
        this._atkDmgEvent.destroy();
        this._atkDmgEvent = null;
      }
    }

    _startAttackDamageLoop() {
      const self = this;
      this._stopAttackDamageLoop();
      this._atkDmgEvent = this.scene.time.addEvent({
        delay: 480,
        loop: true,
        callback: function () {
          if (self.state !== STATES.ATTACK || !self.target || self.scene.combatFrozen) return;
          if (!self.target.sprite || !self.target.sprite.active) return;
          self.target.takeDamage(self.damage);
        },
      });
    }

    findTarget() {
      let best = null;
      let bestD = Infinity;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (!e || !e.sprite || !e.sprite.active || e.hp <= 0 || e.state === STATES.DEATH) continue;
        const d = Phaser.Math.Distance.Between(
          this.sprite.x,
          this.sprite.y,
          e.sprite.x,
          e.sprite.y
        );
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      this.target = best;
    }

    _playIdle() {
      this.state = STATES.IDLE;
      this._stopAttackDamageLoop();
      this.body.setDrag(this._dragIdle, this._dragIdle);
      this.body.setVelocity(0, 0);
      this._safePlayAnim(this.animKeys.idle);
    }

    _playWalk() {
      this.state = STATES.WALK;
      this._stopAttackDamageLoop();
      this.body.setDrag(0, 0);
      this._safePlayAnim(this.animKeys.walk);
    }

    _playAttack() {
      this.state = STATES.ATTACK;
      this.body.setDrag(this._dragIdle, this._dragIdle);
      this.body.setVelocity(0, 0);
      this.sprite.anims.play(this.animKeys.attack);
      this._startAttackDamageLoop();
    }

    _playDeathThenHide() {
      this.state = STATES.DEATH;
      this._stopAttackDamageLoop();
      this.body.setVelocity(0, 0);
      if (this.animKeys.death && this.scene.anims.exists(this.animKeys.death)) {
        this.sprite.anims.play(this.animKeys.death, false);
        this.sprite.once("animationcomplete", () => this._fadeOut());
      } else {
        this._fadeOut();
      }
    }

    _fadeOut() {
      this.scene.tweens.add({
        targets: [this.sprite, this.hpBg, this.hpFill],
        alpha: 0,
        duration: 420,
        onComplete: () => {
          this.sprite.setActive(false).setVisible(false);
          this.hpBg.setVisible(false);
          this.hpFill.setVisible(false);
        },
      });
    }

    takeDamage(amount) {
      if (this.state === STATES.DEATH || this._battleEnded) return;
      if (this.scene.combatFrozen) return;
      const dmg = Number(amount) || 0;
      this.hp = Math.max(0, this.hp - dmg);
      this._refreshHpBar();
      if (this.hp <= 0) {
        this.die();
      }
    }

    die() {
      if (this.state === STATES.DEATH) return;
      this._playDeathThenHide();
    }

    _refreshHpBar() {
      const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
      this.hpFill.width = Math.max(0, this._hpW * ratio);
      this.hpFill.fillColor = ratio > 0.35 ? 0x22c55e : ratio > 0.15 ? 0xeab308 : 0xef4444;
    }

    _updateHpBarPosition() {
      const x = Math.round(this.sprite.x);
      const y = Math.round(this.sprite.y + this._hpYOff);
      this.hpBg.setPosition(x, y);
      const left = Math.round(x - this._hpW / 2 - 1);
      this.hpFill.setPosition(left, y);
    }

    update(time, delta) {
      if (this.state === STATES.DEATH || !this.sprite.active) {
        this._updateHpBarPosition();
        return;
      }

      if (this.scene.combatFrozen) {
        this.body.setDrag(this._dragIdle, this._dragIdle);
        this.body.setVelocity(0, 0);
        if (this.state !== STATES.IDLE && this.state !== STATES.DEATH) {
          this._playIdle();
        }
        this._updateHpBarPosition();
        return;
      }

      this.findTarget();

      if (!this.target || this.target.state === STATES.DEATH || this.target.hp <= 0) {
        if (this.state !== STATES.IDLE) {
          this._playIdle();
        }
        this._updateHpBarPosition();
        return;
      }

      const dist = this._edgeDistanceTo(this.target);
      const enterR = this.attackRange;
      const exitR = this.attackRange + this._meleeExitPad;

      if (this.state === STATES.ATTACK) {
        if (dist > exitR) {
          this.body.setDrag(0, 0);
          const tx = this.target.sprite.x;
          const ty = this.target.sprite.y;
          const ang = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);
          this.body.setVelocity(Math.cos(ang) * this.walkSpeed, Math.sin(ang) * this.walkSpeed);
          this._playWalk();
        } else {
          this.body.setDrag(this._dragIdle, this._dragIdle);
          this.body.setVelocity(0, 0);
        }
      } else if (dist <= enterR) {
        this.body.setDrag(this._dragIdle, this._dragIdle);
        this.body.setVelocity(0, 0);
        this._playAttack();
      } else {
        this.body.setDrag(0, 0);
        const tx = this.target.sprite.x;
        const ty = this.target.sprite.y;
        const ang = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);
        this.body.setVelocity(Math.cos(ang) * this.walkSpeed, Math.sin(ang) * this.walkSpeed);
        if (this.state !== STATES.WALK) {
          this._playWalk();
        }
      }

      this._updateHpBarPosition();
    }
  }

  class BattleScene extends Phaser.Scene {
    constructor() {
      super({ key: "BattleScene" });
    }

    preload() {
      this.load.image("_g_idle", "images/garruk/garruk-idle.png");
      this.load.image("_g_walk", "images/garruk/garruk-walk.png");
      this.load.image("_g_attack", "images/garruk/garruk-attack.png");
      this.load.image("_m_idle", "images/morvex/morvex-idle.png");
      this.load.image("_m_idle_atk", "images/morvex/morvex-idle.png");
      this.load.image("_m_walk", "images/morvex/morvex-walk.png");
    }

    create() {
      const g = DEFAULT_GRID;
      const gIdle = addSpriteSheetFromImageKey(this, "sheet_g_idle", "_g_idle", g.cols, g.rows);
      addSpriteSheetFromImageKey(this, "sheet_g_walk", "_g_walk", g.cols, g.rows);
      addSpriteSheetFromImageKey(this, "sheet_g_attack", "_g_attack", g.cols, g.rows);

      const m = DEFAULT_GRID;
      const mIdle = addSpriteSheetFromImageKey(this, "sheet_m_idle", "_m_idle", m.cols, m.rows);
      addSpriteSheetFromImageKey(this, "sheet_m_walk", "_m_walk", m.cols, m.rows);
      addSpriteSheetFromImageKey(this, "sheet_m_attack", "_m_idle_atk", m.cols, m.rows);

      createLoopAnim(this, "anim_g_idle", "sheet_g_idle", gIdle.endFrame, 11);
      createLoopAnim(this, "anim_g_walk", "sheet_g_walk", gIdle.endFrame, 14);
      createLoopAnim(this, "anim_g_attack", "sheet_g_attack", gIdle.endFrame, 18);

      createLoopAnim(this, "anim_m_idle", "sheet_m_idle", mIdle.endFrame, 10);
      createLoopAnim(this, "anim_m_walk", "sheet_m_walk", mIdle.endFrame, 12);
      createLoopAnim(this, "anim_m_attack", "sheet_m_attack", mIdle.endFrame, 14);

      const w = this.scale.width;
      const h = this.scale.height;
      this.physics.world.setBounds(-80, -80, w + 160, h + 160);
      this.add.rectangle(w / 2, h / 2, w, h, 0x0f172a);
      this.add.text(w / 2, 28, "Raidex Phaser Battle — Auto", {
        fontSize: "18px",
        color: "#e2e8f0",
      }).setOrigin(0.5);

      const garruk = new Hero(this, {
        team: "player",
        displayName: "Garruk",
        x: w * 0.2,
        y: h * 0.58,
        depth: 6,
        visualScale: 0.3,
        maxHp: 220,
        damage: 18,
        attackRange: 56,
        meleeExitPad: 38,
        walkSpeed: 200,
        sheetKeys: { idle: "sheet_g_idle", walk: "sheet_g_walk", attack: "sheet_g_attack" },
        animKeys: { idle: "anim_g_idle", walk: "anim_g_walk", attack: "anim_g_attack" },
      });

      const orc = new Hero(this, {
        team: "enemy",
        displayName: "Orc",
        x: w * 0.8,
        y: h * 0.58,
        depth: 5,
        visualScale: 0.3,
        maxHp: 180,
        damage: 14,
        attackRange: 56,
        meleeExitPad: 38,
        walkSpeed: 200,
        sheetKeys: { idle: "sheet_m_idle", walk: "sheet_m_walk", attack: "sheet_m_attack" },
        animKeys: { idle: "anim_m_idle", walk: "anim_m_walk", attack: "anim_m_attack" },
      });

      garruk.sprite.setFlipX(false);
      orc.sprite.setFlipX(true);

      this.heroes = [garruk, orc];
      garruk.setEnemies(this.heroes);
      orc.setEnemies(this.heroes);

      this._winnerSettled = false;
      this.combatFrozen = false;
      this.heroesRef = this.heroes;
    }

    update(time, delta) {
      for (let i = 0; i < this.heroesRef.length; i++) {
        this.heroesRef[i].update(time, delta);
      }

      if (this._winnerSettled) return;

      const alive = this.heroesRef.filter((h) => h.hp > 0 && h.state !== STATES.DEATH);
      if (alive.length === 1) {
        this._winnerSettled = true;
        this.combatFrozen = true;
        const w = alive[0];
        w._battleEnded = true;
        w._playIdle();
        this.heroesRef.forEach((h) => {
          h._battleEnded = true;
        });
        this.add
          .text(this.scale.width / 2, this.scale.height * 0.88, w.displayName + " wins — idle at position", {
            fontSize: "16px",
            color: "#86efac",
          })
          .setOrigin(0.5);
      } else if (alive.length === 0) {
        this._winnerSettled = true;
        this.combatFrozen = true;
        this.add
          .text(this.scale.width / 2, this.scale.height * 0.88, "Draw", {
            fontSize: "16px",
            color: "#94a3b8",
          })
          .setOrigin(0.5);
      }
    }
  }

  function start() {
    const parent = document.getElementById("game-container");
    if (!parent) return;

    const config = {
      type: Phaser.AUTO,
      parent,
      width: Math.min(window.innerWidth, 960),
      height: Math.min(window.innerHeight, 640),
      backgroundColor: "#0c1222",
      physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { y: 0 } },
      },
      scene: [BattleScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    new Phaser.Game(config);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
