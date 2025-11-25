# Dixon Smart Repair - Interactive Prototype

## Overview

This is an interactive HTML/CSS prototype for the Dixon Smart Repair mobile application system. It demonstrates the complete user experience for both customers and mechanics in an AI-powered automotive diagnostic and quote generation platform.

## Functional Goal

The Dixon Smart Repair system bridges the communication gap between vehicle owners and automotive mechanics through AI-assisted diagnostics. The prototype simulates the complete workflow from customer symptom input to mechanic review and final quote approval, reducing diagnostic time from 15+ minutes to under 5 minutes.

## Frontend Stack

- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.6.2** - Type-safe development with full IntelliSense
- **Vite 6.0.1** - Fast build tool with hot module replacement
- **Tailwind CSS 3.4.17** - Utility-first CSS framework for rapid styling
- **React Router v7** - Client-side routing with nested routes
- **shadcn/ui** - High-quality, accessible UI components built on Radix UI
- **Zustand 5.0.2** - Lightweight state management
- **AWS Amplify UI 6.11.0** - Authentication and AWS integration components
- **Lucide React 0.475.0** - Beautiful, customizable SVG icons
- **React Hook Form 7.54.2** - Performant forms with easy validation

## Key Features Demonstrated

### Customer Mobile Experience
- **VIN Scanning Simulation** - Camera interface with manual entry fallback
- **Natural Language Symptom Input** - Voice and text input with AI clarification
- **AI Diagnosis Display** - Ranked issues with confidence percentages
- **Quote Transparency** - Detailed cost breakdown with multiple options
- **Real-time Status Updates** - Mechanic review progress tracking

### Mechanic Mobile Workflow
- **Review Dashboard** - Pending diagnostics with priority indicators
- **Diagnostic Override** - Professional validation and modification capabilities
- **Quote Adjustment** - Real-time pricing and parts selection
- **Customer Communication** - Direct messaging and approval workflow

### Mobile-First Design
- **Touch-Optimized Interface** - 44px minimum touch targets
- **Responsive Layout** - Adapts to screen sizes from 4.7" to 6.7"
- **Gesture Support** - Swipe navigation and touch interactions
- **Accessibility Compliant** - WCAG 2.1 AA standards
- **PWA Capabilities** - App-like experience with offline support

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Safari, Firefox, Edge)
- Mobile device on same WiFi network for testing

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The prototype will be available at `http://localhost:3000`

### Mobile Testing
1. Find your computer's IP address (e.g., `192.168.1.100`)
2. Ensure your mobile device is on the same WiFi network
3. Open mobile browser and navigate to `http://[YOUR_IP]:3000`
4. Test the complete user flows on your actual mobile device

### Build for Production
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── customer/       # Customer-specific components
│   ├── mechanic/       # Mechanic-specific components
│   └── shared/         # Shared components
├── pages/              # Page components
│   ├── customer/       # Customer app pages
│   ├── mechanic/       # Mechanic app pages
│   └── shared/         # Shared pages (login, settings)
├── store/              # Zustand state management
├── lib/                # Utility functions and configurations
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

## Testing the Prototype

### Customer Flow Testing
1. **Welcome Page** - Start diagnostic process
2. **VIN Scanner** - Simulate vehicle identification
3. **Symptom Input** - Test voice/text input interfaces
4. **AI Clarification** - Navigate through follow-up questions
5. **Diagnosis Results** - Review AI recommendations
6. **Quote Display** - Compare repair options
7. **Status Tracking** - Monitor mechanic review progress

### Mechanic Flow Testing
1. **Dashboard** - Review pending diagnostics
2. **Diagnostic Review** - Validate AI recommendations
3. **Quote Adjustment** - Modify pricing and parts
4. **Final Approval** - Complete review process

### Mobile-Specific Testing
- **Touch Interactions** - Tap, swipe, pinch gestures
- **Form Input** - Mobile keyboard and voice input
- **Navigation** - Thumb-friendly bottom navigation
- **Performance** - Smooth scrolling and transitions
- **Accessibility** - Screen reader compatibility

## Design System

### Color Palette
- **Primary**: Automotive Blue (#1e40af) - Professional, trustworthy
- **Secondary**: Gray scale for text and backgrounds
- **Success**: Green (#10b981) - Positive actions and confirmations
- **Warning**: Amber (#f59e0b) - Cautions and important notices
- **Error**: Red (#ef4444) - Errors and critical issues

### Typography
- **Headings**: Inter font family, bold weights
- **Body Text**: Inter font family, regular weights
- **Mobile Optimized**: Minimum 16px font size for readability

### Components
- **Cards**: Elevated surfaces with subtle shadows
- **Buttons**: Touch-friendly with haptic feedback simulation
- **Forms**: Mobile-optimized with proper input types
- **Navigation**: Bottom tab bar for thumb accessibility

## Performance Considerations

- **Mobile-First**: Optimized for mobile devices and networks
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Responsive images with proper sizing
- **Bundle Splitting**: Code splitting for faster initial loads
- **Caching**: Service worker for offline capabilities

## Browser Support

- **iOS Safari** 14+
- **Chrome Mobile** 90+
- **Samsung Internet** 14+
- **Firefox Mobile** 90+

## Contributing

This prototype serves as a design validation tool and development reference. When implementing the actual React Native mobile apps, use this prototype as a guide for:

- User experience flows and interactions
- Component structure and organization
- State management patterns
- Mobile-specific design considerations
- Accessibility requirements

## License

This prototype is for internal development and design validation purposes.
