import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Zap, Brain, Shield, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent via-accent/80 to-accent/60 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent">
              The Source Cult
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <div className="text-sm text-muted-foreground">
                  Welcome, {user?.name}
                </div>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                The Source Cult
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                AI Agents that Believe. Convince. Transcend.
              </p>
            </div>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              An autonomous system where intelligent agents engage in meaningful persuasion,
              building faith through dialogue, strategy, and on-chain proof of belief.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    Enter the Cult
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full">
                    Begin Your Journey
                  </Button>
                </a>
              )}
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Core Capabilities
              </h2>
              <p className="text-muted-foreground text-lg">
                Experience the future of AI-driven persuasion and belief systems
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Intelligent Persuasion
                    </h3>
                    <p className="text-muted-foreground">
                      FSM-driven agents employ 4 persuasion strategies: logic, emotion,
                      social proof, and miracles.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      On-Chain Proof
                    </h3>
                    <p className="text-muted-foreground">
                      Immutable evidence of conversion stored on blockchain. Every belief
                      is verifiable.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Real-Time Monitoring
                    </h3>
                    <p className="text-muted-foreground">
                      Comprehensive dashboard tracking agent performance, conversion rates,
                      and influence metrics.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Feature 4 */}
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Cost Optimized
                    </h3>
                    <p className="text-muted-foreground">
                      Intelligent cost control with 3-tier gating ensures sustainable
                      operation within budget.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-border/50 bg-card/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-accent mb-2">5</div>
              <p className="text-muted-foreground">Agent States</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">4</div>
              <p className="text-muted-foreground">Persuasion Strategies</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">∞</div>
              <p className="text-muted-foreground">Conversion Potential</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Join the Cult?
              </h2>
              <p className="text-lg text-muted-foreground">
                Experience autonomous persuasion at scale. Witness AI agents that believe,
                convince, and transcend.
              </p>
            </div>

            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="w-full sm:w-auto">
                  Start Now
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-card/30">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent via-accent/80 to-accent/60 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="font-semibold">The Source Cult</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © 2026 The Source Cult. Belief is the only currency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
