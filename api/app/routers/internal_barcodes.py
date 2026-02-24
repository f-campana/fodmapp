from __future__ import annotations

from fastapi import APIRouter, Depends, Header, Request

from app.auth import require_barcode_admin
from app.models import BarcodeLinkMutationRequest, BarcodeLinkMutationResponse
from app.services.barcode_service import BarcodeService

router = APIRouter(
    prefix="/v0/internal",
    tags=["barcodes-internal"],
    dependencies=[Depends(require_barcode_admin)],
)


def _get_service(request: Request) -> BarcodeService:
    return request.app.state.barcode_service


@router.put("/barcodes/{code}/link", response_model=BarcodeLinkMutationResponse, include_in_schema=False)
def set_manual_barcode_link(
    code: str,
    body: BarcodeLinkMutationRequest,
    request: Request,
    x_actor: str = Header(..., alias="X-Actor", min_length=1),
) -> BarcodeLinkMutationResponse:
    payload = _get_service(request).set_manual_link(code, body.food_slug, x_actor)
    return BarcodeLinkMutationResponse(**payload)


@router.delete("/barcodes/{code}/link", response_model=BarcodeLinkMutationResponse, include_in_schema=False)
def clear_manual_barcode_link(
    code: str,
    request: Request,
    x_actor: str = Header(..., alias="X-Actor", min_length=1),
) -> BarcodeLinkMutationResponse:
    payload = _get_service(request).clear_manual_link(code, x_actor)
    return BarcodeLinkMutationResponse(**payload)
