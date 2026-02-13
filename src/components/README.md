# UI Components

Modern, unique NativeWind components for the POS Kiosk application.

## Quick Start

```tsx
import { Button, Card, Badge, Input, Pill, ProductCard } from '@/components/ui';
import { View, Text } from 'react-native';

export default function MyScreen() {
  return (
    <View className="flex-1 bg-black p-6">
      <Card className="mb-4">
        <Text className="text-white font-bold text-xl">
          Hello World
        </Text>
      </Card>
      
      <Button variant="primary" fullWidth onPress={handlePress}>
        Get Started
      </Button>
    </View>
  );
}
```

## Available Components

### Core Components
- **Button** - 6 variants, 4 sizes, loading states
- **Card** - 4 variants, flexible padding
- **Badge** - Status indicators with dot option
- **Input** - Text input with label and error states
- **IconButton** - Circular icon buttons
- **Pill** - Category/filter pills with active states

### Specialized Components
- **ProductCard** - Menu item cards with image
- **FloatingCart** - Sticky cart button with count

## Documentation

- **NATIVEWIND_GUIDE.md** - Complete API reference
- **COMPONENT_SHOWCASE.md** - Visual examples
- **MIGRATION_CHECKLIST.md** - Migration guide

## Component Structure

```
src/components/
├── ui/                    # NativeWind components
│   ├── Button.tsx        # Primary button component
│   ├── Card.tsx          # Container component
│   ├── Badge.tsx         # Status indicators
│   ├── Input.tsx         # Text input
│   ├── IconButton.tsx    # Icon buttons
│   ├── Pill.tsx          # Category pills
│   ├── ProductCard.tsx   # Menu item cards
│   ├── FloatingCart.tsx  # Cart button
│   └── index.ts          # Exports
├── Button.tsx            # Legacy button (deprecated)
├── Card.tsx              # Legacy card (deprecated)
├── index.ts              # Central exports
└── README.md             # This file
```

## Usage Examples

### Button Variants
```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="outline">Outline</Button>
```

### Card Variants
```tsx
<Card variant="default">Default</Card>
<Card variant="elevated">Elevated</Card>
<Card variant="outlined">Outlined</Card>
<Card variant="glass">Glass</Card>
```

### Badge Variants
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">New</Badge>
```

### Input Variants
```tsx
<Input variant="default" />
<Input variant="filled" />
<Input variant="outlined" />
```

## Customization

All components accept a `className` prop for additional styling:

```tsx
<Button className="mt-4 shadow-lg">
  Custom Button
</Button>

<Card className="mb-6 border-brand">
  Custom Card
</Card>
```

## Design Tokens

Components use design tokens from `tailwind.config.js`:

- **Colors**: brand, success, warning, error, surface, text
- **Spacing**: 4, 8, 12, 16, 20, 24, 32, 48
- **Typography**: display, heading, body, label
- **Shadows**: brand, success, card, elevated

## Best Practices

1. **Use semantic variants**: Choose the right variant for the action
2. **Consistent sizing**: Use the same size across similar components
3. **Proper spacing**: Follow the 8-point grid system
4. **Touch targets**: Ensure minimum 44px height for interactive elements
5. **Accessibility**: Provide proper labels and contrast

## Migration from Legacy

### Before (StyleSheet)
```tsx
<TouchableOpacity style={styles.button} onPress={handlePress}>
  <Text style={styles.buttonText}>Click Me</Text>
</TouchableOpacity>
```

### After (NativeWind)
```tsx
<Button variant="primary" onPress={handlePress}>
  Click Me
</Button>
```

## Contributing

When adding new components:

1. Create in `src/components/ui/`
2. Use NativeWind styled components
3. Accept `className` prop for customization
4. Export from `src/components/ui/index.ts`
5. Document in COMPONENT_SHOWCASE.md
6. Add usage examples

## Support

For questions or issues:
- Check NATIVEWIND_GUIDE.md for API reference
- See COMPONENT_SHOWCASE.md for visual examples
- Review example screens in `app/` directory
