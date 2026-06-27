import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import CalendarLogo from '../components/ui/CalendarLogo';

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </>
    )}
  </svg>
);

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// Password strength helper
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-400' };
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-yellow-400' };
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-400' };
  return { score: 4, label: 'Strong', color: 'bg-green-500' };
}

const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { mutate: register, isPending } = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  if (isAuthenticated) return <Navigate to="/" replace />;

  const strength = getPasswordStrength(password);

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = 'Full name is required';
    else if (name.trim().length < 2) next.name = 'Name must be at least 2 characters';

    if (!email) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';

    if (!password) next.password = 'Password is required';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters';

    if (!confirmPassword) next.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    register({ name: name.trim(), email: email.trim().toLowerCase(), password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-10">
        {/* Logo + title */}
        <div className="flex flex-col items-center mb-8">
          <CalendarLogo size={48} />
          <h1 className="mt-4 text-2xl font-normal text-gray-800 tracking-tight">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">to continue to Calendar</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="Alice Organiser"
            value={name}
            onChange={(e) => { setName(e.target.value); clearError('name'); }}
            error={errors.name}
            autoComplete="name"
            autoFocus
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
            error={errors.email}
            autoComplete="email"
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
              error={errors.password}
              autoComplete="new-password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              }
            />
            {/* Password strength bar */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.score ? strength.color : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${
                  strength.score <= 1 ? 'text-red-500' :
                  strength.score === 2 ? 'text-yellow-600' :
                  strength.score === 3 ? 'text-blue-500' : 'text-green-600'
                }`}>
                  {strength.label} password
                </p>
              </div>
            )}
          </div>

          <Input
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
            error={errors.confirmPassword}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showConfirm} />
              </button>
            }
          />

          <Button type="submit" fullWidth size="lg" loading={isPending} className="mt-2">
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-5 text-xs text-center text-gray-400 leading-relaxed">
          By creating an account you agree to our{' '}
          <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span>
          {' '}and{' '}
          <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>.
        </p>

        <div className="mt-5 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400 text-center">
        © {new Date().getFullYear()} Calendar · Built for productivity
      </p>
    </div>
  );
};

export default RegisterPage;
