import { Code, Megaphone, DollarSign, Headphones, Settings, Loader2 } from 'lucide-react';
import type { Role } from '../types';

const ROLE_ICONS: Record<string, typeof Code> = {
  engineering: Code,
  marketing: Megaphone,
  sales: DollarSign,
  support: Headphones,
  ops: Settings,
};

interface Props {
  roles: Role[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function Roles({ roles, selected, onToggle, onBack, onNext }: Props) {
  if (roles.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Select Roles</h2>
      <p className="text-gray-400 mb-6">Choose which AI agents to deploy for your team.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role.id] || Settings;
          const isSelected = selected.has(role.id);
          return (
            <button
              key={role.id}
              onClick={() => onToggle(role.id)}
              className={`text-left p-5 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/50'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{role.name}</h3>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{role.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.integrations.map((i) => (
                      <span key={i.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                        {i.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="px-5 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={selected.size === 0}
          className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:from-indigo-400 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
