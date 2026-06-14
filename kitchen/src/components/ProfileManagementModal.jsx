import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, LockKeyhole, ImagePlus, ShieldAlert, X } from 'lucide-react';
import FormField from './FormField';
import LoadingSpinner from './LoadingSpinner';

export default function ProfileManagementModal({ isOpen, onClose, user, onUpdateUser, apiService, roleLabel = 'Kitchen' }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setImageUrl(user.profile_image_url || '');
      setImageFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'velluto_presets');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/velluto-cafe/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!response.ok) throw new Error('Cloudinary upload failed');
    const data = await response.json();
    return data.secure_url;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        try {
          finalImageUrl = await uploadToCloudinary(imageFile);
        } catch (uploadErr) {
          setError('Failed to upload image. Using local details instead.');
        }
      }

      const res = await apiService.updateProfile({
        name,
        email,
        phone,
        profile_image_url: finalImageUrl
      });

      setSuccess('Profile updated successfully.');
      if (onUpdateUser) {
        onUpdateUser(res.data);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await apiService.updatePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Verify current password.');
    } finally {
      setLoading(false);
    }
  };

  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  return (
    <div className="payment-overlay" style={{ zIndex: 1000 }}>
      <div className="payment-modal" style={{ maxWidth: '560px', width: '90%', padding: '30px', background: '#fffdf9', borderRadius: '24px', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', border: 0, background: 'transparent', cursor: 'pointer', color: '#8a7b70' }}
        >
          <X size={20} />
        </button>

        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.6rem', color: '#49352a', fontFamily: "'Playfair Display', Georgia, serif" }}>
          My Account
        </h3>

        {/* Info card */}
        <div style={{ display: 'flex', gap: '16px', background: '#fcfaf6', border: '1px solid #eee7df', borderRadius: '16px', padding: '16px', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '50%', background: '#eee7df', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {imageUrl ? (
              <img src={imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#8a7b70' }}>
                {name.charAt(0).toUpperCase() || 'A'}
              </span>
            )}
            <label style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.5)', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <ImagePlus size={12} />
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#49352a', fontSize: '1.1rem' }}>{name || 'Cafe User'}</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', fontSize: '0.8rem', color: '#8a7b70' }}>
              <span>Role: <strong style={{ color: '#8b6045' }}>{roleLabel}</strong></span>
              <span>Joined: <strong>{joinedDate}</strong></span>
              <span>Portal: <strong>{roleLabel} Portal</strong></span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #eee7df', marginBottom: '20px' }}>
          <button 
            onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
            style={{ padding: '10px 20px', border: 0, borderBottom: activeTab === 'profile' ? '2px solid #8b6045' : 'none', background: 'transparent', fontWeight: 'bold', color: activeTab === 'profile' ? '#8b6045' : '#8a7b70', cursor: 'pointer' }}
          >
            Edit Profile
          </button>
          <button 
            onClick={() => { setActiveTab('password'); setError(''); setSuccess(''); }}
            style={{ padding: '10px 20px', border: 0, borderBottom: activeTab === 'password' ? '2px solid #8b6045' : 'none', background: 'transparent', fontWeight: 'bold', color: activeTab === 'password' ? '#8b6045' : '#8a7b70', cursor: 'pointer' }}
          >
            Change Password
          </button>
        </div>

        {error && <div className="form-alert" role="alert" style={{ marginBottom: '16px' }}>{error}</div>}
        {success && <div className="form-alert form-alert--success" role="alert" style={{ marginBottom: '16px', background: '#e3eee8', color: '#3b7d55', borderColor: '#d0e3d7' }}>{success}</div>}

        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField 
                label="Full Name" 
                icon={User} 
                type="text" 
                placeholder="John Doe" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              <FormField 
                label="Email Address" 
                icon={Mail} 
                type="email" 
                placeholder="john@cafe.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div style={{ marginTop: '12px' }}>
              <FormField 
                label="Phone Number" 
                icon={Phone} 
                type="tel" 
                placeholder="+1 234 5678" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="payment-modal__btn--failed"
                onClick={onClose}
                style={{ background: '#eee7df', color: '#49352a', border: 0, borderRadius: '12px', height: '44px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="submit"
                className="payment-modal__btn--success"
                disabled={loading}
                style={{ background: '#547662', border: 0, borderRadius: '12px', height: '44px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword}>
            <FormField 
              label="Current Password" 
              icon={LockKeyhole} 
              type="password" 
              placeholder="Enter current password" 
              required 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <FormField 
                label="New Password" 
                icon={LockKeyhole} 
                type="password" 
                placeholder="Enter new password" 
                required 
                minLength="8"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
              <FormField 
                label="Confirm Password" 
                icon={LockKeyhole} 
                type="password" 
                placeholder="Confirm new password" 
                required 
                minLength="8"
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="payment-modal__btn--failed"
                onClick={onClose}
                style={{ background: '#eee7df', color: '#49352a', border: 0, borderRadius: '12px', height: '44px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="submit"
                className="payment-modal__btn--success"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                style={{ background: '#547662', border: 0, borderRadius: '12px', height: '44px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
