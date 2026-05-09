import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LoadingButton from '../components/LoadingButton';

const Settings = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ theme: 'light', email: true, push: true, language: 'en', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/users/${user.id || (user as any)._id}`);
        const u = res.data.data.user || res.data.user;
        setForm({
          theme: u.preferences?.theme || 'light',
          email: u.preferences?.notifications?.email ?? true,
          push: u.preferences?.notifications?.push ?? true,
          language: u.preferences?.language || 'en',
          phone: u.phone || '',
        });
      } catch (err: any) {
        // fallback to local info
        setForm((f) => ({ ...f, phone: user?.phone || '' }));
      }
    };

    load();
  }, [user]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    if (!user) return toast.error('Not authenticated');
    setLoading(true);
    try {
      const payload = {
        phone: form.phone,
        preferences: {
          theme: form.theme,
          notifications: { email: form.email, push: form.push },
          language: form.language,
        },
      };

      const res = await api.put(`/users/${user.id || (user as any)._id}`, payload);
      const updated = res.data.data.user || res.data.user;
      // update localStorage so Auth state stays in sync
      localStorage.setItem('user', JSON.stringify(updated));
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="card p-6 max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Theme</label>
          <select name="theme" value={form.theme} onChange={handleChange} className="mt-1 block w-full">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="inline-flex items-center">
            <input type="checkbox" name="email" checked={form.email} onChange={handleChange} className="mr-2" />
            <span>Email notifications</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="inline-flex items-center">
            <input type="checkbox" name="push" checked={form.push} onChange={handleChange} className="mr-2" />
            <span>Push notifications</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <input name="language" value={form.language} onChange={handleChange} className="mt-1 block w-full" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full" />
        </div>

        <div className="flex items-center justify-end">
          <LoadingButton onClick={handleSave} className="btn btn-primary" loading={loading}>
            Save Settings
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default Settings;
