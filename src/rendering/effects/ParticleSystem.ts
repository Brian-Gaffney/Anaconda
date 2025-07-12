import { Vector2 } from '../../entities/Vector2.js';
import { COLORS } from '../../game/constants.js';
import { Renderer } from '../Renderer.js';

interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update particle
      particle.position = particle.position.add(particle.velocity.multiply(deltaTime * 0.001));
      particle.life -= deltaTime;
      particle.alpha = particle.life / particle.maxLife;
      
      // Apply friction
      particle.velocity = particle.velocity.multiply(0.98);
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(renderer: Renderer): void {
    const ctx = renderer.getContext();
    ctx.save();

    this.particles.forEach(particle => {
      const alpha = particle.alpha;
      ctx.globalAlpha = alpha;
      
      // Add glow effect
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      
      renderer.drawGlowingCircle(
        particle.position.x,
        particle.position.y,
        particle.size * alpha,
        particle.color,
        alpha
      );
    });

    ctx.restore();
  }

  createFoodEatenEffect(position: Vector2): void {
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      this.particles.push({
        position: position.clone(),
        velocity,
        life: 800 + Math.random() * 400,
        maxLife: 800 + Math.random() * 400,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? COLORS.RED_FOOD : COLORS.NEON_GREEN,
        alpha: 1,
      });
    }
  }

  createSnakeGrowthEffect(position: Vector2): void {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      this.particles.push({
        position: position.clone(),
        velocity,
        life: 600 + Math.random() * 300,
        maxLife: 600 + Math.random() * 300,
        size: 1 + Math.random() * 2,
        color: COLORS.CYAN_ACCENT,
        alpha: 1,
      });
    }
  }

  createCollisionEffect(position: Vector2): void {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const velocity = new Vector2(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      this.particles.push({
        position: position.clone(),
        velocity,
        life: 1000 + Math.random() * 500,
        maxLife: 1000 + Math.random() * 500,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.3 ? COLORS.RED_FOOD : '#ff6600',
        alpha: 1,
      });
    }
  }

  clear(): void {
    this.particles = [];
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}