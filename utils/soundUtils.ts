/**
 * Sound utility functions
 * Plays notification sounds using custom audio files
 */

/**
 * Plays a success notification sound (celebration audio)
 */
export function playSuccessSound() {
  try {
    // Use custom audio file from public directory
    const audio = new Audio('/audio/popup-audio.mp3');
    audio.volume = 0.5; // Adjust volume (0.0 to 1.0)
    audio.play().catch(error => {
      console.warn('Could not play success sound:', error);
    });
  } catch (error) {
    console.warn('Could not play success sound:', error);
  }
}
