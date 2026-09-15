import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

export const AccountSecurityPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="rounded-[2rem] border border-[#E8E5DF] bg-white shadow-sm">
        <div className="border-b border-[#E8E5DF] px-8 py-6 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#827E77]">Account</div>
            <h1 className="font-serif text-3xl text-[#181716] mt-2">Security</h1>
          </div>
          <ShieldCheck className="h-7 w-7 text-[#8A745C]" />
        </div>

        <div className="p-8 space-y-4">
          <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">Password</div>
                <div className="text-sm text-[#63605A] mt-2">Protected with encrypted account access</div>
              </div>
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2E5A44]"><Check className="h-4 w-4" /> Enabled</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">Two-step verification</div>
                <div className="text-sm text-[#63605A] mt-2">Recommended for boutique account safety</div>
              </div>
              <button type="button" className="rounded-full border border-[#181716] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#181716] hover:bg-[#181716] hover:text-[#FAF9F6] transition-colors">
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
