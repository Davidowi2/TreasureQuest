import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-lg max-w-none text-foreground">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>By using TreasureQuest, you agree to these Terms of Service. If you don't agree, please don't use our service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. User Content</h2>
          <p>You retain ownership of any photos or content you upload to TreasureQuest, but you grant us a license to use that content for the purpose of operating the service and facilitating gameplay.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Gameplay Rules</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Play fair and don't cheat</li>
            <li>Respect public and private property while playing</li>
            <li>Follow all local laws and safety guidelines</li>
            <li>Don't upload harmful or inappropriate content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Account Responsibility</h2>
          <p>You are responsible for maintaining the security of your account and all activities that occur under your account.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
          <p>TreasureQuest is provided "as is" without any warranties. We are not responsible for any damages or injuries that occur while using our service or participating in treasure hunts.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
          <p>If you have questions about these Terms, please contact us at legal@treasurequest.com</p>
        </section>
      </div>
    </div>
  );
}
