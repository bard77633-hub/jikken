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
    
    // Fixed Friction logic (Run is now a hidden constant via FRICTION)
    // Check if vertical velocity is low enough to slide
    if (Math.abs(vy) < VELOCITY_STOP_THRESHOLD) {
      vy = 0;
      // Apply friction sliding
      vx *= FRICTION; 

      // If sliding very slowly, stop
      if (Math.abs(vx) < 0.1) {
        vx = 0;
        isStopped = true;
      }
    } else {
      // Bounce
      vy = -vy * RESTITUTION;
      // Apply friction on impact
      vx *= FRICTION;
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