export const GRAVITY = 9.8; // m/s^2
export const TIME_STEP = 1 / 60; // 60 FPS
export const RESTITUTION = 0.7; // Bounciness factor
export const FRICTION = 0.8; // Horizontal friction on ground contact
export const WIND_FACTOR = 0.5; // Multiplier for wind force
export const LAUNCH_ANGLE = 45 * (Math.PI / 180); // 45 degrees in radians
export const VELOCITY_STOP_THRESHOLD = 0.5; // Stop if velocity is low
export const HEIGHT_STOP_THRESHOLD = 0.1; // Stop if near ground