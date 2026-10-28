import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

const { width, height } = Dimensions.get('window');

/**
 * SOLOPLAY V3 Cinematic Gaming Background
 * Features:
 * - Animated ambient lighting (lower-left & upper-center green, upper-right & lower-center orange)
 * - Enhanced particle system (glowing green particles, warm orange sparks, rare bright energy motes)
 * - Futuristic circular rings with subtle light segments
 * - 3D Perspective arena grid with darkness fade
 * - Desktop cursor energy glow (non-blocking)
 * - GPU-accelerated and accessible (prefers-reduced-motion supported)
 */
export const GlowingBackground = ({ children }) => {
  const canvasRef = useRef(null);
  const cursorGlowRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // Set Web Page Title
    if (document.title !== 'PIXO — Next-Gen Gaming Arena') {
      document.title = 'PIXO — Next-Gen Gaming Arena';
    }

    // 1. Google Fonts (Orbitron for PIXO Brand, Space Grotesk & Sora for Headings, Inter for Body)
    const fontLinkId = 'pixo-google-fonts';
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link');
      link.id = fontLinkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@500;600;700;800;900&family=Sora:wght@600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    // 2. Global Web CSS Keyframes & Enhancements
    const styleId = 'pixo-cinematic-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes ambientGreenPulse {
          0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.28; }
          50% { transform: scale(1.18) translate(30px, 20px); opacity: 0.42; }
        }
        @keyframes ambientOrangePulse {
          0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.24; }
          50% { transform: scale(1.15) translate(-25px, -20px); opacity: 0.36; }
        }
        @keyframes ambientCenterGlow {
          0%, 100% { transform: scale(1); opacity: 0.16; }
          50% { transform: scale(1.22); opacity: 0.26; }
        }
        @keyframes ringRotateClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ringRotateCounterClockwise {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes cardGlowTravel {
          0% { border-color: rgba(57, 255, 20, 0.24); }
          50% { border-color: rgba(255, 106, 0, 0.45); }
          100% { border-color: rgba(57, 255, 20, 0.24); }
        }
        .pixo-font-brand {
          font-family: 'Orbitron', 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif !important;
          letter-spacing: 4px !important;
        }
        .pixo-font-heading, .soloplay-font-heading {
          font-family: 'Space Grotesk', 'Sora', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        .pixo-font-body, .soloplay-font-body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        /* Hide scrollbars cleanly on modern browsers */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #050705;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(57, 255, 20, 0.25);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(57, 255, 20, 0.5);
        }
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // 3. Desktop Cursor Glow Tracker
    const cursorGlow = cursorGlowRef.current;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    let handleMouseMove = null;

    if (!isTouch && cursorGlow) {
      cursorGlow.style.display = 'block';
      handleMouseMove = (e) => {
        cursorGlow.style.transform = `translate3d(${e.clientX - 220}px, ${e.clientY - 220}px, 0)`;
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    } else if (cursorGlow) {
      cursorGlow.style.display = 'none';
    }

    // 4. Enhanced Particle System (Green & Electric Orange)
    const canvas = canvasRef.current;
    let animationFrameId;

    if (canvas) {
      const ctx = canvas.getContext('2d');
      let w = (canvas.width = window.innerWidth);
      let h = (canvas.height = window.innerHeight);

      const handleResize = () => {
        if (!canvas) return;
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);

      const particleCount = Math.min(48, Math.floor(w / 30));
      const particles = [];
      const particleColors = [
        { r: 57, g: 255, b: 20, isMote: false },   // Neon Green
        { r: 0, g: 200, b: 83, isMote: false },    // Emerald Green
        { r: 255, g: 106, b: 0, isMote: false },   // Electric Orange Spark
        { r: 255, g: 140, b: 50, isMote: false },  // Warm Orange
        { r: 255, g: 255, b: 255, isMote: true },  // Rare Bright Energy Mote
      ];

      for (let i = 0; i < particleCount; i++) {
        const isRare = Math.random() < 0.12;
        const col = isRare
          ? particleColors[4]
          : particleColors[Math.floor(Math.random() * (particleColors.length - 1))];

        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: isRare ? Math.random() * 2.5 + 1.8 : Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.45,
          speedY: -(Math.random() * 0.55 + 0.18),
          color: col,
          alpha: Math.random() * 0.5 + 0.18,
          alphaSpeed: (Math.random() * 0.009 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
        });
      }

      const render = () => {
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.speedX;
          p.y += p.speedY;
          p.alpha += p.alphaSpeed;

          if (p.alpha <= 0.1 || p.alpha >= 0.75) {
            p.alphaSpeed = -p.alphaSpeed;
          }

          if (p.y < -10) {
            p.y = h + 10;
            p.x = Math.random() * w;
          }
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
          ctx.shadowBlur = p.color.isMote ? p.size * 4 : p.size * 2.5;
          ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`;
          ctx.fill();
        }

        animationFrameId = requestAnimationFrame(render);
      };

      render();

      return () => {
        if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }

    return () => {
      if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Base Layer: Deep black and midnight green gradient */}
      <LinearGradient
        colors={['#050705', '#09110B', '#050705']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient Lighting Orbs */}
      {/* 1. Upper-Center Green Light Source */}
      <View
        style={[
          styles.orb,
          styles.orbUpperCenterGreen,
          Platform.OS === 'web' && {
            animation: 'ambientCenterGlow 14s ease-in-out infinite alternate',
          },
        ]}
      />

      {/* 2. Lower-Left Green Light Source */}
      <View
        style={[
          styles.orb,
          styles.orbLowerLeftGreen,
          Platform.OS === 'web' && {
            animation: 'ambientGreenPulse 16s ease-in-out infinite alternate',
          },
        ]}
      />

      {/* 3. Upper-Right Warm Orange Light Source */}
      <View
        style={[
          styles.orb,
          styles.orbUpperRightOrange,
          Platform.OS === 'web' && {
            animation: 'ambientOrangePulse 15s ease-in-out infinite alternate',
          },
        ]}
      />

      {/* 4. Lower-Center Warm Orange Light Source */}
      <View style={[styles.orb, styles.orbLowerCenterOrange]} />

      {/* Futuristic Circular Rings with low opacity & light segments */}
      <View style={styles.ringsContainer} pointerEvents="none">
        {/* Large Outer Thin Green Ring */}
        <View
          style={[
            styles.ringOuter,
            Platform.OS === 'web' && {
              animation: 'ringRotateClockwise 120s linear infinite',
            },
          ]}
        >
          <View style={styles.ringSegmentTop} />
          <View style={styles.ringSegmentBottom} />
        </View>

        {/* Medium Inner Thin Orange Ring */}
        <View
          style={[
            styles.ringInner,
            Platform.OS === 'web' && {
              animation: 'ringRotateCounterClockwise 90s linear infinite',
            },
          ]}
        >
          <View style={styles.ringSegmentOrangeRight} />
          <View style={styles.ringSegmentOrangeLeft} />
        </View>
      </View>

      {/* 3D Perspective Digital Arena Grid (near bottom) */}
      <View style={styles.gridContainer} pointerEvents="none">
        <View style={styles.gridPlane} />
        <LinearGradient
          colors={['#050705', 'rgba(5, 7, 5, 0.65)', 'transparent']}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Canvas Particles (Web) */}
      {Platform.OS === 'web' && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Desktop Cursor Glow (Non-blocking) */}
      {Platform.OS === 'web' && (
        <div
          ref={cursorGlowRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 440,
            height: 440,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(57, 255, 20, 0.08) 0%, rgba(255, 106, 0, 0.04) 45%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none',
            zIndex: 2,
            opacity: 0.85,
            willChange: 'transform',
          }}
        />
      )}

      {/* Children Layer */}
      <View style={[styles.contentLayer, Platform.OS === 'web' && { zIndex: 10 }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050705',
    position: 'relative',
    overflow: 'hidden',
  },
  contentLayer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    pointerEvents: 'none',
  },
  orbUpperCenterGreen: {
    top: -height * 0.12,
    left: '25%',
    width: width * 0.55 + 100,
    height: width * 0.55 + 100,
    backgroundColor: 'rgba(57, 255, 20, 0.14)',
    ...(Platform.OS === 'web'
      ? {
          filter: 'blur(110px)',
          WebkitFilter: 'blur(110px)',
        }
      : { opacity: 0.4 }),
  },
  orbLowerLeftGreen: {
    bottom: -height * 0.1,
    left: -width * 0.15,
    width: width * 0.65 + 80,
    height: width * 0.65 + 80,
    backgroundColor: 'rgba(0, 200, 83, 0.16)',
    ...(Platform.OS === 'web'
      ? {
          filter: 'blur(115px)',
          WebkitFilter: 'blur(115px)',
        }
      : { opacity: 0.35 }),
  },
  orbUpperRightOrange: {
    top: -height * 0.1,
    right: -width * 0.15,
    width: width * 0.65 + 100,
    height: width * 0.65 + 100,
    backgroundColor: 'rgba(255, 106, 0, 0.15)',
    ...(Platform.OS === 'web'
      ? {
          filter: 'blur(120px)',
          WebkitFilter: 'blur(120px)',
        }
      : { opacity: 0.35 }),
  },
  orbLowerCenterOrange: {
    bottom: -height * 0.15,
    right: '20%',
    width: width * 0.45,
    height: width * 0.45,
    backgroundColor: 'rgba(255, 140, 50, 0.1)',
    ...(Platform.OS === 'web'
      ? {
          filter: 'blur(100px)',
          WebkitFilter: 'blur(100px)',
        }
      : { opacity: 0.25 }),
  },
  ringsContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
    overflow: 'hidden',
  },
  ringOuter: {
    position: 'absolute',
    width: Math.min(width * 0.9, 880),
    height: Math.min(width * 0.9, 880),
    borderRadius: 440,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.07)',
  },
  ringSegmentTop: {
    position: 'absolute',
    top: -2,
    left: '42%',
    width: '16%',
    height: 3,
    backgroundColor: 'rgba(57, 255, 20, 0.35)',
    borderRadius: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 10px #39FF14' } : {}),
  },
  ringSegmentBottom: {
    position: 'absolute',
    bottom: -2,
    left: '40%',
    width: '20%',
    height: 3,
    backgroundColor: 'rgba(57, 255, 20, 0.35)',
    borderRadius: 2,
  },
  ringInner: {
    position: 'absolute',
    width: Math.min(width * 0.65, 560),
    height: Math.min(width * 0.65, 560),
    borderRadius: 280,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.08)',
  },
  ringSegmentOrangeRight: {
    position: 'absolute',
    right: -2,
    top: '38%',
    width: 3,
    height: '24%',
    backgroundColor: 'rgba(255, 106, 0, 0.45)',
    borderRadius: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 8px #FF6A00' } : {}),
  },
  ringSegmentOrangeLeft: {
    position: 'absolute',
    left: -2,
    top: '45%',
    width: 3,
    height: '18%',
    backgroundColor: 'rgba(255, 106, 0, 0.4)',
    borderRadius: 2,
  },
  gridContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    overflow: 'hidden',
    zIndex: 0,
  },
  gridPlane: {
    position: 'absolute',
    bottom: 0,
    left: '-50%',
    width: '200%',
    height: '100%',
    opacity: 0.16,
    ...(Platform.OS === 'web'
      ? {
          backgroundImage: `
            linear-gradient(to right, rgba(57, 255, 20, 0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(57, 255, 20, 0.22) 1px, transparent 1px)
          `,
          backgroundSize: '44px 44px',
          transform: 'perspective(400px) rotateX(60deg)',
          transformOrigin: 'bottom center',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, transparent 90%)',
        }
      : {}),
  },
});

export default GlowingBackground;
