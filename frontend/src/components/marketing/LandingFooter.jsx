import { BRAND, FOOTER_COLUMNS } from "../../marketing/brand";
import SaasLogo from "./SaasLogo";

export default function LandingFooter() {
  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer-top">
          <div className="mk-footer-brand">
            <SaasLogo />
            <p>
              Investor-grade ERP infrastructure for modern B2B operators and finance teams.
            </p>
          </div>

          <div className="mk-footer-columns">
            {FOOTER_COLUMNS.map((column) => (
              <section key={column.title} aria-label={column.title}>
                <h3>{column.title}</h3>
                <ul>
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" onClick={(event) => event.preventDefault()}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="mk-footer-bottom">
          <p>
            Copyright {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
          </p>
          <div className="mk-footer-socials" aria-label="Social links placeholders">
            <a href="#" onClick={(event) => event.preventDefault()}>
              X
            </a>
            <a href="#" onClick={(event) => event.preventDefault()}>
              LinkedIn
            </a>
            <a href="#" onClick={(event) => event.preventDefault()}>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
