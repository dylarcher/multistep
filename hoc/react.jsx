/**
 * React Wrapper for Accessible Stepper Web Component
 * Provides: useAccessibleStepper hook, withStepper HOC, and StepperProvider context
 */

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// Ensure web component is registered (side effect import)
import '../main.js';

/**
 * Custom hook for stepper state management
 * @param {number} totalSteps - Total number of steps
 * @param {Object} options - Configuration options
 */
export function useAccessibleStepper(totalSteps, options = {}) {
  const { initialStep = 0, onStepChange, onComplete, validateStep } = options;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [stepData, setStepData] = useState({});
  const [errors, setErrors] = useState({});

  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrev = currentStep > 0;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = totalSteps > 1 ? Math.round((currentStep / (totalSteps - 1)) * 100) : 100;

  const updateStepData = useCallback((step, data) => {
    setStepData((prev) => ({
      ...prev,
      [step]: { ...prev[step], ...data },
    }));
  }, []);

  const next = useCallback(async () => {
    if (!canGoNext) return false;

    // Run validation if provided
    if (validateStep) {
      const validationResult = await validateStep(currentStep, stepData[currentStep]);
      if (validationResult !== true) {
        setErrors((prev) => ({ ...prev, [currentStep]: validationResult }));
        return false;
      }
    }

    setErrors((prev) => ({ ...prev, [currentStep]: null }));
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    onStepChange?.(nextStep, currentStep);
    return true;
  }, [canGoNext, currentStep, stepData, validateStep, onStepChange]);

  const previous = useCallback(() => {
    if (!canGoPrev) return false;
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    onStepChange?.(prevStep, currentStep);
    return true;
  }, [canGoPrev, currentStep, onStepChange]);

  const goTo = useCallback(
    (step) => {
      if (step < 0 || step >= totalSteps) return false;
      const oldStep = currentStep;
      setCurrentStep(step);
      onStepChange?.(step, oldStep);
      return true;
    },
    [totalSteps, currentStep, onStepChange]
  );

  const complete = useCallback(async () => {
    if (validateStep) {
      const validationResult = await validateStep(currentStep, stepData[currentStep]);
      if (validationResult !== true) {
        setErrors((prev) => ({ ...prev, [currentStep]: validationResult }));
        return false;
      }
    }
    onComplete?.(stepData);
    return true;
  }, [currentStep, stepData, validateStep, onComplete]);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    setStepData({});
    setErrors({});
  }, [initialStep]);

  return {
    currentStep,
    totalSteps,
    progress,
    isFirst,
    isLast,
    canGoNext,
    canGoPrev,
    stepData,
    errors,
    next,
    previous,
    goTo,
    complete,
    reset,
    updateStepData,
    setCurrentStep,
  };
}

// Context for sharing stepper state across components
const StepperContext = createContext(null);

export function StepperProvider({ children, ...stepperOptions }) {
  const stepper = useAccessibleStepper(stepperOptions.totalSteps, stepperOptions);

  return <StepperContext.Provider value={stepper}>{children}</StepperContext.Provider>;
}

export function useStepper() {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error('useStepper must be used within a StepperProvider');
  }
  return context;
}

/**
 * Higher-Order Component for adding stepper functionality
 */
export function withStepper(WrappedComponent, totalSteps, options = {}) {
  return function WithStepperComponent(props) {
    const stepper = useAccessibleStepper(totalSteps, options);
    return <WrappedComponent {...props} stepper={stepper} />;
  };
}

/**
 * React wrapper component for the web component
 */
export const AccessibleStepper = forwardRef(function AccessibleStepper(
  {
    current = 0,
    mode = 'steps',
    allowNavigation = false,
    onStepChange,
    onComplete,
    children,
    className,
    style,
    ...props
  },
  forwardedRef
) {
  const innerRef = useRef(null);
  const ref = forwardedRef || innerRef;

  // Sync current prop to web component
  useEffect(() => {
    const el = ref.current;
    if (el && el.currentStep !== current) {
      el.currentStep = current;
    }
  }, [current, ref]);

  // Event listeners
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleStepChange = (e) => onStepChange?.(e.detail);
    const handleComplete = (e) => onComplete?.(e.detail);

    el.addEventListener('stepchange', handleStepChange);
    el.addEventListener('complete', handleComplete);

    return () => {
      el.removeEventListener('stepchange', handleStepChange);
      el.removeEventListener('complete', handleComplete);
    };
  }, [onStepChange, onComplete]);

  return (
    <accessible-stepper
      ref={ref}
      current={current}
      mode={mode}
      allow-navigation={allowNavigation || undefined}
      class={className}
      style={style}
      {...props}
    >
      {children}
    </accessible-stepper>
  );
});

/**
 * Step component for cleaner JSX
 */
export function Step({ label, children, className, ...props }) {
  return (
    <div data-step data-label={label} className={className} {...props}>
      {children}
    </div>
  );
}

/**
 * Hook for accessing the web component instance directly
 */
export function useStepperRef() {
  const ref = useRef(null);

  const api = {
    next: () => ref.current?.next(),
    previous: () => ref.current?.previous(),
    goTo: (index) => ref.current?.goTo(index),
    get currentStep() {
      return ref.current?.currentStep ?? 0;
    },
    get totalSteps() {
      return ref.current?.totalSteps ?? 0;
    },
    get progress() {
      return ref.current?.progress ?? 0;
    },
  };

  return [ref, api];
}

export default AccessibleStepper;
