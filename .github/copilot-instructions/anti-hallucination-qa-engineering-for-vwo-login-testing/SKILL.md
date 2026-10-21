---
name: Anti-Hallucination QA Engineering for VWO Login Testing
description: enforces deterministic, specification-grounded test case for login page
version: 1.0.0
author: user_3IqJXmoXi7z5x65rnAiokKj1btV
license: MIT
tags: [QA, AITesting, AntiHallucination, TestDesign, LoginValidation]
testingTypes: [e2e]
frameworks: [playwright]
languages: [typescript]
domains: [web, Mobile]
agents: [claude-code, cursor, github-copilot, Codex, Commandcode]
---

---

# My Skill: Input Framing & Boundary Definition

## Objective
Prevent the AI agent from relying on pre-trained parametric memory of generic login screens (e.g., assuming social login, CAPTCHA, or specific password rules).

## Implementation Rules
- Explicit Element Declarations: Feed the LLM a strict manifest of present UI selectors before requesting test scenarios.
- Scope Exclusion Declarations: Explicitly list forbidden features that do not exist on the specific VWO login variant under test.
---
## Applied Prompt Pattern
### VWO CONTEXT
- App Name: Visual Website Optimizer (VWO)
- Module: Authentication / Login Screen
- Base URL: https://app.vwo.com/login
---
## STRICT INVENTORY
The VWO login screen consists ONLY of:
1. Email Input (`id="login-email"`)
2. Password Input (`id="login-password"`)
3. Login Button (`id="login-submit"`)
4. "Forgot Password?" Link (`class="forgot-pwd"`)
5. Single Sign-On (SSO) Link (`id="sso-login"`)
---
## FORBIDDEN ASSUMPTIONS
DO NOT generate test cases referencing:
- Social Auth (Google, Slack, Microsoft)
- CAPTCHA / reCAPTCHA
- "Remember Me" checkbox
- "Show Password" eye icon/toggle
- Arbitrary account lockout limits (e.g., "Locked out after 3 attempts")
