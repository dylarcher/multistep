# Accessible Stepper Component

A WCAG 2.2 AA compliant stepper/wizard component built as a vanilla Web Component with TypeScript React wrapper support.

## Features

- **WCAG 2.2 AA+ compliant** — `aria-current="step"`, live region announcements, focus management
- **Two display modes** — numbered steps (1, 2, 3…) or percentage progress bar
- **Keyboard accessible** — Tab/Shift+Tab, Enter/Space activation
- **Framework agnostic** — native Web Component, works anywhere
- **TypeScript ready** — fully typed React wrapper with strict mode
- **React ready** — hooks, HOC, and context patterns included
- **Zero dependencies** — ~8KB unminified

**[View Live Demo](https://dylarcher.github.io/multistep/)** | **[GitHub Repository](https://github.com/dylarcher/multistep)**

---

## Installation

```bash
# Install from npm (coming soon)
npm install @dylarcher/multistep

# Or copy files to your project
main.js              # Web Component (JSDoc annotated)
hoc/react.tsx        # React integration (TypeScript)
styles.css           # Optional demo styles
```

---

## Quick Start

### Vanilla JavaScript

```html
<script type="module" src="./main.js"></script>

<accessible-stepper current="0" mode="steps">
  <div data-step data-label="Account">
    <h2>Create Account</h2>
    <input type="email" placeholder="Email" />
  </div>
  <div data-step data-label="Profile">
    <h2>Your Profile</h2>
    <input type="text" placeholder="Name" />
  </div>
  <div data-step data-label="Review">
    <h2>Review</h2>
    <p>Confirm your details</p>
  </div>
</accessible-stepper>

<script type="module">
  const stepper = document.querySelector('accessible-stepper');
  
  stepper.addEventListener('stepchange', (e) => {
    console.log('Step changed:', e.detail);
    // { current: 1, previous: 0, total: 3, label: "Profile", progress: 50 }
  });

  stepper.addEventListener('complete', () => {
    console.log('Wizard completed!');
  });
</script>
```

### React (TypeScript)

```tsx
import { useState } from 'react';
import { AccessibleStepper, Step } from './hoc/react';

function Wizard() {
  const [step, setStep] = useState(0);

  return (
    <AccessibleStepper
      current={step}
      mode="steps"
      onStepChange={(detail) => setStep(detail.current)}
      onComplete={() => alert('Done!')}
    >
      <Step label="Account">
        <h2>Create Account</h2>
        <input type="email" placeholder="Email" />
      </Step>
      <Step label="Profile">
        <h2>Your Profile</h2>
        <input type="text" placeholder="Name" />
      </Step>
      <Step label="Review">
        <h2>Review</h2>
        <p>Confirm your details</p>
      </Step>
    </AccessibleStepper>
  );
}
```

> **Note:** The React wrapper is fully TypeScript with comprehensive type definitions. Import from `./hoc/react.tsx` or configure your build tool to resolve `./hoc/react`.

---

## API Reference

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `current` | number | `0` | Current step index (0-based) |
| `mode` | `"steps"` \| `"progress"` | `"steps"` | Display as numbered steps or progress bar |
| `allow-navigation` | boolean | `false` | Allow clicking completed steps to navigate back |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentStep` | number | Get/set current step |
| `totalSteps` | number | Total step count (readonly) |
| `progress` | number | Completion percentage 0-100 (readonly) |
| `steps` | Element[] | Array of step elements (readonly) |

### Methods

| Method | Description |
|--------|-------------|
| `next()` | Advance to next step |
| `previous()` | Go to previous step |
| `goTo(index)` | Jump to specific step |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `stepchange` | `{ current, previous, total, label, progress }` | Fired on step change |
| `complete` | `{ current }` | Fired when clicking "Complete" on last step |

### CSS Custom Properties

```css
accessible-stepper {
  --stepper-primary: #0052cc;
  --stepper-complete: #00875a;
  --stepper-inactive: #6b778c;
  --stepper-bg: #fff;
  --stepper-border: #dfe1e6;
  --stepper-focus: #4c9aff;
  --stepper-font: system-ui, -apple-system, sans-serif;
}
```

---

## React Patterns

### Using the Hook

The `useAccessibleStepper` hook manages state independently—useful when you need custom UI or integration with form libraries.

```tsx
import { useAccessibleStepper, UseAccessibleStepperOptions, StepperState } from './hoc/react';

function CustomWizard() {
  const stepper = useAccessibleStepper(3, {
    initialStep: 0,
    onStepChange: (current, previous) => console.log(`${previous} → ${current}`),
    onComplete: (data) => submitForm(data),
    validateStep: async (step, data) => {
      if (step === 0 && !data?.email) {
        return 'Email is required';
      }
      return true;
    }
  });

  return (
    <div>
      <p>Step {stepper.currentStep + 1} of {stepper.totalSteps}</p>
      <progress value={stepper.progress} max="100" />

      {stepper.currentStep === 0 && (
        <input
          type="email"
          onChange={(e) => stepper.updateStepData(0, { email: e.target.value })}
        />
      )}

      {stepper.errors[stepper.currentStep] && (
        <p role="alert">{stepper.errors[stepper.currentStep]}</p>
      )}

      <button onClick={stepper.previous} disabled={stepper.isFirst}>Back</button>
      <button onClick={stepper.isLast ? stepper.complete : stepper.next}>
        {stepper.isLast ? 'Submit' : 'Continue'}
      </button>
    </div>
  );
}
```

### Hook Return Value

```ts
{
  currentStep: number;
  totalSteps: number;
  progress: number;          // 0-100
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  stepData: Record<number, any>;
  errors: Record<number, string | null>;
  next: () => Promise<boolean>;
  previous: () => boolean;
  goTo: (step: number) => boolean;
  complete: () => Promise<boolean>;
  reset: () => void;
  updateStepData: (step: number, data: object) => void;
  setCurrentStep: (step: number) => void;
}
```

### Using Context Provider

Share stepper state across deeply nested components.

```tsx
import { StepperProvider, useStepper, Step } from './hoc/react';

function App() {
  return (
    <StepperProvider
      totalSteps={3}
      onComplete={(data) => console.log('Submitted:', data)}
    >
      <WizardHeader />
      <WizardContent />
      <WizardFooter />
    </StepperProvider>
  );
}

function WizardHeader() {
  const { currentStep, totalSteps, progress } = useStepper();
  return (
    <header>
      <h1>Step {currentStep + 1} of {totalSteps}</h1>
      <progress value={progress} max="100" />
    </header>
  );
}

function WizardContent() {
  const { currentStep, updateStepData } = useStepper();
  // Render current step content...
}

function WizardFooter() {
  const { next, previous, isFirst, isLast, complete } = useStepper();
  return (
    <footer>
      <button onClick={previous} disabled={isFirst}>Back</button>
      <button onClick={isLast ? complete : next}>
        {isLast ? 'Finish' : 'Next'}
      </button>
    </footer>
  );
}
```

### Higher-Order Component

Wrap existing components to inject stepper functionality.

```tsx
import { withStepper } from './hoc/react';

function CheckoutForm({ stepper }) {
  return (
    <div>
      <p>Progress: {stepper.progress}%</p>
      {/* stepper.next(), stepper.previous(), etc. */}
    </div>
  );
}

export default withStepper(CheckoutForm, 4, {
  onComplete: (data) => processOrder(data)
});
```

### Direct Web Component Access

When you need the raw web component methods:

```tsx
import { useStepperRef, AccessibleStepperElement } from './hoc/react';

function Wizard() {
  const [ref, api] = useStepperRef();

  const jumpToEnd = () => api.goTo(api.totalSteps - 1);

  return (
    <accessible-stepper ref={ref}>
      {/* steps */}
    </accessible-stepper>
  );
}
```

---

## Live Demo

The [index.html](index.html) file includes a comprehensive demo showcasing all component features:

1. **Basic Steps Mode** - Standard numbered steps with navigation
2. **Progress Bar Mode** - Percentage-based progress indicator
3. **Allow Navigation** - Click completed steps to go back
4. **Form Wizard** - Multi-step form with validation
5. **Custom Themes** - Dark mode and custom color schemes

**[View Live Demo →](https://dylarcher.github.io/multistep/)**

The demo includes event logging and manual controls to test all component features interactively.

---

## Display Modes

### Steps Mode (default)

Shows numbered circles with step labels. Best for wizards with distinct stages.

```html
<accessible-stepper mode="steps">
  <!-- steps -->
</accessible-stepper>
```

### Progress Mode

Shows a progress bar with percentage. Best for linear flows or long processes.

```html
<accessible-stepper mode="progress">
  <!-- steps -->
</accessible-stepper>
```

---

## Accessibility Implementation

### ARIA Attributes Used

| Attribute | Element | Purpose |
|-----------|---------|---------|
| `aria-current="step"` | Current step marker | Identifies active step |
| `aria-live="polite"` | Announcer div | Announces step changes |
| `aria-atomic="true"` | Announcer div | Reads entire announcement |
| `aria-hidden` | Hidden steps | Removes from AT tree |
| `role="progressbar"` | Progress bar | Semantic progress |
| `aria-valuenow/min/max` | Progress bar | Numeric progress |
| `aria-valuetext` | Progress bar | Human-readable progress |
| `role="list"` | Step indicator | Semantic list structure |
| `role="button"` | Clickable markers | Interactive markers |

### Screen Reader Announcements

On step change, the live region announces: `"Step 2 of 3: Profile"`

### Focus Management

1. After step change, focus moves to first input in new step
2. If no inputs exist, focus moves to step content container
3. `tabindex="-1"` on content allows programmatic focus

### Keyboard Support

| Key | Action |
|-----|--------|
| Tab | Move between interactive elements |
| Enter/Space | Activate buttons, navigate to completed steps |

---

## Styling Examples

### Dark Theme

```css
accessible-stepper {
  --stepper-primary: #60a5fa;
  --stepper-complete: #34d399;
  --stepper-inactive: #9ca3af;
  --stepper-bg: #1f2937;
  --stepper-border: #374151;
  --stepper-focus: #93c5fd;
}
```

### Vertical Layout (requires custom CSS)

```css
accessible-stepper .stepper-nav {
  flex-direction: column;
  align-items: flex-start;
}

accessible-stepper .stepper-nav li {
  flex-direction: column;
}

accessible-stepper .stepper-nav li:not(:last-child)::after {
  width: 2px;
  height: 2rem;
  margin: 0.5rem 0 0.5rem 1.25rem;
}
```

### Compact Mobile

```css
@media (max-width: 480px) {
  accessible-stepper {
    --stepper-font: 14px;
  }
  
  accessible-stepper .step-marker {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
}
```

---

## Integration with Form Libraries

### React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { useAccessibleStepper, AccessibleStepper, Step } from './hoc/react';

function MultiStepForm() {
  const { register, handleSubmit, trigger, formState: { errors } } = useForm();
  
  const stepper = useAccessibleStepper(3, {
    validateStep: async (step) => {
      const fields = [['email'], ['name', 'phone'], ['terms']][step];
      return await trigger(fields);
    },
    onComplete: (stepData) => handleSubmit(onSubmit)()
  });

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <AccessibleStepper current={stepper.currentStep}>
        <Step label="Account">
          <input {...register('email', { required: true })} />
          {errors.email && <span>Required</span>}
        </Step>
        <Step label="Profile">
          <input {...register('name', { required: true })} />
          <input {...register('phone')} />
        </Step>
        <Step label="Confirm">
          <label>
            <input type="checkbox" {...register('terms', { required: true })} />
            Accept terms
          </label>
        </Step>
      </AccessibleStepper>
      
      <button onClick={stepper.previous} disabled={stepper.isFirst}>Back</button>
      <button onClick={stepper.isLast ? stepper.complete : stepper.next}>
        {stepper.isLast ? 'Submit' : 'Next'}
      </button>
    </form>
  );
}
```

---

## TypeScript Support

The React wrapper ([hoc/react.tsx](hoc/react.tsx)) is fully TypeScript with comprehensive type definitions and strict mode enabled. All types are exported for your use:

```tsx
import type {
  AccessibleStepperElement,
  StepperState,
  UseAccessibleStepperOptions,
  StepChangeDetail,
  CompleteDetail,
  AccessibleStepperProps,
  StepProps,
} from './hoc/react';

// Web Component interface
interface AccessibleStepperElement extends HTMLElement {
  currentStep: number;
  readonly totalSteps: number;
  readonly progress: number;
  readonly steps: Element[];
  next(): void;
  previous(): void;
  goTo(index: number): void;
}

// Hook options
interface UseAccessibleStepperOptions {
  initialStep?: number;
  onStepChange?: (current: number, previous: number) => void;
  onComplete?: (data: Record<number, unknown>) => void | Promise<void>;
  validateStep?: (step: number, data: unknown) => boolean | string | Promise<boolean | string>;
}

// Hook return value
interface StepperState {
  currentStep: number;
  totalSteps: number;
  progress: number;
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  stepData: Record<number, unknown>;
  errors: Record<number, string | null>;
  next: () => Promise<boolean>;
  previous: () => boolean;
  goTo: (step: number) => boolean;
  complete: () => Promise<boolean>;
  reset: () => void;
  updateStepData: (step: number, data: Record<string, unknown>) => void;
  setCurrentStep: (step: number) => void;
}
```

The vanilla Web Component ([main.js](main.js)) includes comprehensive JSDoc annotations for type safety in JavaScript projects:

```javascript
/**
 * @typedef {Object} StepChangeDetail
 * @property {number} current - Current step index
 * @property {number} previous - Previous step index
 * @property {number} total - Total number of steps
 * @property {string} label - Current step label
 * @property {number} progress - Completion percentage (0-100)
 */
```

---

## Project Structure

```
multistep/
├── main.js              # Web Component (JSDoc annotated)
├── hoc/
│   └── react.tsx        # TypeScript React wrapper
├── index.html           # Live demo (GitHub Pages)
├── styles.css           # Demo page styles
├── biome.json           # Linting & formatting config
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies & scripts
├── README.md            # This file
└── RESEARCH.md          # Implementation research
```

### Development

```bash
# Install dependencies
pnpm install

# Type check TypeScript files
pnpm type-check

# Lint and format (requires biome)
biome check --write .

# View demo
open index.html
```

**Quality Tools:**
- **Biome** - Fast linting and formatting for JavaScript
- **TypeScript** - Strict mode type checking for React wrapper
- **JSDoc** - Type annotations for vanilla Web Component

---

## Browser Support

- Chrome 67+
- Firefox 63+
- Safari 10.1+
- Edge 79+

Web Components (Custom Elements v1) are supported in all modern browsers. No polyfills needed.

---

## WCAG 2.2 Compliance Checklist

| Criterion | Level | Status |
|-----------|-------|--------|
| 1.3.1 Info and Relationships | A | ✅ Semantic `<ol>`, ARIA roles |
| 1.4.3 Contrast (Minimum) | AA | ✅ Default colors pass 4.5:1 |
| 2.1.1 Keyboard | A | ✅ Full keyboard access |
| 2.4.3 Focus Order | A | ✅ Logical focus sequence |
| 2.4.7 Focus Visible | AA | ✅ Visible focus indicators |
| 3.3.7 Redundant Entry | A | ✅ Data persisted between steps |
| 4.1.2 Name, Role, Value | A | ✅ ARIA labels, roles |
| 4.1.3 Status Messages | AA | ✅ Live region announcements |
