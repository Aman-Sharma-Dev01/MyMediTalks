import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useReaderAuth } from '../lib/ReaderAuthContext';
import ConfettiEffect from './ConfettiEffect';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

// Google OAuth Client ID - you'll need to set this up in Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

export default function LoginModal({ isOpen, onClose, message }: LoginModalProps) {
  const { login, reader } = useReaderAuth();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      setError('');
      // Decode JWT token from Google
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      setUserName(payload.name);
      
      await login({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture || '',
      });
      
      // Show success state with confetti
      setSuccess(true);
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Google login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setSuccess(false);
    setError('');
    setUserName('');
    onClose();
  };

  const initializeGoogleButton = () => {
    if (window.google && googleButtonRef.current) {
      // Clear the button container first
      googleButtonRef.current.innerHTML = '';
      
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'signin_with',
        shape: 'pill',
      });
    }
  };

  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID || success) return;

    setError('');

    // Check if Google script is already loaded
    if (window.google) {
      initializeGoogleButton();
      return;
    }

    // Load Google Sign-In script
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Script exists but google object not ready yet, wait for it
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogleButton();
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      initializeGoogleButton();
    };
  }, [isOpen]);

  // Demo login for testing (remove in production)
  const handleDemoLogin = async () => {
    try {
      setUserName('Demo User');
      await login({
        googleId: 'demo_' + Date.now(),
        email: 'demo@example.com',
        name: 'Demo User',
        avatar: '',
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti on success */}
          {success && <ConfettiEffect trigger={true} />}
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-md"
          >
            <div className="bg-cream rounded-3xl p-8 shadow-2xl border border-primary/10 mx-4 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-secondary hover:text-ink transition-colors z-10"
              >
                <X size={24} />
              </button>

              {!success ? (
                <>
                  <div className="text-center mb-8 relative">
                    <span className="material-symbols-outlined text-5xl text-primary mb-4 block">
                      local_florist
                    </span>
                    <h2 className="text-2xl font-display font-medium text-ink mb-2">
                      Welcome to MyMediTalks
                    </h2>
                    <p className="text-secondary">
                      {message || 'Sign in to like, comment, and save articles'}
                    </p>
                  </div>

                  <div className="space-y-4 relative">
                    {GOOGLE_CLIENT_ID ? (
                      <div className="flex flex-col items-center gap-3">
                        <div ref={googleButtonRef} className="min-h-[44px]"></div>
                        {loading && <p className="text-sm text-secondary">Signing in...</p>}
                        {error && <p className="text-sm text-red-500">{error}</p>}
                      </div>
                ) : (
                      <div className="text-center text-secondary text-sm">
                        <p className="mb-4">Google OAuth not configured.</p>
                        <button
                          onClick={handleDemoLogin}
                          className="w-full py-3 px-4 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors font-medium"
                        >
                          Continue as Demo User
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-secondary text-center mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                  </p>
                </>
              ) : (
                <div className="text-center py-8 relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
                  >
                    <Check className="text-green-600" size={40} />
                  </motion.div>
                  <h2 className="text-2xl font-display font-medium text-ink mb-2">
                    Welcome, {userName}! 🎉
                  </h2>
                  <p className="text-secondary mb-6">
                    You're now signed in. Enjoy reading and interacting with articles!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
