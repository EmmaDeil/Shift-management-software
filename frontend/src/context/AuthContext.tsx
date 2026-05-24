import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { User, AuthContextType } from '../types';
import socketUtil from '../utils/socket';

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
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

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

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

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
  }) => {
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
