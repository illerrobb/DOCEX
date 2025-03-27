import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [placeholders, setPlaceholders] = useState([]);
  const [rawText, setRawText] = useState('');
  const [data, setData] = useState({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [view, setView] = useState('fields');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('doc', selectedFile);
    try {
      const res = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPlaceholders(res.data.placeholders);
      setRawText(res.data.rawText);
      const initData = {};
      res.data.placeholders.forEach(p => initData[p] = '');
      setData(initData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e, placeholder) => {
    setData({ ...data, [placeholder]: e.target.value });
  };

  const handleGenerate = async () => {
    try {
      const res = await axios.post('http://localhost:3001/generate', {
        templateId: 'default',
        data,
        content: rawText
      });
      setGeneratedContent(res.data.generatedContent);
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, padding: '1rem' }}>
        <h2>Carica Documento</h2>
        <input type="file" onChange={handleFileChange} accept=".docx" />
        <button onClick={handleUpload}>Upload</button>
        {placeholders.length > 0 && (
          <div>
            <h3>Compila i campi:</h3>
            {placeholders.map(p => (
              <div key={p}>
                <label>{p}: </label>
                <input 
                  type="text" 
                  value={data[p] || ''} 
                  onChange={(e) => handleInputChange(e, p)} 
                />
              </div>
            ))}
            <button onClick={handleGenerate}>Genera Documento</button>
          </div>
        )}
        <div>
          <button onClick={() => setView('fields')}>CAMPI</button>
          <button onClick={() => setView('json')}>JSON</button>
        </div>
        {view === 'json' && (
          <div>
            <h3>JSON Schema</h3>
            <textarea
              rows="10"
              cols="50"
              value={JSON.stringify(data, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setData(parsed);
                } catch (err) {
                  console.error(err);
                }
              }}
            />
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: '1rem', borderLeft: '1px solid #ccc' }}>
        <h2>Anteprima Documento</h2>
        <pre>{generatedContent}</pre>
      </div>
    </div>
  );
}

export default App;