import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead/SeoHead';
import { Section } from '@/components/Section/Section';
import { siteConfig } from '@/config';
import {
  formatRadarDate,
  groupByVerdict,
  jobRadar,
  remoteLabel,
  tierLabel,
  VERDICT_LABEL,
  type RadarItem,
  type RadarReportView,
} from '@/content/jobRadar';
import styles from './JobRadar.module.css';

function RoleCard({ item }: { item: RadarItem }) {
  const { score } = item;
  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <p className={styles.company}>{item.company}</p>
          <h4 className={styles.role}>{item.title}</h4>
        </div>
        <span
          className={styles.fit}
          data-verdict={score.verdict}
          aria-label={`Fit score ${score.fit} out of 100`}
        >
          {score.fit}
        </span>
      </div>

      <ul className={styles.meta} aria-label="Role details">
        <li>{remoteLabel(item.remote)}</li>
        <li>{item.location}</li>
        {item.compHint && <li>{item.compHint}</li>}
      </ul>

      <p className={styles.rationale}>{score.rationale}</p>

      {score.matched.length > 0 && (
        <div className={styles.tagRow}>
          <span className={styles.tagLabel}>Matched</span>
          <ul className={styles.tags}>
            {score.matched.map((m) => (
              <li key={m} className={styles.tag}>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {score.concerns.length > 0 && (
        <div className={styles.tagRow}>
          <span className={styles.tagLabel}>Concerns</span>
          <ul className={styles.tags}>
            {score.concerns.map((c) => (
              <li key={c} className={`${styles.tag} ${styles.concern}`}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        className={styles.apply}
        href={item.url}
        target="_blank"
        rel="noreferrer noopener"
      >
        View role<span aria-hidden="true"> ↗</span>
      </a>
    </li>
  );
}

/** Presentational view — takes the report as a prop so it tests with fixtures. */
export function JobRadarView({ report }: { report: RadarReportView }) {
  const groups = groupByVerdict(report.items);
  const { counts } = report;

  return (
    <Section
      id="job-radar"
      eyebrow="Job Radar"
      title="An agentic pipeline for my own job search"
      intro="I built a spec-driven pipeline that pulls open roles from public ATS boards, filters them against my criteria, and scores fit — dogfooding the AI-native method this site is about. The spec and code live in the repo."
    >
      <dl className={styles.stats} aria-label="Run summary">
        <div className={styles.stat}>
          <dt>Generated</dt>
          <dd>{formatRadarDate(report.generatedAt)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Scoring</dt>
          <dd>{tierLabel(report.tier)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Roles scanned</dt>
          <dd>{counts.fetched.toLocaleString('en-US')}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Passed filters</dt>
          <dd>{counts.kept.toLocaleString('en-US')}</dd>
        </div>
      </dl>

      {report.tier === 'tier-1' && (
        <p className={styles.tierNote}>
          Showing the free, autonomous deterministic pass. The on-command Claude Code pass
          (<code>/radar-score</code>) adds nuanced judgment — for example, telling genuine AI-native
          engineering from an LLM bolt-on.
        </p>
      )}

      {groups.length === 0 ? (
        <p className={styles.empty}>No roles cleared the filters in the latest run.</p>
      ) : (
        groups.map((group) => (
          <section key={group.verdict} className={styles.group} aria-label={VERDICT_LABEL[group.verdict]}>
            <h3 className={styles.groupHead}>
              {VERDICT_LABEL[group.verdict]}
              <span className={styles.groupCount}>{group.items.length}</span>
            </h3>
            <ul className={styles.grid}>
              {group.items.map((item) => (
                <RoleCard key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}

      <p className={styles.footnote}>
        Fit scores and rationales are my tool's output, not the employers'. See{' '}
        <Link to="/colophon">how this site is built</Link> or{' '}
        <a href={siteConfig.links.github} target="_blank" rel="noreferrer noopener">
          the source on GitHub
        </a>
        .
      </p>
    </Section>
  );
}

export function JobRadar() {
  return (
    <>
      <SeoHead
        title="Job Radar"
        description="An agentic, spec-driven pipeline I built to source and fit-score senior software / AI engineering roles from public ATS boards."
        path="/job-radar"
      />
      <JobRadarView report={jobRadar} />
    </>
  );
}
