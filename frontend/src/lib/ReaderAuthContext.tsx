import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import api from './api';

// Helper function to get reader token (checks cookie first, then localStorage)
export const getReaderToken = (): string | undefined => {
  const cookieToken = Cookies.get('readerToken');
  const localToken = localStorage.getItem('readerToken');
  
  console.log('getReaderToken called:');
  console.log('  Cookie token:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'NOT FOUND');
  console.log('  localStorage token:', localToken ? `${localToken.substring(0, 20)}...` : 'NOT FOUND');
  
  const token = cookieToken || localToken || undefined;
  return token;
};

interface Reader {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isSubscribed: boolean;
  savedArticles: string[];
  likedArticles: string[];
}

interface ReaderAuthContextType {
  reader: Reader | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (googleData: GoogleAuthData) => Promise<void>;
  logout: () => void;
  refreshReader: () => Promise<void>;
  updateSubscriptionStatus: (isSubscribed: boolean) => void;
}

interface GoogleAuthData {
  googleId: string;
  email: string;
  name: string;
  avatar: string;
}

const ReaderAuthContext = createContext<ReaderAuthContextType | undefined>(undefined);

export function ReaderAuthProvider({ children }: { children: React.ReactNode }) {
  const [reader, setReader] = useState<Reader | null>(() => {
    // Try to restore reader from localStorage on initial load
    const cached = localStorage.getItem('readerData');
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshReader = useCallback(async () => {
    // Try cookie first, then localStorage as fallback
    let token = getReaderToken();
    if (token && !Cookies.get('readerToken')) {
      // If we found token in localStorage but not cookie, restore the cookie
      Cookies.set('readerToken', token, { expires: 30, path: '/', sameSite: 'lax' });
    }
    
    if (!token) {
      // No token anywhere - check if we have cached reader data
      const cached = localStorage.getItem('readerData');
      if (!cached) {
        setReader(null);
        setIsLoading(false);
        return;
      }
      // We have cached data but no token - clear stale data
      localStorage.removeItem('readerData');
      setReader(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/reader/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReader(data);
      localStorage.setItem('readerData', JSON.stringify(data));
    } catch (error: any) {
      const status = error?.response?.status;
      // Only remove credentials on explicit 401 (unauthorized/invalid token)
      if (status === 401) {
        Cookies.remove('readerToken', { path: '/' });
        localStorage.removeItem('readerToken');
        localStorage.removeItem('readerData');
        setReader(null);
      } else {
        // For other errors (404, 500, network), keep existing state
        // Don't log out user for server issues
        console.error('Failed to refresh reader, keeping cached state:', error?.message || error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshReader();
  }, [refreshReader]);

  const login = async (googleData: GoogleAuthData) => {
    try {
      const { data } = await api.post('/reader/google', googleData);
      console.log('Login response received, token:', data.token ? `${data.token.substring(0, 20)}...` : 'NO TOKEN');
      
      // Set cookie with secure options for persistence
      Cookies.set('readerToken', data.token, { 
        expires: 30, // 30 days
        path: '/',
        sameSite: 'lax'
      });
      // Also save token to localStorage as backup
      localStorage.setItem('readerToken', data.token);
      
      // Verify storage
      console.log('Cookie saved:', Cookies.get('readerToken') ? 'YES' : 'NO');
      console.log('localStorage saved:', localStorage.getItem('readerToken') ? 'YES' : 'NO');
      
      setReader(data.reader);
      localStorage.setItem('readerData', JSON.stringify(data.reader));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('readerToken', { path: '/' });
    localStorage.removeItem('readerToken');
    localStorage.removeItem('readerData');
    setReader(null);
  };

  const updateSubscriptionStatus = (isSubscribed: boolean) => {
    if (reader) {
      const updatedReader = { ...reader, isSubscribed };
      setReader(updatedReader);
      localStorage.setItem('readerData', JSON.stringify(updatedReader));
    }
  };

  return (
    <ReaderAuthContext.Provider
      value={{
        reader,
        isLoading,
        isAuthenticated: !!reader,
        login,
        logout,
        refreshReader,
        updateSubscriptionStatus,
      }}
    >
      {children}
    </ReaderAuthContext.Provider>
  );
}

export function useReaderAuth() {
  const context = useContext(ReaderAuthContext);
  if (context === undefined) {
    throw new Error('useReaderAuth must be used within a ReaderAuthProvider');
  }
  return context;
}
