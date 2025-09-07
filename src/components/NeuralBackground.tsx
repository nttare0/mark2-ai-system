"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface NeuralBackgroundProps {
  className?: string;
  enableAnimation?: boolean;
  darkOverlay?: boolean;
}

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  pulsePhase: number;
}

interface Connection {
  from: Node;
  to: Node;
  opacity: number;
  animationPhase: number;
}

export default function NeuralBackground({ 
  className = "", 
  enableAnimation = true,
  darkOverlay = false 
}: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const lastFrameTime = useRef(0);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Handle visibility changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleVisibilityChange = () => {
        setIsVisible(!document.hidden);
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, []);

  // Initialize nodes and connections
  const initializeNetwork = useCallback((width: number, height: number) => {
    const nodeCount = Math.min(25, Math.floor((width * height) / 15000)); // Cap nodes based on screen size
    const nodes: Node[] = [];
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        opacity: 0.3 + Math.random() * 0.4,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
    
    // Create connections between nearby nodes
    const connections: Connection[] = [];
    const maxDistance = Math.min(150, Math.max(width, height) / 8);
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance && connections.length < nodeCount * 2) {
          connections.push({
            from: nodes[i],
            to: nodes[j],
            opacity: 0.1 + (1 - distance / maxDistance) * 0.2,
            animationPhase: Math.random() * Math.PI * 2
          });
        }
      }
    }
    
    nodesRef.current = nodes;
    connectionsRef.current = connections;
  }, []);

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (!canvasRef.current || prefersReducedMotion || !enableAnimation || !isVisible) {
      return;
    }

    // Throttle to ~30fps for performance
    if (currentTime - lastFrameTime.current < 33) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    lastFrameTime.current = currentTime;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const time = currentTime * 0.001; // Convert to seconds
    
    // Update and draw connections
    ctx.strokeStyle = '#9b8cff';
    connectionsRef.current.forEach(connection => {
      const { from, to } = connection;
      
      // Update animation phase
      connection.animationPhase += 0.02;
      if (connection.animationPhase > Math.PI * 2) {
        connection.animationPhase -= Math.PI * 2;
      }
      
      // Animate opacity
      const animatedOpacity = connection.opacity * (0.5 + 0.5 * Math.sin(connection.animationPhase));
      
      ctx.globalAlpha = animatedOpacity;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
    
    // Update and draw nodes
    ctx.fillStyle = '#9b8cff';
    nodesRef.current.forEach(node => {
      // Update position (very slow drift)
      node.x += node.vx;
      node.y += node.vy;
      
      // Bounce off edges
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
      
      // Keep within bounds
      node.x = Math.max(0, Math.min(width, node.x));
      node.y = Math.max(0, Math.min(height, node.y));
      
      // Update pulse
      node.pulsePhase += 0.03;
      if (node.pulsePhase > Math.PI * 2) {
        node.pulsePhase -= Math.PI * 2;
      }
      
      // Draw node with pulse effect
      const pulseOpacity = node.opacity * (0.4 + 0.6 * Math.sin(node.pulsePhase));
      const pulseSize = 2 + Math.sin(node.pulsePhase) * 0.5;
      
      ctx.globalAlpha = pulseOpacity;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
    animationRef.current = requestAnimationFrame(animate);
  }, [prefersReducedMotion, enableAnimation, isVisible]);

  // Setup canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      initializeNetwork(rect.width, rect.height);
    };

    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    resizeObserver.observe(canvas);
    
    // Start animation
    if (!prefersReducedMotion && enableAnimation && isVisible) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      resizeObserver.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, initializeNetwork, prefersReducedMotion, enableAnimation, isVisible]);

  // Render static version for reduced motion
  const renderStaticNetwork = () => {
    if (!nodesRef.current.length) return null;
    
    return (
      <svg 
        className="absolute inset-0 w-full h-full" 
        aria-hidden="true"
        style={{ opacity: 0.3 }}
      >
        {/* Render static connections */}
        {connectionsRef.current.map((connection, index) => (
          <line
            key={`connection-${index}`}
            x1={connection.from.x}
            y1={connection.from.y}
            x2={connection.to.x}
            y2={connection.to.y}
            stroke="#9b8cff"
            strokeWidth="1"
            opacity={connection.opacity}
          />
        ))}
        
        {/* Render static nodes */}
        {nodesRef.current.map((node) => (
          <circle
            key={`node-${node.id}`}
            cx={node.x}
            cy={node.y}
            r="2"
            fill="#9b8cff"
            opacity={node.opacity}
          />
        ))}
      </svg>
    );
  };

  return (
    <div 
      className={`fixed inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Dark overlay if requested */}
      {darkOverlay && (
        <div className="absolute inset-0 bg-background/30 backdrop-blur-[1px]" />
      )}
      
      {/* Animated canvas version */}
      {!prefersReducedMotion && enableAnimation ? (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ 
            opacity: isVisible ? 0.4 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      ) : (
        /* Static SVG fallback */
        <div className="absolute inset-0 w-full h-full">
          {renderStaticNetwork()}
        </div>
      )}
    </div>
  );
}