const fs = require('fs');
const csv = require('csv-parser');
const iconv = require('iconv-lite');

function loadCSVWithEncoding(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(iconv.decodeStream('latin1'))
      .pipe(csv({ separator: '\t' }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

function getLatestCompra(codProduto, compras) {
  const comprasFiltradas = compras
    .filter(c => c.CODPRODUTO.trim() === codProduto)
    .sort((a, b) => new Date(b.DATA.split('.').reverse().join('-')) - new Date(a.DATA.split('.').reverse().join('-')));

  if (comprasFiltradas.length > 0) {
    return {
      preco: parseFloat(comprasFiltradas[0].CUSTODIRETO_UN_EST.replace(',', '.')),
      data: comprasFiltradas[0].DATA
    };
  }
  return null;
}

function getLatestVenda(codProduto, vendas) {
  const vendasFiltradas = vendas
    .filter(v => v.CODPRODUTO.trim() === codProduto)
    .sort((a, b) => new Date(b.DATAEMISSAONF.split('.').reverse().join('-')) - new Date(a.DATAEMISSAONF.split('.').reverse().join('-')));

  if (vendasFiltradas.length > 0) {
    return {
      preco: parseFloat(vendasFiltradas[0].PRECO.replace(',', '.')),
      data: vendasFiltradas[0].DATAEMISSAONF
    };
  }
  return null;
}

function calculateMargins(custo, venda) {
  let markupPercent = 0;
  let margemLucroPercent = 0;

  if (custo > 0) {
    markupPercent = (((venda - custo) / custo) * 100).toFixed(2);
  }

  if (venda > 0) {
    margemLucroPercent = (((venda - custo) / venda) * 100).toFixed(2);
  }

  return {
    markupPercent,
    margemLucroPercent
  };
}

module.exports = { loadCSVWithEncoding, getLatestCompra, getLatestVenda, calculateMargins };
