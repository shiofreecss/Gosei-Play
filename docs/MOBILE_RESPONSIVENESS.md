# Mobile and Tablet Responsiveness

This document outlines the responsive design approach used in the Gosei Play application, including device detection and specific optimizations for different screen sizes.

## Device Detection

The application uses a custom hook `useDeviceDetect` to determine the current device type based on screen width. This hook is located in `src/hooks/useDeviceDetect.ts`.

### Breakpoints

The application uses the following breakpoints for device detection:

- Mobile: < 768px (< md breakpoint)
- Tablet: 768px - 1024px (md to lg breakpoint)
- Desktop: ≥ 1024px (≥ lg breakpoint)

### Usage

```typescript
import useDeviceDetect from '../../hooks/useDeviceDetect';

const YourComponent = () => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetect();
  
  return (
    <div className={`
      ${isMobile ? 'mobile-styles' : ''}
      ${isTablet ? 'tablet-styles' : ''}
      ${isDesktop ? 'desktop-styles' : ''}
    `}>
      {/* Your component content */}
    </div>
  );
};
```

## Responsive Design Principles

### Mobile View (< 768px)
- Full-width layouts
- Smaller text sizes
- Compact controls
- Touch-friendly button sizes
- Stacked layouts for better readability

### Tablet View (768px - 1024px)
- Optimized 600px width for game info
- Larger text sizes for better readability
- Increased padding and spacing
- Enhanced touch targets
- Balanced layouts between mobile and desktop

### Desktop View (≥ 1024px)
- Sidebar layouts for game information
- Standard text sizes
- Efficient use of screen real estate
- Hover states for interactive elements

## Component-Specific Optimizations

### Game Info Component
The Game Info component (`src/components/go-board/GameInfo.tsx`) implements responsive design with the following features:

#### Mobile
- Full-width layout
- Compact player cards
- Small avatars (64px)
- Minimal padding and spacing

#### Tablet
- Fixed width (600px) with centered alignment
- Larger player cards with increased padding
- Larger avatars (80px)
- Enhanced button sizes
- Increased text sizes
- Optimized spacing between elements

#### Desktop
- Fixed width (400px-500px)
- Standard sizing for all elements
- Compact sidebar layout

### Best Practices

1. **Conditional Styling**
   ```typescript
   const styles = {
     container: `base-styles ${
       isTablet 
         ? 'tablet-specific-styles'
         : isMobile
           ? 'mobile-specific-styles'
           : 'desktop-specific-styles'
     }`
   };
   ```

2. **Responsive Images**
   - Use appropriate image sizes for different devices
   - Implement lazy loading for better performance
   - Consider using different aspect ratios when needed

3. **Touch Targets**
   - Minimum 44x44px for touch targets on mobile and tablet
   - Adequate spacing between interactive elements
   - Clear visual feedback for touch interactions

4. **Performance Considerations**
   - Throttle resize event listeners
   - Clean up event listeners in useEffect
   - Use CSS transforms for animations when possible

## Testing

To ensure proper responsive behavior:

1. Test on actual devices when possible
2. Use browser dev tools for device emulation
3. Test orientation changes (portrait/landscape)
4. Verify touch interactions work as expected
5. Check performance on different devices

## Future Improvements

- Consider implementing orientation-specific layouts
- Add support for larger tablet sizes (iPad Pro)
- Implement responsive images using srcset
- Add support for foldable devices
- Consider implementing responsive font sizing using clamp()

## Related Documentation

- [Board Sizes](./BOARD_SIZES.md)
- [Planning](./PLANNING.md)
- [Troubleshooting](./TROUBLESHOOTING.md) 