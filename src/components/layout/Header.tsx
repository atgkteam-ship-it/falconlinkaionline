import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Menu, X, Moon, Sun, LogOut, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationsBell } from "./NotificationsBell";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/ai", label: "AI Assistant" },
  { to: "/agents/apply", label: "Become Agent" },
];

export function Header() {
  const { user, isAdmin, isAgent, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header className={`sticky top-0 z-50 transition-all ${scrolled ? "glass-strong shadow-soft" : "bg-transparent"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grad-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">FalconLink<span className="grad-text"> AI</span></span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground" activeProps={{ className: "text-foreground bg-accent" }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} aria-label="Toggle theme" className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <NotificationsBell />
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link to="/bookings" className="text-sm font-medium text-muted-foreground hover:text-foreground">Bookings</Link>
              {isAgent && <Link to="/agent" className="text-sm font-medium text-muted-foreground hover:text-foreground">Agent</Link>}
              {isAdmin && <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground">Admin</Link>}
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="hidden md:inline-flex grad-primary text-primary-foreground shadow-glow hover:opacity-90">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
          <button className="md:hidden rounded-lg p-2 hover:bg-accent" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden border-t border-border glass-strong">
            <div className="flex flex-col gap-1 p-4">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">{n.label}</Link>
              ))}
              {user ? (
                <>
                  <Link to="/bookings" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">My Bookings</Link>
                  {isAgent && <Link to="/agent" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">Agent Dashboard</Link>}
                  {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">Admin</Link>}
                  <Button variant="outline" size="sm" className="mt-2" onClick={async () => { await signOut(); setOpen(false); navigate({ to: "/" }); }}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
                </>
              ) : (
                <Button asChild size="sm" className="mt-2 grad-primary text-primary-foreground"><Link to="/login" onClick={() => setOpen(false)}><UserIcon className="mr-2 h-4 w-4" />Sign in</Link></Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
