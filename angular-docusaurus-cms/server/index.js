// Multi Token Access Dinamis
import express, { response } from 'express';
import cors from 'cors';
import { Octokit } from '@octokit/rest';
import multer from 'multer';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const GITLAB_API = 'https://gitlab.com/api/v4';

// Ambil daftar repo
app.get("/repos", async (req,res) => {
    const { token } = req.query;
    const { owner } = req.query;
    try {
        const response = await axios.get(`${GITLAB_API}/projects`, {
            headers: { 'PRIVATE-TOKEN': token },
            params: { membership: true, simple: true, per_page: 100 },
        });
        const repos = response.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            path: repo.path_with_namespace
        }));
        res.json(repos);
    } catch (err) {
        res.status(500).json({ error: 'Gagal ambil repositori', detail: err.message });
    }
    console.log('Token Dari FE : ', token);
    console.log('Owner :', owner );
});

// Ambil file markdown dari folder docs
async function getMarkdownFiles(token, projectId, path = 'docs') {
    try {
      const url = `${GITLAB_API}/projects/${projectId}/repository/tree`;
      const { data } = await axios.get(url, {
        headers: { 'PRIVATE-TOKEN': token },
        params: { path, recursive: true, per_page: 100 },
      });
      return data.filter(f => f.type === 'blob' && (f.path.endsWith('.md') || f.path.endsWith('.mdx')))
                 .map(f => ({ name: f.name, path: f.path }));
    } catch (err) {
      console.error('Gagal ambil file markdown:', err.response?.data || err.message);
      throw err;
    }
  }
  
  
  app.get('/docs', async (req, res) => {
    const { token, repo, path } = req.query;
    try {
      const targetPath = path || 'docs';
      const files = await getMarkdownFiles(token, repo, targetPath);
      res.json(files);
    } catch (err) {
      res.status(500).json({ error: 'Gagal ambil file markdown', detail: err.message });
    }
  });
  
  app.get('/file', async (req, res) => {
    const { token, repo, path } = req.query;
    try {
      const response = await axios.get(`${GITLAB_API}/projects/${repo}/repository/files/${encodeURIComponent(path)}/raw`, {
        headers: { 'PRIVATE-TOKEN': token },
        params: { ref: 'main' },
      });
      res.send(response.data);
    } catch (err) {
      res.status(500).json({ error: 'Gagal ambil konten file', detail: err.message });
    }
  });
  
  app.post('/file', async (req, res) => {
    const { token, repo, path, content, message = 'Update file via CMS' } = req.body;
    try {
        await axios.put(`${GITLAB_API}/projects/${repo}/repository/files/${encodeURIComponent(path)}`, {
          branch: 'main',
          content,
          commit_message: message,
        }, {
          headers: { 'PRIVATE-TOKEN': token },
        });
        res.json({ success: true });
      } catch (err) {
        res.status(500).json({ error: 'Gagal commit file', detail: err.message });
      }
    });
  
  app.post('/new-file', async (req, res) => {
    const { token, repo, path, content, message = 'Add new markdown file' } = req.body;
    try {
      await axios.post(`${GITLAB_API}/projects/${repo}/repository/files/${encodeURIComponent(path)}`, {
        branch: 'main',
        content,
        commit_message: message,
      }, {
        headers: { 'PRIVATE-TOKEN': token },
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal membuat file baru', detail: err.message });
    }
  });
  
  app.delete('/delete-file', async (req, res) => {
    const { token, repo, path } = req.query;
    try {
      await axios.delete(`${GITLAB_API}/projects/${repo}/repository/files/${encodeURIComponent(path)}`, {
        headers: { 'PRIVATE-TOKEN': token },
        data: {
          branch: 'main',
          commit_message: `Delete file ${path} via CMS`,
        }
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus file', detail: err.message });
    }
  });
  
  app.listen(PORT, () => {
    console.log(`GitLab CMS Backend running on http://localhost:${PORT}`);
  });
  