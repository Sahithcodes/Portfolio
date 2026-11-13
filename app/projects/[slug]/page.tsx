import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Code2 } from "lucide-react";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { getProject, getProjectLinks, projects } from "@/data/projects";

export function generateStaticParams() {
  return projects.map(({ id }) => ({ slug: id }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = getProject(params.slug);
  if (!project) return { title: "Project not found" };
  return { title: `${project.title} | K. Venkata Sahith`, description: project.description };
}

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = getProject(params.slug);
  if (!project) notFound();
  const projectLinks = getProjectLinks(project);

  return (
    <section className="min-h-screen py-28 sm:py-36">
      <Container>
        <Link href="/#projects" className="inline-flex items-center gap-2 text-sm text-content-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to projects
        </Link>
        <header className="mt-10 max-w-4xl">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">{project.index} / {project.category}</p>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-content-primary sm:text-6xl">{project.title}</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-content-secondary sm:text-lg">{project.description}</p>
          <p className="mt-5 inline-flex rounded-full border border-surface-border bg-surface px-3 py-1 font-mono text-xs text-content-muted">{project.status}</p>
          {projectLinks && <div className="mt-7 flex flex-wrap gap-3">
            <a href={projectLinks.primary.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-background hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {projectLinks.primary.label === "View Project" && !project.demo ? <Code2 className="h-4 w-4" aria-hidden="true" /> : null}
              {projectLinks.primary.label} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            {projectLinks.repository && <a href={projectLinks.repository} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm font-medium text-content-primary hover:border-accent"><Code2 className="h-4 w-4" aria-hidden="true" /> GitHub <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>}
          </div>}
        </header>

        {project.screenshot ? (
          // Screenshots are only rendered when a repository image is supplied in project data.
          // eslint-disable-next-line @next/next/no-img-element
          <figure className="mt-12 overflow-hidden rounded-2xl border border-surface-border bg-surface"><img src={project.screenshot} alt={`${project.title} project screenshot`} className="h-auto w-full" /><figcaption className="px-4 py-3 text-xs text-content-muted">Project interface</figcaption></figure>
        ) : null}

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-content-primary">Problem</h2>
            <p className="mt-3 text-sm leading-relaxed text-content-secondary">{project.problem}</p>
          </article>
          <article className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-content-primary">Solution</h2>
            <p className="mt-3 text-sm leading-relaxed text-content-secondary">{project.solution}</p>
          </article>
          <article className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-content-primary">Technical architecture</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-content-secondary">{project.architecture.map((step) => <li key={step}>{step}</li>)}</ol>
          </article>
          <article className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-content-primary">Implemented features</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-content-secondary">{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          </article>
          <article className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 lg:col-span-2">
            <h2 className="font-heading text-xl font-semibold text-content-primary">Technology stack</h2>
            <div className="mt-4 flex flex-wrap gap-2">{project.technologies.map((technology) => <span key={technology} className="rounded-full border border-surface-border bg-surface-elevated px-3 py-1.5 font-mono text-xs text-content-secondary">{technology}</span>)}</div>
          </article>
          {project.implementationNotes?.map((note) => <p key={note} className="rounded-xl border-l-2 border-accent bg-surface/70 p-5 text-sm leading-relaxed text-content-secondary lg:col-span-2">{note}</p>)}
        </div>
      </Container>
    </section>
  );
}
