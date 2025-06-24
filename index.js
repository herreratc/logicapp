const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Helpers
function parseNumber(value) {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
}

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0);
  const parts = dateStr.replace(/[-\/]/g, '.').split('.');
  if (parts.length !== 3) return new Date(0);
  const [day, month, year] = parts;
  return new Date(`${year}-${month}-${day}`);
}

function isBetween(date, start, end) {
  return date >= start && date <= end;
}

// Load CSV line by line
function streamCSV(filePath) {
  return fs.createReadStream(filePath).pipe(csv({ separator: '\t' }));
}

app.get('/produtos', async (req, res) => {
  const { dataInicio, dataFim } = req.query;

  let startDate = null;
  let endDate = null;

  if (dataInicio && dataFim) {
    startDate = parseDate(dataInicio);
    endDate = parseDate(dataFim);
    if (isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ error: 'Formato de data inválido' });
    }
  }

  const produtos = {};
  const comprasPorProduto = {};
  const vendasPorProduto = {};

  // Lê produtos
  await new Promise((resolve, reject) => {
    streamCSV('./Tabela-Produtos.csv')
      .on('data', (row) => {
        const cod = row.CODPRODUTO?.trim();
        if (cod) {
          produtos[cod] = {
            codProduto: cod,
            produto: row.PRODUTO || '',
          };
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Lê compras
  await new Promise((resolve, reject) => {
    streamCSV('./Tabela-Compras.csv')
      .on('data', (row) => {
        const cod = row.CODPRODUTO?.trim();
        if (!cod || !produtos[cod]) return;

        const data = parseDate(row.DATA);
        if (startDate && endDate && !isBetween(data, startDate, endDate)) return;

        const preco = parseNumber(row.CUSTODIRETO_UN_EST);
        if (!comprasPorProduto[cod]) comprasPorProduto[cod] = [];
        comprasPorProduto[cod].push(preco);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Lê vendas
  await new Promise((resolve, reject) => {
    streamCSV('./Tabela-Vendas.csv')
      .on('data', (row) => {
        const cod = row.CODPRODUTO?.trim();
        if (!cod || !produtos[cod]) return;

        const data = parseDate(row.DATAEMISSAONF);
        if (startDate && endDate && !isBetween(data, startDate, endDate)) return;

        const preco = parseNumber(row.PRECO);
        if (!vendasPorProduto[cod]) vendasPorProduto[cod] = [];
        vendasPorProduto[cod].push(preco);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Calcula resultado
  const resultado = Object.values(produtos).map(prod => {
    const compras = comprasPorProduto[prod.codProduto] || [];
    const vendas = vendasPorProduto[prod.codProduto] || [];

    let precoCompra = 0;
    let precoVenda = 0;

    if (startDate && endDate) {
      precoCompra = compras.length ? compras.reduce((a, b) => a + b, 0) / compras.length : 0;
      precoVenda = vendas.length ? vendas.reduce((a, b) => a + b, 0) / vendas.length : 0;
    } else {
      precoCompra = compras.length ? compras[compras.length - 1] : 0;
      precoVenda = vendas.length ? vendas[vendas.length - 1] : 0;
    }

    const markup = precoCompra > 0 ? ((precoVenda - precoCompra) / precoCompra) * 100 : 0;
    const margemLucro = precoVenda > 0 ? ((precoVenda - precoCompra) / precoVenda) * 100 : 0;

    return {
      ...prod,
      precoCompra: parseFloat(precoCompra.toFixed(2)),
      precoVenda: parseFloat(precoVenda.toFixed(2)),
      markup: parseFloat(markup.toFixed(2)),
      margemLucro: parseFloat(margemLucro.toFixed(2))
    };
  });

  res.json(resultado);
});

app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`);
});
