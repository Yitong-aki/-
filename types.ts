export interface RainParams {
  rainAmount: number;
  speed: number;
  brightness: number;
  zoom: number;
  refraction: number; // Normal strength
}

export const DEFAULT_PARAMS: RainParams = {
  rainAmount: 0.5,
  speed: 0.2, // Slower for a relaxed, static/slow-moving feel
  brightness: 1.1,
  zoom: 1.25, // Increased to simulate larger glass surface (smaller drops)
  refraction: 0.4, // Balanced refraction
};