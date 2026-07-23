import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type SignupErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type PasswordStrength = 'weak' | 'fair' | 'strong';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const departmentOptions = [
  'Operations',
  'Administration',
  'Sales',
  'Support',
  'Human Resources',
  'Finance',
  'IT',
  'Warehouse',
  'Other',
];

const positionOptions = [
  'Employee',
  'Shift Lead',
  'Supervisor',
  'Manager',
  'Operations Coordinator',
  'Support Specialist',
  'Sales Associate',
  'Administrator',
  'Other',
];

const getPasswordStrength = (value: string): PasswordStrength => {
  const trimmed = value.trim();
  let score = 0;

  if (trimmed.length >= 8) score += 1;
  if (trimmed.length >= 12) score += 1;
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) score += 1;
  if (/\d/.test(trimmed)) score += 1;
  if (/[^A-Za-z0-9]/.test(trimmed)) score += 1;

  if (score >= 4) return 'strong';
  if (score >= 2) return 'fair';
  return 'weak';
};

const Signup = () => {
  const { register, isAuthenticated } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>({});

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const confirmPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const nextErrors: SignupErrors = {};

    if (!firstName.trim()) {
      nextErrors.firstName = 'First name is required.';
    }

    if (!lastName.trim()) {
      nextErrors.lastName = 'Last name is required.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailRegex.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        department: department || undefined,
        position: position || undefined,
      });
    } catch (error) {
      // Errors are handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-8">
      <div className="max-w-lg w-full">
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm dark:bg-gray-900/80">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900/40" />
                <div className="h-14 w-14 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
              </div>
              <p className="mt-4 text-sm font-semibold tracking-wide text-primary-700 dark:text-primary-300">
                Creating your account
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Setting up your profile and access
              </p>
              <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/40">
                <div className="h-full w-1/2 rounded-full bg-primary-600 animate-pulse" />
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">Create Your Account</h1>
            <p className="text-gray-600 dark:text-gray-400">Start managing your shifts in ShiftFlow</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) {
                      setErrors((prev) => ({ ...prev, firstName: undefined }));
                    }
                  }}
                  className={`input ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) {
                      setErrors((prev) => ({ ...prev, lastName: undefined }));
                    }
                  }}
                  className={`input ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                  required
                />
                {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="you@example.com"
                required
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department (Optional)
                </label>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="input"
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position (Optional)
                </label>
                <select
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="input"
                >
                  <option value="">Select position</option>
                  {positionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password || errors.confirmPassword) {
                      setErrors((prev) => ({
                        ...prev,
                        password: undefined,
                        confirmPassword: e.target.value !== confirmPassword ? prev.confirmPassword : undefined,
                      }));
                    }
                  }}
                  className={`input ${errors.password ? 'border-red-500 focus:ring-red-500' : password ? (passwordStrength === 'strong' ? 'border-green-500 focus:ring-green-500' : passwordStrength === 'fair' ? 'border-amber-500 focus:ring-amber-500' : 'border-red-500 focus:ring-red-500') : ''}`}
                  placeholder="At least 8 characters"
                  required
                />
                <div className="mt-2 space-y-2">
                  {password && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-gray-500 dark:text-gray-400">Password strength</span>
                        <span
                          className={
                            passwordStrength === 'strong'
                              ? 'text-green-600'
                              : passwordStrength === 'fair'
                                ? 'text-amber-600'
                                : 'text-red-600'
                          }
                        >
                          {passwordStrength === 'strong' ? 'Strong' : passwordStrength === 'fair' ? 'Fair' : 'Weak'}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all ${
                            passwordStrength === 'strong'
                              ? 'w-full bg-green-500'
                              : passwordStrength === 'fair'
                                ? 'w-2/3 bg-amber-500'
                                : 'w-1/3 bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  {errors.password ? (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  ) : password ? (
                    <p className={`text-sm ${passwordStrength === 'strong' ? 'text-green-600' : passwordStrength === 'fair' ? 'text-amber-600' : 'text-red-600'}`}>
                      {passwordStrength === 'strong'
                        ? 'This password looks strong.'
                        : passwordStrength === 'fair'
                          ? 'Add a symbol or uppercase letter to make it stronger.'
                          : 'Use at least 8 characters with mixed case, a number, and a symbol.'}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  className={`input ${errors.confirmPassword || confirmPasswordMismatch ? 'border-red-500 focus:ring-red-500' : passwordsMatch ? 'border-green-500 focus:ring-green-500' : ''}`}
                  required
                />
                <div className="mt-2 space-y-1">
                  {errors.confirmPassword || confirmPasswordMismatch ? (
                    <p className="text-sm text-red-600">{errors.confirmPassword || 'Passwords do not match.'}</p>
                  ) : passwordsMatch ? (
                    <p className="text-sm text-green-600">Passwords match.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
