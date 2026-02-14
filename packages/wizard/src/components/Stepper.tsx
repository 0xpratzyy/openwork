import { Check } from 'lucide-react';

interface Props {
  steps: string[];
  current: number;
}

export default function Stepper({ steps, current }: Props) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  done
                    ? 'bg-indigo-500 text-white'
                    : active
                      ? 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500'
                      : 'bg-white/5 text-gray-500'
                }`}
              >
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={`mt-1 text-xs hidden sm:block ${
                  active ? 'text-indigo-400' : done ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 transition-colors ${
                  done ? 'bg-indigo-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
