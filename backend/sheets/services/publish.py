from django.utils import timezone

from ..models import Sheet


def build_snapshot(sheet: Sheet) -> dict:
    sprints = (
        sheet.sprints.prefetch_related("sprint_repos__sheet_repo")
        .order_by("range_start")
        .all()
    )
    sprint_list = []
    total_hours = 0.0
    for sprint in sprints:
        projects = [
            repo.project
            for repo in sprint.sprint_repos.all()
            if repo.commit_messages and repo.commit_messages.strip()
        ]
        hours = float(sprint.time_hours) if sprint.time_hours else 0.0
        total_hours += hours
        sprint_list.append(
            {
                "range_start": str(sprint.range_start),
                "range_end": str(sprint.range_end),
                "summary": sprint.summary,
                "time_hours": str(sprint.time_hours) if sprint.time_hours else None,
                "projects": projects,
            }
        )
    return {
        "sheet_name": sheet.name,
        "client_name": sheet.client.name,
        "published_at": timezone.now().isoformat(),
        "total_hours": total_hours,
        "sprints": sprint_list,
    }


def publish_sheet(sheet: Sheet) -> Sheet:
    sheet.published_snapshot = build_snapshot(sheet)
    sheet.is_published = True
    sheet.published_at = timezone.now()
    sheet.save(update_fields=["published_snapshot", "is_published", "published_at"])
    return sheet


def unpublish_sheet(sheet: Sheet) -> Sheet:
    sheet.is_published = False
    sheet.save(update_fields=["is_published"])
    return sheet
