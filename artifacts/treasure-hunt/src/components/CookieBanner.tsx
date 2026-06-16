import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Cookie } from 'lucide-react';

export function CookieBanner() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('treasurequest_cookie_consent');
    setAccepted(consent === 'accepted');
  }, []);

  const handleAccept = () => {
    localStorage.setItem('treasurequest_cookie_consent', 'accepted');
    setAccepted(true);
  };

  if (accepted) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Cookie className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            We use cookies to enhance your experience and keep our app secure. By using our service, you agree to our{' '}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> and{' '}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
          </div>
        </div>
        <Button onClick={handleAccept} className="shrink-0">
          Accept
        </Button>
      </div>
    </div>
  );
}
