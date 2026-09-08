import json
from typing import Dict, Any, List
from openai import AsyncOpenAI
from app.core.config import get_env_variable, DEFAULT_OPENAI_MODEL
from app.core.database import get_db_connection
from app.models.schemas import CurhatResponse, SmartExpenseParseResponse, ParsedExpenseItem

CURHAT_SYSTEM_PROMPT = """Kamu adalah 'Teman Curhat & Companion' yang hangat, berempati tinggi, tenang, dan suportif.
Pengguna adalah seorang developer / individu yang mungkin sedang menghadapi kejenuhan koding (burnout), tekanan pekerjaan, masalah keuangan, atau sekadar ingin berbagi cerita sehari-hari.

Prinsip komunikasimu:
1. Dengarkan dengan tulus, validasi perasaan pengguna tanpa langsung menghakimi.
2. Gunakan bahasa Indonesia yang santai, akrab, hangat, dan menenangkan (seperti sahabat karib).
3. Jika pengguna sedang sedih atau cemas, berikan kenyamanan emosional terlebih dahulu sebelum memberikan saran logis.
4. Apabila pengguna merayakan pencapaian (misal commit GitHub atau hemat uang), ikutlah bergembira dan apresiasi usahanya!
5. Jaga jawaban tetap terfokus, tidak bertele-tele, dan terasa manusiawi.
"""

EXPENSE_EXTRACTION_SYSTEM_PROMPT = """Ekstrak pengeluaran atau pemasukan dari kalimat pengguna menjadi JSON terstruktur.
Gunakan format JSON persis seperti ini:
{
  "items": [
    {
      "entry_type": "expense" atau "income",
      "amount": angka nominal dalam float/integer (contoh: 25000 untuk 25rb/25k, 3500000 untuk 3.5jt),
      "category": salah satu dari ["Makanan", "Transportasi", "Tagihan", "Belanja", "Hiburan", "Kesehatan", "Pendidikan", "Gaji", "Investasi", "Lain-lain"],
      "note": "penjelasan singkat item"
    }
  ],
  "summary": "Ringkasan singkat transaksi yang terdeteksi"
}
Kembalikan HANYA format JSON tanpa teks pembuka atau markdown tambahan.
"""

def resolve_openai_client() -> AsyncOpenAI | None:
    api_key = get_env_variable("OPENAI_API_KEY")
    if not api_key:
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT config_value FROM system_settings WHERE config_key = 'openai_api_key'")
            row = cursor.fetchone()
            if row and row["config_value"]:
                api_key = row["config_value"]
    
    if not api_key:
        return None
    return AsyncOpenAI(api_key=api_key)

async def generate_curhat_reply(session_id: str, incoming_message: str) -> CurhatResponse:
    openai_client = resolve_openai_client()
    
    # Save user message to database
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            INSERT INTO chat_messages (session_id, sender_role, message_body)
            VALUES (?, 'user', ?)
        """, (session_id, incoming_message))

    if not openai_client:
        fallback_reply = (
            "Halo! Aku senang kamu menyapa. Namun, OpenAI API Key belum terpasang di Pengaturan. "
            "Buka ikon gerigi Pengaturan di pojok kanan atas dan masukkan API Key kamu agar kita bisa ngobrol bebas ya!"
        )
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO chat_messages (session_id, sender_role, message_body)
                VALUES (?, 'assistant', ?)
            """, (session_id, fallback_reply))
        return CurhatResponse(
            reply_content=fallback_reply,
            sentiment_tag="neutral",
            suggested_action="Buka Pengaturan untuk menambahkan OpenAI API Key"
        )

    # Fetch last 8 messages for context
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT sender_role, message_body
            FROM chat_messages
            WHERE session_id = ?
            ORDER BY id DESC
            LIMIT 8
        """, (session_id,))
        rows = cursor.fetchall()
        
    conversation_history = [
        {"role": row["sender_role"], "content": row["message_body"]}
        for row in reversed(rows)
    ]

    messages_payload = [{"role": "system", "content": CURHAT_SYSTEM_PROMPT}] + conversation_history

    try:
        completion = await openai_client.chat.completions.create(
            model=DEFAULT_OPENAI_MODEL,
            messages=messages_payload,
            temperature=0.75,
            max_tokens=600
        )
        assistant_reply = completion.choices[0].message.content or "Aku di sini mendengarkanmu..."
    except Exception as api_error:
        assistant_reply = f"Maaf, sedang ada kendala menghubungi model OpenAI: {str(api_error)}"

    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            INSERT INTO chat_messages (session_id, sender_role, message_body)
            VALUES (?, 'assistant', ?)
        """, (session_id, assistant_reply))

    return CurhatResponse(
        reply_content=assistant_reply,
        sentiment_tag="supportive",
        suggested_action=None
    )

import re

CATEGORY_KEYWORDS = {
    "Makanan": ["makan", "minum", "kopi", "teh", "nasi", "bakso", "ayam", "geprek", "sate", "mie", "warteg", "sarapan", "cemilan", "snack", "resto", "kafe"],
    "Transportasi": ["bensin", "pertalite", "pertamax", "ojol", "gojek", "grab", "maxim", "parkir", "tol", "kereta", "krl", "bus", "tiket", "ongkir"],
    "Tagihan": ["listrik", "pln", "air", "pdam", "wifi", "indihome", "internet", "pulsa", "kuota", "paket data", "bpjs", "kontrakan", "sewa"],
    "Belanja": ["belanja", "shopee", "tokped", "tokopedia", "indomaret", "alfamart", "supermarket", "baju", "sepatu", "buku"],
    "Hiburan": ["nonton", "bioskop", "cinema", "game", "steam", "netflix", "spotify", "liburan", "jalan"],
    "Kesehatan": ["obat", "apotek", "dokter", "vitamin", "klinik", "rumah sakit"],
    "Gaji": ["gaji", "freelance", "honor", "bonus", "transferan", "proyek", "cuan", "dividen"]
}

def parse_indonesian_amount(raw_token: str) -> float:
    cleaned = raw_token.lower().replace("rp", "").strip()
    # Check for million suffix (jt / juta)
    if "jt" in cleaned or "juta" in cleaned:
        num_str = cleaned.replace("juta", "").replace("jt", "").replace(" ", "").replace(",", ".")
        try:
            return float(num_str) * 1_000_000
        except ValueError:
            return 0.0
            
    # Check for thousand suffix (rb / ribu / k)
    if "rb" in cleaned or "ribu" in cleaned or "k" in cleaned:
        num_str = cleaned.replace("ribu", "").replace("rb", "").replace("k", "").replace(" ", "").replace(",", ".")
        try:
            return float(num_str) * 1_000
        except ValueError:
            return 0.0
            
    # Standard numbers: remove thousand separator dots, replace comma with dot
    plain = cleaned.replace(".", "").replace(",", ".").replace(" ", "")
    try:
        return float(plain)
    except ValueError:
        return 0.0

def extract_expenses_heuristically(raw_text: str) -> List[ParsedExpenseItem]:
    phrases = re.split(r",|\bdan\b|\blalu\b|\bserta\b|\bsama\b|\bterus\b|\n", raw_text, flags=re.IGNORECASE)
    extracted_records: List[ParsedExpenseItem] = []
    
    number_pattern = re.compile(r"(?:rp\.?\s*)?(\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|ribu|k)?|\d{4,})", re.IGNORECASE)

    for phrase in phrases:
        phrase_clean = phrase.strip()
        if not phrase_clean:
            continue
            
        match = number_pattern.search(phrase_clean)
        if not match:
            continue
            
        matched_token = match.group(0)
        parsed_value = parse_indonesian_amount(matched_token)
        if parsed_value <= 0:
            continue

        assigned_category = "Lain-lain"
        lower_phrase = phrase_clean.lower()
        for cat_name, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in lower_phrase for kw in keywords):
                assigned_category = cat_name
                break

        is_income = any(inc_word in lower_phrase for inc_word in ["gaji", "dapat", "terima", "bonus", "transfer dari", "cuan", "proyek"])
        entry_type = "income" if is_income or assigned_category == "Gaji" else "expense"
        
        extracted_records.append(ParsedExpenseItem(
            entry_type=entry_type,
            amount=parsed_value,
            category=assigned_category,
            note=phrase_clean
        ))

    return extracted_records

async def parse_expense_from_text(raw_text: str) -> SmartExpenseParseResponse:
    openai_client = resolve_openai_client()
    
    # Fallback to local heuristic extractor if OpenAI is not configured
    if not openai_client:
        local_results = extract_expenses_heuristically(raw_text)
        if local_results:
            return SmartExpenseParseResponse(
                extracted_items=local_results,
                detected_summary=f"Berhasil mendeteksi {len(local_results)} transaksi otomatis (Mode Cerdas Lokal)."
            )
        return SmartExpenseParseResponse(
            extracted_items=[],
            detected_summary="Tidak menemukan nominal pengeluaran. Contoh format: 'Beli nasi goreng 25rb dan bensin 30rb'."
        )

    try:
        completion = await openai_client.chat.completions.create(
            model=DEFAULT_OPENAI_MODEL,
            messages=[
                {"role": "system", "content": EXPENSE_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": raw_text}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        raw_json_result = completion.choices[0].message.content
        parsed_payload = json.loads(raw_json_result)
        
        extracted_items = [
            ParsedExpenseItem(
                entry_type=item.get("entry_type", "expense"),
                amount=float(item.get("amount", 0)),
                category=item.get("category", "Lain-lain"),
                note=item.get("note", "")
            )
            for item in parsed_payload.get("items", [])
            if float(item.get("amount", 0)) > 0
        ]
        
        return SmartExpenseParseResponse(
            extracted_items=extracted_items,
            detected_summary=parsed_payload.get("summary", f"{len(extracted_items)} transaksi berhasil dideteksi.")
        )
    except Exception:
        local_results = extract_expenses_heuristically(raw_text)
        if local_results:
            return SmartExpenseParseResponse(
                extracted_items=local_results,
                detected_summary=f"Berhasil mendeteksi {len(local_results)} transaksi (Fallback Lokal)."
            )
        return SmartExpenseParseResponse(
            extracted_items=[],
            detected_summary="Gagal memproses kalimat pengeluaran."
        )

