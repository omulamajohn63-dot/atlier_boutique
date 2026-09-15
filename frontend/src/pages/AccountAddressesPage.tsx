import React from 'react';
import { MapPin, Plus } from 'lucide-react';

export const AccountAddressesPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="rounded-[2rem] border border-[#E8E5DF] bg-white shadow-sm">
        <div className="border-b border-[#E8E5DF] px-8 py-6 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#827E77]">Account</div>
            <h1 className="font-serif text-3xl text-[#181716] mt-2">Addresses</h1>
          </div>
          <MapPin className="h-7 w-7 text-[#8A745C]" />
        </div>

        <div className="p-8 space-y-4">
          <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">Default Delivery</div>
                <div className="font-serif text-xl text-[#181716] mt-2">Elena Wambui</div>
                <div className="text-sm text-[#63605A] mt-2">14 Riverside Drive, Westlands<br />Nairobi County, Kenya 00100</div>
              </div>
              <button type="button" className="rounded-full border border-[#181716] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#181716] hover:bg-[#181716] hover:text-[#FAF9F6] transition-colors">
                Edit
              </button>
            </div>
          </div>

          <button type="button" className="flex items-center gap-2 rounded-full border border-[#E8E5DF] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#63605A] hover:bg-[#181716] hover:text-[#FAF9F6] transition-colors">
            <Plus className="h-4 w-4" /> Add a new address
          </button>
        </div>
      </div>
    </div>
  );
};
