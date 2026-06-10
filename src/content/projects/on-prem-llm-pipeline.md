---
title: "On-Prem LLM Deployment Pipeline"
blurb: "CI/CD automation that deploys LLMs to office workstations with vLLM — production-grade deployment culture for on-prem AI."
tags: ["Python", "vLLM", "Jenkins", "CI/CD"]
featured: true
date: 2025-09-01
---

## Problem

Deploying LLMs to local workstations was manual and inconsistent — every deployment was a one-off, with no repeatable process and no visibility into what was running where.

## Approach

Built an automated CI/CD pipeline that treats on-prem workstations like a production fleet: versioned model rollouts served through vLLM, health checks, and clean rollback paths. Deployment time dropped from ad-hoc manual work to a predictable, orchestrated process — and it introduced a production-grade deployment culture across the org.
