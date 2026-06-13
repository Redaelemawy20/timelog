from django.contrib import admin

from .models import Client, Sheet, SheetRepo, Sprint, SprintRepo


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "updated_at")
    search_fields = ("name",)


@admin.register(Sheet)
class SheetAdmin(admin.ModelAdmin):
    list_display = ("name", "client", "updated_at")
    search_fields = ("name", "client__name")
    list_filter = ("client",)


@admin.register(SheetRepo)
class SheetRepoAdmin(admin.ModelAdmin):
    list_display = ("owner", "name", "sheet")


@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ("sheet", "range_start", "range_end", "created_at")


@admin.register(SprintRepo)
class SprintRepoAdmin(admin.ModelAdmin):
    list_display = ("project", "sheet", "sprint_id")
    search_fields = ("project",)
