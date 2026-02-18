/**
 * JEDI - Weapons Control System
 * Main script for the weapon system control interface
 */

// =============================================
// Constants & global configuration
// =============================================
const CONFIG = {
  DEFAULT_ROUNDS: 500,
  DEFAULT_TIME: 33.33,
  DEFAULT_TEMP_LEVEL: 30,
  DEFAULT_RXM_LEVEL: 0,
  DEFAULT_SPECTRAL_PROFILE: "INERT",
  LOW_AMMO_THRESHOLD: 100,
  GAUGE_UPDATE_INTERVAL: 500, // ms
  TEST_SEQUENCE_DURATION: 3000, // ms
  TEST_COMPLETE_DISPLAY_TIME: 1000, // ms
};

// =============================================
// Audio management
// =============================================
class AudioManager {
  constructor() {
    this.soundConfig = {
      buttonClick: 'sounds/buttonclick.opus',
      criticalWarning: 'sounds/bip.opus',
      gameOver: 'sounds/gameover.opus',
    };
    this.sounds = {};
  }

  _getSound(soundName) {
    if (this.sounds[soundName]) {
      return this.sounds[soundName];
    }
    const src = this.soundConfig[soundName];
    if (!src) return null;
    const audio = new Audio(src);
    audio.preload = 'auto';
    this.sounds[soundName] = audio;
    return audio;
  }

  playSound(soundName, options = {}) {
    const sound = this._getSound(soundName);
    if (!sound) {
      console.warn(`Sound '${soundName}' not found`);
      return;
    }
    sound.pause();
    sound.currentTime = 0;
    if (options.loop !== undefined) sound.loop = options.loop;
    if (options.volume !== undefined) sound.volume = options.volume;
    sound.play().catch(error => {
      console.warn(`Error playing '${soundName}' sound:`, error);
    });
  }

  stopSound(soundName) {
    const sound = this.sounds[soundName];
    if (!sound) return;
    sound.pause();
    sound.currentTime = 0;
    sound.loop = false;
  }
}

// =============================================
// User interface management
// =============================================
class UIManager {
  constructor() {
    this.elements = {
      roundsValue: document.getElementById('rounds-value'),
      timeValue: document.getElementById('time-value'),
      tempGauge: document.getElementById('temp-gauge'),
      rxmGauge: document.getElementById('rxm-gauge'),
      radarScan: document.querySelector('.radar-scan'),
      criticalWarning: document.getElementById('critical-warning'),
      criticalText: document.getElementById('critical-text'),
      weaponStatusOptions: document.querySelectorAll('#weapon-status-options .control-option'),
      iffStatusOptions: document.querySelectorAll('#iff-status-options .control-option'),
      targetProfileOptions: document.querySelectorAll('#target-profile-options .control-option'),
      targetSelectOptions: document.querySelectorAll('#target-select-options .control-option'),
      spectralProfileOptions: document.querySelectorAll('#spectral-profile-options .control-option'),
    };
    Object.entries(this.elements).forEach(([key, el]) => {
      if (!el) {
        console.warn(`Missing UI element: ${key}`);
      }
    });
  }

  getSelectedOption(groupId) {
    const selector = `#${groupId}-options .selected`;
    const element = document.querySelector(selector);
    return element ? element.getAttribute('data-value') : null;
  }

  selectOption(groupId, value) {
    document.querySelectorAll(`#${groupId}-options .control-option`).forEach(opt => {
      opt.classList.remove('selected');
    });
    const target = document.querySelector(`#${groupId}-options [data-value="${value}"]`);
    if (target) {
      target.classList.add('selected');
      return true;
    }
    return false;
  }

  updateGauges(tempLevel, rxmLevel) {
    if (this.elements.tempGauge) this.elements.tempGauge.style.height = `${tempLevel}%`;
    if (this.elements.rxmGauge) this.elements.rxmGauge.style.height = `${rxmLevel}%`;
  }

  updateDisplayValues(rounds, time) {
    if (this.elements.roundsValue) this.elements.roundsValue.textContent = rounds;
    if (this.elements.timeValue) this.elements.timeValue.textContent = this.formatTime(time);
  }

  updateScanLineColor(targetSelect, spectralProfile) {
    const radar = this.elements.radarScan;
    if (!radar) return;
    if (spectralProfile === "INERT") {
      radar.style.display = 'none';
      return;
    }
    radar.style.display = 'block';
    const colors = {
      "INFRA RED": 'rgba(255, 0, 0, 0.3)',
      "UV": 'rgba(138, 43, 226, 0.3)',
      "MULTI SPEC": 'rgba(255, 255, 0, 0.3)',
    };
    radar.style.backgroundColor = colors[targetSelect] || colors["MULTI SPEC"];
  }

  showCriticalWarning(message = "CRITICAL") {
    if (this.elements.criticalText) this.elements.criticalText.textContent = message;
    if (this.elements.criticalWarning) this.elements.criticalWarning.style.display = 'block';
  }

  hideCriticalWarning() {
    if (this.elements.criticalWarning) this.elements.criticalWarning.style.display = 'none';
  }

  setTestWarningStyle(isComplete = false) {
    const text = this.elements.criticalText;
    if (!text) return;
    if (isComplete) {
      text.textContent = "COMPLETE";
      text.style.backgroundColor = '#ffff00';
      text.style.color = '#000';
    } else {
      text.textContent = "TESTING";
      text.style.backgroundColor = '';
      text.style.color = '';
    }
  }

  setBlinking(elements, blinking = true) {
    elements.forEach(element => {
      if (!element) return;
      if (blinking) element.classList.add('blinking');
      else element.classList.remove('blinking');
    });
  }

  formatTime(time) {
    const seconds = Math.floor(time);
    const centiseconds = Math.floor((time - seconds) * 100);
    const displaySeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    const displayCentiseconds = centiseconds < 10 ? `0${centiseconds}` : `${centiseconds}`;
    return `${displaySeconds}.${displayCentiseconds}`;
  }
}

// =============================================
// Weapon system controller
// =============================================
class WeaponSystem {
  constructor(audioManager, uiManager) {
    this.audioManager = audioManager;
    this.ui = uiManager;
    this.state = {
      currentRounds: CONFIG.DEFAULT_ROUNDS,
      currentTime: CONFIG.DEFAULT_TIME,
      tempLevel: CONFIG.DEFAULT_TEMP_LEVEL,
      rxmLevel: CONFIG.DEFAULT_RXM_LEVEL,
      spectralProfile: CONFIG.DEFAULT_SPECTRAL_PROFILE,
      targetRounds: CONFIG.DEFAULT_ROUNDS,
      targetTime: CONFIG.DEFAULT_TIME,
      isWarningActive: false,
      inTestMode: false,
      isPaused: false,
      firingInterval: null,
      cooldownInterval: null,
    };
    this._validateUI();
    this._initializeEventListeners();
    this._initializeUI();
  }

  _validateUI() {
    ['roundsValue', 'timeValue', 'tempGauge', 'rxmGauge'].forEach(key => {
      if (!this.ui.elements[key]) {
        console.warn(`WeaponSystem missing UI reference: ${key}`);
      }
    });
  }

  _initializeEventListeners() {
    document.querySelectorAll('.control-option').forEach(option => {
      option.setAttribute('tabindex', '0');
      option.setAttribute('role', 'button');
      option.addEventListener('click', this._handleControlOptionClick.bind(this));
      option.addEventListener('keydown', this._handleControlOptionKeydown.bind(this));
    });
    document.addEventListener('DOMContentLoaded', this._handleDOMContentLoaded.bind(this));
  }

  _initializeUI() {
    this.ui.updateGauges(this.state.tempLevel, this.state.rxmLevel);
    this.ui.updateDisplayValues(this.state.currentRounds, this.state.currentTime);
    const target = this.ui.getSelectedOption('target-select');
    this.ui.updateScanLineColor(target, this.state.spectralProfile);
  }

  _handleControlOptionClick(event) {
    const option = event.currentTarget;
    const value = option.getAttribute('data-value');
    const group = option.parentElement.id.replace('-options', '');
    this.audioManager.playSound('buttonClick');
    option.parentElement.querySelectorAll('.control-option').forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    switch (group) {
      case 'iff-status':
        if (value === 'TEST') this.runTestSequence();
        else this.simulateEngagement();
        break;
      case 'spectral-profile':
        this.state.spectralProfile = value;
        this.ui.updateScanLineColor(this.ui.getSelectedOption('target-select'), value);
        break;
      case 'target-select':
        this.ui.updateScanLineColor(value, this.state.spectralProfile);
        break;
      default:
        this.simulateEngagement();
    }
  }

  _handleControlOptionKeydown(event) {
    const { key } = event;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this._handleControlOptionClick(event);
    } else if (key === 'ArrowRight' || key === 'ArrowDown') {
      event.preventDefault();
      this._moveOptionFocus(event.currentTarget, 'next');
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      event.preventDefault();
      this._moveOptionFocus(event.currentTarget, 'prev');
    }
  }

  _moveOptionFocus(option, direction) {
    const options = Array.from(option.parentElement.querySelectorAll('.control-option'));
    if (!options.length) return;
    const currentIndex = options.indexOf(option);
    if (currentIndex === -1) return;
    const delta = direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + delta + options.length) % options.length;
    options[nextIndex].focus();
  }

  _handleDOMContentLoaded() {
    const initialProfile = document.querySelector('#spectral-profile-options .selected');
    if (initialProfile) {
      this.state.spectralProfile = initialProfile.getAttribute('data-value');
    }
    this.ui.updateScanLineColor(this.ui.getSelectedOption('target-select'), this.state.spectralProfile);
  }

  runTestSequence() {
    if (this.state.inTestMode) return;
    this.state.inTestMode = true;
    const originalRounds = this.ui.elements.roundsValue?.textContent;
    const originalTime = this.ui.elements.timeValue?.textContent;
    const originalTemp = this.state.tempLevel;
    const originalRxm = this.state.rxmLevel;
    this.stopFiring();
    this.state.isWarningActive = false;
    this.ui.setBlinking([this.ui.elements.roundsValue, this.ui.elements.timeValue], true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step <= 10) {
        this.state.tempLevel = Math.min(originalTemp + step * 7, 100);
        this.state.rxmLevel = Math.min(step * 10, 100);
      } else if (step <= 20) {
        this.state.tempLevel = Math.max(100 - (step - 10) * 7, originalTemp);
        this.state.rxmLevel = Math.max(100 - (step - 10) * 10, originalRxm);
      }
      this.ui.updateGauges(this.state.tempLevel, this.state.rxmLevel);
      if (step >= 20) {
        clearInterval(interval);
      }
    }, 150);
    this.ui.showCriticalWarning("TESTING");
    setTimeout(() => {
      clearInterval(interval);
      this.ui.setTestWarningStyle(true);
      setTimeout(() => {
        this.ui.hideCriticalWarning();
        this.ui.setBlinking([this.ui.elements.roundsValue, this.ui.elements.timeValue], false);
        if (this.ui.elements.roundsValue && originalRounds) {
          this.ui.elements.roundsValue.textContent = originalRounds;
        }
        if (this.ui.elements.timeValue && originalTime) {
          this.ui.elements.timeValue.textContent = originalTime;
        }
        this.state.tempLevel = originalTemp;
        this.state.rxmLevel = originalRxm;
        this.ui.updateGauges(this.state.tempLevel, this.state.rxmLevel);
        this.ui.setTestWarningStyle(false);
        this.ui.selectOption('iff-status', 'SEARCH');
        this.state.inTestMode = false;
      }, CONFIG.TEST_COMPLETE_DISPLAY_TIME);
    }, CONFIG.TEST_SEQUENCE_DURATION);
  }

  simulateEngagement() {
    const weaponStatus = this.ui.getSelectedOption('weapon-status');
    const iffStatus = this.ui.getSelectedOption('iff-status');
    if (weaponStatus === "ARMED" && iffStatus === "ENGAGED") {
      this.state.tempLevel = 60;
      this.state.isPaused = false;
      this.startFiring();
    } else if (weaponStatus === "SAFE") {
      this.stopFiring();
      this.state.isPaused = true;
      this.ui.selectOption('iff-status', 'SEARCH');
      this.state.rxmLevel = 0;
      this.state.tempLevel = 30;
      this.ui.updateGauges(this.state.tempLevel, this.state.rxmLevel);
    } else {
      this.stopFiring();
      this.state.isPaused = true;
      this.state.rxmLevel = 0;
      this.ui.updateGauges(this.state.tempLevel, this.state.rxmLevel);
    }
    if (this.state.firingInterval && !this.state.isPaused) {
      clearInterval(this.state.firingInterval);
      this.startFiring();
    }
  }

  getFireRate() {
    const profile = this.ui.getSelectedOption('target-profile');
    switch (profile) {
      case "SOFT":
        return { fireInterval: 500, burstSize: 1, pauseAfterBurst: 0 };
      case "STANDARD":
        return { fireInterval: 100, burstSize: 3, pauseAfterBurst: 200 };
      case "HARD":
        return { fireInterval: 50, burstSize: Infinity, pauseAfterBurst: 0 };
      default:
        return { fireInterval: 300, burstSize: 1, pauseAfterBurst: 0 };
    }
  }

  startFiring() {
    if (this.state.firingInterval) clearInterval(this.state.firingInterval);
    if (!this.state.isPaused) {
      this.state.targetRounds = 0;
      this.state.targetTime = 0;
    }
    const rate = this.getFireRate();
    let shotCounter = 0;
    this.state.firingInterval = setInterval(() => {
      if (!this.state.isPaused && this.state.currentRounds > 0) {
        this.state.currentRounds--;
        this.state.currentTime = (CONFIG.DEFAULT_TIME * this.state.currentRounds) / CONFIG.DEFAULT_ROUNDS;
        this.ui.updateDisplayValues(this.state.currentRounds, this.state.currentTime);
        this.state.rxmLevel = Math.min(this.state.rxmLevel + 1, 100);
        this.state.tempLevel = Math.min(this.state.tempLevel + 0.5, 90);
        this.ui.updateGauges(this.state.tempLevel, this.state.rxmLevel);
        this.checkCriticalStatus();
        shotCounter++;
        if (shotCounter >= rate.burstSize && rate.pauseAfterBurst > 0) {
          clearInterval(this.state.firingInterval);
          setTimeout(() => this.startFiring(), rate.pauseAfterBurst);
          shotCounter = 0;
        }
      }
      if (this.state.currentRounds <= 0) {
        this.state.currentRounds = 0;
        this.ui.updateDisplayValues(0, 0);
        this.stopFiring();
        this.ui.selectOption('weapon-status', 'SAFE');
        this.ui.selectOption('iff-status', 'SEARCH');
      }
    }, rate.fireInterval);
  }

  stopFiring() {
    if (this.state.firingInterval) clearInterval(this.state.firingInterval);
    if (this.state.cooldownInterval) clearInterval(this.state.cooldownInterval);
    this.state.cooldownInterval = setInterval(() => {
      this.state.tempLevel = Math.max(this.state.tempLevel - 5, 30);
      this.state.rxmLevel = Math.max(this.state.rxmLevel - 10, 0);
      this.ui.updateGauges(this.state.tempLevel, this.state.rxmLevel);
      if (this.state.tempLevel <= 30 && this.state.rxmLevel <= 0) {
        clearInterval(this.state.cooldownInterval);
        this.state.cooldownInterval = null;
      }
    }, CONFIG.GAUGE_UPDATE_INTERVAL);
    if (this.state.currentRounds <= 0) {
      this.deactivateCriticalWarning();
      this.audioManager.playSound('gameOver');
    }
  }

  checkCriticalStatus() {
    if (this.state.currentRounds <= CONFIG.LOW_AMMO_THRESHOLD && this.state.currentRounds > 0) {
      this.activateCriticalWarning();
    } else if (this.state.currentRounds <= 0) {
      this.deactivateCriticalWarning();
    }
  }

  activateCriticalWarning() {
    if (this.state.isWarningActive) return;
    this.state.isWarningActive = true;
    this.audioManager.playSound('criticalWarning', { loop: true });
    this.ui.showCriticalWarning();
  }

  deactivateCriticalWarning() {
    if (!this.state.isWarningActive) return;
    this.state.isWarningActive = false;
    this.audioManager.stopSound('criticalWarning');
    this.ui.hideCriticalWarning();
  }
}

// =============================================
// Application initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  const audioManager = new AudioManager();
  const uiManager = new UIManager();
  const weaponSystem = new WeaponSystem(audioManager, uiManager);
  window.audioManager = audioManager;
  window.uiManager = uiManager;
  window.weaponSystem = weaponSystem;
});
