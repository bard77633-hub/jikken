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
    
    // Check if we should stop
    // Stop if we exceeded bounce limit OR if vertical energy is very low
    if (newBounces >= params.bounceLimit || Math.abs(vy) < VELOCITY_STOP_THRESHOLD) {
      if (Math.abs(vx) < VELOCITY_STOP_THRESHOLD) {
        // Complete stop
        vx = 0;
        vy = 0;
        isStopped = true;
      } else {
        // Slide with friction
        vy = 0;
        vx *= FRICTION;
        // If sliding very slowly, stop
        if (Math.abs(vx) < 0.1) {
          vx = 0;
          isStopped = true;
        }
      }
    } else {
      // Bounce
      vy = -vy * RESTITUTION;
      vx *= FRICTION; // Friction applied on impact
      newBounces += 1;
    }
  }

  // Record history for trail
  // Ensure we have a valid history array
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