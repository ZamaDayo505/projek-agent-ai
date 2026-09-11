"""
Voice proxy router — bridges the frontend to VOICEVOX engine (localhost:50021).
Provides a health-check and a speak endpoint that returns audio/wav.
"""
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

VOICEVOX_BASE = "http://127.0.0.1:50021"
TIMEOUT = 10.0

router = APIRouter(prefix="/voice", tags=["voice"])


class SpeakRequest(BaseModel):
    text: str
    speaker: int = 3  # default: ずんだもん


@router.get("/check")
async def check_voicevox():
    """Return 200 if VOICEVOX engine is reachable, 503 otherwise."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{VOICEVOX_BASE}/version")
        if res.status_code == 200:
            return {"available": True, "version": res.text.strip('"')}
    except Exception:
        pass
    raise HTTPException(status_code=503, detail="VOICEVOX engine not running")


@router.post("/speak")
async def speak(req: SpeakRequest):
    """
    Generate speech via VOICEVOX and return the WAV audio blob.
    Two-step VOICEVOX API: audio_query → synthesis.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is required")

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            # Step 1: generate audio query
            query_res = await client.post(
                f"{VOICEVOX_BASE}/audio_query",
                params={"text": req.text, "speaker": req.speaker},
            )
            query_res.raise_for_status()

            # Step 2: synthesize WAV
            synth_res = await client.post(
                f"{VOICEVOX_BASE}/synthesis",
                params={"speaker": req.speaker},
                content=query_res.content,
                headers={"Content-Type": "application/json"},
            )
            synth_res.raise_for_status()

        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=502, detail=f"VOICEVOX error: {exc.response.status_code}")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="VOICEVOX engine unreachable")

    return Response(content=synth_res.content, media_type="audio/wav")
