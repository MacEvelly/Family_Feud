# Family Feud Audio Files

This directory contains the audio files for the Family Feud game, similar to the Philippines version hosted by Ding Dong Dantes.

## Required Audio Files

Place the following audio files in this directory:

1. **background-music.mp3** - Background music that loops during gameplay
   - Should be a catchy, upbeat game show theme
   - Recommended: Similar to the Philippines Family Feud theme music
   - Format: MP3, OGG, or WAV

2. **card-flip.mp3** - Sound effect when a correct answer card is flipped
   - Should be a satisfying "ding" or "chime" sound
   - Recommended: Classic game show correct answer sound
   - Format: MP3, OGG, or WAV

3. **wrong-answer.mp3** - Sound effect when a wrong answer is given
   - Should be a buzzer or "wrong" sound
   - Recommended: Classic game show buzzer sound
   - Format: MP3, OGG, or WAV

4. **game-start.mp3** - Sound effect when the game starts
   - Should be an exciting intro sound
   - Recommended: Game show intro music or fanfare
   - Format: MP3, OGG, or WAV

5. **points-awarded.mp3** - Sound effect when points are awarded to a team
   - Should be a celebratory sound
   - Recommended: Cheering or success sound
   - Format: MP3, OGG, or WAV

6. **new-question.mp3** - Sound effect when a new question appears
   - Should be a transition sound
   - Recommended: Brief musical sting or transition sound
   - Format: MP3, OGG, or WAV

## Where to Find Audio Files

You can find appropriate audio files from:
- Free sound effect websites (freesound.org, zapsplat.com)
- Royalty-free music libraries
- Game show sound effect collections
- Create your own recordings

## File Format Recommendations

- **Format**: MP3 is recommended for best browser compatibility
- **Bitrate**: 128-192 kbps is sufficient for game sounds
- **Sample Rate**: 44.1 kHz
- **File Size**: Keep files reasonably small (< 2MB for SFX, < 5MB for background music)

## Alternative: Using Web Audio URLs

If you prefer to host audio files elsewhere or use online sources, you can modify the audio paths in `FamilyFeud.js` in the `audioManager.init()` function to point to external URLs.

## Testing

After adding audio files:
1. Start the game server
2. Open the game in a browser
3. Use the audio controls in the top-right corner to test sounds
4. Adjust volume levels as needed

## Note

The game will work without audio files, but sounds will not play. Make sure all files are properly named and in the correct directory.

