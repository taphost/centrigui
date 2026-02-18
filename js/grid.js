/**
 * Yellow Grid Animation - Optimized Script
 * Creates a perspective grid with smooth movement
 */
(function() {
    'use strict';

    const CANVAS_SIZE = { width: 1024, height: 800 };
    
    const GRID_CONFIG = {
        cellSizeZ: 1000,      // Cell depth size
        cellSizeX: 1000,      // Cell width size
        gridWidth: 200,       // Horizontal cells count
        gridDepth: 200,       // Depth cells count
        speed: 3.0,           // Movement speed
        color: '#aaaa00',     // Grid color
        lineWidth: 2,         // Line thickness
        horizon: 0.38,        // Horizon position (0-1)
        overlayHeight: 100,   // Overlay height fallback
        anisotropicBlur: 0.01 // Anisotropic blur factor
    };

    const PERSPECTIVE_FACTOR = 0.0005;
    const VERTICAL_LINE_SCALE_FACTOR = 4;
    const VERTICAL_LINE_DENSITY_FACTOR = 4;
    const ALPHA_FALLOFF_OFFSET = 0.2;

    const overlayElement = document.querySelector('.grid-overlay');
    const canvas = document.getElementById('gridCanvas');
    if (!canvas) {
        console.warn('Grid canvas is missing; animation cannot start.');
        return;
    }
    const ctx = canvas.getContext('2d');

    const deviceRatio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.style.width = `${CANVAS_SIZE.width}px`;
    canvas.style.height = `${CANVAS_SIZE.height}px`;
    canvas.width = CANVAS_SIZE.width * deviceRatio;
    canvas.height = CANVAS_SIZE.height * deviceRatio;
    ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);

    const vanishingPoint = {
        x: CANVAS_SIZE.width / 2,
        y: CANVAS_SIZE.height * GRID_CONFIG.horizon
    };

    const HORIZON_DIFF = CANVAS_SIZE.height - vanishingPoint.y;
    const DEPTH_LIMIT = GRID_CONFIG.gridDepth * GRID_CONFIG.cellSizeZ;

    let state = {
        gridPosition: 0,
        animationId: null
    };
    
    /**
     * Starts the grid animation if it is not already running
     */
    function init() {
        startAnimation();
    }
    
    /**
     * Main animation loop
     */
    function animate() {
        state.animationId = requestAnimationFrame(animate);
        
        ctx.clearRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
        state.gridPosition = (state.gridPosition + GRID_CONFIG.speed) % GRID_CONFIG.cellSizeZ;
        drawGrid();
    }

    function startAnimation() {
        if (!state.animationId) {
            animate();
        }
    }

    function stopAnimation() {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
            state.animationId = null;
        }
    }
    
    function getOverlayHeight() {
        return overlayElement ? overlayElement.offsetHeight : GRID_CONFIG.overlayHeight;
    }

    function computeScale(depth) {
        return 1 / (depth * PERSPECTIVE_FACTOR + 1);
    }

    function computePerspectiveY(scale) {
        return vanishingPoint.y + HORIZON_DIFF * scale;
    }

    function computeAnisotropicFactor(amount, multiplier = 0.01) {
        return Math.max(1, GRID_CONFIG.anisotropicBlur * amount * multiplier);
    }

    function computeGridOpacity(depth) {
        return Math.min(1, 1 - (depth / DEPTH_LIMIT) + ALPHA_FALLOFF_OFFSET);
    }

    function computeHorizontalOpacity(distance, halfWidth) {
        return Math.min(1, 1 - (distance / halfWidth) + ALPHA_FALLOFF_OFFSET);
    }

    /**
     * Draws the horizontal grid lines
     */
    function drawHorizontalLines(overlayHeight) {
        for (let z = 0; z < GRID_CONFIG.gridDepth; z++) {
            const depth = z * GRID_CONFIG.cellSizeZ - state.gridPosition;
            if (depth < 0) continue;
            const scale = computeScale(depth);
            const y = computePerspectiveY(scale);
            const scaledWidth = GRID_CONFIG.gridWidth * GRID_CONFIG.cellSizeX * scale;

            if (y <= CANVAS_SIZE.height && y >= overlayHeight) {
                const anisotropicFactor = computeAnisotropicFactor(depth);
                ctx.beginPath();
                ctx.lineWidth = GRID_CONFIG.lineWidth * anisotropicFactor;
                ctx.moveTo(vanishingPoint.x - scaledWidth / 2, y);
                ctx.lineTo(vanishingPoint.x + scaledWidth / 2, y);
                ctx.globalAlpha = computeGridOpacity(depth);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }
    
    /**
     * Draws the vertical grid lines
     */
    function drawVerticalLines(overlayHeight, halfGridWidth) {
        const densityLimit = GRID_CONFIG.gridWidth / VERTICAL_LINE_DENSITY_FACTOR;
        for (let x = -halfGridWidth; x <= halfGridWidth; x++) {
            const distance = Math.abs(x);
            if (distance > densityLimit) continue;
            const nearX = vanishingPoint.x + x * GRID_CONFIG.cellSizeX / VERTICAL_LINE_SCALE_FACTOR;
        const nearY = CANVAS_SIZE.height;
            const ratio = (overlayHeight - vanishingPoint.y) / (nearY - vanishingPoint.y);
            const intersectX = vanishingPoint.x + (nearX - vanishingPoint.x) * ratio;
            const startY = overlayHeight;

            ctx.beginPath();
            ctx.moveTo(intersectX, startY);
            ctx.lineTo(nearX, nearY);

            const anisotropicFactor = computeAnisotropicFactor(distance, 0.1);
            ctx.lineWidth = GRID_CONFIG.lineWidth * anisotropicFactor;
            ctx.globalAlpha = computeHorizontalOpacity(distance, halfGridWidth);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }
    
    /**
     * Draws the complete grid
     */
    function drawGrid() {
        const overlayHeight = getOverlayHeight();
        const halfGridWidth = GRID_CONFIG.gridWidth / 2;
        ctx.strokeStyle = GRID_CONFIG.color;
        drawHorizontalLines(overlayHeight);
        drawVerticalLines(overlayHeight, halfGridWidth);
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            startAnimation();
        } else {
            stopAnimation();
        }
    }

    window.addEventListener('beforeunload', stopAnimation);
    window.addEventListener('pagehide', stopAnimation);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    init();
})();
