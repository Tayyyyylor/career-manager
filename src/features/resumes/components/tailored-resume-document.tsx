import type { TailoredResumeContent } from "@/features/resumes/tailored";

export type ResumeContact = {
  fullName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid-page">
      <h2 className="mb-2 border-b border-neutral-300 pb-1 text-[11px] font-semibold tracking-[0.12em] text-neutral-500 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/**
 * Rendu « papier » d'un CV adapté (format A4, toujours clair, imprimable).
 */
export function TailoredResumeDocument({
  content,
  contact,
}: {
  content: TailoredResumeContent;
  contact: ResumeContact;
}) {
  const contactItems = [contact.email, contact.phone, contact.location, ...contact.links.map(displayUrl)].filter(
    (item): item is string => Boolean(item),
  );

  return (
    <article
      id="cv-document"
      className="mx-auto w-full max-w-[210mm] bg-white px-[14mm] py-[12mm] text-[12.5px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-neutral-200 print:max-w-none print:p-0 print:shadow-none print:ring-0"
    >
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">{contact.fullName}</h1>
        {content.headline ? <p className="mt-0.5 text-base text-neutral-700">{content.headline}</p> : null}
        {contactItems.length > 0 ? (
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-neutral-600">
            {contactItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </p>
        ) : null}
      </header>

      <div className="grid gap-5">
        {content.summary ? (
          <Section title="Profil">
            <p className="whitespace-pre-line">{content.summary}</p>
          </Section>
        ) : null}

        {content.experiences.length > 0 ? (
          <Section title="Expériences professionnelles">
            <div className="grid gap-3.5">
              {content.experiences.map((experience, index) => (
                <div key={index} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="font-semibold">
                      {experience.position}
                      <span className="font-normal text-neutral-700"> — {experience.company}</span>
                    </h3>
                    <span className="text-[11.5px] text-neutral-500">
                      {[experience.period, experience.location].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  {experience.bullets.length > 0 ? (
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 marker:text-neutral-400">
                      {experience.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {content.projects.length > 0 ? (
          <Section title="Projets">
            <div className="grid gap-2.5">
              {content.projects.map((project, index) => (
                <div key={index} className="break-inside-avoid">
                  <h3 className="font-semibold">
                    {project.name}
                    {project.role ? <span className="font-normal text-neutral-700"> — {project.role}</span> : null}
                  </h3>
                  {project.description ? <p>{project.description}</p> : null}
                  {project.technologies.length > 0 ? (
                    <p className="text-[11.5px] text-neutral-500">{project.technologies.join(" · ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {content.skillGroups.length > 0 ? (
          <Section title="Compétences">
            <dl className="grid gap-1">
              {content.skillGroups.map((group) => (
                <div key={group.label} className="grid grid-cols-[9rem_1fr] gap-3">
                  <dt className="font-medium text-neutral-700">{group.label}</dt>
                  <dd>{group.items.join(", ")}</dd>
                </div>
              ))}
            </dl>
          </Section>
        ) : null}

        {content.education.length > 0 ? (
          <Section title="Formation">
            <div className="grid gap-2">
              {content.education.map((item, index) => (
                <div key={index} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="font-semibold">
                      {item.degree}
                      <span className="font-normal text-neutral-700"> — {item.institution}</span>
                    </h3>
                    {item.period ? <span className="text-[11.5px] text-neutral-500">{item.period}</span> : null}
                  </div>
                  {item.details ? <p className="text-neutral-700">{item.details}</p> : null}
                </div>
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    </article>
  );
}
