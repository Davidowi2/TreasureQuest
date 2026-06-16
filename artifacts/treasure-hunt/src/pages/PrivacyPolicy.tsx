import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-lg max-w-none text-foreground">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Email address, name, and profile information from Google Sign-In</li>
            <li>Photos and media you upload as part of the treasure hunt gameplay</li>
            <li>Location data you share for gameplay purposes</li>
            <li>Progress and gameplay information</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To facilitate treasure hunt gameplay</li>
            <li>To display your progress on leaderboards</li>
            <li>To improve our service</li>
            <li>To authenticate your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Camera & Media</h2>
          <p>We only access your camera when you voluntarily choose to upload photos during the game. Photos are only used for clue verification as part of the gameplay experience.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Location Tracking</h2>
          <p>We only access your location when you voluntarily choose to share it for gameplay purposes. Location data is used to enhance your treasure hunt experience and is not shared with third parties.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
          <p>We use cookies to keep you signed in and to enhance your experience on our platform. You can accept or decline cookies when you first visit our site.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at privacy@treasurequest.com</p>
        </section>
      </div>
    </div>
  );
}
