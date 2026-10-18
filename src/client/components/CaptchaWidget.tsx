import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface CaptchaWidgetProps {
  onVerify: (data: { token?: string; answer?: string; solution?: string }) => void;
  provider?: 'built_in' | 'turnstile' | 'recaptcha' | 'solvemedia';
  siteKey?: string;
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  onVerify,
  provider = 'built_in',
}) => {
  const [num1, setNum1] = useState(3);
  const [num2, setNum2] = useState(4);
  const [userAnswer, setUserAnswer] = useState('');
  const [verified, setVerified] = useState(false);

  const generateProblem = () => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setNum1(a);
    setNum2(b);
    setUserAnswer('');
    setVerified(false);
  };

  useEffect(() => {
    generateProblem();
  }, [provider]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserAnswer(val);
    const expected = (num1 + num2).toString();
    if (val.trim() === expected) {
      setVerified(true);
      onVerify({
        token: `math_verified_${Date.now()}`,
        answer: val.trim(),
        solution: expected,
      });
    } else {
      setVerified(false);
      onVerify({
        token: undefined,
        answer: val.trim(),
        solution: expected,
      });
    }
  };

  return (
    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs">
      <div className="flex items-center justify-between text-slate-300">
        <div className="flex items-center gap-1.5 font-semibold text-[11px] text-indigo-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Security Verification (Anti-Bot Captcha)</span>
        </div>
        <button
          type="button"
          onClick={generateProblem}
          className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer transition-colors"
          title="Refresh Captcha Challenge"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 bg-slate-950 font-mono text-sm font-bold text-amber-400 rounded-lg border border-slate-800 select-none">
          {num1} + {num2} = ?
        </div>
        <input
          type="text"
          maxLength={3}
          placeholder="Answer..."
          value={userAnswer}
          onChange={handleChange}
          className={`w-24 px-3 py-1.5 font-mono text-xs rounded-lg border bg-slate-950 text-white focus:outline-hidden ${
            verified
              ? 'border-emerald-500 ring-1 ring-emerald-500/50'
              : 'border-slate-700 focus:border-indigo-500'
          }`}
        />
        {verified && (
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            ✓ Verified
          </span>
        )}
      </div>
    </div>
  );
};
