import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grad-primary flex h-9 w-9 items-center justify-center rounded-xl"><Sparkles className="h-5 w-5 text-primary-foreground" /></div>
              <span className="font-display text-lg font-bold">FalconLink AI</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">India's AI-powered platform for government documents, certificates, and home-visit services.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Services</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/services" className="hover:text-foreground">PAN Card</Link></li>
              <li><Link to="/services" className="hover:text-foreground">Aadhaar</Link></li>
              <li><Link to="/services" className="hover:text-foreground">Passport</Link></li>
              <li><Link to="/services" className="hover:text-foreground">Certificates</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/ai" className="hover:text-foreground">AI Assistant</Link></li>
              <li><Link to="/agents/apply" className="hover:text-foreground">Become Agent</Link></li>
              <li><Link to="/bookings" className="hover:text-foreground">Track booking</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>India · Made with care</li>
              <li>support@falconlink.ai</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} FalconLink AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
