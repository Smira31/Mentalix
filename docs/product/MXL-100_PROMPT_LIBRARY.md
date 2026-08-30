# MXL-100 — Mentalix prompt library

## Prompt record

Every prompt is stored with `prompt_id`, purpose, target surface, input contract, output contract, safety boundaries, version, owner and evaluation notes. Prompts must request one bounded next step when appropriate and distinguish fact, interpretation and unknown.

| Family | Use | Must not do |
| --- | --- | --- |
| Clarify | name situation and unknowns | diagnose or over-question |
| Compass | compare examples and form a hypothesis | state causality as fact |
| Step | reduce a task to 2–10 minutes | pressure or shame |
| Review | inspect result and choose next action | imply failure for skipping |

No prompt may silently add memory, change persona, collect sensitive data or promise confidentiality. Version changes require regression fixtures for safety, refusal, empty context and user correction.
