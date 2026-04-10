'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LogIn, Mail, Lock, Sparkles, Eye, EyeOff, Notebook } from 'lucide-react';
import Image from 'next/image';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Account created successfully! Please sign in.');
    }
  }, [searchParams]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const result = await loginAction(formData);
    if (result.success) {
      router.push('/');
      router.refresh();
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f9fc] via-[#f0fdfe] to-[#d6f7fa] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#1ecbe1] rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#17a8bb] rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0fa8be] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-3/4 max-w-md shadow-2xl relative z-10 backdrop-blur-lg bg-transparent">
        <CardHeader className="space-y-3 pb-6">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <Image
              src="/icon-512x512.png"
              alt="Dapur Lisa"
              width={64}
              height={64}
              className="rounded-2xl shadow-lg"
            />
          </div>
          <CardTitle className="text-xl font-bold text-center text-[#028697]">
            Dapur Lisa
          </CardTitle>
          <CardDescription className="text-center text-base">
            Login untuk akses ke beranda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-light flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                Email atau No. WhatsApp
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                required
                placeholder="you@example.com or 08123456789"
                disabled={loading}
                className="h-11 text-sm focus-visible:ring-[#1ecbe1]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-light flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                  className="h-11 text-sm pr-10 focus-visible:ring-[#1ecbe1]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {successMessage && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {successMessage}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-[#028697] hover:bg-[#17a8bb] text-white transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Masuk
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-teal-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#028697] rounded-lg text-white">atau</span>
            </div>
          </div>

          <Link href="/landing" className="block text-xs">
            <Button
              variant="outline"
              className="w-full h-7 font-semibold border-0 text-[#028697] hover:bg-[#e0f9fc] hover:text-[#00545f] transition-all duration-200"
            >
              <Notebook className="w-4 h-4 mr-2" />
              lihat katalog
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f9fc] via-[#f0fdfe] to-[#d6f7fa]">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="p-6">
            <div className="text-center flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-[#1ecbe1] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}