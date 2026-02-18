document.addEventListener('DOMContentLoaded', () => {
    // Create the global tooltip element
    const globalTooltip = document.createElement('div');
    globalTooltip.id = 'global-tooltip';
    globalTooltip.className = 'tooltip-global';
    document.body.appendChild(globalTooltip);

    // Track mouse move for positioning
    document.addEventListener('mousemove', (e) => {
        if (globalTooltip.classList.contains('active')) {
            const x = e.clientX;
            const y = e.clientY;

            // Offset from cursor
            const offsetX = 20;
            const offsetY = 20;

            // Keep tooltip inside viewport
            let finalX = x + offsetX;
            let finalY = y + offsetY;

            const rect = globalTooltip.getBoundingClientRect();
            if (finalX + rect.width > window.innerWidth) {
                finalX = x - rect.width - offsetX;
            }
            if (finalY + rect.height > window.innerHeight) {
                finalY = window.innerHeight - rect.height - 10;
            }

            globalTooltip.style.left = `${finalX}px`;
            globalTooltip.style.top = `${finalY}px`;
        }
    });

    // Delegated event listeners for elements with data-tooltip
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-tooltip-text]');
        if (target) {
            const text = target.getAttribute('data-tooltip-text');
            if (text) {
                globalTooltip.textContent = text;
                globalTooltip.classList.add('active');
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip-text]');
        if (target) {
            globalTooltip.classList.remove('active');
        }
    });
});
