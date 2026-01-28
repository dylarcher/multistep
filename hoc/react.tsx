/**
 * React Wrapper for Accessible Stepper Web Component
 * Provides: useAccessibleStepper hook, withStepper HOC, and StepperProvider context
 */

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ForwardedRef,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

// Ensure web component is registered (side effect import)
import '../main.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'accessible-stepper': {
        ref?: ForwardedRef<AccessibleStepperElement>;
        current?: number;
        mode?: 'steps' | 'progress';
        'allow-navigation'?: boolean | '';
        class?: string;
        style?: CSSProperties;
        children?: ReactNode;
      };
    }
  }
}

export interface AccessibleStepperElement extends HTMLElement {
  currentStep: number;
  totalSteps: number;
  progress: number;
  steps: Element[];
  next(): void;
  previous(): void;
  goTo(index: number): void;
}

export interface UseAccessibleStepperOptions {
  initialStep?: number;
  onStepChange?: (current: number, previous: number) => void;
  onComplete?: (data: Record<number, unknown>) => void | Promise<void>;
  validateStep?: (
    step: number,
    data: unknown
  ) => boolean | string | Promise<boolean | string>;
}

export interface StepperState {
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

export function useAccessibleStepper(
  totalSteps: number,
  options: UseAccessibleStepperOptions = {}
): StepperState {
  const { initialStep = 0, onStepChange, onComplete, validateStep } = options;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [stepData, setStepData] = useState<Record<number, Record<string, unknown>>>({});
  const [errors, setErrors] = useState<Record<number, string | null>>({});

  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrev = currentStep > 0;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = totalSteps > 1 ? Math.round((currentStep / (totalSteps - 1)) * 100) : 100;

  const updateStepData = useCallback((step: number, data: Record<string, unknown>) => {
    setStepData((prev) => ({
      ...prev,
      [step]: { ...(prev[step] ?? {}), ...data },
    }));
  }, []);

  const next = useCallback(async () => {
    if (!canGoNext) return false;

    if (validateStep) {
      const validationResult = await validateStep(currentStep, stepData[currentStep]);
      if (validationResult !== true) {
        setErrors((prev) => ({ ...prev, [currentStep]: validationResult as string }));
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
    (step: number) => {
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
        setErrors((prev) => ({ ...prev, [currentStep]: validationResult as string }));
        return false;
      }
    }
    await onComplete?.(stepData);
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

const StepperContext = createContext<StepperState | null>(null);

export interface StepperProviderProps extends PropsWithChildren {
  totalSteps: number;
  initialStep?: number;
  onStepChange?: (current: number, previous: number) => void;
  onComplete?: (data: Record<number, unknown>) => void | Promise<void>;
  validateStep?: (
    step: number,
    data: unknown
  ) => boolean | string | Promise<boolean | string>;
}

export function StepperProvider({ children, ...stepperOptions }: StepperProviderProps) {
  const stepper = useAccessibleStepper(stepperOptions.totalSteps, stepperOptions);

  return <StepperContext.Provider value={stepper}>{children}</StepperContext.Provider>;
}

export function useStepper(): StepperState {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error('useStepper must be used within a StepperProvider');
  }
  return context;
}

export function withStepper<P extends object>(
  WrappedComponent: ComponentType<P & { stepper: StepperState }>,
  totalSteps: number,
  options: UseAccessibleStepperOptions = {}
) {
  return function WithStepperComponent(props: P) {
    const stepper = useAccessibleStepper(totalSteps, options);
    return <WrappedComponent {...props} stepper={stepper} />;
  };
}

export interface StepChangeDetail {
  current: number;
  previous: number;
  total: number;
  label: string;
  progress: number;
}

export interface CompleteDetail {
  current: number;
}

export interface AccessibleStepperProps {
  current?: number;
  mode?: 'steps' | 'progress';
  allowNavigation?: boolean;
  onStepChange?: (detail: StepChangeDetail) => void;
  onComplete?: (detail: CompleteDetail) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const AccessibleStepper = forwardRef<
  AccessibleStepperElement,
  AccessibleStepperProps
>(function AccessibleStepper(
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
  const innerRef = useRef<AccessibleStepperElement>(null);
  const ref = (forwardedRef || innerRef) as React.MutableRefObject<AccessibleStepperElement | null>;

  useEffect(() => {
    const el = ref.current;
    if (el && el.currentStep !== current) {
      el.currentStep = current;
    }
  }, [current, ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleStepChange = (e: Event) => {
      const customEvent = e as CustomEvent<StepChangeDetail>;
      onStepChange?.(customEvent.detail);
    };
    const handleComplete = (e: Event) => {
      const customEvent = e as CustomEvent<CompleteDetail>;
      onComplete?.(customEvent.detail);
    };

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

export interface StepProps {
  label: string;
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
}

export function Step({ label, children, className, ...props }: StepProps) {
  return (
    <div data-step data-label={label} className={className} {...props}>
      {children}
    </div>
  );
}

export function useStepperRef(): [
  React.RefObject<AccessibleStepperElement>,
  {
    next: () => void;
    previous: () => void;
    goTo: (index: number) => void;
    readonly currentStep: number;
    readonly totalSteps: number;
    readonly progress: number;
  }
] {
  const ref = useRef<AccessibleStepperElement>(null);

  const api = {
    next: () => ref.current?.next(),
    previous: () => ref.current?.previous(),
    goTo: (index: number) => ref.current?.goTo(index),
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
