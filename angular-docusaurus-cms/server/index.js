// Multi Token Access Dinamis
import express, { response } from 'express';
import cors from 'cors';
import { Octokit } from '@octokit/rest';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


// Ambil daftar repo
app.get("/repos", (req,res) => {
    const { owner, token } = req.query;
    console.log('Token Dari FE : ', token);
    console.log('Owner :', owner );
    const octokit = new Octokit({ auth: token });
    octokit.repos.listForAuthenticatedUser({ username: owner }).then(response => {
        const repos = response.data.map(repo => ({ name: repo.name, path: `${owner}/${repo.name}`}));
        res.json(repos);
    }).catch(err => {
        res.status(500).json({ error: 'Gagal ambil repositori', detail: err.message })
    });
});

// Ambil semua fille markdown yang ada didalam repo (docs dan subfolder)
async function getMarkdownFiles( octokit, owner, repo, path = 'docs') {
    try {
        const { data: items } = await octokit.repos.getContent({ owner, repo, path});
        let results = [];
        for (const item of items) {
            if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.mdx'))) {
                results.push({ name: item.name, path: item.path });
            } else if (item.type === 'dir') {
                const children = await getMarkdownFiles(octokit, owner, repo, item.path);
                results = results.concat(children);
            }
        }
        return results;
    } catch (err) {
        console.error(`Error reading directory ${path} in ${repo}:`, err.message);
        throw err;
    }
}

// Endpoint ambil semua file .md/ .mdx di docs
app.get('/docs', async (req, res) => {
    const { token, owner, repo } = req.query;
    const octokit = new Octokit({ auth: token })
    try {
        const markdownFiles = await getMarkdownFiles(octokit, owner, repo);
        res.json(markdownFiles);
    } catch (err) {
        res.status(500).json({ error: 'Gagal ambil file', detail: err.message });
    }
});

// Ambil isi file markdown tertentu
app.get('/file', async (req, res) => {
    const { token, owner, repo, path } = req.query;
    const octokit = new Octokit({ auth: token });
    try {
        const file = await octokit.repos.getContent({ owner, repo, path });
        const content = Buffer.from(file.data.content, 'base64').toString('utf-8');
        res.send(content);
    } catch (err) {
        res.status(500).json({ error: `Gagal ambil file`, detail: err.message });
    }
});

//Upload gambar
const upload = multer();

app.post('/upload-image', upload.single('file'), async (req,res) => {
    const { file } = req;
    const { owner, repo, token } = req.body;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const octokit = new Octokit({ auth: token });
    const path = `static/img/${file.originalname}`;
    const content = file.buffer.toString('base64');

    try {
        const { data: existing } = await octokit.repos.getContent({ owner, repo, path });
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `Update image: ${file.originalname}`,
            content,
            sha: existing.sha
        });
    } catch (err) {
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message: `Upload Image: ${file.originalname}`,
            content
        });
    }

    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
    res.json({ url });
})


// Commit Github
app.post('/file', async (req, res) => {
    const { token, owner, repo, path, content, message = 'Update via CMS' } = req.body;
    const octokit = new Octokit({ auth: token });

    try {
        const { data: existingFile } = await octokit.repos.getContent({ owner, repo, path });

        const update = await octokit.repos.createOrUpdateFileContents ({
            owner,
            repo,
            path,
            message,
            content: Buffer.from(content).toString('base64'),
            sha: existingFile.sha
        });

        res.json({ success: true, commit: update.data.commit.sha });
    } catch (err) {
        res.status(500).json({ error: 'Gagal commit file', detail: err.message });
    }
});

//Add File markdown 
app.post('/new-file', async (req,res) => {
    const { token, owner, repo, path, content, message = 'Add new markdown file' } = req.body;

    if (!token || !owner || !repo || !path || !content) {
        return res.status(400).json({ error: 'Semua field wajib diisi'});
    }

    if (typeof content !== 'string'){
        return res.status(400).json({ error: 'Konten harus berupa string.'})
    }

    const octokit = new Octokit({ auth: token });

      try {
        await octokit.repos.getContent({ owner, repo, path });
        return res.status(400).json({ error: 'File sudah ada di repositori' });
      } catch (err) {
        if (err.status !== 404) {
          return res.status(500).json({ error: 'Gagal cek file', detail: err.message });
        }
      }

      try {
        const encodedContent = Buffer.from(content).toString('base64');
        const response = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: encodedContent,
          });
          res.json({ success: true, commit: response.data.commit.sha });
      } catch (createErr) {
        res.status(500).json({ error: 'Gagal membuat file baru', detail: createErr.message });
      }
  })

  //delete markdown file
  app.delete('/delete-file', async (req, res) => {
    const { token, owner, repo, path } = req.query;

    if (!token || !owner || !repo || !path) {
        return res.status(400).json({ error: 'Semua parameter (token, owner, repo, path wajib diisi' });
    }

    const octokit = new Octokit({ auth: token });

    try {
        const { data: file } = await octokit.repos.getContent({ owner, repo, path});

        const result = await octokit.repos.deleteFile({
            owner,
            repo,
            path,
            message: `Delete file ${path} via cms`,
            sha: file.sha
        });

        res.json({ success: true, commit: result.data.commit.sha });
    } catch (err) {
        console.error('Gagal hapus file:', err.message);
        res.status(500).json({ error: 'Gagal menghapus file', detail: err.message })
    }


  })

app.listen(PORT, () => {
    console.log(`BackEnd running on http://localhost:${PORT}`);
});