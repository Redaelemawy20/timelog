from django.contrib import admin

from .models import LogEntry, LogEntryRun, Sheet, SheetRepo


@admin.register(Sheet)
class SheetAdmin(admin.ModelAdmin):
    list_display = ("name", "updated_at")
    search_fields = ("name",)


@admin.register(SheetRepo)
class SheetRepoAdmin(admin.ModelAdmin):
    list_display = ("owner", "name", "sheet")


@admin.register(LogEntryRun)
class LogEntryRunAdmin(admin.ModelAdmin):
    list_display = ("sheet", "range_start", "range_end", "status", "created_at")


@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    list_display = ("project", "period_start", "sheet", "run_id")
    search_fields = ("project", "task")
