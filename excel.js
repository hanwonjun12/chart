const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use('/chart-images', express.static(path.join(__dirname, 'chart-images')));

async function readExcelData(page) {
  const workbook = new ExcelJS.Workbook();
  try {
    const excelFilePath = path.resolve(__dirname, '230526_웹차트분석_.xlsx');
    await workbook.xlsx.readFile(excelFilePath);
    const worksheet1 = workbook.getWorksheet('무료1');
    const worksheet2 = workbook.getWorksheet('유료1');
    let worksheet;
    if (page === '2') {
      worksheet = worksheet2;
    } else {
      worksheet = worksheet1;
    }
    const rows = [];
    worksheet.eachRow({ includeEmpty: true, includeFormula: false }, (row, rowNumber) => {
      const rowData = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowData.push(cell.value);
      });
      rows.push(rowData);
    });
    return rows;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw new Error('Failed to read Excel data');
  }
}

app.get('/data', async (req, res) => {
  try {
    const chartKey = req.query.chartKey;
    const chartType = req.query.chartType;
    const page = req.query.page;

    const data = await readExcelData(page);

    let filteredData = data;

    if (chartKey) {
      filteredData = filteredData.filter(row => row[1] === parseInt(chartKey));
    }

    if (chartType) {
      filteredData = filteredData.filter(row => row[2] === chartType);
    }

    if (filteredData.length === 0) {
      res.send('No data available for the selected chart key and chart type.');
    } else {
      const tableRows = filteredData.map(row => {
        const chartKey = row[1];
        const chartType = row[2];
        const chartNumber = row[3];
        const chartName = row[4];
        let chartView = '';
      
        if (chartKey === 1 && chartType === '꺽은 선형 차트') {
          const imageName = `chart${chartNumber}.png`;
          chartView = `<img src="/chart-images/${imageName}" alt="Chart View">`;
        } else {
          chartView = 'Chart View';
        }
      
        return `<tr>
                  <td>${chartKey}</td>
                  <td>${chartType}</td>
                  <td>${chartNumber}</td>
                  <td>${chartName}</td>
                  <td>${chartView}</td>
                </tr>`;
      });
      const tableHTML = `<table>
                          <tr>
                            <th>차트 키</th>
                            <th>차트 유형</th>
                            <th>차트 번호</th>
                            <th>차트 이름</th>
                            <th>차트 뷰</th>
                          </tr>
                          ${tableRows.join('')}
                        </table>`;

      res.send(tableHTML);
    }
  } catch (error) {
    console.error('Error reading Excel data:', error);
    res.status(500).send('Failed to read Excel data.');
  }
});
app.get('/page2', async (req, res) => {
  try {
    const data = await readExcelData();
    const chartKey = req.query.chartKey;
    const chartType = req.query.chartType;

    // Filter data for 유료1 시트, chartKey, chartType
    let filteredData = data.filter(row => row[0] === '유료1');
    if (chartKey) {
      filteredData = filteredData.filter(row => row[1] === parseInt(chartKey));
    }
    if (chartType) {
      filteredData = filteredData.filter(row => row[2] === chartType);
    }

    // Prepare the chart data as an object to pass to page2.html
    const chartData = {
      chartKey,
      chartType,
      data: filteredData,
    };

    res.render('page2', { chartData });
  } catch (error) {
    console.error('Error reading Excel data:', error);
    res.status(500).send('Failed to read Excel data.');
  }
});
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
}); 