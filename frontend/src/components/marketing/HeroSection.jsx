import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BRAND, TRUST_LOGOS } from "../../marketing/brand";

const DASHBOARD_IMAGES = [
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1686061593213-98dad7c599b9?auto=format&fit=crop&w=2200&q=80",
  "https://images.unsplash.com/photo-1686061592689-312bbfb5c055?auto=format&fit=crop&w=2200&q=80",
  
];
const HERO_TRUST_LOGOS = TRUST_LOGOS.slice(0, 5);
const HERO_GRADIENT_WORDS = new Set(["Finance", "Operations", "Growth"]);

function renderHeroTitle(title) {
  return title.split(/(Finance|Operations|Growth)/g).map((token, index) => {
    if (HERO_GRADIENT_WORDS.has(token)) {
      return (
        <span className="mk-gradient-word" key={`hero-word-${token}-${index}`}>
          {token}
        </span>
      );
    }

    return token;
  });
}

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [layerSources, setLayerSources] = useState([DASHBOARD_IMAGES[0], DASHBOARD_IMAGES[1]]);
  const activeLayerRef = useRef(0);
  const currentIndexRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updateMotionPreference();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateMotionPreference);
      return () => mediaQuery.removeEventListener("change", updateMotionPreference);
    }

    mediaQuery.addListener(updateMotionPreference);
    return () => mediaQuery.removeListener(updateMotionPreference);
  }, []);

  useEffect(() => {
    let mounted = true;

    const preloadTasks = DASHBOARD_IMAGES.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = resolve;
        }),
    );

    Promise.all(preloadTasks).then(() => {
      if (mounted) {
        setIsPreloaded(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!isPreloaded || prefersReducedMotion) {
      return undefined;
    }

    const rotateScreenshots = () => {
      const nextIndex = (currentIndexRef.current + 1) % DASHBOARD_IMAGES.length;
      const hiddenLayer = activeLayerRef.current === 0 ? 1 : 0;

      setLayerSources((prev) => {
        const nextSources = [...prev];
        nextSources[hiddenLayer] = DASHBOARD_IMAGES[nextIndex];
        return nextSources;
      });

      frameRef.current = window.requestAnimationFrame(() => {
        setActiveLayer(hiddenLayer);
        setCurrentIndex(nextIndex);
        frameRef.current = null;
      });
    };

    const intervalId = window.setInterval(rotateScreenshots, 3900);

    return () => {
      window.clearInterval(intervalId);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isPreloaded, prefersReducedMotion]);

  return (
    <section className="mk-hero" aria-labelledby="mk-hero-title">
      <div className="mk-hero-background" aria-hidden="true">
        <img
          src={layerSources[0]}
          alt=""
          className={`mk-hero-bg-image ${activeLayer === 0 ? "is-active" : ""}`.trim()}
          loading={currentIndex === 0 ? "eager" : "lazy"}
          decoding="async"
        />
        <img
          src={layerSources[1]}
          alt=""
          className={`mk-hero-bg-image ${activeLayer === 1 ? "is-active" : ""}`.trim()}
          loading="lazy"
          decoding="async"
        />
        <div className="mk-hero-bg-overlay" />
      </div>

      <div className="mk-hero-gradient" aria-hidden="true" />

      <div className="mk-hero-stage">
        <div className="mk-container mk-hero-inner">
          <div className="mk-hero-copy">
            <p className="mk-hero-kicker">{BRAND.tagline}</p>
            <h1 id="mk-hero-title">{renderHeroTitle(BRAND.heroTitle)}</h1>
            <p className="mk-hero-subtitle">{BRAND.heroSubtitle}</p>

            <div className="mk-hero-ctas">
              <Link to="/" className="mk-btn mk-btn-primary mk-btn-pulse">
                Start Free Trial
              </Link>
              <Link to="/" className="mk-btn mk-btn-secondary">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mk-container mk-hero-trust" aria-label="Trusted by modern SaaS teams">
        <p>Trusted by modern SaaS teams</p>
        <div className="mk-hero-trust-logos">
          {HERO_TRUST_LOGOS.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </div>

      <a href="#features" className="mk-scroll-indicator" aria-label="Scroll to features">
        <span className="mk-scroll-dot" />
      </a>
    </section>
  );
}
