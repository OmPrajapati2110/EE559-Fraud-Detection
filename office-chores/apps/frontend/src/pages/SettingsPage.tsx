import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ExternalLink, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [slackSuccess, setSlackSuccess] = useState(false);
  const [slackError, setSlackError] = useState('');
  const [testingSlack, setTestingSlack] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ webhookUrl: string }>();

  const saveSlack = async (data: { webhookUrl: string }) => {
    try {
      await api.put('/integrations/slack/webhook', data);
      setSlackSuccess(true);
      setSlackError('');
    } catch {
      setSlackError('Failed to save webhook URL');
    }
  };

  const testSlack = async () => {
    setTestingSlack(true);
    try {
      await api.post('/integrations/slack/test');
      alert('Test message sent to Slack!');
    } catch {
      alert('Failed to send test message. Check your webhook URL.');
    } finally {
      setTestingSlack(false);
    }
  };

  const connectGoogle = async () => {
    const res = await api.get<{ authUrl: string }>('/integrations/google-calendar/connect');
    window.location.href = res.data.authUrl;
  };

  const disconnectGoogle = async () => {
    if (!confirm('Disconnect Google Calendar? Future chores will not sync.')) return;
    await api.delete('/integrations/google-calendar/disconnect');
    window.location.reload();
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Slack */}
      <section className="border rounded-xl p-6 bg-white">
        <h2 className="text-base font-semibold mb-1">Slack Integration</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Paste an Incoming Webhook URL from your Slack workspace to receive chore notifications.
        </p>
        <form onSubmit={handleSubmit(saveSlack)} className="space-y-3">
          <input
            {...register('webhookUrl', { required: true })}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="https://hooks.slack.com/services/..."
          />
          {slackError && <p className="text-xs text-destructive">{slackError}</p>}
          {slackSuccess && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Webhook saved
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={testingSlack}
              onClick={testSlack}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted disabled:opacity-50"
            >
              Test
            </button>
          </div>
        </form>
      </section>

      {/* Google Calendar */}
      <section className="border rounded-xl p-6 bg-white">
        <h2 className="text-base font-semibold mb-1">Google Calendar</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect your Google Calendar to automatically sync chore assignments to your personal calendar.
        </p>
        {user?.googleCalendarConnected ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Connected
            </span>
            <button
              onClick={disconnectGoogle}
              className="text-sm text-destructive hover:underline"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectGoogle}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-muted"
          >
            <ExternalLink className="w-4 h-4" />
            Connect Google Calendar
          </button>
        )}
      </section>
    </div>
  );
}
