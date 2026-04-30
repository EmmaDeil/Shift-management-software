import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: '',
    department: '',
    position: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await api.get(`/users/${user.id || (user as any)._id}`);
        const u = res.data.data.user || res.data.user;
        setForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          email: u.email || '',
          phone: u.phone || '',
          avatar: u.avatar || '',
          department: u.department || '',
          position: u.position || '',
          role: u.role || '',
        });
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return toast.error('Not authenticated');
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        avatar: form.avatar,
        department: form.department,
        position: form.position,
      };

      const res = await api.put(`/users/${user.id || (user as any)._id}`, payload);
      const updated = res.data.data.user || res.data.user;
      localStorage.setItem('user', JSON.stringify(updated));
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div><h1>Loading...</h1></div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>

      {user?.role !== 'employee' && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          This account has {user?.role} permissions, and it still stays linked to the employee workflow.
        </div>
      )}

      <div className="card p-6 max-w-2xl">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input name="email" value={form.email} disabled className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <input name="department" value={form.department} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Position</label>
          <input name="position" value={form.position} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <input name="role" value={form.role} disabled className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
