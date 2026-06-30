from __future__ import annotations

import re


CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
MULTISPACE = re.compile(r"[ \t]{2,}")


def clean_text(value: str, *, max_length: int) -> str:
    cleaned = CONTROL_CHARS.sub("", value).replace("\r\n", "\n").replace("\r", "\n")
    cleaned = "\n".join(MULTISPACE.sub(" ", line).strip() for line in cleaned.split("\n"))
    return cleaned.strip()[:max_length]
