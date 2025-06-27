import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Brain, Sparkles, BookOpen, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="app-container bg-white">
      {/* Status Bar */}
      <div className="status-bar px-4 py-2 text-white text-sm flex justify-between items-center">
        <span className="font-medium">9:41 AM</span>
        <div className="flex items-center space-x-1 text-xs">
          <span>••••</span>
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      <div className="main-content flex flex-col">
        {/* Hero Section */}
        <section className="luma-gradient px-6 py-12 text-white text-center">
          <div className="animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full emotion-gradient flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Luma</h1>
            <p className="text-lg text-white/90 mb-2">A journal that remembers,</p>
            <p className="text-lg text-white/90 mb-8">reflects, and grows with you</p>
            <p className="text-sm text-white/80 leading-relaxed mb-8">
              Every entry becomes part of your story. Luma listens between the lines,
              offering gentle insights and compassionate reflections on your emotional journey.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-8 bg-calm">
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-wisdom mb-2">Your Personal Companion</h2>
              <p className="text-sm text-wisdom/70">Discover what makes Luma special</p>
            </div>

            <div className="grid gap-4">
              <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-4 flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-wisdom mb-1">AI That Understands</h3>
                    <p className="text-sm text-wisdom/70 leading-relaxed">
                      More than just storage—Luma reads your emotional patterns and offers thoughtful reflections
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-4 flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium text-wisdom mb-1">Track Your Growth</h3>
                    <p className="text-sm text-wisdom/70 leading-relaxed">
                      Visualize your emotional journey with mood mapping and pattern recognition
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <CardContent className="p-4 flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-wisdom mb-1">Daily Inspiration</h3>
                    <p className="text-sm text-wisdom/70 leading-relaxed">
                      Receive personalized prompts and gentle nudges to explore your inner world
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <CardContent className="p-4 flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-wisdom mb-1">Your Story, Preserved</h3>
                    <p className="text-sm text-wisdom/70 leading-relaxed">
                      Every word matters. Access your complete journey anytime, anywhere
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="px-6 py-8 bg-gradient-to-br from-gentle/50 to-white">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <blockquote className="text-wisdom/80 italic mb-4 leading-relaxed">
                "Luma helped me understand patterns in my thinking I never noticed before. 
                It's like having a wise friend who remembers everything and always knows just what to say."
              </blockquote>
              <cite className="text-sm text-wisdom/60">— Early Beta User</cite>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-8 text-center">
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold text-wisdom mb-4">
              Ready to begin your journey?
            </h2>
            <p className="text-sm text-wisdom/70 mb-8 leading-relaxed">
              Join thousands discovering deeper self-awareness through compassionate AI companionship
            </p>
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-medium rounded-xl shadow-lg"
            >
              Start Your Journey
            </Button>
            
            <p className="text-xs text-wisdom/50 mt-4">
              Free to start • No credit card required
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
