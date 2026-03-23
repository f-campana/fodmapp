from __future__ import annotations

from typing import Tuple


class BarcodeValidationError(ValueError):
    pass


def normalize_retail_barcode(raw_code: str) -> Tuple[str, str]:
    code = raw_code.strip()
    if not code:
        raise BarcodeValidationError("Barcode must not be empty")
    if not code.isdigit():
        raise BarcodeValidationError("Barcode must contain digits only")

    if len(code) == 8:
        if not _is_valid_check_digit(code):
            raise BarcodeValidationError("Invalid EAN-8 check digit")
        return code, "EAN8"

    if len(code) == 12:
        if not _is_valid_check_digit(code):
            raise BarcodeValidationError("Invalid UPC-A check digit")
        return f"0{code}", "EAN13"

    if len(code) == 13:
        if not _is_valid_check_digit(code):
            raise BarcodeValidationError("Invalid EAN-13 check digit")
        return code, "EAN13"

    raise BarcodeValidationError("Barcode must be 8, 12, or 13 digits")


def _is_valid_check_digit(code: str) -> bool:
    if len(code) < 2:
        return False
    expected = _compute_check_digit(code[:-1])
    return int(code[-1]) == expected


def _compute_check_digit(payload: str) -> int:
    digits = [int(char) for char in payload]
    if len(payload) % 2 == 0:
        odd_sum = sum(digits[::2])
        even_sum = sum(digits[1::2])
    else:
        odd_sum = sum(digits[1::2])
        even_sum = sum(digits[::2])

    total = (odd_sum * 3) + even_sum
    return (10 - (total % 10)) % 10
