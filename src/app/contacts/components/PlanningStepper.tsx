'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Cliente' },
  { number: 2, label: 'Salud' },
  { number: 3, label: 'Metas' },
  { number: 4, label: 'Cartera' },
  { number: 5, label: 'Final' },
];

interface PlanningStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function PlanningStepper({ currentStep, onStepClick }: PlanningStepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;
          const isPending = currentStep < step.number;

          return (
            <React.Fragment key={step.number}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => !isPending && onStepClick?.(step.number)}
                  disabled={isPending}
                  className={cn(
                    'relative w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300',
                    isCompleted && 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600',
                    isActive && 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 cursor-pointer',
                    isPending && 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  )}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    step.number
                  )}

                  {/* Active ring animation */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-indigo-500"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </button>

                {/* Label */}
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors duration-200',
                    isCompleted && 'text-emerald-400',
                    isActive && 'text-indigo-400',
                    isPending && 'text-slate-500'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-2">
                  <div className="h-0.5 bg-slate-700 rounded-full relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-emerald-500"
                      initial={{ width: '0%' }}
                      animate={{ width: isCompleted ? '100%' : '0%' }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
