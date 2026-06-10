---
title: "Autoscaling Chatbot Platform"
blurb: "Chatbot backend serving hundreds of thousands of users with autoscaling infrastructure."
tags: ["Python", "Google Cloud", "Autoscaling"]
featured: true
date: 2023-11-01
---

## Problem

Conversational traffic is spiky. A chatbot serving hundreds of thousands of users needs infrastructure that scales out under load and scales back when idle — without dropping conversations.

## Approach

Built the backend on autoscaling infrastructure with load-aware scaling policies, graceful connection draining, and fallback responses when downstream models are saturated. The system stays responsive under real-world load patterns, not just ideal ones.
