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

function parseDateFlexible(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0);
  const normalized = dateStr.replace(/[-\/]/g, '.');
  const [day, month, year] = normalized.split('.');
  const date = new Date(`${year}-${month}-${day}`);
  return isNaN(date.getTime()) ? new Date(0) : date;
}

async function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath, { encoding: 'utf8' })
      .pipe(csv({ separator: '\t' }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

app.get('/produtos', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    let start, end;

    if (dataInicio && dataFim) {
      start = parseDateFlexible(dataInicio);
      end = parseDateFlexible(dataFim);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Formato de data inválido. Use DD.MM.AAAA ou 24/06/2025' });
      }
    }

    const produtos = await loadCSV('./Tabela-Produtos.csv');
    const compras = await loadCSV('./Tabela-Compras.csv');
    const vendas = await loadCSV('./Tabela-Vendas.csv');

    const resultado = produtos.map(prod => {
      const cod = prod.CODPRODUTO ? prod.CODPRODUTO.trim() : '';
      const nome = prod.PRODUTO || '';

      let comprasProduto = compras.filter(c => c.CODPRODUTO && c.CODPRODUTO.trim() === cod);
      let vendasProduto = vendas.filter(v => v.CODPRODUTO && v.CODPRODUTO.trim() === cod);

      if (start && end) {
        comprasProduto = comprasProduto.filter(c => {
          const data = parseDateFlexible(c.DATA);
          return data >= start && data <= end;
        });

        vendasProduto = vendasProduto.filter(v => {
          const data = parseDateFlexible(v.DATAEMISSAONF);
          return data >= start && data <= end;
        });
      }

      let precoCompra = 0;
      let precoVenda = 0;

      if (start && end) {
        const somaCompras = comprasProduto.reduce((acc, c) => acc + parseNumber(c.CUSTODIRETO_UN_EST), 0);
        const somaVendas = vendasProduto.reduce((acc, v) => acc + parseNumber(v.PRECO), 0);
        precoCompra = comprasProduto.length ? somaCompras / comprasProduto.length : 0;
        precoVenda = vendasProduto.length ? somaVendas / vendasProduto.length : 0;
      } else {
        const ultimaCompra = comprasProduto
          .sort((a, b) => parseDateFlexible(b.DATA) - parseDateFlexible(a.DATA))[0];
        const ultimaVenda = vendasProduto
          .sort((a, b) => parseDateFlexible(b.DATAEMISSAONF) - parseDateFlexible(a.DATAEMISSAONF))[0];
        precoCompra = ultimaCompra ? parseNumber(ultimaCompra.CUSTODIRETO_UN_EST) : 0;
        precoVenda = ultimaVenda ? parseNumber(ultimaVenda.PRECO) : 0;
      }

      const markup = precoCompra > 0 ? ((precoVenda - precoCompra) / precoCompra) * 100 : 0;
      const margemLucro = precoVenda > 0 ? ((precoVenda - precoCompra) / precoVenda) * 100 : 0;

      return {
        codProduto: cod,
        produto: nome,
        precoCompra: parseFloat(precoCompra.toFixed(2)),
        precoVenda: parseFloat(precoVenda.toFixed(2)),
        markup: parseFloat(markup.toFixed(2)),
        margemLucro: parseFloat(margemLucro.toFixed(2))
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao processar /produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}`);
});
