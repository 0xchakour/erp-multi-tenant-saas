import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import SaasLogo from "./SaasLogo";
import AuthModal from "../ui/AuthModal";

const NAVIGATION_ITEMS = {
  features: {
    title: "Features",
    items: [
      { label: "Automation", description: "Streamline repetitive tasks" },
      { label: "Analytics", description: "Deep insights into performance" },
      { label: "Integration", description: "Connect with your tools" },
      { label: "Collaboration", description: "Team workflows simplified" },
      { label: "Security", description: "Enterprise-grade protection" },
    ],
  },
  solutions: {
    title: "Solutions",
    items: [
      { label: "Enterprise", description: "For large organizations" },
      { label: "Startups", description: "Rapid scaling solutions" },
      { label: "SMB", description: "Tailored for small teams" },
      { label: "Healthcare", description: "Compliance ready" },
      { label: "Finance", description: "Regulated industry support" },
    ],
  },
  pricing: {
    title: "Pricing",
    items: [
      { label: "Plans", description: "View all pricing tiers" },
      { label: "Calculator", description: "Estimate your costs" },
      { label: "ROI", description: "See your return" },
      { label: "Enterprise", description: "Custom solutions" },
      { label: "FAQ", description: "Common questions" },
    ],
  },
  resources: {
    title: "Resources",
    items: [
      { label: "Documentation", description: "Full API reference" },
      { label: "Blog", description: "Latest industry insights" },
      { label: "Guides", description: "Step-by-step tutorials" },
      { label: "Webinars", description: "Join live sessions" },
      { label: "Community", description: "Connect with users" },
    ],
  },
  company: {
    title: "Company",
    items: [
      { label: "About", description: "Our mission & vision" },
      { label: "Careers", description: "Join the team" },
      { label: "Press", description: "News & announcements" },
      { label: "Partners", description: "Integration partners" },
      { label: "Contact", description: "Get in touch" },
    ],
  },
};

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hasOpenDropdown, setHasOpenDropdown] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveDropdown(null);
        setHasOpenDropdown(false);
      }
    };

    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeDropdown]);

  const handleMouseEnter = (dropdownKey) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(dropdownKey);
      setHasOpenDropdown(true);
    }, 80);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setHasOpenDropdown(false);
    }, 200);
  };

  const handleKeyDown = (e, dropdownKey) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setActiveDropdown(activeDropdown === dropdownKey ? null : dropdownKey);
      setHasOpenDropdown(activeDropdown !== dropdownKey);
    } else if (e.key === "Escape" && activeDropdown === dropdownKey) {
      e.preventDefault();
      setActiveDropdown(null);
      setHasOpenDropdown(false);
    }
  };

  return (
    <header
      ref={headerRef}
      className={`mk-header ${isScrolled ? "mk-header--scrolled" : ""} ${
        hasOpenDropdown ? "mk-header--dropdown-open" : ""
      }`}
    >
      <div className="mk-header-inner">
        <Link to="/" className="mk-header-brand" aria-label="Nexora home">
          <SaasLogo compact />
        </Link>

        <nav className="mk-header-nav" aria-label="Main navigation">
          {Object.entries(NAVIGATION_ITEMS).map(([key, nav]) => (
            <div
              key={key}
              className="mk-nav-item"
              onMouseEnter={() => handleMouseEnter(key)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className="mk-nav-trigger"
                aria-haspopup="true"
                aria-expanded={activeDropdown === key}
                onKeyDown={(e) => handleKeyDown(e, key)}
              >
                {nav.title}
              </button>

              <div
                className={`mk-dropdown ${activeDropdown === key ? "mk-dropdown--active" : ""}`}
                role="menu"
              >
                <div className="mk-dropdown-arrow" />
                <div className="mk-dropdown-content">
                  {nav.items.map((item, idx) => (
                    <a
                      key={idx}
                      href={`#${key}-${idx}`}
                      className="mk-dropdown-item"
                      role="menuitem"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setActiveDropdown(null);
                          setHasOpenDropdown(false);
                        }
                      }}
                    >
                      <span className="mk-dropdown-label">{item.label}</span>
                      <span className="mk-dropdown-desc">{item.description}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="mk-header-actions">
          <button
            type="button"
            className="mk-btn mk-btn-primary mk-btn-cta"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Join Us
          </button>
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
