/**
 * SEU DOCE ATELIÊ - INTERACTIVE 3D RENDER ENGINE (HTML5 CANVAS)
 * Implements a lightweight, hardware-accelerated 3D projection of a luxurious sweet (Macaron)
 * with physics, lighting highlights, specular reflections, depth-sorting, and mouse-drag spin controls.
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('webgl-canvas-placeholder');
    if (!container) return;

    // Clear fallback illustration to load dynamic 3D engine
    container.innerHTML = '';

    // Create Canvas Element
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    canvas.style.cursor = 'grab';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 3D Object state
    let angleX = 0.3; // Tilt pitch
    let angleY = 0.5; // Yaw rotation
    let scale = 1.0;

    // Interaction state
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let velocityX = 0.02; // Idle rotation
    let velocityY = 0.005;

    // Color definitions (Harmonious Sweets Palette)
    const colorPinkTop = { r: 255, g: 141, b: 161 };      // Hot Strawberry
    const colorPinkBottom = { r: 255, g: 115, b: 142 };   // Darker Rose
    const colorCream = { r: 255, g: 240, b: 245 };        // Sweet Lavender Cream
    
    // Physics & loop variables
    let targetScale = 1.0;
    let currentScale = 1.0;

    // 3D Projection formula (simple perspective or orthographic for smooth rendering)
    function project(x, y, z) {
        // Rotate around X axis (pitch)
        let cosX = Math.cos(angleX);
        let sinX = Math.sin(angleX);
        let y1 = y * cosX - z * sinX;
        let z1 = y * sinX + z * cosX;

        // Rotate around Y axis (yaw)
        let cosY = Math.cos(angleY);
        let sinY = Math.sin(angleY);
        let x2 = x * cosY - z1 * sinY;
        let z2 = x * sinY + z1 * cosY;

        // Perspective scale factor
        const d = 400; // Distance to camera
        const fov = d / (d + z2);
        
        return {
            x: (width / 2) + x2 * fov * currentScale,
            y: (height / 2) + y1 * fov * currentScale,
            z: z2, // Store depth for z-sorting
            fov: fov
        };
    }

    // Main Draw Function
    function draw() {
        ctx.clearRect(0, 0, width, height);

        // 1. Draw soft drop shadow on floor (depth scales size and blur)
        const shadowY = height / 2 + 90;
        const shadowSizeX = 90 * (1 - angleX * 0.15) * currentScale;
        const shadowSizeY = 24 * currentScale;
        const shadowGrad = ctx.createRadialGradient(
            width / 2, shadowY, 5,
            width / 2, shadowY, shadowSizeX
        );
        shadowGrad.addColorStop(0, 'rgba(44, 37, 35, 0.25)');
        shadowGrad.addColorStop(0.5, 'rgba(44, 37, 35, 0.08)');
        shadowGrad.addColorStop(1, 'rgba(44, 37, 35, 0)');
        
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(width / 2, shadowY, shadowSizeX, shadowSizeY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Interpolate scale for smooth hover effect
        currentScale += (targetScale - currentScale) * 0.15;

        // Build composite slices of Macaron (Depth-Sorted Rendering)
        // We render slices of the macaron to create a convincing solid 3D effect in 2D Canvas!
        const slices = [];

        // Generate top cookie shell slices
        const topShellY = -25;
        for (let i = 0; i <= 24; i++) {
            const h = i / 24; // 0 to 1
            const r = Math.sin(Math.acos(h)) * 75; // Hemisphere shape
            const offset = h * 24 - 12; // Height offset
            slices.push({
                type: 'cookie',
                yOffset: topShellY + offset,
                radius: r,
                color: colorPinkTop,
                isTop: true,
                depth: topShellY + offset // Depth index
            });
        }

        // Cream layer slices (fluffy center filling)
        const creamY = 0;
        for (let i = 0; i < 8; i++) {
            const offset = i - 4;
            slices.push({
                type: 'cream',
                yOffset: creamY + offset,
                radius: 70,
                color: colorCream,
                depth: creamY + offset
            });
        }

        // Generate bottom cookie shell slices
        const bottomShellY = 25;
        for (let i = 0; i <= 24; i++) {
            const h = i / 24; // 0 to 1
            const r = Math.sin(Math.acos(h)) * 75;
            const offset = -h * 24 + 12; // Height offset
            slices.push({
                type: 'cookie',
                yOffset: bottomShellY + offset,
                radius: r,
                color: colorPinkBottom,
                isTop: false,
                depth: bottomShellY + offset
            });
        }

        // Z-Sorting: project all layers to determine true visible depth (z-buffer)
        slices.forEach(slice => {
            const projCenter = project(0, slice.yOffset, 0);
            slice.projY = projCenter.y;
            slice.projX = projCenter.x;
            slice.depthVal = projCenter.z;
            slice.fov = projCenter.fov;
        });

        // Sort slices back-to-front (Painter's algorithm)
        slices.sort((a, b) => b.depthVal - a.depthVal);

        // Render each sorted slice
        slices.forEach(slice => {
            const rx = slice.radius * currentScale * slice.fov;
            const ry = slice.radius * Math.sin(angleX) * currentScale * slice.fov;
            
            if (ry < 1) return; // Hide edge errors

            ctx.beginPath();
            ctx.ellipse(slice.projX, slice.projY, rx, ry, 0, 0, Math.PI * 2);

            // Dynamic lighting vector based on rotation angleX/Y
            const highlightX = slice.projX - rx * 0.25;
            const highlightY = slice.projY - ry * 0.35;
            const highlightRadius = rx * 0.95;

            if (slice.type === 'cookie') {
                const grad = ctx.createRadialGradient(
                    highlightX, highlightY, highlightRadius * 0.1,
                    slice.projX, slice.projY, highlightRadius
                );
                
                const c = slice.color;
                // Add soft shading and glowing highlights
                grad.addColorStop(0, `rgb(${Math.min(255, c.r + 45)}, ${Math.min(255, c.g + 45)}, ${Math.min(255, c.b + 45)})`);
                grad.addColorStop(0.3, `rgb(${c.r}, ${c.g}, ${c.b})`);
                grad.addColorStop(1, `rgb(${Math.max(0, c.r - 55)}, ${Math.max(0, c.g - 55)}, ${Math.max(0, c.b - 55)})`);
                
                ctx.fillStyle = grad;
                ctx.fill();

                // Draw glossy specular light on top surface
                if (slice.isTop && slice.depthVal > 0) {
                    ctx.beginPath();
                    ctx.ellipse(highlightX, highlightY, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                    ctx.fill();
                }
            } else if (slice.type === 'cream') {
                // Cream texture gradient
                const grad = ctx.createLinearGradient(
                    slice.projX - rx, slice.projY,
                    slice.projX + rx, slice.projY
                );
                const c = slice.color;
                grad.addColorStop(0, `rgb(${c.r - 20}, ${c.g - 20}, ${c.b - 15})`);
                grad.addColorStop(0.5, `rgb(${c.r}, ${c.g}, ${c.b})`);
                grad.addColorStop(1, `rgb(${c.r - 10}, ${c.g - 10}, ${c.b - 8})`);

                ctx.fillStyle = grad;
                ctx.fill();
            }
        });
    }

    // Physics Update Loop
    function update() {
        if (!isDragging) {
            // Apply drag friction/inertia
            angleY += velocityX;
            angleX += velocityY;

            // Decay speed back to idle
            velocityX += (0.006 - velocityX) * 0.05;
            velocityY += (0.001 - velocityY) * 0.05;

            // Clamp pitch tilt angle to avoid vertical flip distortion
            angleX = Math.max(-0.6, Math.min(0.6, angleX));
        }

        draw();
        requestAnimationFrame(update);
    }

    // Interaction Events
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
        targetScale = 1.08;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - previousMouseX;
        const deltaY = e.clientY - previousMouseY;

        // Update angles based on mouse offset
        angleY += deltaX * 0.01;
        angleX += deltaY * 0.01;
        angleX = Math.max(-0.6, Math.min(0.6, angleX)); // Cap pitch

        // Calculate drag speed for physics inertia release
        velocityX = deltaX * 0.01;
        velocityY = deltaY * 0.01;

        previousMouseX = e.clientX;
        previousMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            canvas.style.cursor = 'grab';
            targetScale = 1.0;
        }
    });

    // Touch Support for Mobile
    canvas.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        previousMouseX = touch.clientX;
        previousMouseY = touch.clientY;
        targetScale = 1.08;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - previousMouseX;
        const deltaY = touch.clientY - previousMouseY;

        angleY += deltaX * 0.01;
        angleX += deltaY * 0.01;
        angleX = Math.max(-0.6, Math.min(0.6, angleX));

        velocityX = deltaX * 0.005;
        velocityY = deltaY * 0.005;

        previousMouseX = touch.clientX;
        previousMouseY = touch.clientY;
        e.preventDefault(); // Prevent scroll while dragging sweet
    });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
        targetScale = 1.0;
    });

    // Hover scales
    canvas.addEventListener('mouseenter', () => {
        if (!isDragging) targetScale = 1.05;
    });

    canvas.addEventListener('mouseleave', () => {
        if (!isDragging) {
            targetScale = 1.0;
            isDragging = false;
            canvas.style.cursor = 'grab';
        }
    });

    // Kickoff update loop
    update();
});
