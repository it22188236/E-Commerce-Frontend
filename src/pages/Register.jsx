import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Loader2, Mail, Lock, User, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <motion.div
        initial={{
          opacity: 0,
          y: 20
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
        className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-card border border-gray-100">
        
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-gray-600">Join NexusStore today</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error &&
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center">
              {error}
            </div>
          }

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('name', {
                    required: 'Name is required'
                  })}
                  className="input-field pl-10"
                  placeholder="John Doe" />
                
              </div>
              {errors.name &&
              <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              }
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="input-field pl-10"
                  placeholder="user@example.com" />
                
              </div>
              {errors.email &&
              <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              }
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="input-field pl-10"
                  placeholder="••••••••" />
                
              </div>
              {errors.password &&
              <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              }
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                    value === password || 'Passwords do not match'
                  })}
                  className="input-field pl-10"
                  placeholder="••••••••" />
                
              </div>
              {errors.confirmPassword &&
              <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              }
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-base shadow-lg shadow-primary-600/30">
            
            {loading ?
            <Loader2 className="w-5 h-5 animate-spin" /> :

            'Create Account'
            }
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500">
              
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};