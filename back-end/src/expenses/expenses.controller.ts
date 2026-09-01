import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './interfaces/expense.interface';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/constants/roles.constant';

@Controller('expenses')
@UseGuards(AuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(Role.SUPER_USER)
  create(@Body() dto: CreateExpenseDto) {
    return {
      status: 'success',
      message: 'Expense created successfully',
      data: this.expensesService.create(dto),
    };
  }

  @Get()
  @Roles(Role.SUPER_USER)
  findAll() {
    return {
      status: 'success',
      data: this.expensesService.findAll(),
    };
  }

  @Get(':id')
  @Roles(Role.SUPER_USER)
  findById(@Param('id') id: string) {
    return {
      status: 'success',
      data: this.expensesService.findById(id),
    };
  }

  @Put(':id')
  @Roles(Role.SUPER_USER)
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return {
      status: 'success',
      message: 'Expense updated successfully',
      data: this.expensesService.update(id, dto),
    };
  }

  @Delete(':id')
  @Roles(Role.SUPER_USER)
  delete(@Param('id') id: string) {
    this.expensesService.delete(id);
    return {
      status: 'success',
      message: 'Expense deleted successfully',
    };
  }
}
