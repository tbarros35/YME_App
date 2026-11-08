# 📋 Manual de Passagem de Pasta e Gestão do YME Portal (Produção)

> **Destinatários:** Direção da YME, Executive Board, Departamento de Digital Development / TI  
> **Objetivo:** Garantir a continuidade do YME Portal ano após ano, detalhando como aceder ao servidor, aplicar atualizações, realizar backups da base de dados e passar a gestão para a próxima equipa sem perda de dados.

---

## 📌 1. Arquitetura em Produção

O **YME Portal** está alojado na **Oracle Cloud Infrastructure (OCI)** na região **Spain Central (Madrid)** ao abrigo do plano **Always Free (0€/mês vitalício)**.

A aplicação corre de forma contentorizada e isolada com **Docker Compose**:
* **`yme_frontend_prod` (Nginx):** Serve a interface React/Vite compilada e atua como Reverse Proxy seguro para a API interna e ficheiros anexos. Portas expostas: `80` (HTTP) e `443` (HTTPS).
* **`yme_backend_prod` (Node.js + Prisma):** API REST em Express. Não está exposta diretamente para a internet, comunicando apenas com a rede interna do Docker.
* **`yme_postgres_prod` (PostgreSQL 16):** Base de dados relacional oficial da associação (membros, avaliações SAD, saldos, tickets). Porta 5432 não exposta ao exterior.
* **Volumes Persistentes:**
  * `yme-app_postgres_data_prod`: Guarda os ficheiros físicos da base de dados.
  * `yme-app_backend_uploads_prod`: Guarda os comprovativos e relatórios PDF enviados pelos membros.

---

## 🔑 2. Acessos Oficiais

| Recurso | Detalhes |
|---|---|
| **Endereço Web** | `http://79.72.63.191` |
| **Utilizador Admin Inicial** | `admin@yme.pt` |
| **Utilizador SSH do Servidor** | `opc` |
| **IP do Servidor** | `79.72.63.191` |
| **Localização do Código no Servidor** | `/home/opc/yme-app` |

### Como aceder ao servidor via terminal (SSH):
Com o ficheiro da chave privada (`.key` descarregado na criação da máquina):
```powershell
ssh -i "caminho\para\ssh-key.key" opc@79.72.63.191
```

---

## 🔄 3. Passagem de Pasta para o Próximo Mandato

Como a conta da Oracle Cloud foi criada com o **email geral da associação**, a passagem de pasta é extremamente simples e não requer recriar o servidor do zero:

### Método A: Transferência de Acesso (Recomendado e Imediato)
1. **Email Institucional:** A nova direção assume o acesso ao email geral da YME.
2. **Oracle Cloud Console:** 
   * A nova direção acede a [cloud.oracle.com](https://cloud.oracle.com) com o nome da conta (`yme`) e o email institucional.
   * Alternativamente, o responsável cessante pode ir a **Identity & Security ➔ Domains ➔ Users ➔ Create User** e adicionar o email do novo responsável de TI como Administrador da conta.
3. **Chave SSH:** Entregar à nova equipa o ficheiro da chave SSH privada (`.key`) para que possam ligar-se ao servidor sempre que necessário.
4. **Pronto!** O servidor continua a correr ininterruptamente, sem custos e sem migrações de dados.

---

## 💾 4. Procedimento de Backup e Restauro da Base de Dados

Mesmo com o servidor Always Free, recomenda-se realizar uma cópia de segurança semestral ou anual dos dados da associação.

### 📤 1. Fazer Backup no Servidor:
Ligar ao servidor via SSH e executar:
```bash
# 1.1 Criar pasta de backups
mkdir -p ~/backups && cd ~/backups

# 1.2 Exportar todo o SQL da base de dados
docker exec yme_postgres_prod pg_dump -U yme_admin yme_portal_prod_db > yme_db_backup_$(date +%Y%m%d).sql

# 1.3 Compactar ficheiros carregados pelos membros
tar -czvf yme_uploads_backup_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/yme-app_backend_uploads_prod/_data

# 1.4 Fazer download dos ficheiros para o Google Drive institucional
```

### 📥 2. Restaurar Backup (se necessário num servidor novo):
```bash
cat yme_db_backup_XXXX.sql | docker exec -i yme_postgres_prod psql -U yme_admin -d yme_portal_prod_db
```

---

## 🚀 5. Como Atualizar o Código em Produção

Sempre que a equipa de Digital Development fizer melhorias ou correções no repositório GitHub (`main`):

1. Ligar ao servidor via SSH:
   ```bash
   ssh -i "caminho/para/chave.key" opc@79.72.63.191
   ```
2. Puxar as novidades do Git e reconstruir os contentores:
   ```bash
   cd ~/yme-app
   git pull origin main
   docker compose -f docker-compose.prod.yml up -d --build
   ```
O Docker faz o build apenas das alterações, corre migrações do Prisma automaticamente e reinicia a app em segundos, sem perder quaisquer dados da base de dados.

---

## 🌐 6. Associar Domínio Personalizado (Ex: `portal.yme.pt` ou `app.yme.pt`)

Quando a YME desejar utilizar um domínio em vez do endereço IP:

1. No gestor de DNS do domínio da YME (ex: Cloudflare, cPanel, etc.), criar um registo tipo **`A`**:
   * **Nome:** `portal` (ou `app`)
   * **Destino/IP:** `79.72.63.191`
2. No servidor, instalar o Certbot para ativar HTTPS gratuito com certificado SSL automático:
   ```bash
   sudo dnf install -y epel-release
   sudo dnf install -y certbot
   ```
3. Atualizar o ficheiro `nginx.conf` com o nome do domínio e os certificados SSL.
