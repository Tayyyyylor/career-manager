import type { CSSProperties, ReactNode } from "react";
import { Globe, Mail, MapPin, Phone } from "lucide-react";

import { cvFontFamily, type ResumeStyle } from "@/features/resumes/style/types";
import type { TailoredResumeContent } from "@/features/resumes/tailored";
import { cn } from "@/lib/utils";

export type ResumeContact = {
  fullName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
};

type DocumentProps = {
  content: TailoredResumeContent;
  contact: ResumeContact;
  style: ResumeStyle;
};

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function contactItems(contact: ResumeContact) {
  return [
    contact.email ? { icon: Mail, text: contact.email } : null,
    contact.phone ? { icon: Phone, text: contact.phone } : null,
    contact.location ? { icon: MapPin, text: contact.location } : null,
    ...contact.links.map((link) => ({ icon: Globe, text: displayUrl(link) })),
  ].filter((item): item is { icon: typeof Mail; text: string } => item !== null);
}

/** Variables CSS communes : couleur d'accent, nuance claire, police. */
function paperStyle(style: ResumeStyle): CSSProperties {
  return {
    "--cv-accent": style.accent,
    "--cv-accent-soft": `color-mix(in srgb, ${style.accent} 12%, white)`,
    fontFamily: cvFontFamily(style.font),
  } as CSSProperties;
}

const PAPER =
  "cv-paper mx-auto w-full max-w-[210mm] bg-white text-[12px] leading-relaxed text-neutral-800 shadow-sm ring-1 ring-neutral-200 print:max-w-none print:shadow-none print:ring-0";

function Bullets({ items, className }: { items: readonly string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className={cn("mt-1.5 grid gap-1", className)}>
      {items.map((item, index) => (
        <li key={index} className="relative pl-3.5">
          <span className="absolute top-[0.6em] left-0 size-1.5 rounded-full bg-(color:--cv-accent)" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Moderne : colonne latérale colorée ──────────────────────────────────────

function ModernSideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-[10.5px] font-semibold tracking-[0.16em] text-white/75 uppercase">{title}</h2>
      {children}
    </section>
  );
}

function ModernMainSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="flex items-center gap-2 text-[12px] font-bold tracking-[0.14em] text-(color:--cv-accent) uppercase">
        {title}
        <span className="h-px flex-1 bg-(color:--cv-accent-soft)" aria-hidden />
      </h2>
      {children}
    </section>
  );
}

function ModernTemplate({ content, contact }: Omit<DocumentProps, "style">) {
  return (
    <div className="grid min-h-[296mm] grid-cols-1 sm:grid-cols-[32%_1fr]">
      <aside className="grid content-start gap-7 bg-(color:--cv-accent) px-[7mm] py-[12mm] text-white">
        <ModernSideSection title="Contact">
          <ul className="grid gap-1.5 text-[11px] break-words">
            {contactItems(contact).map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2">
                <Icon className="mt-0.5 size-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="min-w-0">{text}</span>
              </li>
            ))}
          </ul>
        </ModernSideSection>

        {content.skillGroups.map((group) => (
          <ModernSideSection key={group.label} title={group.label}>
            <ul className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <li key={item} className="rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] leading-snug">
                  {item}
                </li>
              ))}
            </ul>
          </ModernSideSection>
        ))}

        {content.education.length > 0 ? (
          <ModernSideSection title="Formation">
            <div className="grid gap-2.5 text-[11px]">
              {content.education.map((item, index) => (
                <div key={index} className="break-inside-avoid">
                  <p className="font-semibold leading-snug">{item.degree}</p>
                  <p className="text-white/80">{item.institution}</p>
                  {item.period ? <p className="text-white/65">{item.period}</p> : null}
                </div>
              ))}
            </div>
          </ModernSideSection>
        ) : null}
      </aside>

      <main className="grid content-start gap-6 px-[9mm] py-[12mm]">
        <header>
          <h1 className="text-[30px] leading-tight font-bold tracking-tight text-neutral-900">{contact.fullName}</h1>
          {content.headline ? (
            <p className="mt-1 text-[15px] font-medium text-(color:--cv-accent)">{content.headline}</p>
          ) : null}
        </header>

        {content.summary ? (
          <p className="rounded-lg bg-(color:--cv-accent-soft) px-4 py-3 text-[12px] whitespace-pre-line text-neutral-700">
            {content.summary}
          </p>
        ) : null}

        {content.experiences.length > 0 ? (
          <ModernMainSection title="Expériences">
            <div className="grid gap-4">
              {content.experiences.map((experience, index) => (
                <article key={index} className="relative break-inside-avoid border-l-2 border-(color:--cv-accent-soft) pl-4">
                  <span className="absolute top-1 -left-[5px] size-2 rounded-full bg-(color:--cv-accent)" aria-hidden />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="text-[13px] font-semibold text-neutral-900">{experience.position}</h3>
                    <span className="text-[11px] text-neutral-500">{experience.period}</span>
                  </div>
                  <p className="text-[11.5px] font-medium text-(color:--cv-accent)">
                    {[experience.company, experience.location].filter(Boolean).join(" · ")}
                  </p>
                  <Bullets items={experience.bullets} />
                </article>
              ))}
            </div>
          </ModernMainSection>
        ) : null}

        {content.projects.length > 0 ? (
          <ModernMainSection title="Projets">
            <div className="grid gap-3">
              {content.projects.map((project, index) => (
                <article key={index} className="break-inside-avoid">
                  <h3 className="text-[12.5px] font-semibold text-neutral-900">
                    {project.name}
                    {project.role ? <span className="font-normal text-neutral-500"> — {project.role}</span> : null}
                  </h3>
                  {project.description ? <p>{project.description}</p> : null}
                  {project.technologies.length > 0 ? (
                    <p className="mt-0.5 text-[11px] text-(color:--cv-accent)">{project.technologies.join(" · ")}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </ModernMainSection>
        ) : null}
      </main>
    </div>
  );
}

// ─── Classique : une colonne, titres soulignés ───────────────────────────────

function ClassicSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2.5">
      <h2 className="border-b-[1.5px] border-(color:--cv-accent) pb-1 text-[12.5px] font-bold tracking-[0.12em] text-(color:--cv-accent) uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ClassicTemplate({ content, contact }: Omit<DocumentProps, "style">) {
  return (
    <div className="grid gap-5 px-[15mm] py-[13mm]">
      <header className="text-center">
        <h1 className="text-[28px] leading-tight font-bold tracking-wide text-neutral-900 uppercase">
          {contact.fullName}
        </h1>
        {content.headline ? (
          <p className="mt-1 text-[14.5px] font-medium text-(color:--cv-accent)">{content.headline}</p>
        ) : null}
        <p className="mt-2 flex flex-wrap justify-center gap-x-2 text-[11px] text-neutral-600">
          {contactItems(contact).map(({ text }, index) => (
            <span key={text}>
              {index > 0 ? <span className="mr-2 text-(color:--cv-accent)">•</span> : null}
              {text}
            </span>
          ))}
        </p>
      </header>

      {content.summary ? (
        <ClassicSection title="Profil">
          <p className="whitespace-pre-line">{content.summary}</p>
        </ClassicSection>
      ) : null}

      {content.experiences.length > 0 ? (
        <ClassicSection title="Expériences professionnelles">
          <div className="grid gap-3.5">
            {content.experiences.map((experience, index) => (
              <article key={index} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="text-[13px] font-bold text-neutral-900">
                    {experience.position}
                    <span className="font-normal text-neutral-600"> — {experience.company}</span>
                  </h3>
                  <span className="text-[11px] text-neutral-500 italic">
                    {[experience.period, experience.location].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <Bullets items={experience.bullets} />
              </article>
            ))}
          </div>
        </ClassicSection>
      ) : null}

      {content.skillGroups.length > 0 ? (
        <ClassicSection title="Compétences">
          <dl className="grid gap-1">
            {content.skillGroups.map((group) => (
              <div key={group.label} className="grid grid-cols-[9.5rem_1fr] gap-3">
                <dt className="font-semibold text-neutral-900">{group.label}</dt>
                <dd>{group.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </ClassicSection>
      ) : null}

      {content.projects.length > 0 ? (
        <ClassicSection title="Projets">
          <div className="grid gap-2.5">
            {content.projects.map((project, index) => (
              <article key={index} className="break-inside-avoid">
                <h3 className="font-bold text-neutral-900">
                  {project.name}
                  {project.role ? <span className="font-normal text-neutral-600"> — {project.role}</span> : null}
                </h3>
                {project.description ? <p>{project.description}</p> : null}
                {project.technologies.length > 0 ? (
                  <p className="text-[11px] text-neutral-500 italic">{project.technologies.join(", ")}</p>
                ) : null}
              </article>
            ))}
          </div>
        </ClassicSection>
      ) : null}

      {content.education.length > 0 ? (
        <ClassicSection title="Formation">
          <div className="grid gap-2">
            {content.education.map((item, index) => (
              <div key={index} className="flex flex-wrap items-baseline justify-between gap-x-3 break-inside-avoid">
                <p>
                  <span className="font-bold text-neutral-900">{item.degree}</span>
                  <span className="text-neutral-600"> — {item.institution}</span>
                </p>
                {item.period ? <span className="text-[11px] text-neutral-500 italic">{item.period}</span> : null}
              </div>
            ))}
          </div>
        </ClassicSection>
      ) : null}
    </div>
  );
}

// ─── Épuré : sobre, touches de couleur ───────────────────────────────────────

function MinimalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2.5 sm:grid-cols-[8.5rem_1fr] sm:gap-6">
      <h2 className="pt-0.5 text-[10.5px] font-semibold tracking-[0.18em] text-(color:--cv-accent) uppercase">
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function MinimalTemplate({ content, contact }: Omit<DocumentProps, "style">) {
  return (
    <div className="grid gap-6 px-[16mm] py-[14mm]">
      <header className="border-l-4 border-(color:--cv-accent) pl-4">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-neutral-900">{contact.fullName}</h1>
        {content.headline ? <p className="mt-0.5 text-[14px] text-neutral-600">{content.headline}</p> : null}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-neutral-500">
          {contactItems(contact).map(({ text }) => (
            <span key={text}>{text}</span>
          ))}
        </p>
      </header>

      {content.summary ? (
        <MinimalSection title="Profil">
          <p className="whitespace-pre-line">{content.summary}</p>
        </MinimalSection>
      ) : null}

      {content.experiences.length > 0 ? (
        <MinimalSection title="Expériences">
          <div className="grid gap-4">
            {content.experiences.map((experience, index) => (
              <article key={index} className="break-inside-avoid">
                <h3 className="font-semibold text-neutral-900">
                  {experience.position}
                  <span className="font-normal text-neutral-500"> · {experience.company}</span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {[experience.period, experience.location].filter(Boolean).join(" · ")}
                </p>
                <Bullets items={experience.bullets} />
              </article>
            ))}
          </div>
        </MinimalSection>
      ) : null}

      {content.projects.length > 0 ? (
        <MinimalSection title="Projets">
          <div className="grid gap-2.5">
            {content.projects.map((project, index) => (
              <article key={index} className="break-inside-avoid">
                <h3 className="font-semibold text-neutral-900">{project.name}</h3>
                {project.description ? <p>{project.description}</p> : null}
                {project.technologies.length > 0 ? (
                  <p className="text-[11px] text-neutral-500">{project.technologies.join(" · ")}</p>
                ) : null}
              </article>
            ))}
          </div>
        </MinimalSection>
      ) : null}

      {content.skillGroups.length > 0 ? (
        <MinimalSection title="Compétences">
          <dl className="grid gap-1">
            {content.skillGroups.map((group) => (
              <div key={group.label}>
                <dt className="inline font-semibold text-neutral-900">{group.label} : </dt>
                <dd className="inline">{group.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </MinimalSection>
      ) : null}

      {content.education.length > 0 ? (
        <MinimalSection title="Formation">
          <div className="grid gap-1.5">
            {content.education.map((item, index) => (
              <p key={index} className="break-inside-avoid">
                <span className="font-semibold text-neutral-900">{item.degree}</span>
                <span className="text-neutral-500">
                  {" "}
                  · {item.institution}
                  {item.period ? ` · ${item.period}` : ""}
                </span>
              </p>
            ))}
          </div>
        </MinimalSection>
      ) : null}
    </div>
  );
}

/** Rendu « papier » d'un CV adapté (A4, imprimable, couleurs conservées). */
export function TailoredResumeDocument({ content, contact, style }: DocumentProps) {
  const Template =
    style.template === "classic" ? ClassicTemplate : style.template === "minimal" ? MinimalTemplate : ModernTemplate;

  return (
    <article id="cv-document" className={PAPER} style={paperStyle(style)}>
      <Template content={content} contact={contact} />
    </article>
  );
}
