const express = require('express');
const app = express();
const path = require('path');

// 모든 정적 파일 제공 (HTML, CSS, JS, JSON 포함)
app.use(express.static(__dirname));

// 루트 접근 시 index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
