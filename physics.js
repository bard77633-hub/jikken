import { 
  GRAVITY, 
  TIME_STEP, 
  RESTITUTION, 
  FRICTION, 
  WIND_FACTOR, 
  VELOCITY_STOP_THRESHOLD 
} from './constants.js';

export function updatePhysics(state, params) {
  if (state.isStopped) return state;

  let { position, velocity, bounces, history } = state;
  let { x, y } = position;
  let { x: vx, y: vy } = velocity;

  // Apply forces
  // Gravity
  vy -= GRAVITY * TIME_STEP;
  
  // Wind acceleration (F=ma, assuming m=1)
  const ax = params.wind * WIND_FACTOR;
  vx += ax * TIME_STEP;

  // Update position
  x += vx * TIME_STEP;
  y += vy * TIME_STEP;

  // Ground collision
  let isStopped = false;
  let newBounces = bounces;

  if (y <= 0) {
    y = 0;
    
    // Calculate Friction based on "Run" param
    // Standard Friction is 0.8 (stops relatively fast)
    // High Run param means reduced friction (glides more)
    // params.run is approx 10 to 50
    // If Run is 0, friction is 0.6. If Run is 50, friction is 0.85 (preserves velocity)
    const runFactor = (params.run || 0) / 100; // 0.0 to 0.5
    const effectiveFriction = 0.5 + runFactor; // 0.5 to 1.0 (clamped logic below)

    // Check if vertical velocity is low enough to slide
    if (Math.abs(vy) < VELOCITY_STOP_THRESHOLD) {
      vy = 0;
      // Apply friction sliding
      vx *= Math.min(0.98, effectiveFriction); // Cap at 0.98 to ensure it eventually stops

      // If sliding very slowly, stop
      if (Math.abs(vx) < 0.1) {
        vx = 0;
        isStopped = true;
      }
    } else {
      // Bounce
      vy = -vy * RESTITUTION;
      // Apply friction on impact
      vx *= Math.min(0.98, effectiveFriction);
      newBounces += 1;
    }
  }

  // Record history for trail
  const safeHistory = history || [];
  const lastPos = safeHistory.length > 0 ? safeHistory[safeHistory.length - 1] : null;
  let newHistory = safeHistory;
  
  if (!lastPos || Math.abs(x - lastPos.x) > 0.5 || Math.abs(y - lastPos.y) > 0.5) {
     newHistory = [...safeHistory, { x, y }];
  }

  return {
    position: { x, y },
    velocity: { x: vx, y: vy },
    bounces: newBounces,
    isStopped,
    history: newHistory,
  };
}