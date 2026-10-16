import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpensesRepository } from './expenses.repository';
import { IExpense, CreateExpenseDto, UpdateExpenseDto } from './interfaces/expense.interface';

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  create(dto: CreateExpenseDto): IExpense {
    return this.expensesRepository.create(dto);
  }

  findAll(): IExpense[] {
    return this.expensesRepository.findAll();
  }

  findById(id: string): IExpense {
    const expense = this.expensesRepository.findById(id);
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  update(id: string, dto: UpdateExpenseDto): IExpense {
    const expense = this.expensesRepository.update(id, dto);
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    return expense;
  }

  delete(id: string): void {
    const expense = this.expensesRepository.findById(id);
    if (!expense) throw new NotFoundException(`Expense ${id} not found`);
    this.expensesRepository.delete(id);
  }
}
