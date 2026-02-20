/**
 * Platform Detection Testing Utility
 * 
 * This file helps test iOS behavior without an actual iPhone.
 * Use browser console to simulate different platforms.
 * 
 * The simulation persists across page reloads using localStorage.
 */

import { Capacitor } from '@capacitor/core';

// LocalStorage key for persisting simulation
const SIMULATION_KEY = '__platform_simulation__';

// Store original getPlatform function
const originalGetPlatform = Capacitor.getPlatform;
const originalIsNativePlatform = Capacitor.isNativePlatform;

/**
 * Apply platform simulation based on stored value
 */
const applySimulation = () => {
  const simulation = localStorage.getItem(SIMULATION_KEY);
  
  if (simulation === 'ios') {
    (Capacitor as any).getPlatform = () => 'ios';
    (Capacitor as any).isNativePlatform = () => true;
    console.log('🍎 iOS Platform Simulation ACTIVE (persisted)');
  } else if (simulation === 'android') {
    (Capacitor as any).getPlatform = () => 'android';
    (Capacitor as any).isNativePlatform = () => true;
    console.log('🤖 Android Platform Simulation ACTIVE (persisted)');
  } else if (simulation === 'web') {
    (Capacitor as any).getPlatform = originalGetPlatform;
    (Capacitor as any).isNativePlatform = originalIsNativePlatform;
    console.log('🌐 Web Platform (default)');
  }
};

/**
 * Simulate iOS platform for testing
 * Call this in browser console: window.simulateIOS()
 * Persists across page reloads until you call window.simulateWeb()
 */
export const simulateIOS = () => {
  localStorage.setItem(SIMULATION_KEY, 'ios');
  
  // Override Capacitor methods
  (Capacitor as any).getPlatform = () => 'ios';
  (Capacitor as any).isNativePlatform = () => true;
  
  console.log('🍎 iOS Platform Simulation ENABLED');
  console.log('Platform:', Capacitor.getPlatform());
  console.log('Is Native:', Capacitor.isNativePlatform());
  console.log('✅ Simulation will persist across page reloads');
  console.log('💡 Reload the page now to see iOS behavior');
};

/**
 * Simulate Android platform for testing
 * Call this in browser console: window.simulateAndroid()
 * Persists across page reloads until you call window.simulateWeb()
 */
export const simulateAndroid = () => {
  localStorage.setItem(SIMULATION_KEY, 'android');
  
  // Override Capacitor methods
  (Capacitor as any).getPlatform = () => 'android';
  (Capacitor as any).isNativePlatform = () => true;
  
  console.log('🤖 Android Platform Simulation ENABLED');
  console.log('Platform:', Capacitor.getPlatform());
  console.log('Is Native:', Capacitor.isNativePlatform());
  console.log('✅ Simulation will persist across page reloads');
  console.log('💡 Reload the page now to see Android behavior');
};

/**
 * Reset to web platform (default)
 * Call this in browser console: window.simulateWeb()
 * Removes simulation persistence
 */
export const simulateWeb = () => {
  localStorage.removeItem(SIMULATION_KEY);
  
  // Restore original methods
  (Capacitor as any).getPlatform = originalGetPlatform;
  (Capacitor as any).isNativePlatform = originalIsNativePlatform;
  
  console.log('🌐 Web Platform Simulation ENABLED');
  console.log('Platform:', Capacitor.getPlatform());
  console.log('Is Native:', Capacitor.isNativePlatform());
  console.log('✅ Simulation cleared - back to normal web behavior');
  console.log('💡 Reload the page now to see Web behavior');
};

// Apply simulation on load (before any components render)
applySimulation();

/**
 * Get current platform info
 */
export const getPlatformInfo = () => {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  const simulation = localStorage.getItem(SIMULATION_KEY);
  
  console.log('📱 Current Platform Info:');
  console.log('  Platform:', platform);
  console.log('  Is Native:', isNative);
  console.log('  Is iOS:', platform === 'ios');
  console.log('  Is Android:', platform === 'android');
  console.log('  Is Web:', platform === 'web');
  console.log('  Simulation Active:', simulation || 'none');
  
  return { platform, isNative, simulation };
};

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).simulateIOS = simulateIOS;
  (window as any).simulateAndroid = simulateAndroid;
  (window as any).simulateWeb = simulateWeb;
  (window as any).getPlatformInfo = getPlatformInfo;
  
  console.log('🧪 Platform Testing Utilities Loaded!');
  console.log('Available commands:');
  console.log('  window.simulateIOS()     - Test iOS behavior (persists on reload)');
  console.log('  window.simulateAndroid() - Test Android behavior (persists on reload)');
  console.log('  window.simulateWeb()     - Test Web behavior (clears simulation)');
  console.log('  window.getPlatformInfo() - Check current platform');
  console.log('');
  
  // Show current simulation status
  const currentSim = localStorage.getItem(SIMULATION_KEY);
  if (currentSim) {
    console.log(`⚡ Active Simulation: ${currentSim.toUpperCase()}`);
    console.log('   To disable: window.simulateWeb()');
  }
}
