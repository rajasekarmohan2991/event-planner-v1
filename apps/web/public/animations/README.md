# Animation Assets

This directory contains Lottie animations used throughout the application.

## Adding New Animations

1. Download free Lottie animations from [LottieFiles](https://lottiefiles.com/), [Lordicon](https://lordicon.com/), or other free sources
2. Place the `.json` files in this directory
3. Update the `AuthAnimations` object in `components/ui/LottieAnimation.tsx` to include the new animation

## Guidelines

- Use free, open-source animations with proper attribution if required
- Keep file sizes small (preferably under 100KB)
- Optimize animations for web use
- Test animations on different screen sizes

## Current Animations

- `login.json` - Shown on the login page
- `register.json` - Shown on the registration page
- `success.json` - Used for success messages
- `error.json` - Used for error messages
- `loading.json` - Used for loading states
