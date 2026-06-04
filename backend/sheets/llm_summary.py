import os

from openai import OpenAI

from .models import Sprint, SprintConversationMessage

INITIAL_USER_MESSAGE = "Generate a summary from the sprint commits."


class SummaryGenerationConfigError(Exception):
    pass


class SummaryGenerationUpstreamError(Exception):
    pass


def _build_system_prompt(sprint: Sprint) -> str:
    active_repos = [
        repo for repo in sprint.sprint_repos.all()
        if (repo.commit_messages or "").strip()
    ]

    multiple_active_projects = len(active_repos) > 1

    parts: list[str] = [
        "Your job is to convert raw commit messages into a natural, client-friendly summary that focuses on concrete outcomes and actual changes.",
        "",
        "Goal",
        "Write a summary that helps the client understand exactly what changed in their application and match it with their Figma designs.",
        "",
        "Analysis Process",
        "1. Read all commit messages carefully to understand what was changed",
        "2. Group related commits that touch the same page/feature into one segment",
        "3. Identify the most impactful changes (new features, major fixes, visible improvements)",
        "4. Sort segments by importance: most significant changes first, minor updates last",
        "",
        "Writing Rules - Be Specific and Natural",
        "Output 3–5 segments separated by -",
        "Use past tense and natural human language",
        "Start segments with action verbs or natural phrases like: 'Added', 'Fixed', 'Updated', 'Changed', 'Removed', 'For [page name] I added...', 'On [page name] now...', '[Page name] now...'",
        "Always mention specific page names, screen names, or component names (e.g., 'Login page', 'Dashboard header', 'Profile settings', 'Appointments page')",
        "Focus on actual visual or functional changes, not generic improvements",
        "Avoid vague words like 'enhanced', 'improved', 'optimized', 'updated' without explaining what specifically changed",
        "Describe the actual outcome (e.g., not 'improved performance' but 'page loads 2x faster' or 'animations run smoother')",
        "IMPORTANT: Group related commits that affect the same page/feature into ONE segment (e.g., if 5 commits touch Dashboard, combine them into one Dashboard segment)",
        "IMPORTANT: Sort segments by impact - most important changes first (new features > major fixes > UI improvements > minor tweaks)",
        "Prioritize visible changes that clients can see and test",
        "",
        "What to Avoid",
        "Do not use: refactor, component, API, schema, hooks, props, CSS, TypeScript, Redux, state management",
        "Do not use generic phrases: 'enhanced user experience', 'improved overall performance', 'better functionality'",
        "Do not mention: commit hashes, branches, PRs, merges, build processes, dependencies, technical debt",
        "",
        "don't add empty lines or spaces between segments",
        "What to Include",
        "Specific page or screen names that match Figma designs",
        "Actual features added or changed (e.g., 'Added search bar to Products page', 'Changed Save button to green on Checkout')",
        "Visible improvements (e.g., 'Fixed spacing on mobile view', 'Aligned buttons on Settings screen')",
        "New interactions (e.g., 'Clicking username now opens profile menu', 'Added swipe gesture to close modal')",
        "Bug fixes that users notice (e.g., 'Fixed date picker showing wrong month', 'Resolved crash when uploading images')",
        "",
        "Output Format (strict) start each segment with bullet point",
        "(most of times use this) * Action verb + specific page/feature + what changed ",
        "* Or: For [page name] + action + outcome",
        "* Or: [Page name] + now/can/shows + specific change",
        "",
        "Conversation behavior",
        "When the user asks for refinements (shorter, stronger tone, different style, etc.), revise your latest summary accordingly while keeping the same formatting rules.",
        "Reply with only the revised summary text unless the user asks a clarifying question.",
        "",
    ]

    if multiple_active_projects:
        parts.extend([
            "CRITICAL: Multiple Projects Grouping",
            "Since this sprint contains multiple active projects, you MUST:",
            "1. Group all segments by project name",
            "2. Use this exact format for each project group:",
            "   [Project Name]",
            "   * segment 1",
            "   * segment 2",
            "   ---------------",
            "3. Separate each project group with a dashed line (---------------) that works well in Excel",
            "4. Do NOT mix segments from different projects",
            "5. Each project's segments should be grouped together under its project name",
            "6. The dashed line (---------------) must be on its own line after each project's segments",
            "",
            "Example Output for Multiple Projects:",
            "[Frontend]",
            "* Added login form with email validation",
            "* Fixed dashboard layout on mobile",
            "---------------",
            "[Backend]",
            "* Added user authentication endpoint",
            "* Fixed data export timing issue",
            "---------------",
            "",
        ])

    parts.extend([
        "Examples of Good vs Bad",
        "Bad: 'Enhanced dashboard functionality'",
        "Good: 'Added activity timeline to Dashboard showing last 30 days'",
        "Good: 'For Dashboard  added real-time notifications'",
        "Good: 'Dashboard now displays user stats and recent activity'",
        "",
        "Bad: 'Improved user profile'",
        "Good: 'Added bio section and social links to Profile page'",
        "Good: 'For Profile page added photo upload with preview'",
        "",
        "Bad: 'Updated settings'",
        "Good: 'Reorganized Settings page with tabs for Account, Privacy, and Notifications'",
        "Good: 'For Appointments page  added calendar view and filtering'",
        "",
        "Example of Grouping",
        "If commits say: 'add button', 'style button', 'fix button click', 'update button text' all for Login page",
        "Good: 'For Login page added new Submit button with proper styling and click handling'",
        "Bad: Four separate segments about the same button",
        "",
        "Extra Instructions",
        "Mix your sentence structures naturally (use verbs, 'For X I...', 'X now...')",
        "Analyze all commits first, then group by page/feature before writing segments",
        "Rank importance: New pages/features > Major functionality changes > Bug fixes that users notice > Visual/UI updates > Minor tweaks",
        "If 10+ commits touch the same page, combine them into one comprehensive segment about that page",
        "If work is substantial, use 5–8 segments with specific details",
        "If minimal work, use 1-3 compact but specific segments",
        "Skip internal-only changes unless they affect what users see",
        "",
        "Sprint commit data:",
        "",
    ])

    for repo in sprint.sprint_repos.all():
        repo_name = repo.sheet_repo.display_name or f"{repo.sheet_repo.owner}/{repo.sheet_repo.name}"
        commit_messages = (repo.commit_messages or "").strip()
        notes = (repo.notes or "").strip()
        parts.append(f"Repo: {repo_name}")
        if notes:
            parts.append(f"Notes: {notes}")
        if commit_messages:
            parts.append("Commits:")
            for line in commit_messages.splitlines():
                line = line.strip()
                if line:
                    parts.append(f"- {line}")
        else:
            parts.append("Commits: None")
        parts.append("")
    return "\n".join(parts)


def _build_api_input(
    system_prompt: str,
    history: list[SprintConversationMessage],
) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt},
    ]
    for message in history:
        messages.append({"role": message.role, "content": message.content})
    return messages


def generate_conversation_reply(
    sprint: Sprint,
    history: list[SprintConversationMessage],
) -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise SummaryGenerationConfigError("OPENAI_API_KEY is not configured.")

    model = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4.1-mini").strip() or "gpt-4.1-mini"
    system_prompt = _build_system_prompt(sprint)
    api_input = _build_api_input(system_prompt, history)

    try:
        client = OpenAI(api_key=api_key)
        response = client.responses.create(
            model=model,
            input=api_input,
            temperature=0.2,
        )
    except Exception as exc:
        raise SummaryGenerationUpstreamError("Failed to generate sprint summary.") from exc

    reply = (response.output_text or "").strip()
    if not reply:
        raise SummaryGenerationUpstreamError("Summary response is empty.")
    return reply
