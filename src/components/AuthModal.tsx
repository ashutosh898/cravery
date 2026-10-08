import React, { useState } from 'react';
import { User, LogIn, UserPlus, Shield, Sparkles, Check, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType, token: string) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'restaurant_owner' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        const res = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          role,
        });
        setSuccessMsg('Account registered in MongoDB! Logging you in...');
        setTimeout(() => {
          onAuthSuccess(res.user, res.sessionToken);
          onClose();
        }, 600);
      } else {
        const res = await api.login({
          email: email.trim(),
          password,
        });
        setSuccessMsg('Login successful! Stored in MongoDB login_logs.');
        setTimeout(() => {
          onAuthSuccess(res.user, res.sessionToken);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoRole: 'customer' | 'restaurant_owner' | 'admin') => {
    setIsRegisterMode(false);
    setEmail(demoEmail);
    setPassword('crave123');
    setRole(demoRole);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-stone-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {isRegisterMode ? 'Create Cravery Account' : 'Sign In to Cravery'}
              </h3>
              <p className="text-xs text-stone-500">
                Every login is logged to MongoDB database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quick Demo Credentials */}
        {!isRegisterMode && (
          <div className="my-3 p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs">
            <span className="font-bold text-stone-700 block mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              1-Click Demo Accounts (Pass: crave123):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillQuickDemo('alex.mercer@gmail.com', 'customer')}
                className="p-1.5 bg-white border border-stone-200 hover:border-amber-500 rounded text-center font-medium text-stone-800 transition-colors cursor-pointer truncate"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('chef.marco@anticoforno.it', 'restaurant_owner')}
                className="p-1.5 bg-white border border-stone-200 hover:border-amber-500 rounded text-center font-medium text-stone-800 transition-colors cursor-pointer truncate"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@cravery.com', 'admin')}
                className="p-1.5 bg-white border border-stone-200 hover:border-amber-500 rounded text-center font-medium text-stone-800 transition-colors cursor-pointer truncate"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Account Type
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="customer">Customer (Foodie)</option>
                  <option value="restaurant_owner">Restaurant Owner / Kitchen</option>
                  <option value="admin">Platform Administrator</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Register in MongoDB'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Signing in...' : 'Sign In & Record in MongoDB'}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-stone-200 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs text-stone-600 hover:text-amber-700 font-semibold cursor-pointer"
          >
            {isRegisterMode
              ? 'Already registered? Sign In'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
