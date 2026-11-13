import { Award, ExternalLink } from "lucide-react";
import Container from "@/components/layout/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import { certifications } from "@/data/certifications";

export default function CertificationsSection() {
  return (
    <section id="certifications" className="py-24 sm:py-32 relative scroll-mt-20 transition-colors duration-300">
      <Container>
        <SectionHeading
          index="05"
          eyebrow="Credentials & Professional Development"
          title="Learning, credentials &"
          highlight="workshops."
          description="A record of cloud, AI, data-visualization, career-development, and quantum-computing learning."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certifications.map((item, index) => (
            <article
              key={item.title}
              className={`group rounded-2xl border bg-surface p-6 sm:p-7 transition-colors hover:border-accent/60 ${index === 0 ? "border-accent/50 md:col-span-2" : "border-surface-border"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span className="shrink-0 rounded-xl border border-surface-border bg-surface-elevated p-2.5 text-accent" aria-hidden="true">
                    <Award className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-accent">{item.type}</p>
                    <h3 className="mt-1 font-heading text-lg font-semibold text-content-primary group-hover:text-accent sm:text-xl">{item.title}</h3>
                    <p className="mt-1 text-sm text-content-secondary">{item.issuer}</p>
                  </div>
                </div>
                {item.date && <span className="shrink-0 font-mono text-xs text-content-muted">{item.date}</span>}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-content-secondary">{item.description}</p>
              {item.topics && (
                <ul className="mt-4 grid gap-2 text-sm text-content-secondary sm:grid-cols-3">
                  {item.topics.map((topic) => <li key={topic} className="border-l border-accent/50 pl-3">{topic}</li>)}
                </ul>
              )}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-surface-border/70 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-wide text-content-muted">{item.url ? "Credential reference" : "Completed workshop"}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
                    View credential <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
