import re


def sheet_export_filename(name: str) -> str:
    safe_name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip(" .")
    return f"{safe_name or 'sheet'}.xlsx"
