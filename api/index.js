const express  = require('express');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { Pool } = require('pg');

const app        = express();
const PORT       = process.env.PORT       || 3333;
const JWT_SECRET = process.env.JWT_SECRET || 'troque-essa-chave!';

const db = new Pool({
  host:     process.env.DB_HOST     || 'postgres',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'pharmaapp',
  user:     process.env.DB_USER     || 'pharmaapp_api',
  password: process.env.DB_PASSWORD || 'ApiSenha123!',
});

app.use(cors());
app.use(express.json());

// ── Middleware de auth ────────────────────────────────────────
function auth(roles = []) {
  return (req, res, next) => {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) return res.status(401).json({ erro: 'Não autenticado' });
    try {
      req.usuario = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(req.usuario.role))
        return res.status(403).json({ erro: 'Sem permissão' });
      next();
    } catch { res.status(401).json({ erro: 'Token inválido' }); }
  };
}

// ── Saúde ─────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true }));

// ─────────────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE email=$1 AND ativo=TRUE', [email]
    );
    const u = rows[0];
    if (!u || !bcrypt.compareSync(senha, u.senha_hash))
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });

    const token = jwt.sign(
      { id: u.id, role: u.role, farmacia_id: u.farmacia_id, nome: u.nome },
      JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({
      token,
      usuario: { id: u.id, nome: u.nome, email: u.email, role: u.role, farmacia_id: u.farmacia_id }
    });
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/auth/trocar-senha', auth(), async (req, res) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    const { rows } = await db.query('SELECT * FROM usuarios WHERE id=$1', [req.usuario.id]);
    if (!bcrypt.compareSync(senha_atual, rows[0].senha_hash))
      return res.status(400).json({ erro: 'Senha atual incorreta' });
    await db.query('UPDATE usuarios SET senha_hash=$1 WHERE id=$2',
      [bcrypt.hashSync(nova_senha, 10), req.usuario.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN — ESTATÍSTICAS
// ─────────────────────────────────────────────────────────────
app.get('/admin/stats', auth(['admin']), async (req, res) => {
  try {
    const { rows: [s] } = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM farmacias)                        AS total_farmacias,
        (SELECT COUNT(*) FROM farmacias WHERE status='ativa')   AS farmacias_ativas,
        (SELECT COUNT(*) FROM clientes)                         AS total_clientes,
        (SELECT COUNT(*) FROM pedidos)                          AS total_pedidos,
        (SELECT COUNT(*) FROM farmacias WHERE plano='premium')  AS planos_premium
    `);
    res.json(s);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ─────────────────────────────────────────────────────────────
//  ADMIN — FARMÁCIAS
// ─────────────────────────────────────────────────────────────
app.get('/admin/farmacias', auth(['admin']), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM vw_farmacias_resumo ORDER BY criado_em DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/admin/farmacias/:id', auth(['admin']), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM vw_farmacias_resumo WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/admin/farmacias', auth(['admin']), async (req, res) => {
  const client = await db.connect();
  try {
    const { nome, responsavel, email, telefone, cidade, estado, plano, senha_responsavel } = req.body;
    await client.query('BEGIN');
    const { rows: [farm] } = await client.query(
      `INSERT INTO farmacias (nome, responsavel, email, telefone, cidade, estado, plano)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [nome, responsavel, email, telefone, cidade, estado, plano || 'basico']
    );
    await client.query(
      `INSERT INTO usuarios (nome, email, senha_hash, role, farmacia_id)
       VALUES ($1,$2,$3,'farmacia',$4)`,
      [responsavel, email, bcrypt.hashSync(senha_responsavel || '123456', 10), farm.id]
    );
    await client.query('COMMIT');
    res.status(201).json(farm);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ erro: e.message });
  } finally { client.release(); }
});

app.patch('/admin/farmacias/:id/status', auth(['admin']), async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE farmacias SET status=$1 WHERE id=$2 RETURNING *', [req.body.status, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ─────────────────────────────────────────────────────────────
//  FARMÁCIA — CLIENTES
// ─────────────────────────────────────────────────────────────
app.get('/farmacia/clientes', auth(['admin','farmacia']), async (req, res) => {
  try {
    const fid = req.usuario.farmacia_id;
    const { busca } = req.query;
    let q = 'SELECT * FROM clientes WHERE farmacia_id=$1';
    const p = [fid];
    if (busca) { q += ' AND (nome ILIKE $2 OR telefone ILIKE $2)'; p.push(`%${busca}%`); }
    q += ' ORDER BY nome';
    const { rows } = await db.query(q, p);
    res.json(rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/farmacia/clientes/:id', auth(['admin','farmacia']), async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM clientes WHERE id=$1 AND farmacia_id=$2',
      [req.params.id, req.usuario.farmacia_id]
    );
    if (!rows[0]) return res.status(404).json({ erro: 'Não encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/farmacia/clientes', auth(['admin','farmacia']), async (req, res) => {
  try {
    const { nome, email, telefone, cpf } = req.body;
    const { rows } = await db.query(
      'INSERT INTO clientes (farmacia_id, nome, email, telefone, cpf) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.usuario.farmacia_id, nome, email, telefone, cpf]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.put('/farmacia/clientes/:id', auth(['admin','farmacia']), async (req, res) => {
  try {
    const { nome, email, telefone, status } = req.body;
    const { rows } = await db.query(
      `UPDATE clientes SET nome=$1, email=$2, telefone=$3, status=COALESCE($4,status)
       WHERE id=$5 AND farmacia_id=$6 RETURNING *`,
      [nome, email, telefone, status, req.params.id, req.usuario.farmacia_id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ─────────────────────────────────────────────────────────────
//  FARMÁCIA — PRODUTOS
// ─────────────────────────────────────────────────────────────
app.get('/farmacia/produtos', auth(['admin','farmacia','cliente']), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, c.nome AS categoria_nome
       FROM produtos p LEFT JOIN categorias c ON c.id=p.categoria_id
       WHERE p.farmacia_id=$1 AND p.ativo=TRUE ORDER BY p.nome`,
      [req.usuario.farmacia_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.get('/farmacia/produtos/criticos', auth(['admin','farmacia']), async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM vw_estoque_critico WHERE farmacia_id=$1', [req.usuario.farmacia_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/farmacia/produtos', auth(['admin','farmacia']), async (req, res) => {
  try {
    const { nome, categoria_id, preco, estoque, estoque_minimo, precisa_receita, descricao } = req.body;
    const { rows } = await db.query(
      `INSERT INTO produtos (farmacia_id, nome, categoria_id, preco, estoque, estoque_minimo, precisa_receita, descricao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.usuario.farmacia_id, nome, categoria_id, preco, estoque||0, estoque_minimo||10, precisa_receita||false, descricao]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.put('/farmacia/produtos/:id', auth(['admin','farmacia']), async (req, res) => {
  try {
    const { nome, preco, estoque, estoque_minimo, precisa_receita, ativo } = req.body;
    const { rows } = await db.query(
      `UPDATE produtos SET nome=$1, preco=$2, estoque=$3, estoque_minimo=$4,
       precisa_receita=$5, ativo=$6 WHERE id=$7 AND farmacia_id=$8 RETURNING *`,
      [nome, preco, estoque, estoque_minimo, precisa_receita, ativo, req.params.id, req.usuario.farmacia_id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ─────────────────────────────────────────────────────────────
//  FARMÁCIA — PEDIDOS
// ─────────────────────────────────────────────────────────────
app.get('/farmacia/pedidos', auth(['admin','farmacia']), async (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT p.*, COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') AS itens
             FROM pedidos p LEFT JOIN itens_pedido i ON i.pedido_id=p.id
             WHERE p.farmacia_id=$1`;
    const params = [req.usuario.farmacia_id];
    if (status) { q += ' AND p.status=$2'; params.push(status); }
    q += ' GROUP BY p.id ORDER BY p.criado_em DESC';
    const { rows } = await db.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

app.post('/farmacia/pedidos', auth(['admin','farmacia','cliente']), async (req, res) => {
  const client = await db.connect();
  try {
    const { cliente_id, itens, observacao } = req.body;
    await client.query('BEGIN');
    let total = 0;
    const itensCompletos = [];
    for (const item of itens) {
      const { rows } = await client.query('SELECT preco, nome FROM produtos WHERE id=$1', [item.produto_id]);
      total += rows[0].preco * item.quantidade;
      itensCompletos.push({ ...item, preco_unitario: rows[0].preco, nome_produto: rows[0].nome });
    }
    const { rows: [cli] } = await client.query('SELECT nome FROM clientes WHERE id=$1', [cliente_id]);
    const { rows: [pedido] } = await client.query(
      `INSERT INTO pedidos (farmacia_id, cliente_id, nome_cliente, total, observacao)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.usuario.farmacia_id, cliente_id, cli.nome, total, observacao]
    );
    for (const item of itensCompletos) {
      await client.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, quantidade, preco_unitario)
         VALUES ($1,$2,$3,$4,$5)`,
        [pedido.id, item.produto_id, item.nome_produto, item.quantidade, item.preco_unitario]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(pedido);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ erro: e.message });
  } finally { client.release(); }
});

app.patch('/farmacia/pedidos/:id/status', auth(['admin','farmacia']), async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE pedidos SET status=$1 WHERE id=$2 AND farmacia_id=$3 RETURNING *',
      [req.body.status, req.params.id, req.usuario.farmacia_id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ─────────────────────────────────────────────────────────────
//  CLIENTE
// ─────────────────────────────────────────────────────────────
app.get('/cliente/meus-pedidos', auth(['cliente']), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') AS itens
       FROM pedidos p
       LEFT JOIN itens_pedido i ON i.pedido_id=p.id
       JOIN clientes c ON c.id=p.cliente_id
       WHERE c.usuario_id=$1
       GROUP BY p.id ORDER BY p.criado_em DESC`,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`✅ PharmaApp API na porta ${PORT}`));
