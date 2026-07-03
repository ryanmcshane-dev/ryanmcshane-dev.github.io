import type { RawGreenhouseResponse } from '../../types';

/**
 * Trimmed but shape-accurate Greenhouse board payload
 * (GET boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true).
 *
 * Note `content` is HTML that arrives *entity-encoded* (`&lt;p&gt;`), so the adapter must
 * decode entities before stripping tags. Captured against a live board 2026-07-02.
 */
export const greenhouseFixture: RawGreenhouseResponse = {
  jobs: [
    {
      id: 7995153,
      title: 'Senior Software Engineer, Payments',
      absolute_url: 'https://careers.example.com/positions/7995153?gh_jid=7995153',
      updated_at: '2026-06-10T08:50:56-04:00',
      location: { name: 'Remote - US' },
      content:
        '&lt;div class=&quot;content-intro&quot;&gt;&lt;p&gt;We are hiring a &lt;strong&gt;Senior Software Engineer&lt;/strong&gt; to build event-driven backend services on AWS.&lt;/p&gt;&lt;/div&gt;',
      metadata: [
        { name: 'Workplace Type', value: 'Remote', value_type: 'single_select' },
        { name: 'Is this job part of ACC?', value: false, value_type: 'yes_no' },
      ],
      offices: [{ name: 'Remote' }],
      departments: [{ name: 'Engineering' }],
    },
    {
      id: 7995200,
      title: 'Acquisition Manager',
      absolute_url: 'https://careers.example.com/positions/7995200?gh_jid=7995200',
      updated_at: '2026-06-09T10:00:00-04:00',
      location: { name: 'Berlin, Germany' },
      content: '&lt;p&gt;Lead regional acquisition efforts.&lt;/p&gt;',
      metadata: [{ name: 'Workplace Type', value: 'Hybrid', value_type: 'single_select' }],
      offices: [{ name: 'Berlin, Germany' }],
      departments: [{ name: 'Sales' }],
    },
  ],
};
