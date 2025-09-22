'use client';

import React from 'react';
import { Space, P, Icon } from '@dnb/eufemia';

interface Step {
  id: number;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
  isVisible: boolean;
  isSkipped?: boolean;
}

interface StepperProps {
  steps: Step[];
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export default function Stepper({ steps, onStepClick, className = '' }: StepperProps) {
  const visibleSteps = steps.filter(step => step.isVisible);

  return (
    <Space top="large" bottom="large">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 var(--spacing-medium)',
        maxWidth: '600px',
        width: '100%',
        margin: '0 auto'
      }}>
        {visibleSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div
              onClick={() => onStepClick && onStepClick(step.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: onStepClick ? 'pointer' : 'default',
                position: 'relative'
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: step.isSkipped
                    ? '3px dashed var(--color-black-20)'
                    : `3px solid ${
                        step.isCompleted
                          ? 'var(--color-sea-green)'
                          : step.isActive
                          ? 'var(--color-sea-green)'
                          : 'var(--color-black-20)'
                      }`,
                  backgroundColor: step.isCompleted
                    ? 'var(--color-sea-green)'
                    : step.isActive
                    ? 'var(--color-white)'
                    : 'var(--color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: step.isActive ? '0 0 0 3px var(--color-sea-green-12)' : 'none',
                  opacity: step.isSkipped ? 0.5 : 1
                }}
              >
                {step.isCompleted ? (
                  <Icon
                    icon="check"
                    size="medium"
                    style={{
                      color: 'var(--color-white)'
                    }}
                  />
                ) : step.isSkipped ? (
                  <span style={{
                    color: 'var(--color-black-40)',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    —
                  </span>
                ) : (
                  <span style={{
                    color: step.isActive ? 'var(--color-sea-green)' : 'var(--color-black-40)',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    {step.id}
                  </span>
                )}
              </div>

              {/* Step Title */}
              <Space top="small">
                <P
                  size="small"
                  style={{
                    fontWeight: step.isActive || step.isCompleted ? 600 : 400,
                    color: step.isSkipped
                      ? 'var(--color-black-40)'
                      : step.isActive || step.isCompleted
                      ? 'var(--color-sea-green)'
                      : 'var(--color-black-60)',
                    textAlign: 'center',
                    maxWidth: '120px',
                    lineHeight: 1.3,
                    opacity: step.isSkipped ? 0.6 : 1,
                    margin: 0
                  }}
                >
                  {step.isSkipped ? 'Hoppet over' : step.title}
                </P>
              </Space>
            </div>

            {/* Connection Line */}
            {index < visibleSteps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: '3px',
                  backgroundColor: step.isCompleted
                    ? 'var(--color-sea-green)'
                    : 'var(--color-black-20)',
                  margin: '0 var(--spacing-medium)',
                  marginBottom: '32px', // Align with circles
                  transition: 'background-color 0.3s ease',
                  borderRadius: '2px',
                  // Make line dashed if current step is skipped
                  ...(step.isSkipped && {
                    backgroundImage: 'repeating-linear-gradient(to right, var(--color-black-20) 0, var(--color-black-20) 4px, transparent 4px, transparent 8px)',
                    backgroundColor: 'transparent'
                  })
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </Space>
  );
}

// Helper hook for managing stepper state
export function useStepperState() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());

  const markStepCompleted = (stepId: number) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const markStepIncomplete = (stepId: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
  };

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId);
  };

  const createStep = (
    id: number,
    title: string,
    isVisible: boolean = true,
    isSkipped: boolean = false
  ): Step => ({
    id,
    title,
    isCompleted: completedSteps.has(id),
    isActive: currentStep === id,
    isVisible,
    isSkipped
  });

  return {
    currentStep,
    setCurrentStep,
    completedSteps,
    markStepCompleted,
    markStepIncomplete,
    goToStep,
    createStep
  };
}