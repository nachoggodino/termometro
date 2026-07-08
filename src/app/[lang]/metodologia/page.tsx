import { MethodologyNavigation } from "@/components/methodology/methodology-navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { HEAT_INDEX_PARAMETERS, HEAT_SCORE } from "@/lib/domain/heat";
import { LINE_FLEET_ESTIMATES } from "@/lib/domain/fleet-estimates";
import type { MetroLine } from "@/lib/domain/lines";
import { notFound } from "next/navigation";
import { CircleHelp, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

export default async function MethodologyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);

  const fleetRows = Object.entries(LINE_FLEET_ESTIMATES) as Array<[MetroLine, (typeof LINE_FLEET_ESTIMATES)[MetroLine]]>;

  return (
    <main className="min-h-dvh">
      <article className="mx-auto max-w-3xl px-4 pb-6">
        <MethodologyNavigation dictionary={dictionary} />

        <div className="flex items-center justify-center gap-2 pt-6 text-center">
          <CircleHelp aria-hidden="true" className="size-5 text-muted sm:size-6" />
          <h1 className="text-xl font-[650] tracking-[-0.015em] sm:text-2xl">{dictionary.methodology.title}</h1>
        </div>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-6 text-muted">{dictionary.methodology.intro}</p>

        <div className="mt-8 flex flex-col gap-5">
          <MethodologySection id="mission" title={dictionary.methodology.missionTitle}>
            {dictionary.methodology.missionBody.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </MethodologySection>

          <MethodologySection id="score" title={dictionary.methodology.scoreTitle}>
            <p>
              <strong>{dictionary.methodology.scoreLead}</strong>
            </p>
            <p>{dictionary.methodology.scoreBody}</p>
            <ul className="list-disc space-y-2 pl-5">
              {dictionary.methodology.scoreBullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <FormulaList formulas={dictionary.methodology.scoreFormulas} />
            <dl className="grid gap-2 sm:grid-cols-2">
              <ConstantItem label={dictionary.methodology.constants.heatValues} value={`Fresco = ${HEAT_SCORE.fresco}; Calor = ${HEAT_SCORE.calor}; Infierno = ${HEAT_SCORE.infierno}`} />
              <ConstantItem label={dictionary.methodology.constants.halfLife} value={`${HEAT_INDEX_PARAMETERS.reportHalfLifeDays} ${dictionary.methodology.units.days}`} />
              <ConstantItem label={dictionary.methodology.constants.reportsFor50} value={String(HEAT_INDEX_PARAMETERS.reportsFor50Score)} />
              <ConstantItem label={dictionary.methodology.constants.fleetFor50} value={`${HEAT_INDEX_PARAMETERS.fleetPercentFor50Score}%`} />
              <ConstantItem label={dictionary.methodology.constants.reportWeight} value={`${HEAT_INDEX_PARAMETERS.reportScoreWeight * 100}%`} />
              <ConstantItem label={dictionary.methodology.constants.fleetWeight} value={`${HEAT_INDEX_PARAMETERS.fleetScoreWeight * 100}%`} />
            </dl>
          </MethodologySection>

          <MethodologySection id="confidence" title={dictionary.methodology.confidenceTitle}>
            <p>
              <strong>{dictionary.methodology.confidenceLead}</strong>
            </p>
            <p>{dictionary.methodology.confidenceBody}</p>
            <ul className="list-disc space-y-2 pl-5">
              {dictionary.methodology.confidenceRules.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <FormulaList formulas={dictionary.methodology.confidenceFormulas} />
          </MethodologySection>

          <MethodologySection id="fleet" title={dictionary.methodology.fleetTitle}>
            <p>
              <strong>{dictionary.methodology.fleetLead}</strong>
            </p>
            <p>{dictionary.methodology.fleetBody}</p>
            <div className="space-y-3">
              {dictionary.methodology.fleetSources.map((source) => (
                <a
                  className="block rounded-md border border-border bg-surface p-3 text-foreground transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  href={source.href}
                  key={source.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-semibold">{source.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted">{source.description}</span>
                    </span>
                    <ExternalLink aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
                  </span>
                </a>
              ))}
            </div>
            <p>
              <em>{dictionary.methodology.fleetCorrection}</em>
            </p>
            <div>
              <h3 className="text-sm font-semibold">{dictionary.methodology.fleetCurrentTitle}</h3>
              <div className="mt-3 rounded-md border border-border">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead className="bg-surface text-muted">
                    <tr>
                      <th className="w-14 border-b border-border px-2 py-2 font-semibold sm:px-3">{dictionary.methodology.fleetTable.line}</th>
                      <th className="border-b border-border px-2 py-2 font-semibold sm:px-3">{dictionary.methodology.fleetTable.trains}</th>
                      <th className="border-b border-border px-2 py-2 font-semibold sm:px-3">{dictionary.methodology.fleetTable.cars}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetRows.map(([line, estimate]) => (
                      <tr className="border-b border-border last:border-b-0" key={line}>
                        <td className="px-2 py-2 font-mono font-semibold sm:px-3">{line}</td>
                        <td className="px-2 py-2 font-mono tabular-nums sm:px-3">{estimate.trainsPeakHour}</td>
                        <td className="px-2 py-2 font-mono tabular-nums sm:px-3">{estimate.carsPeakHourApprox}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </MethodologySection>

        </div>
        <p className="mt-8 text-center text-xs text-muted">{dictionary.common.disclaimer}</p>
      </article>
    </main>
  );
}

function MethodologySection({ children, id, title }: { children: ReactNode; id: string; title: string }) {
  return (
    <section className="scroll-mt-32 rounded-md border border-border bg-surface-raised p-4" id={id}>
      <h2 className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-3 space-y-4 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
}

function FormulaList({ formulas }: { formulas: readonly string[] }) {
  return (
    <div className="space-y-2">
      {formulas.map((formula) => (
        <code className="block overflow-x-auto rounded-sm border border-border bg-surface px-3 py-2 font-mono text-xs leading-5 text-foreground" key={formula}>
          {formula}
        </code>
      ))}
    </div>
  );
}

function ConstantItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface px-3 py-2">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-xs text-foreground">{value}</dd>
    </div>
  );
}
