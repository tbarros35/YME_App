# 📋 Manual de Passagem de Pasta e Transferência da Web App YME

> **Destinatários:** Direção da YME, Executive Board, Departamento de Digital Development / TI  
> **Objetivo:** Garantir a continuidade do YME Portal ano após ano, permitindo transferir todo o servidor, base de dados e ficheiros para a conta do próximo responsável sem perder dados e sem recomeçar do zero.

---

## 📌 1. Visão Geral da Arquitetura

O **YME Portal** corre de forma 100% isolada e contentorizada com **Docker Compose**:
- **Contentor 1 (`yme_postgres_prod`):** Base de dados PostgreSQL (membros, avaliações SAD, carteira YME, tickets, histórico).
- **Contentor 2 (`yme_backend_prod`):** API REST Node.js + Express + Prisma ORM.
- **Contentor 3 (`yme_frontend_prod`):** Aplicação React + Vite servida por servidor Web Nginx de alto rendimento.
- **Volumes Persistentes:**
  - `postgres_data_prod`: Guarda permanentemente todos os registos da base de dados.
  - `backend_uploads_prod`: Guarda os relatórios em PDF do SAD e comprovativos de reembolsos.

---

## 🚀 2. Método Recomendado: Transferência de Snapshot (DigitalOcean ➔ DigitalOcean)

Este é o método mais rápido e seguro quando o novo responsável também tem acesso aos créditos de estudante do **GitHub Student Developer Pack** (200\$ de crédito gratuito).

### ⏳ No Final do Mandato Atual (Responsável que sai):
1. Acede à tua conta em [cloud.digitalocean.com](https://cloud.digitalocean.com).
2. No menu lateral, clica em **Droplets** e seleciona o servidor do **YME Portal**.
3. Clica na aba **Snapshots** (no menu lateral esquerdo do Droplet).
4. Em **"Take a snapshot of Droplet"**, introduz um nome (ex: `yme-portal-backup-final-2026`) e clica em **Take Snapshot**.
   > *Nota: O processo demora cerca de 2 a 5 minutos a tirar a fotografia exata do disco.*
5. Assim que o snapshot for concluído, clica no botão **More (três pontos `...`)** ao lado do snapshot e seleciona **Transfer Snapshot**.
6. Insere o **email da conta DigitalOcean do novo responsável** da YME e clica em **Transfer**.

---

### 📥 No Início do Novo Mandato (Responsável que entra):
1. O novo responsável cria/entra na sua conta DigitalOcean (ativando previamente o crédito do GitHub Student Pack).
2. Recebe uma notificação/email e acede a **Images** ➔ **Snapshots**.
3. Clica em **Accept Transfer**.
4. Ao lado do snapshot aceite, clica em **More (`...`)** ➔ **Create Droplet**.
5. Seleciona o plano pretendido (ex: Basic Regular SSD 12\$/mês) e o datacenter mais próximo (**Frankfurt** ou **Amsterdam**).
6. Clica em **Create Droplet**.
7. **Pronto!** Em 1 a 2 minutos, o novo servidor arranca com **todos** os contentores, base de dados, utilizadores e ficheiros exatamente no mesmo estado em que foram deixados.

---

## 💾 3. Método Alternativo: Backup Universal de Base de Dados e Ficheiros

Se a associação decidir mudar de fornecedor de alojamento (ex: alojamento institucional próprio da YME, AWS, Azure, etc.), este método exporta os dados limpos:

### 📤 1. No servidor antigo, extrair os dados reais:
Ligar via SSH ao servidor antigo (`ssh root@IP_ANTIGO`) e executar:

```bash
# 1.1 Criar diretório de backup temporário
mkdir -p ~/backups && cd ~/backups

# 1.2 Exportar todo o SQL da base de dados (membros, avaliações, carteira, transações)
docker exec yme_postgres_prod pg_dump -U yme_admin yme_portal_prod_db > yme_database_backup.sql

# 1.3 Compactar todos os relatórios PDF e comprovativos de despesas
tar -czvf yme_uploads_backup.tar.gz /var/lib/docker/volumes/yme-app-interna_backend_uploads_prod/_data

# 1.4 Guardar uma cópia do ficheiro com os segredos de produção
cp ~/YME_App/.env.production ~/backups/.env.production
```
*(Descarregar estes 3 ficheiros para um computador seguro ou Google Drive institucional da YME).*

### 📥 2. No servidor novo, restaurar os dados:
1. Clonar o repositório oficial no novo servidor:
   ```bash
   git clone https://github.com/tbarros35/YME_App.git
   cd YME_App
   ```
2. Colocar o ficheiro `.env.production` na raiz do projeto.
3. Iniciar os contentores limpos:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. Restaurar a base de dados a partir do ficheiro SQL:
   ```bash
   cat yme_database_backup.sql | docker exec -i yme_postgres_prod psql -U yme_admin -d yme_portal_prod_db
   ```
5. Restaurar os ficheiros PDF dos relatórios:
   ```bash
   tar -xzvf yme_uploads_backup.tar.gz -C /var/lib/docker/volumes/yme-app-interna_backend_uploads_prod/_data --strip-components=6
   ```

---

## 🌐 4. Gestão de Endereço / Domínio

Se a YME associar um domínio ao portal (ex: `portal.yme.pt` ou `app.yme.pt`):
- O endereço para os membros **nunca tem de mudar** de mandato para mandato.
- Sempre que houver troca de servidor, o responsável de TI apenas tem de aceder ao gestor de DNS da associação e **atualizar o registo `A`** para apontar para o novo IP do Droplet.
- Para renovar o SSL (HTTPS com cadeado verde) no novo servidor:
  ```bash
  apt update && apt install -y certbot python3-certbot-nginx
  certbot --nginx -d app.yme.pt
  ```

---

## ✅ 5. Checklist de Verificação da Transição

- [ ] Snapshot ou backup SQL transferido e restaurado.
- [ ] Contentores a correr sem erros (`docker compose -f docker-compose.prod.yml ps`).
- [ ] Login testado com sucesso com a conta de Administrador (`admin@yme.pt`).
- [ ] Verificação da aba de Membros, Carteira YME e Avaliações SAD no Backoffice.
- [ ] Credenciais de acesso ao servidor SSH devidamente partilhadas e arquivadas no cofre de passwords da direção.
