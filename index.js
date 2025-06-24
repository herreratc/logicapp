const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
app.use(cors());
const PORT = 3000;

let produtos = [];
let compras = [];
let vendas = [];
let cacheComprasPorProduto = {};
let cacheVendasPorProduto = {};

function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath, { encoding: 'utf8' })
      .pipe(csv({ separator: '\t' }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

function parseNumber(value) {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
}

function parseDateFlexible(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0);
  const normalized = dateStr.replace(/[-\/]/g, '.');
  const [day, month, year] = normalized.split('.');
  const date = new Date(`${year}-${month}-${day}`);
  return isNaN(date.getTime()) ? new Date(0) : date;
}

async function loadData() {
  try {
    produtos = await loadCSV('./Tabela-Produtos.csv');
    compras = await loadCSV('./Tabela-Compras.csv');
    vendas = await loadCSV('./Tabela-Vendas.csv');
    indexarCache();
    console.log('✅ Dados carregados e cache indexado.');
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
  }
}

function indexarCache() {
  cacheComprasPorProduto = {};
  cacheVendasPorProduto = {};

  compras.forEach(c => {
    const cod = c.CODPRODUTO ? c.CODPRODUTO.trim() : '';
    if (!cacheComprasPorProduto[cod]) cacheComprasPorProduto[cod] = [];
    cacheComprasPorProduto[cod].push(c);
  });

  vendas.forEach(v => {
    const cod = v.CODPRODUTO ? v.CODPRODUTO.trim() : '';
    if (!cacheVendasPorProduto[cod]) cacheVendasPorProduto[cod] = [];
    cacheVendasPorProduto[cod].push(v);
  });
}

app.get('/produtos', (req, res) => {
  const { dataInicio, dataFim } = req.query;
  let resultado = [];

  let start, end;
  if (dataInicio && dataFim) {
    start = parseDateFlexible(dataInicio);
    end = parseDateFlexible(dataFim);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Formato de data inválido. Exemplo: 24.06.2025 ou 24/06/2025 ou 24-06-2025' });
    }
  }

  produtos.forEach(prod => {
    const cod = prod.CODPRODUTO ? prod.CODPRODUTO.trim() : '';
    const comprasDoProduto = cacheComprasPorProduto[cod] || [];
    const vendasDoProduto = cacheVendasPorProduto[cod] || [];

    let precoCompra = 0;
    let precoVenda = 0;

    if (start && end) {
      const comprasFiltradas = comprasDoProduto.filter(c => {
        if (!c.DATA) return false;
        const dataCompra = parseDateFlexible(c.DATA);
        return dataCompra >= start && dataCompra <= end;
      });

      const vendasFiltradas = vendasDoProduto.filter(v => {
        if (!v.DATAEMISSAONF) return false;
        const dataVenda = parseDateFlexible(v.DATAEMISSAONF);
        return dataVenda >= start && dataVenda <= end;
      });

      const somaCompras = comprasFiltradas.reduce((acc, c) => acc + parseNumber(c.CUSTODIRETO_UN_EST), 0);
      const somaVendas = vendasFiltradas.reduce((acc, v) => acc + parseNumber(v.PRECO), 0);

      precoCompra = comprasFiltradas.length ? somaCompras / comprasFiltradas.length : 0;
      precoVenda = vendasFiltradas.length ? somaVendas / vendasFiltradas.length : 0;

    } else {
      const ultimaCompra = comprasDoProduto
        .sort((a, b) => parseDateFlexible(b.DATA) - parseDateFlexible(a.DATA))[0];

      const ultimaVenda = vendasDoProduto
        .sort((a, b) => parseDateFlexible(b.DATAEMISSAONF) - parseDateFlexible(a.DATAEMISSAONF))[0];

      precoCompra = ultimaCompra ? parseNumber(ultimaCompra.CUSTODIRETO_UN_EST) : 0;
      precoVenda = ultimaVenda ? parseNumber(ultimaVenda.PRECO) : 0;
    }

    // ✅ Cálculo de Markup e Margem de Lucro
    let markup = 0;
    let margemLucro = 0;

    if (precoCompra > 0) {
      markup = ((precoVenda - precoCompra) / precoCompra) * 100;
    }

    if (precoVenda > 0) {
      margemLucro = ((precoVenda - precoCompra) / precoVenda) * 100;
    }

    resultado.push({
      codProduto: cod,
      produto: prod.PRODUTO,
      precoCompra: parseFloat(precoCompra.toFixed(2)),
      precoVenda: parseFloat(precoVenda.toFixed(2)),
      markup: parseFloat(markup.toFixed(2)),
      margemLucro: parseFloat(margemLucro.toFixed(2))
    });
  });

  res.json(resultado);
});

loadData().then(() => {
  app.listen(PORT, () => console.log(`✅ API rodando em http://localhost:${PORT}`));
});
