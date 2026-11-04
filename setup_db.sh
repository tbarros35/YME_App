#!/usr/bin/env bash
set -e

# Update postgresql.conf to listen on all interfaces
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/16/main/postgresql.conf || true
sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/16/main/postgresql.conf || true

# Update pg_hba.conf to trust local/IPv4 connections
cat << 'EOF' > /etc/postgresql/16/main/pg_hba.conf
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
host    all             all             0.0.0.0/0               trust
host    all             all             ::0/0                   trust
EOF

service postgresql restart

sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'yme_user') THEN CREATE ROLE yme_user WITH LOGIN PASSWORD 'yme_password_secure' CREATEDB SUPERUSER; END IF; END \$\$;"

sudo -u postgres createdb -O yme_user yme_portal_db || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE yme_portal_db TO yme_user;"

echo "PostgreSQL fully open & ready!"
