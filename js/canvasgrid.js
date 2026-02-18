class CRTCanvas {
  constructor(canvas, options = {}) {
    if (!canvas) return;
    this.canvas = canvas;
    this.config = Object.assign({
      gridSpacing: 3,
      gridLineWidth: 0.5,
      gridColor: 'rgba(255, 255, 0, 0.15)',
      accentLineEvery: 0,
      accentColor: 'rgba(255, 255, 0, 0.35)',
    }, options);
    this.ctx = this.canvas.getContext('2d');
    this.handleVisibility = this.handleVisibility.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.init();
  }

  init() {
    this.resize();
    this.animate();
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  handleResize() {
    this.resize();
  }

  handleVisibility() {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(this.raf);
    } else {
      this.animate();
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * ratio;
    this.canvas.height = rect.height * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawGrid() {
    const {
      gridSpacing,
      gridLineWidth,
      gridColor,
      accentLineEvery,
      accentColor,
    } = this.config;
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = gridLineWidth;
    this.ctx.save();
    this.ctx.beginPath();
    for (let x = 0; x <= this.width; x += gridSpacing) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
    }
    for (let y = 0; y <= this.height; y += gridSpacing) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
    }
    this.ctx.stroke();
    if (accentLineEvery > 1) {
      this.ctx.strokeStyle = accentColor;
      this.ctx.beginPath();
      for (let x = 0; x <= this.width; x += gridSpacing * accentLineEvery) {
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
      }
      for (let y = 0; y <= this.height; y += gridSpacing * accentLineEvery) {
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.width, y);
      }
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  animate() {
    this.clear();
    this.drawGrid();
    this.raf = requestAnimationFrame(() => this.animate());
  }
}

function initCRTCanvas(selector, options = {}) {
  document.querySelectorAll(selector).forEach(canvas => {
    new CRTCanvas(canvas, options);
  });
}

function bootstrapCRTCanvas() {
  initCRTCanvas('.crt-overlay-canvas');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapCRTCanvas);
} else {
  bootstrapCRTCanvas();
}
