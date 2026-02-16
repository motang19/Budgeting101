# 📅 Budget Calendar App

A beautiful budget tracking application with calendar interface and cloud database sync.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase Database

Go to https://supabase.com/dashboard and run this SQL:

```sql
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date_category ON expenses(date, category);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON expenses
  FOR ALL USING (true) WITH CHECK (true);
```

### 3. Configure Environment

```bash
cp .env.local.template .env.local
```

Edit `.env.local` and add your Supabase credentials from Settings → API

### 4. Start the App

```bash
npm start
```

Open http://localhost:3000 🎉

## ✨ Features

- 📅 Calendar interface
- 💰 Expense tracking with categories
- 🔍 Search and filter
- ☁️ Cloud database sync
- 📊 Category insights

For detailed setup instructions, see LOCAL_SETUP_GUIDE.md
