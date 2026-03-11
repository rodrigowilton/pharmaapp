-- ============================================================
--  PharmaApp — Setup completo do banco
--  Execute no terminal do postgres no EasyPanel (ícone >_)
-- ============================================================

CREATE DATABASE pharmaapp;
\c pharmaapp

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE plano_tipo    AS ENUM ('basico','premium');
CREATE TYPE status_farm   AS ENUM ('ativa','suspensa','inativa');
CREATE TYPE status_geral  AS ENUM ('ativo','inativo');
CREATE TYPE role_usuario  AS ENUM ('admin','farmacia','cliente');
CREATE TYPE status_pedido AS ENUM ('aguardando','confirmado','preparando','entregue','cancelado');

CREATE TABLE farmacias (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(150) NOT NULL,
  responsavel   VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  telefone      VARCHAR(20),
  cnpj          VARCHAR(18)  UNIQUE,
  cidade        VARCHAR(80),
  estado        CHAR(2),
  plano         plano_tipo   NOT NULL DEFAULT 'basico',
  status        status_farm  NOT NULL DEFAULT 'ativa',
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE usuarios (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha_hash  TEXT         NOT NULL,
  role        role_usuario NOT NULL DEFAULT 'cliente',
  farmacia_id UUID REFERENCES farmacias(id) ON DELETE SET NULL,
  ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE clientes (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmacia_id   UUID         NOT NULL REFERENCES farmacias(id) ON DELETE CASCADE,
  usuario_id    UUID         REFERENCES usuarios(id) ON DELETE SET NULL,
  nome          VARCHAR(100) NOT NULL,
  email         VARCHAR(150),
  telefone      VARCHAR(20),
  cpf           VARCHAR(14),
  total_gasto   NUMERIC(10,2) NOT NULL DEFAULT 0,
  ultima_compra TIMESTAMPTZ,
  status        status_geral  NOT NULL DEFAULT 'ativo',
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias (
  id   SERIAL      PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE
);

INSERT INTO categorias (nome) VALUES
  ('Analgésico'),('Antibiótico'),('Anti-inflamatório'),
  ('Cardiovascular'),('Gástrico'),('Dermatológico'),
  ('Suplemento'),('Vitamina'),('Outros');

CREATE TABLE produtos (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmacia_id     UUID          NOT NULL REFERENCES farmacias(id) ON DELETE CASCADE,
  categoria_id    INT           REFERENCES categorias(id),
  nome            VARCHAR(200)  NOT NULL,
  descricao       TEXT,
  preco           NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque         INT           NOT NULL DEFAULT 0,
  estoque_minimo  INT           NOT NULL DEFAULT 10,
  precisa_receita BOOLEAN       NOT NULL DEFAULT FALSE,
  ativo           BOOLEAN       NOT NULL DEFAULT TRUE,
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE pedidos (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmacia_id   UUID          NOT NULL REFERENCES farmacias(id) ON DELETE CASCADE,
  cliente_id    UUID          NOT NULL REFERENCES clientes(id),
  nome_cliente  VARCHAR(100),
  total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  status        status_pedido NOT NULL DEFAULT 'aguardando',
  observacao    TEXT,
  criado_em     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE itens_pedido (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id      UUID          NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id     UUID          NOT NULL REFERENCES produtos(id),
  nome_produto   VARCHAR(200),
  quantidade     INT           NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  subtotal       NUMERIC(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- Índices
CREATE INDEX ON clientes(farmacia_id);
CREATE INDEX ON produtos(farmacia_id);
CREATE INDEX ON pedidos(farmacia_id);
CREATE INDEX ON pedidos(cliente_id);
CREATE INDEX ON pedidos(status);
CREATE INDEX ON itens_pedido(pedido_id);

-- Trigger: atualiza atualizado_em
CREATE OR REPLACE FUNCTION fn_ts()
RETURNS TRIGGER AS $$ BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER ts_farmacias BEFORE UPDATE ON farmacias  FOR EACH ROW EXECUTE FUNCTION fn_ts();
CREATE TRIGGER ts_clientes  BEFORE UPDATE ON clientes   FOR EACH ROW EXECUTE FUNCTION fn_ts();
CREATE TRIGGER ts_produtos  BEFORE UPDATE ON produtos   FOR EACH ROW EXECUTE FUNCTION fn_ts();
CREATE TRIGGER ts_pedidos   BEFORE UPDATE ON pedidos    FOR EACH ROW EXECUTE FUNCTION fn_ts();

-- Trigger: pedido entregue → atualiza estoque e cliente
CREATE OR REPLACE FUNCTION fn_pedido_entregue()
RETURNS TRIGGER AS $$
DECLARE item RECORD;
BEGIN
  IF NEW.status = 'entregue' AND OLD.status <> 'entregue' THEN
    FOR item IN SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = NEW.id
    LOOP
      UPDATE produtos SET estoque = GREATEST(0, estoque - item.quantidade) WHERE id = item.produto_id;
    END LOOP;
    UPDATE clientes SET total_gasto = total_gasto + NEW.total, ultima_compra = NOW() WHERE id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tg_entregue AFTER UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION fn_pedido_entregue();

-- Views
CREATE VIEW vw_farmacias_resumo AS
SELECT f.*,
  COUNT(DISTINCT c.id)  AS total_clientes,
  COUNT(DISTINCT p.id)  AS total_produtos,
  COUNT(DISTINCT pe.id) AS total_pedidos
FROM farmacias f
LEFT JOIN clientes c  ON c.farmacia_id = f.id
LEFT JOIN produtos  p ON p.farmacia_id = f.id AND p.ativo = TRUE
LEFT JOIN pedidos  pe ON pe.farmacia_id = f.id
GROUP BY f.id;

CREATE VIEW vw_estoque_critico AS
SELECT p.id, p.farmacia_id, p.nome, p.estoque, p.estoque_minimo
FROM produtos p WHERE p.ativo = TRUE AND p.estoque <= p.estoque_minimo;

-- Usuário da API no banco
CREATE ROLE pharmaapp_api LOGIN PASSWORD 'ApiSenha123!';
GRANT CONNECT ON DATABASE pharmaapp TO pharmaapp_api;
GRANT USAGE ON SCHEMA public TO pharmaapp_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pharmaapp_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pharmaapp_api;

-- Admin padrão (senha: admin123 — TROQUE DEPOIS!)
INSERT INTO usuarios (nome, email, senha_hash, role)
VALUES ('Administrador', 'admin@pharmaapp.com', crypt('admin123', gen_salt('bf')), 'admin');

-- Dados de exemplo
INSERT INTO farmacias (nome, responsavel, email, telefone, cidade, estado, plano)
VALUES
  ('Farmácia Saúde Total', 'Carlos Mendes', 'carlos@saudetotal.com', '(11) 98765-4321', 'São Paulo', 'SP', 'premium'),
  ('Drogaria Bem Estar',   'Ana Souza',     'ana@bemestar.com',      '(21) 91234-5678', 'Rio de Janeiro', 'RJ', 'basico');
