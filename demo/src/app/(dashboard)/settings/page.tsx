/**
 * Settings Page
 * Phase 3: Frontend - React/Next.js
 *
 * User settings and preferences.
 * Should trigger: react-nextjs-expert
 */

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const settingsTabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Appearance' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@taskpro.com',
    bio: 'Software engineer and team lead',
    timezone: 'America/New_York',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskAssigned: true,
    taskCompleted: true,
    comments: true,
    mentions: true,
  });
  const [appearance, setAppearance] = useState({
    theme: 'light',
    compactMode: false,
    showAvatars: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar tabs */}
        <div className="lg:w-48">
          <nav className="flex flex-row gap-1 lg:flex-col">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader
                title="Profile Information"
                description="Update your profile details"
              />
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-600">
                    AU
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Change avatar
                    </Button>
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <Input
                  label="Full name"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />

                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={3}
                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} loading={saving}>
                    Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Change Password"
                  description="Update your password to keep your account secure"
                />
                <CardContent className="space-y-4">
                  <Input label="Current password" type="password" />
                  <Input label="New password" type="password" />
                  <Input label="Confirm new password" type="password" />
                  <div className="flex justify-end pt-4">
                    <Button>Update password</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Danger Zone"
                  description="Irreversible account actions"
                />
                <CardContent>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <h4 className="font-medium text-red-800">Delete account</h4>
                    <p className="mt-1 text-sm text-red-600">
                      Once you delete your account, there is no going back. All your data
                      will be permanently removed.
                    </p>
                    <Button variant="destructive" size="sm" className="mt-4">
                      Delete account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader
                title="Notification Preferences"
                description="Choose how you want to be notified"
              />
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Delivery methods</h4>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Email notifications</span>
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, email: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Push notifications</span>
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={(e) =>
                        setNotifications((prev) => ({ ...prev, push: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900">Activity notifications</h4>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Task assigned to me</span>
                    <input
                      type="checkbox"
                      checked={notifications.taskAssigned}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          taskAssigned: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Task completed</span>
                    <input
                      type="checkbox"
                      checked={notifications.taskCompleted}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          taskCompleted: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">New comments</span>
                    <input
                      type="checkbox"
                      checked={notifications.comments}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          comments: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Mentions</span>
                    <input
                      type="checkbox"
                      checked={notifications.mentions}
                      onChange={(e) =>
                        setNotifications((prev) => ({
                          ...prev,
                          mentions: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} loading={saving}>
                    Save preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader
                title="Appearance"
                description="Customize the look and feel"
              />
              <CardContent className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['light', 'dark', 'system'].map((theme) => (
                      <button
                        key={theme}
                        onClick={() =>
                          setAppearance((prev) => ({ ...prev, theme }))
                        }
                        className={cn(
                          'rounded-lg border-2 p-4 text-center capitalize transition-colors',
                          appearance.theme === theme
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900">Display options</h4>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Compact mode
                      </span>
                      <p className="text-xs text-gray-500">
                        Reduce spacing and padding
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={appearance.compactMode}
                      onChange={(e) =>
                        setAppearance((prev) => ({
                          ...prev,
                          compactMode: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Show avatars
                      </span>
                      <p className="text-xs text-gray-500">
                        Display user avatars in lists
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={appearance.showAvatars}
                      onChange={(e) =>
                        setAppearance((prev) => ({
                          ...prev,
                          showAvatars: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} loading={saving}>
                    Save preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
