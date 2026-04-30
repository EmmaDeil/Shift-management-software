import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { loadSchedule, saveSchedule, listMonths, PersistedSchedule } from './scheduleStore';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/schedule/:month', async (req: Request<{ month: string }>, res: Response) => {
  const { month } = req.params; // YYYY-MM
  const data = await loadSchedule(month);
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

app.post('/api/schedule/:month', async (req: Request<{ month: string }, unknown, Omit<PersistedSchedule,'updatedAt'|'month'>>, res: Response) => {
  const { month } = req.params;
  const body = req.body;
  const payload: PersistedSchedule = {
    month,
    people: body.people,
    timeSlots: body.timeSlots,
    assignments: body.assignments,
    stats: body.stats,
    updatedAt: new Date().toISOString()
  };
  await saveSchedule(payload);
  res.json({ saved: true, month });
});

app.get('/api/months', async (_req: Request, res: Response) => {
  res.json({ months: await listMonths() });
});

const PORT = process.env.PORT || 4000;

// In production, serve the Vite build output (client)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  // SPA fallback: send index.html for any non-API route
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Schedule API listening on :${PORT}`);
});
