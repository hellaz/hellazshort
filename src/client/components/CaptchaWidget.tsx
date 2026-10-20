import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface CaptchaWidgetProps {
  onVerify: (data: { token?: string; answer?: string; solution?: string }) => void;
  provider?: 'built_in' | 'turnstile' | 'recaptcha' | 'solvemedia';
  siteKey?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: any) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export const CaptchaWidget: React.FC<CaptchaWidgetProps> = ({
  onVerify,
  provider = 'built_in',
  siteKey,
}) => {
  const [num1, setNum1] = useState(3);
  const [num2, setNum2] = useState(4);
  const [userAnswer, setUserAnswer] = useState('');
  const [verified, setVerified] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

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

  // Cloudflare Turnstile integration
  useEffect(() => {
    if (provider === 'turnstile' && siteKey && turnstileContainerRef.current) {
      // Load Turnstile script if missing
      const SCRIPT_ID = 'cf-turnstile-script';
      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement;

      const initTurnstile = () => {
        if (window.turnstile && turnstileContainerRef.current) {
          try {
            if (widgetIdRef.current) {
              window.turnstile.remove(widgetIdRef.current);
            }
            widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
              sitekey: siteKey,
              theme: 'dark',
              callback: (token: string) => {
                setVerified(true);
                onVerify({ token });
              },
              'error-callback': () => {
                setVerified(false);
                onVerify({ token: undefined });
              },
              'expired-callback': () => {
                setVerified(false);
                onVerify({ token: undefined });
              },
            });
          } catch (err) {
            console.warn('Turnstile render error:', err);
          }
        }
      };

      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setTimeout(initTurnstile, 100);
        };
        document.head.appendChild(script);
      } else if (window.turnstile) {
        initTurnstile();
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
        }
      };
    }
  }, [provider, siteKey]);

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

  // If Turnstile is active and siteKey is configured, render Turnstile container
  if (provider === 'turnstile' && siteKey) {
    return (
      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5 font-semibold text-[11px] text-indigo-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cloudflare Turnstile Verification</span>
          </div>
        </div>
        <div ref={turnstileContainerRef} className="my-1 flex justify-center min-h-[65px]" />
      </div>
    );
  }

  // Built-in lightweight challenge (zero setup required)
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
