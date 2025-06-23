import React from 'react';
import { motion } from 'framer-motion';

// Ripple effect for buttons and clickable elements
export function RippleButton({ children, onClick, className = "", ...props }) {
  const [ripples, setRipples] = React.useState([]);

  const createRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(event);
  };

  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      onClick={createRipple}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
      
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </motion.button>
  );
}

// Hover scale effect for cards
export function HoverCard({ children, className = "", scale = 1.02, ...props }) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Floating action button with magnetic effect
export function FloatingButton({ children, className = "", ...props }) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
    setMousePosition({ x, y });
  };

  return (
    <motion.button
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      animate={{
        x: isHovered ? mousePosition.x : 0,
        y: isHovered ? mousePosition.y : 0,
        scale: isHovered ? 1.1 : 1
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Stagger animation for lists
export function StaggerContainer({ children, className = "", delay = 0.1 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: delay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "", ...props }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Pulse animation for notifications
export function PulseNotification({ children, className = "", ...props }) {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Smooth height transition for expandable content
export function ExpandableContent({ 
  isExpanded, 
  children, 
  className = "",
  ...props 
}) {
  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={false}
      animate={{
        height: isExpanded ? "auto" : 0,
        opacity: isExpanded ? 1 : 0
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      <div className="pb-4">
        {children}
      </div>
    </motion.div>
  );
}

// Page transition wrapper
export function PageTransition({ children, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Loading skeleton with shimmer effect
export function ShimmerSkeleton({ width = "100%", height = "20px", className = "" }) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 rounded ${className}`}
      style={{ width, height }}
      animate={{
        backgroundPosition: ["200% 0", "-200% 0"]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{
        backgroundSize: "200% 100%"
      }}
    />
  );
}

// Bounce animation for success states
export function BounceSuccess({ children, className = "", trigger = false }) {
  return (
    <motion.div
      className={className}
      animate={trigger ? {
        scale: [1, 1.2, 1],
        rotate: [0, 5, -5, 0]
      } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}