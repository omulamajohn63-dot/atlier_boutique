import React, { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, UserRound, Package, Heart, Eye, MapPin, ShieldCheck, Bell } from 'lucide-react';
import { useRouter } from '../router/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { AccountOverviewPage } from './AccountOverviewPage';
import { AccountOrdersPage } from './AccountOrdersPage';
import { AccountNotificationsPage } from './AccountNotificationsPage';
import { AccountProfilePage } from './AccountProfilePage';
import { AccountAddressesPage } from './AccountAddressesPage';
import { AccountSecurityPage } from './AccountSecurityPage';

export const AccountPage: React.FC = () => {
  const { navigate, route } = useRouter();
  const { user, isLoading, isConfigured, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.user_metadata?.full_name || '');
    setPhone(user.user_metadata?.phone || '');
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    const result = mode === 'signIn'
      ? await signIn(email, password)
      : await signUp(email, password, { fullName, phone });
    setMessage(result.error || (result.needsVerification ? 'Check your email to verify your account.' : 'Welcome back to Atelier.'));
    setIsSubmitting(false);
  };

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-sm text-[#827E77]">Loading account...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-20">
        <button type="button" onClick={() => navigate('/')} className="text-xs font-semibold flex items-center gap-1.5 text-[#63605A] hover:text-[#181716]">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Storefront
        </button>

        <div className="bg-white border border-[#E8E5DF] rounded-3xl p-7 mt-6 space-y-6">
          <div className="text-center space-y-2">
            <UserRound className="w-6 h-6 mx-auto text-[#8A745C]" />
            <h1 className="font-serif text-2xl">Your Atelier Account</h1>
            <p className="text-xs text-[#827E77]">Save your details and follow every order in one place.</p>
          </div>

          {!isConfigured ? (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-[#9B6B20] bg-[#FFF8E8] border border-[#E8D7A8] rounded-xl p-4">
                Account access will be available once Supabase browser credentials are configured.
              </p>
              <Button type="button" onClick={() => navigate('/')} className="w-full uppercase tracking-wider text-xs">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {message && <p className="text-xs text-[#63605A] bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl p-3">{message}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signUp' && (
                  <>
                    <input type="text" required placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="w-full text-xs px-3.5 py-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl" />
                    <input type="tel" required placeholder="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" className="w-full text-xs px-3.5 py-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl" />
                  </>
                )}
                <input type="email" required placeholder="Email address" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full text-xs px-3.5 py-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl" />
                <input type="password" required minLength={8} placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full text-xs px-3.5 py-3 bg-[#FAF9F6] border border-[#E8E5DF] rounded-xl" />
                <Button type="submit" isLoading={isSubmitting} className="w-full uppercase tracking-wider text-xs">{mode === 'signIn' ? 'Sign In' : 'Create Account'}</Button>
              </form>
              <button type="button" onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} className="w-full text-xs text-[#63605A] hover:text-[#181716]">
                {mode === 'signIn' ? 'New to Atelier? Create an account' : 'Already have an account? Sign in'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const navigationItems: Array<{ label: string; href: string; icon: React.ReactNode }> = [
    { label: 'Overview', href: '/account', icon: <UserRound className="h-4 w-4" /> },
    { label: 'Orders', href: '/account/orders', icon: <Package className="h-4 w-4" /> },
    { label: 'Notifications', href: '/account/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Track Order', href: '/track', icon: <Eye className="h-4 w-4" /> },
    { label: 'Wishlist', href: '/wishlist', icon: <Heart className="h-4 w-4" /> },
    { label: 'Recently Viewed', href: '/shop', icon: <Eye className="h-4 w-4" /> },
    { label: 'Personal Info', href: '/account/profile', icon: <UserRound className="h-4 w-4" /> },
    { label: 'Addresses', href: '/account/addresses', icon: <MapPin className="h-4 w-4" /> },
    { label: 'Security', href: '/account/security', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid min-h-[560px] overflow-hidden rounded-[2rem] border border-[#E8E5DF] bg-white shadow-[0_20px_80px_rgba(24,23,22,0.04)] md:grid-cols-[260px_minmax(620px,1fr)]">
        <aside className="bg-[#F8F5EF] px-7 py-8 border-r border-[#E8E5DF] sticky top-0 self-start">
          <div className="font-serif text-2xl tracking-wide text-[#181716]">MY ACCOUNT</div>
          <nav className="mt-8 space-y-2">
            {navigationItems.map(({ label, href, icon }) => (
              <button key={label} type="button" onClick={() => navigate(href)} className={`flex w-full items-center gap-3 rounded-full px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] transition ${route.path === href ? 'bg-[#181716] text-[#FAF9F6]' : 'text-[#63605A] hover:bg-[#EFECE6]'}`}>
                {icon}
                {label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={() => void signOut()} className="mt-12 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#63605A] hover:text-[#181716]">
            <LogOut className="h-4 w-4" /> SIGN OUT
          </button>
        </aside>

        <main className="p-8 sm:p-10">
          {route.path === '/account/orders' && <AccountOrdersPage />}
          {route.path === '/account/notifications' && <AccountNotificationsPage />}
          {route.path === '/account/profile' && <AccountProfilePage />}
          {route.path === '/account/addresses' && <AccountAddressesPage />}
          {route.path === '/account/security' && <AccountSecurityPage />}
          {route.path === '/account' && <AccountOverviewPage />}
        </main>
      </div>
    </div>
  );
};
