"""
Utilitários para gerenciamento de fuso horário
Moçambique usa CAT (Central Africa Time) = UTC+2
"""
from datetime import datetime, timedelta, timezone

# Fuso horário de Moçambique (CAT - Central Africa Time)
MOZAMBIQUE_TZ = timezone(timedelta(hours=2))

def now_moz() -> datetime:
    """
    Retorna a data/hora atual no fuso horário de Moçambique (UTC+2)
    """
    return datetime.now(MOZAMBIQUE_TZ)

def utc_to_moz(dt: datetime) -> datetime:
    """
    Converte uma data UTC para o fuso horário de Moçambique
    """
    if dt.tzinfo is None:
        # Se a data não tem timezone, assume UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(MOZAMBIQUE_TZ)

def format_moz_datetime(dt: datetime) -> str:
    """
    Formata uma data para exibição em português (Moçambique)
    """
    # Se a data não tem timezone, assume que já está no fuso de Moçambique
    if dt.tzinfo is None:
        moz_dt = dt
    else:
        moz_dt = utc_to_moz(dt)
    
    return moz_dt.strftime("%d/%m/%Y às %H:%M")



