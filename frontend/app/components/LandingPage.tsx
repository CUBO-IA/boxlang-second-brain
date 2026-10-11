"use client";

import Link from "next/link";

import { landingCopy } from "../lib/landing";
import { useLanguage } from "../lib/language";
import { LanguageSwitch, LogoMark } from "./Brand";

const featureIcons: Record<string, React.ReactNode> = {
  document: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h4" /></>,
  branch: <path d="M5 5v14M5 12h7c4 0 3-6 8-6M17 3l3 3-3 3" />,
  warning: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>,
  graph: <><circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="9" r="2.5" /><circle cx="11" cy="18" r="2.5" /><path d="M8.3 7.6l7.3 1M7.2 9.2l2.8 6.6M16.6 11l-4.2 5.2" /></>,
  people: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.3c2 .8 3.5 2.8 3.5 5.7" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>,
};

function Icon({ children, size = 20 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function LandingPage() {
  const [language, setLanguage] = useLanguage();
  const t = landingCopy[language];

  return (
    <div className="landing">
      <header className="landing-header landing-width">
        <Link className="landing-brand" href="/">
          <LogoMark />
          <span>Terengue</span>
        </Link>
        <nav aria-label={t.navLabel}>
          <a href="#como-funciona">{t.navHow}</a>
          <a href="#funciones">{t.navFeatures}</a>
          <a href="#fuentes">{t.navSources}</a>
          <a href="#confianza">{t.navTrust}</a>
        </nav>
        <LanguageSwitch language={language} onChange={setLanguage} />
        <Link className="button primary" href="/app">{t.login}</Link>
      </header>

      <main>
        <section className="landing-hero landing-width">
          <div className="hero-text">
            <p className="hero-pill">{t.eyebrow}</p>
            <h1>{t.sloganLead} <span>{t.sloganAccent}</span></h1>
            <p className="hero-pitch">{t.pitch}</p>
            <div className="hero-actions">
              <Link className="button primary large" href="/app">{t.register}</Link>
              <a className="button secondary large" href="#como-funciona">{t.seeHow}</a>
            </div>
            <p className="hero-note">{t.languages}</p>
          </div>
          <figure className="hero-sample" aria-label={t.sampleLabel}>
            <p className="sample-question">{t.sampleQuestion}</p>
            <div className="sample-claim">
              <span className="claim-tag supported"><Icon size={12}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>{t.supported}</span>
              <p>{t.sampleSupported} <strong>{t.sampleCitation}</strong></p>
            </div>
            <div className="sample-claim">
              <span className="claim-tag inferred"><Icon size={12}>{featureIcons.branch}</Icon>{t.inferred}</span>
              <p>{t.sampleInferred} <span>{t.samplePremises}</span></p>
            </div>
            <p className="sample-conflict">
              <Icon size={18}>{featureIcons.warning}</Icon>
              <span><strong>{t.conflictTitle}</strong> {t.conflictText}</span>
            </p>
          </figure>
        </section>

        <section id="como-funciona" className="landing-band">
          <div className="landing-section landing-width">
            <div className="section-intro">
              <h2>{t.howTitle}</h2>
              <p>{t.howIntro}</p>
            </div>
            <ol className="step-grid">
              {t.steps.map((step, index) => (
                <li key={step.title} className="landing-card">
                  <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="funciones" className="landing-section landing-width">
          <div className="section-intro">
            <h2>{t.featuresTitle}</h2>
            <p>{t.featuresIntro}</p>
          </div>
          <ul className="feature-grid">
            {t.features.map((feature) => (
              <li key={feature.title} className="landing-card flat">
                <span className={feature.icon === "warning" ? "feature-icon warning" : "feature-icon"}><Icon>{featureIcons[feature.icon]}</Icon></span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
          <p className="landing-status">{t.statusNote}</p>
        </section>

        <section id="fuentes" className="landing-band">
          <div className="landing-section landing-width sources-layout">
            <div className="section-intro">
              <h2>{t.sourcesTitle}</h2>
              <p>{t.sourcesIntro}</p>
              <p className="hero-note">{t.sourcesNote}</p>
            </div>
            <div className="sources-lists">
              <p className="eyebrow">{t.formatsLabel}</p>
              <ul className="format-chips">
                {t.formats.map((format) => <li key={format}>{format}</li>)}
              </ul>
              <p className="eyebrow">{t.originsLabel}</p>
              <ul className="origin-grid">
                {t.origins.map((origin) => (
                  <li key={origin.title}><strong>{origin.title}</strong><span>{origin.text}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="confianza" className="landing-section landing-width">
          <div className="section-intro">
            <h2>{t.trustTitle}</h2>
            <p>{t.trustIntro}</p>
          </div>
          <div className="trust-grid">
            <div className="trust-card dark">
              <h3>{t.notTitle}</h3>
              <ul>
                {t.notList.map((item) => (
                  <li key={item}><Icon size={18}><path d="M6 6l12 12M18 6L6 18" /></Icon><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="trust-card">
              <h3>{t.knowTitle}</h3>
              <ul>
                {t.knowList.map((item) => (
                  <li key={item}><Icon size={18}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5h.01" /></Icon><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="landing-width landing-cta-wrap">
          <div className="landing-cta">
            <div>
              <h2>{t.sloganLead} <span>{t.sloganAccent}</span> {t.ctaTail}</h2>
              <p>{t.ctaText}</p>
            </div>
            <div className="hero-actions">
              <Link className="button cream large" href="/app">{t.register}</Link>
              <Link className="button outline-light large" href="/app">{t.login}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-width">
          <div className="footer-columns">
            <div className="footer-brand">
              <Link className="landing-brand" href="/">
                <LogoMark size={36} inverse />
                <span>Terengue</span>
              </Link>
              <p className="footer-slogan">{t.sloganLead} {t.sloganAccent}</p>
              <p>{t.footerPitch}</p>
            </div>
            <nav aria-label={t.footerProduct}>
              <p className="footer-heading">{t.footerProduct}</p>
              <a href="#como-funciona">{t.navHow}</a>
              <a href="#funciones">{t.navFeatures}</a>
              <a href="#fuentes">{t.footerSources}</a>
              <a href="#confianza">{t.navTrust}</a>
            </nav>
            <nav aria-label={t.footerApp}>
              <p className="footer-heading">{t.footerApp}</p>
              <Link href="/app">{t.login}</Link>
              <Link href="/app">{t.register}</Link>
            </nav>
            <div>
              <p className="footer-heading">{t.footerProject}</p>
              {t.project.map((line) => <p key={line} className="footer-line">{line}</p>)}
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t.legal}</p>
            <LanguageSwitch language={language} onChange={setLanguage} inverse />
          </div>
        </div>
      </footer>
    </div>
  );
}
