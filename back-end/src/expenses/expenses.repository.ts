import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { v4 as uuidv4 } from 'uuid';
import { IExpense, CreateExpenseDto, UpdateExpenseDto } from './interfaces/expense.interface';

@Injectable()
export class ExpensesRepository {
  constructor(private readonly db: DatabaseService) {}

  create(expense: CreateExpenseDto): IExpense {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO expenses (id, description, amount, category, date, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, expense.description, expense.amount, expense.category, expense.date, now, now]
    );
    return this.findById(id)!;
  }

  findAll(): IExpense[] {
    return this.db.query<IExpense>('SELECT * FROM expenses ORDER BY date DESC');
  }

  findById(id: string): IExpense | undefined {
    return this.db.queryOne<IExpense>('SELECT * FROM expenses WHERE id = ?', [id]);
  }

  update(id: string, data: UpdateExpenseDto): IExpense | undefined {
    const expense = this.findById(id);
    if (!expense) return undefined;
    
    const now = new Date().toISOString();
    const updated = { ...expense, ...data, updatedAt: now };

    this.db.run(
      `UPDATE expenses SET description = ?, amount = ?, category = ?, date = ?, updatedAt = ? WHERE id = ?`,
      [updated.description, updated.amount, updated.category, updated.date, updated.updatedAt, id]
    );

    return this.findById(id);
  }

  delete(id: string): boolean {
    this.db.run('DELETE FROM expenses WHERE id = ?', [id]);
    return true;
  }
}
