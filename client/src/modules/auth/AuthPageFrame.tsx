import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type AuthPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  alternatePrompt: string;
  alternateHref: string;
  alternateLabel: string;
  children: ReactNode;
};

export function AuthPageFrame({
  eyebrow,
  title,
  description,
  alternatePrompt,
  alternateHref,
  alternateLabel,
  children,
}: AuthPageFrameProps) {
  return (
    <main className="auth-page-shell">
      <div className="page-backdrop page-backdrop-left" aria-hidden="true" />
      <div className="page-backdrop page-backdrop-right" aria-hidden="true" />

      <section className="auth-page-card">
        <div className="auth-page-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="card-copy">{description}</p>
        </div>

        {children}

        <p className="auth-switch-copy">
          {alternatePrompt} <Link to={alternateHref}>{alternateLabel}</Link>
        </p>
      </section>
    </main>
  );
}
