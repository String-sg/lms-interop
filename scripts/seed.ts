import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { nanoid } from "nanoid";
import * as schema from "../src/db/schema";
import { slugify } from "../src/lib/slug";
import { extractWikilinks } from "../src/lib/mdx/wikilinks";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const CREATOR_ID = process.env.SEED_USER_ID || "seed-creator";

const seedModules = [
  {
    title: "AI Governance in Singapore",
    tags: ["ai", "governance", "singapore", "policy"],
    markdown: `# AI Governance in Singapore

Singapore has positioned itself as a global leader in responsible AI development, balancing innovation with robust governance frameworks.

## Key Frameworks

The **Model AI Governance Framework** (2019, updated 2020) provides practical guidance for organisations deploying AI. It emphasises:

- **Explainability** — users should understand how AI decisions affect them
- **Transparency** — organisations should disclose AI use
- **Fairness** — AI systems should not discriminate
- **Human oversight** — humans should remain accountable for AI decisions

See also: [[AI Verify]] for Singapore's testing toolkit.

## Regulatory Approach

Singapore takes a "light touch" approach — guidelines rather than hard regulation. This contrasts with the EU's [[AI Act Overview]] which mandates compliance through law.

The Infocomm Media Development Authority (IMDA) leads AI governance efforts, working alongside the Personal Data Protection Commission (PDPC).

## Why It Matters

As AI becomes embedded in healthcare, finance, and public services, governance frameworks help ensure these systems are:

1. Safe and reliable
2. Fair and non-discriminatory
3. Transparent and explainable
4. Privacy-preserving

For a deeper look at verification, see [[AI Verify]].
`,
  },
  {
    title: "AI Verify",
    tags: ["ai", "testing", "singapore", "verification"],
    markdown: `# AI Verify

AI Verify is Singapore's AI governance testing framework and software toolkit, launched by IMDA in 2022. It is the world's first AI governance testing framework.

## What It Does

AI Verify allows companies to **self-assess** their AI systems against internationally recognised governance principles through:

- **Technical tests** — quantitative checks for fairness, robustness, and explainability
- **Process checks** — governance questionnaires about organisational practices

## How It Works

1. Upload your AI model and test dataset
2. Select governance principles to test against
3. Run automated technical tests
4. Complete process check questionnaires
5. Generate a report showing compliance levels

## Open Source

AI Verify was open-sourced in June 2023, allowing the global community to contribute. The foundation governing the project includes members from major tech companies.

## Connection to Governance

AI Verify operationalises the principles in [[AI Governance in Singapore]]. While the governance framework says *what* to do, AI Verify helps you *measure* whether you're doing it.

For comparison with other regulatory approaches, see [[AI Act Overview]] and [[Responsible AI Principles]].
`,
  },
  {
    title: "AI Act Overview",
    tags: ["ai", "regulation", "eu", "policy"],
    markdown: `# EU AI Act Overview

The EU AI Act is the world's first comprehensive AI regulation, adopted in March 2024. It takes a **risk-based approach** to regulating AI systems.

## Risk Categories

| Risk Level | Examples | Requirements |
|---|---|---|
| Unacceptable | Social scoring, real-time biometric surveillance | **Banned** |
| High | Healthcare AI, hiring tools, credit scoring | Conformity assessments, human oversight, transparency |
| Limited | Chatbots, deepfakes | Transparency obligations |
| Minimal | Spam filters, AI in games | No requirements |

## Key Dates

- **2024** — Act adopted
- **2025** — Bans on unacceptable-risk AI take effect
- **2026** — Full enforcement for high-risk systems

## Comparison with Singapore

Unlike [[AI Governance in Singapore]], which relies on voluntary frameworks, the EU AI Act is **mandatory** with significant penalties (up to 7% of global turnover).

Both approaches share common [[Responsible AI Principles]] but differ in enforcement mechanisms.

## Impact on Global Companies

Any company offering AI services to EU citizens must comply, regardless of where the company is based. This "Brussels Effect" is pushing global AI governance standards upward.
`,
  },
  {
    title: "Responsible AI Principles",
    tags: ["ai", "ethics", "principles", "foundations"],
    markdown: `# Responsible AI Principles

Responsible AI refers to the practice of designing, developing, and deploying AI systems in ways that are ethical, transparent, and accountable.

## Core Principles

### Fairness
AI systems should treat all people equitably and not discriminate based on race, gender, age, or other protected characteristics.

### Transparency
Organisations should be open about when and how they use AI. Users should know when they're interacting with an AI system.

### Explainability
AI decisions should be understandable to the people they affect. "Black box" models should be avoided in high-stakes decisions.

### Accountability
There must be clear human responsibility for AI outcomes. The system's creators and deployers should be answerable.

### Privacy
AI systems should respect data protection principles and minimise data collection to what is necessary.

### Safety & Robustness
AI systems should be reliable, secure, and resistant to adversarial attacks or unexpected inputs.

## Frameworks That Apply These Principles

- [[AI Governance in Singapore]] — voluntary guidelines
- [[AI Act Overview]] — mandatory regulation (EU)
- [[AI Verify]] — testing toolkit to measure compliance

## Getting Started

If you're building AI systems, start with:
1. Map which principles apply to your use case
2. Assess current compliance gaps
3. Implement technical and process safeguards
4. Test using tools like [[AI Verify]]
5. Document and disclose your AI governance practices
`,
  },
  {
    title: "Machine Learning Fundamentals",
    tags: ["ml", "foundations", "technical"],
    markdown: `# Machine Learning Fundamentals

Machine learning (ML) is a subset of AI where systems learn patterns from data rather than being explicitly programmed.

## Types of Machine Learning

### Supervised Learning
The model learns from labelled examples. Given inputs and known outputs, it learns the mapping function.

**Examples:** spam detection, image classification, credit scoring

### Unsupervised Learning
The model finds patterns in unlabelled data without predefined categories.

**Examples:** customer segmentation, anomaly detection, topic modelling

### Reinforcement Learning
The model learns by interacting with an environment and receiving rewards or penalties.

**Examples:** game playing, robotics, recommendation systems

## Key Concepts

- **Training data** — the dataset used to teach the model
- **Features** — input variables the model uses to make predictions
- **Labels** — the correct answers in supervised learning
- **Overfitting** — when a model memorises training data but fails on new data
- **Bias** — systematic errors that can lead to unfair outcomes (see [[Responsible AI Principles]])

## Why Governance Matters for ML

ML models can inherit biases from training data, make opaque decisions, and behave unpredictably on edge cases. This is why frameworks like [[AI Governance in Singapore]] exist — to ensure ML-powered systems meet safety and fairness standards.

Understanding these technical fundamentals helps you appreciate why [[AI Verify]] tests for specific properties like fairness and robustness.
`,
  },
];

async function seed() {
  console.log("Seeding modules...");

  for (const mod of seedModules) {
    const id = nanoid();
    const slug = slugify(mod.title);

    // For seed, we store a placeholder blob URL (content is in the DB for dev)
    // In production, this would be a real Blob URL
    const fakeBlobUrl = `https://placeholder.blob.vercel-storage.com/modules/${slug}.mdx`;

    await db.insert(schema.modules).values({
      id,
      slug,
      title: mod.title,
      tags: mod.tags,
      mdxBlobUrl: fakeBlobUrl,
      frontmatter: { title: mod.title, tags: mod.tags },
      createdBy: CREATOR_ID,
      updatedAt: new Date(),
    }).onConflictDoNothing();

    // Extract and insert wikilinks
    const links = extractWikilinks(mod.markdown);
    if (links.length > 0) {
      await db.delete(schema.moduleLinks).where(
        require("drizzle-orm").eq(schema.moduleLinks.fromId, id)
      );
      await db.insert(schema.moduleLinks).values(
        links.map((l) => ({ fromId: id, toSlug: l.slug, label: l.label }))
      ).onConflictDoNothing();
    }

    console.log(`  ✓ ${mod.title} (${links.length} links)`);
  }

  console.log("Done! Seeded", seedModules.length, "modules.");
}

seed().catch(console.error);
