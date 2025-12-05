export const GRAVITY = 9.8; // m/s^2
export const TIME_STEP = 1 / 60; // 60 FPS
export const RESTITUTION = 0.6; // Bounciness factor (Reduced for faster stop)
export const FRICTION = 0.65; // Fixed horizontal friction (Moderate stop power)
export const WIND_FACTOR = 0.5; // Multiplier for wind force
export const VELOCITY_STOP_THRESHOLD = 0.5; // Stop if velocity is low
export const HEIGHT_STOP_THRESHOLD = 0.1; // Stop if near ground