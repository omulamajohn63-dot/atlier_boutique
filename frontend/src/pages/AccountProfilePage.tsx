import React from 'react';
import { UserRound, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export const AccountProfilePage: React.FC = () => {
  const { user, isConfigured, updateProfile } = useAuth();
  const [fullName, setFullName] = React.useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = React.useState(user?.user_metadata?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileMessage, setProfileMessage] = React.useState('');

  React.useEffect(() => {
    if (!user) return;
    setFullName(user.user_metadata?.full_name || '');
    setPhone(user.user_metadata?.phone || '');
  }, [user]);

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileMessage('');
    setIsSavingProfile(true);
    const result = await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
    setProfileMessage(result.error || 'Profile details updated.');
    setIsSavingProfile(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="rounded-[2rem] border border-[#E8E5DF] bg-white shadow-sm">
        <div className="border-b border-[#E8E5DF] px-8 py-6 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#827E77]">Account</div>
            <h1 className="font-serif text-3xl text-[#181716] mt-2">Personal Information</h1>
          </div>
          <UserRound className="h-7 w-7 text-[#8A745C]" />
        </div>

        <form onSubmit={handleProfileSave} className="p-8 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#63605A]">
              Full name
              <input type="text" required value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="mt-2 w-full rounded-xl border border-[#E8E5DF] bg-[#FAF9F6] px-3.5 py-3 text-sm text-[#181716] focus:border-[#181716] focus:outline-none" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#63605A]">
              Phone number
              <input type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="mt-2 w-full rounded-xl border border-[#E8E5DF] bg-[#FAF9F6] px-3.5 py-3 text-sm text-[#181716] focus:border-[#181716] focus:outline-none" />
            </label>
          </div>

          <div className="rounded-[1.5rem] border border-[#E8E5DF] bg-[#FAF9F6] px-5 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#827E77]">Email</div>
            <div className="mt-2 text-sm text-[#181716]">{user?.email || 'atelier@example.com'}</div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" isLoading={isSavingProfile} disabled={!isConfigured} className="gap-2"><Save className="h-3.5 w-3.5" /> Save profile</Button>
            {profileMessage && <p className="text-xs text-[#63605A]">{profileMessage}</p>}
          </div>
        </form>
      </div>
    </div>
  );
};
