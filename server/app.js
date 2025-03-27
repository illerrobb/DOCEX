const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// Middleware for JSON
app.use(express.json());

// Configure multer for file upload
const upload = multer({ dest: 'uploads/' });

// In-memory storage for templates
let templates = {};

// Endpoint to upload DOCX file and extract placeholders
app.post('/upload', upload.single('doc'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const result = await mammoth.extractRawText({ path: req.file.path });
    const regex = /{{\s*([^}]+)\s*}}/g;
    let match;
    let placeholders = [];
    while ((match = regex.exec(result.value)) !== null) {
      placeholders.push(match[1].trim());
    }
    placeholders = [...new Set(placeholders)];
    fs.unlinkSync(req.file.path);
    res.json({ placeholders, rawText: result.value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error processing file' });
  }
});

// Endpoint to save a template with mapping for placeholders
app.post('/template', (req, res) => {
  const { templateId, placeholdersMapping } = req.body;
  if (!templateId || !placeholdersMapping) {
    return res.status(400).json({ error: 'Missing templateId or placeholdersMapping' });
  }
  templates[templateId] = placeholdersMapping;
  res.json({ message: 'Template saved successfully' });
});

// Endpoint to generate document replacing placeholders
app.post('/generate', (req, res) => {
  const { templateId, data, content } = req.body;
  if (!templateId || !data || !content) {
    return res.status(400).json({ error: 'Missing templateId, data or content' });
  }
  let generatedContent = content;
  for (const key in data) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    generatedContent = generatedContent.replace(regex, data[key]);
  }
  res.json({ generatedContent });
});

// Simple endpoint to check server
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});