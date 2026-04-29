import os

from openai import OpenAI

from .models import Sprint


class SummaryGenerationConfigError(Exception):
    pass


class SummaryGenerationUpstreamError(Exception):
    pass


def _build_prompt(sprint: Sprint) -> str:
    parts: list[str] = [
        "Create a concise sprint summary based on these updates.",
        f"Sprint range: {sprint.range_start} to {sprint.range_end}",
        "",
        "Repository updates:",
    ]
    for repo in sprint.sprint_repos.all():
        repo_name = repo.sheet_repo.display_name or f"{repo.sheet_repo.owner}/{repo.sheet_repo.name}"
        commit_messages = (repo.commit_messages or "").strip()
        notes = (repo.notes or "").strip()
        parts.append(f"- Repo: {repo_name}")
        if notes:
            parts.append(f"  Notes: {notes}")
        if commit_messages:
            parts.append("  Commits:")
            for line in commit_messages.splitlines():
                line = line.strip()
                if line:
                    parts.append(f"    - {line}")
        else:
            parts.append("  Commits: None")
    parts.append("")
    parts.append("Return only the final summary text.")
    return "\n".join(parts)


def generate_sprint_summary_text(sprint: Sprint) -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise SummaryGenerationConfigError("OPENAI_API_KEY is not configured.")

    model = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4.1-mini").strip() or "gpt-4.1-mini"
    prompt = _build_prompt(sprint)

    try:
        client = OpenAI(api_key=api_key)
        response = client.responses.create(
            model=model,
            input=prompt,
            temperature=0.2,
        )
    except Exception as exc:
        raise SummaryGenerationUpstreamError("Failed to generate sprint summary.") from exc

    summary = (response.output_text or "").strip()
    if not summary:
        raise SummaryGenerationUpstreamError("Summary response is empty.")
    return summary
