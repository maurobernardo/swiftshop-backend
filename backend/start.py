"""
Script de inicialização para produção.
Configura o servidor FastAPI com variáveis de ambiente.
"""
import os
import uvicorn

if __name__ == "__main__":
    # Porta do ambiente ou padrão 8888
    port = int(os.environ.get("PORT", 8888))
    # Host padrão 0.0.0.0 para aceitar conexões externas
    host = os.environ.get("HOST", "0.0.0.0")
    
    # Executar servidor
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=False,  # Desabilitar reload em produção
        log_level="info"
    )

