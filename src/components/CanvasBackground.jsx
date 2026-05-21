import React, { useEffect, useRef } from 'react';

const CanvasBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    const maxParticles = 90;
    const maxDistance = 120; // Connection line threshold
    const mouse = {
      x: null,
      y: null,
      radius: 180, // Mouse interaction boundary
    };

    // Responsive Canvas Resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse Tracking Event Listeners
    const handleMouseMove = (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Particle Blueprint Class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.4; // Soft horizontal speed
        this.vy = (Math.random() - 0.5) * 0.4; // Soft vertical speed
        this.baseSize = Math.random() * 2 + 1.5; // Size between 1.5px and 3.5px
        this.size = this.baseSize;
        // Vibrant neon glow colors matching the shop theme
        const colors = [
          'rgba(20, 233, 178, 0.45)',  // Neon Teal
          'rgba(147, 51, 234, 0.45)',  // Radiant Violet
          'rgba(6, 182, 212, 0.45)',   // Cool Cyan
          'rgba(245, 158, 11, 0.45)',  // Warm Amber
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        // Core float boundary bounce
        if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

        this.x += this.vx;
        this.y += this.vy;

        // Interactive mouse interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            // Gravitational pull force towards mouse pointer
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= (dx / distance) * force * 0.8;
            this.y -= (dy / distance) * force * 0.8;
            
            // Expand size slightly when close to cursor
            this.size = this.baseSize * (1 + force * 1.5);
          } else {
            // Smoothly ease back to base size
            if (this.size > this.baseSize) {
              this.size -= 0.1;
            }
          }
        } else {
          if (this.size > this.baseSize) {
            this.size -= 0.1;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        // Apply micro radial glow
        ctx.shadowBlur = mouse.x !== null ? 8 : 0;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      }
    }

    // Initialize particles array
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
      }
    };
    initParticles();

    // Constellation lines builder
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            // Check if connection includes mouse proximity
            let alpha = (maxDistance - dist) / maxDistance * 0.15;
            
            // If near mouse, intensify connection transparency and draw glowing wireframe
            if (mouse.x !== null && mouse.y !== null) {
              const mDx1 = mouse.x - particles[i].x;
              const mDy1 = mouse.y - particles[i].y;
              const mDist1 = Math.sqrt(mDx1 * mDx1 + mDy1 * mDy1);
              
              const mDx2 = mouse.x - particles[j].x;
              const mDy2 = mouse.y - particles[j].y;
              const mDist2 = Math.sqrt(mDx2 * mDx2 + mDy2 * mDy2);

              if (mDist1 < mouse.radius && mDist2 < mouse.radius) {
                alpha *= 2.5; // Double intensity near mouse
              }
            }

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            // Dynamic color shift using linear gradient
            const gradient = ctx.createLinearGradient(
              particles[i].x, particles[i].y,
              particles[j].x, particles[j].y
            );
            gradient.addColorStop(0, particles[i].color.replace('0.45', alpha.toString()));
            gradient.addColorStop(1, particles[j].color.replace('0.45', alpha.toString()));

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        // Draw dynamic web lines from nodes directly to mouse cursor
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - particles[i].x;
          const dy = mouse.y - particles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const alpha = (mouse.radius - dist) / mouse.radius * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(20, 233, 178, ${alpha})`; // Glowing teal lines to cursor
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }
      }
    };

    // Primary loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update & Draw particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Join connections
      drawConnections();

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanups
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, #07080f 0%, #0d0f1c 100%)',
      }}
    />
  );
};

export default CanvasBackground;
