# Ryan McShane — Résumé

> Plain-text/markdown mirror of `public/resume.pdf`, kept in sync so the Job Radar candidate
> profile can load it directly into context. Confidentiality: mirrors the already-public résumé —
> employer partner / external HCM platform / internal project names stay generic. Do not add
> specifics here that aren't already in the public PDF.

**Senior Software Engineer · Tech Lead**
Hampstead, NH (Open to Remote) · (401) 793-6692 · ryanmcshane429@gmail.com
linkedin.com/in/ryan-mcshane · ryanmcshane.github.io/mysite

## Summary

Senior software engineer and tech lead — 7+ years building event-driven microservices in
Java/Spring Boot on AWS. Leads a 9-engineer team behind an API platform streaming ~11K daily
events to external HCM systems for 1,200+ customers across 9 integrations — a solution strong
enough to help win a major HCM vendor as a customer. Drives AI-native engineering: RAG/agentic
tooling across 30+ microservices and spec-driven development that turns weeks of delivery into days.

## Technical Skills

- **Languages:** Java, JavaScript, TypeScript, SQL
- **Backend & Architecture:** Spring Boot, Microservices, Event-Driven Architecture, Apache Camel,
  IBM MQ, REST APIs, OAuth 2.0, Hibernate/JPA
- **Frontend:** React
- **Cloud & DevOps:** AWS (ECS), GitLab CI/CD, GitLab Runners, build-verification suites
- **AI & Agentic Engineering:** Claude Code, RAG, LLM agent / tool-calling design, knowledge graphs
  (Graphify), spec-driven development, prompt engineering
- **Observability & Reliability:** Splunk, New Relic, Spring Boot Admin, AppDynamics, Power Automate alerting
- **Data:** PostgreSQL
- **Testing & Quality:** TestNG, JUnit 5, Playwright, RestAssured, Cucumber/BDD, Allure, Selenium,
  Postman, Maven

## Experience

### Lincoln Financial Group — Software Engineer & Tech Lead · Mar 2022 – Present
*Title: Sr. Analyst, Application Development · Progression: QE Engineer → Software Engineer → Tech Lead*

- Lead a 9-engineer Scrum team (5 backend, 1 QE, 3 frontend) that owns the backend services behind
  Lincoln's Absence Management and Evidence-of-Insurability (EOI) API platforms plus a React "Admin
  UI" for internal configuration — partnering with stakeholders and architects to gather
  requirements, author epics/stories, run design reviews for reusable/maintainable design, and
  unblock developers while driving delivery end to end.
- Architected and own a near-real-time, event-driven Absence Management API processing ~10K
  events/day for 80+ enterprise customers, streaming data from the system of record to external HCM
  platforms; the solution became an industry benchmark whose strength helped win a major HCM
  platform vendor as a Lincoln customer.
- Design and ship cloud-native microservices in Java/Spring Boot on AWS (ECS) using Apache Camel for
  routing/integration, IBM MQ for async messaging, PostgreSQL with Hibernate/JPA, and OAuth
  2.0–secured APIs; led the design and delivery of EOI API integrations across 5+ new HCM platforms,
  now serving 1,200+ customers across 9 integrations.
- Built proactive observability and alerting to catch issues before customers do: authored Splunk
  and New Relic alerts — including a detector that flags when upstream event delivery lags 30+
  minutes behind the source system — plus Spring Boot Admin health monitoring and a Power Automate
  flow firing email/Microsoft Teams notifications on alert; cut detection-to-resolution on a critical
  upstream dependency from days to hours and ensured issues are caught internally, not by customers.
- Key contributor to an internal AI agent that unifies 30+ microservices through RAG and a knowledge
  graph (Graphify), letting engineers query how services connect and act across tooling; helped add
  secure token-based skills so the agent runs GitLab code reviews, pulls Jira/Confluence issues for
  defect analysis, and queries Splunk via SPL — accelerating daily RCA, review, and design work, and
  championing AI adoption across group-protection IT.
- Champion spec-driven development org-wide, architecting solutions and decomposing them into
  discrete, AI-executable task lists. Recently led a complex inbound/outbound integration with a new
  HCM platform — the first carrier live on it: used Claude to analyze the partner's OpenAPI specs and
  co-author the design spec from a reusable template that guides the AI, winning architect sign-off
  with minimal revisions; developers then implemented straight from the spec's task list, cutting a
  projected 2+ month build to ~4 weeks.
- Modernized the team's test-automation platform with Claude Code: migrated reporting from a legacy
  internal tool to Allure with a GitLab Pages dashboard tracking the last 100 pipeline runs and a
  flaky-test trend view; added a `@ParallelEligible` tagging strategy that runs eligible tests across
  4 threads (~4× faster) and stripped unused libraries (Selenium, QAF) for a leaner headless-service
  framework — sustaining the team's benchmark coverage via build-verification suites in CI and a
  nightly full-regression suite on scheduled GitLab runners.

### Cognizant — Software Quality Engineer (contracted to Lincoln Financial Group) · Jan 2019 – Mar 2022

- Built the foundational automated test framework (Java, TestNG, RestAssured, Cucumber, Maven,
  Selenium) integrated into GitLab CI/CD for nightly regression and build verification — covering UI,
  REST APIs, PostgreSQL data checks, and IBM MQ pub/sub messaging.
- Led a globally distributed QA team to deliver testing for a large-scale HCM integration program and
  collaborated directly with pilot customers to validate deliverables.
- Drove root-cause analysis on production and integration issues using Splunk and AppDynamics, and
  presented automation strategy and frameworks to QE teams and stakeholders across the organization.

### Vector Solutions — SQL Data Analyst / Web Development Intern · Jan 2018 – May 2018

- Wrote complex SQL to extract and migrate data from Microsoft Dynamics CRM into Salesforce, and
  contributed front-end updates (WordPress, HTML, CSS) to the company website launch.

## Education

**University of South Florida** — B.S., Business Analytics & Information Systems · 2018
