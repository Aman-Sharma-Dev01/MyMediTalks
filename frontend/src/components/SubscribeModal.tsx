import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Check, BellOff } from 'lucide-react';
import ConfettiEffect from './ConfettiEffect';
import { useReaderAuth, getReaderToken } from '../lib/ReaderAuthContext';
import api from '../lib/api';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const { reader, isAuthenticated, login, updateSubscriptionStatus } = useReaderAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setUnsubscribed(false);
      setError('');
    }
  }, [isOpen]);

  // Setup Google Sign-In button
  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID || success || isAuthenticated) return;

    const initializeGoogle = () => {
      if (window.google && googleButtonRef.current) {
        // Clear any existing button
        googleButtonRef.current.innerHTML = '';
        
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'signup_with',
          shape: 'pill',
        });
      }
    };

    // Check if Google script is already loaded
    if (window.google) {
      initializeGoogle();
    } else {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        const checkGoogle = setInterval(() => {
          if (window.google) {
            clearInterval(checkGoogle);
            initializeGoogle();
          }
        }, 100);
        return () => clearInterval(checkGoogle);
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, [isOpen, success, isAuthenticated]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      setError('');
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      await login({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture || '',
      });
      
      // New users are auto-subscribed, so show success
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!reader) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = getReaderToken();
      await api.post('/reader/unsubscribe', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateSubscriptionStatus(false);
      setUnsubscribed(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unsubscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResubscribe = async () => {
    if (!reader) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = getReaderToken();
      await api.post('/reader/resubscribe', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateSubscriptionStatus(true);
      setUnsubscribed(false);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setUnsubscribed(false);
    setError('');
    onClose();
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

              {!success && !unsubscribed ? (
                <>
                  {/* Already subscribed state */}
                  {isAuthenticated && reader?.isSubscribed ? (
                    <>
                      <div className="text-center mb-8 relative">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                          <Check className="text-green-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-display font-medium text-ink mb-2">
                          You're Subscribed!
                        </h2>
                        <p className="text-secondary">
                          Receiving updates at:
                        </p>
                        <p className="font-medium text-ink mt-1">
                          {reader?.email}
                        </p>
                      </div>

                      <div className="space-y-4 relative">
                        {error && (
                          <p className="text-red-500 text-sm text-center">{error}</p>
                        )}
                        <button
                          onClick={handleUnsubscribe}
                          disabled={loading}
                          className="w-full py-3 px-4 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Unsubscribing...
                            </>
                          ) : (
                            <>
                              <BellOff size={18} />
                              Unsubscribe from Updates
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-8 relative">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                          <Mail className="text-primary" size={32} />
                        </div>
                        <h2 className="text-2xl font-display font-medium text-ink mb-2">
                          Stay in the Loop
                        </h2>
                        <p className="text-secondary">
                          Sign up to get notified when I publish new articles about medicine, wellness, and healing.
                        </p>
                      </div>

                      {/* Google Sign-Up Button */}
                      <div className="space-y-4 relative">
                        {GOOGLE_CLIENT_ID ? (
                          <div className="flex flex-col items-center gap-4">
                            <div ref={googleButtonRef} className="min-h-[44px]"></div>
                            {loading && <p className="text-sm text-secondary">Signing up...</p>}
                          </div>
                        ) : (
                          <p className="text-center text-secondary text-sm">
                            Google Sign-In not configured.
                          </p>
                        )}
                        
                        {error && (
                          <p className="text-red-500 text-sm text-center">{error}</p>
                        )}
                      </div>

                      <p className="text-xs text-secondary text-center mt-6">
                        No spam, ever. Unsubscribe anytime.
                      </p>
                    </>
                  )}
                </>
              ) : unsubscribed ? (
                /* Unsubscribed state - offer to resubscribe */
                <div className="text-center py-8 relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <BellOff className="text-gray-500" size={32} />
                  </div>
                  <h2 className="text-2xl font-display font-medium text-ink mb-2">
                    Unsubscribed
                  </h2>
                  <p className="text-secondary mb-6">
                    You won't receive email updates anymore.
                  </p>
                  <button
                    onClick={handleResubscribe}
                    disabled={loading}
                    className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? 'Subscribing...' : 'Subscribe Again'}
                  </button>
                </div>
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
                    You're All Set! 🎉
                  </h2>
                  <p className="text-secondary mb-6">
                    {isAuthenticated 
                      ? `Welcome, ${reader?.name}! You'll receive updates on new articles.`
                      : "Thank you for subscribing! Check your email for a welcome message."
                    }
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
