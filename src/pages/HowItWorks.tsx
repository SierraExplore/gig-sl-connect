import { Link } from "react-router-dom";
import {
  Search,
  Send,
  CheckCircle2,
  DollarSign,
  Shield,
  Users,
  Star,
  ArrowRight,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const workerSteps = [
  {
    icon: Search,
    title: "Find Gigs",
    description: "Browse opportunities matching your skills and location. Filter by category, pay, and more.",
  },
  {
    icon: Send,
    title: "Apply",
    description: "Submit your application with an optional cover letter explaining why you're perfect for the job.",
  },
  {
    icon: CheckCircle2,
    title: "Get Accepted",
    description: "Once the employer accepts, you'll receive a notification with job details.",
  },
  {
    icon: DollarSign,
    title: "Get Paid",
    description: "Complete the work, verify completion, and receive your payment via mobile money.",
  },
];

const employerSteps = [
  {
    icon: Users,
    title: "Post a Gig",
    description: "Describe your job requirements, set the pay, and specify the location.",
  },
  {
    icon: Search,
    title: "Review Applications",
    description: "Browse applicant profiles, check their ratings, and select the best candidates.",
  },
  {
    icon: CheckCircle2,
    title: "Accept Workers",
    description: "Choose who to hire. Workers will be notified and can start at the scheduled time.",
  },
  {
    icon: Star,
    title: "Rate & Pay",
    description: "Once work is verified, release payment and leave a review for the worker.",
  },
];

const features = [
  {
    icon: Shield,
    title: "Verified Users",
    description: "All users go through NIN verification for trust and safety.",
  },
  {
    icon: Star,
    title: "Rating System",
    description: "Build your reputation through honest reviews and ratings.",
  },
  {
    icon: DollarSign,
    title: "Secure Payments",
    description: "Pay and get paid via mobile money with transaction tracking.",
  },
];

export default function HowItWorks() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container relative py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">How GigBox Works</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're looking for work or hiring talent, GigBox makes it simple, safe, and efficient.
          </p>
        </div>
      </section>

      {/* For Workers */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">For Workers</h2>
            <p className="text-muted-foreground">Find gigs and start earning</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {workerSteps.map((step, index) => (
              <Card key={step.title} className="glass-card p-6 relative">
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg">
              <Link to="/auth?signup=true&role=worker">
                Start Finding Work
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Employers */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">For Employers</h2>
            <p className="text-muted-foreground">Post gigs and find reliable workers</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {employerSteps.map((step, index) => (
              <Card key={step.title} className="glass-card p-6 relative">
                <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth?signup=true&role=employer">
                Start Hiring
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Built for Trust</h2>
            <p className="text-muted-foreground">
              Safety and reliability are at the core of GigBox
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="glass-card p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is GigBox free to use?",
                a: "Yes! Creating an account and browsing gigs is completely free for workers. Employers can post gigs for free as well.",
              },
              {
                q: "How do I get verified?",
                a: "Upload your National ID (NIN) and take a selfie. Our team will verify your identity within 24-48 hours.",
              },
              {
                q: "How do payments work?",
                a: "Employers pay directly to workers via mobile money (Orange Money, Africell Money) or cash for on-site work.",
              },
              {
                q: "What if there's a dispute?",
                a: "GigBox has a dispute resolution system. If you encounter issues, you can file a dispute and our team will help mediate.",
              },
              {
                q: "Can I work multiple gigs?",
                a: "Absolutely! You can apply to and work on as many gigs as you can handle. Build your reputation and earn more.",
              },
            ].map((faq) => (
              <Card key={faq.q} className="glass-card p-5">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <Card className="bg-gradient-to-br from-primary to-primary-glow p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Join thousands of Sierra Leoneans already using GigBox to find work and hire talent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link to="/auth?signup=true">Create Free Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
                asChild
              >
                <Link to="/explore">Browse Gigs</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
