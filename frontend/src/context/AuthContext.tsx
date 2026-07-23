import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { User, AuthContextType } from '../types';
import socketUtil from '../utils/socket';

const AUTH_STORAGE_KEY = 'rememberMe';

const getStorage = () => {
  const rememberMe = localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

const saveAuthState = (token: string, user: User, rememberMe: boolean) => {
  const storage = rememberMe ? localStorage : sessionStorage;

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');

  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
  localStorage.setItem(AUTH_STORAGE_KEY, String(rememberMe));
};

const clearAuthState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

const joinAttendanceRooms = (token: string, user: User) => {
  const socket = socketUtil.initSocket(token);
  if (!socket || !user?.id) return;

  socket.emit('join-room', user.id);

  if (user.department) {
    socket.emit('join-room', `department-${user.department}`);
  }

  if (user.role) {
    socket.emit('join-room', `role-${user.role}`);
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storage = getStorage();
    const storedToken = storage.getItem('token');
    const storedUser = storage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      try {
        joinAttendanceRooms(storedToken, parsedUser);
      } catch (e) {
        // ignore socket init errors
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;

      saveAuthState(token, user, rememberMe);

      setToken(token);
      setUser(user);

      // initialize socket and join attendance rooms
      try {
        joinAttendanceRooms(token, user);
      } catch (e) {
        // ignore
      }

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    department?: string;
    position?: string;
    rememberMe?: boolean;
  }) => {
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data.data;

      saveAuthState(token, user, data.rememberMe ?? true);

      setToken(token);
      setUser(user);

      // initialize socket and join attendance rooms
      try {
        joinAttendanceRooms(token, user);
      } catch (e) {
        // ignore
      }

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    clearAuthState();
    setToken(null);
    setUser(null);
    try {
      socketUtil.disconnectSocket();
    } catch (e) {}
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
