import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { AgentsService } from './agents.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/constants/roles.constant';
import { AppLogger } from '../common/logger/app.logger';
import type { IUser } from '../users/interfaces/user.interface';
import type { IAgentProfile } from './interfaces/agent.interface';
import type { IOrder } from '../orders/interfaces/order.interface';
import type { IApiResponse } from '../common/interfaces/api-response.interface';

// ── Upload constants ────────────────────────────────────────────────────────
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'delivery-photos');
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Auto-create the upload directory
mkdirSync(UPLOAD_DIR, { recursive: true });

const multerStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Safe filename: timestamp + random suffix + original extension (no path traversal)
    const safeExt = extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
    const name = `pod-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`;
    cb(null, name);
  },
});

function multerFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Invalid file type "${file.mimetype}". Allowed: JPG, PNG, WebP, GIF`,
      ),
      false,
    );
  }
}

@ApiTags('Agents')
@ApiHeader({ name: 'x-auth-token', required: true })
@UseGuards(AuthGuard, RolesGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @Roles(Role.HUB_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'List all agents' })
  findAll(): IApiResponse<IAgentProfile[]> {
    return { success: true, data: this.agentsService.findAll() };
  }

  @Get(':id')
  @Roles(Role.HUB_MANAGER, Role.SUPER_USER, Role.DELIVERY_AGENT)
  @ApiOperation({ summary: 'Get agent profile' })
  findById(@Param('id') id: string): IApiResponse<IAgentProfile> {
    return { success: true, data: this.agentsService.findById(id) };
  }

  @Get(':id/worklist')
  @Roles(Role.DELIVERY_AGENT, Role.HUB_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Get assigned orders for an agent' })
  getWorklist(@Param('id') id: string, @CurrentUser() user: IUser): IApiResponse<IOrder[]> {
    return { success: true, data: this.agentsService.getWorklist(id, user) };
  }

  @Patch(':id/availability')
  @Roles(Role.DELIVERY_AGENT)
  @ApiOperation({ summary: 'Update agent availability status' })
  updateAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: IUser,
  ): IApiResponse<IAgentProfile> {
    return { success: true, data: this.agentsService.updateAvailability(id, dto, user) };
  }

  /**
   * POST /agents/:id/delivery-photo
   *
   * Proof-of-delivery photo upload.
   *
   * Implementation:
   *   - Uses @UseInterceptors(FileInterceptor) — NestJS/Multer disk storage
   *   - Validates file type (MIME whitelist: JPEG, PNG, WebP, GIF)
   *   - Validates file size (max 5 MB — enforced via multer limits)
   *   - Generates safe filename (no path traversal)
   *   - Stores to uploads/delivery-photos/
   *   - Logs upload to access.log
   *
   * @param id — Agent UUID
   * @param file — Uploaded image (multipart/form-data field: "photo")
   * @param user — Authenticated delivery agent
   */
  @Post(':id/delivery-photo')
  @Roles(Role.DELIVERY_AGENT, Role.HUB_MANAGER, Role.SUPER_USER)
  @ApiOperation({ summary: 'Upload proof-of-delivery photo (Delivery Agent)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Proof-of-delivery photo (JPG, PNG, WebP, GIF — max 5 MB)',
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Image file',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or no file provided' })
  @ApiResponse({ status: 403, description: 'Forbidden — can only upload for own assignments' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: multerStorage,
      fileFilter: multerFileFilter,
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  uploadDeliveryPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: IUser,
  ): IApiResponse<{ filename: string; path: string; size: number }> {
    if (!file) {
      throw new BadRequestException('No photo file provided. Use field name "photo".');
    }

    // Verify the agent exists
    const agent = this.agentsService.findById(id);
    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    // Delivery agents can only upload for themselves unless Hub Manager / Super User
    if (
      user.role === Role.DELIVERY_AGENT &&
      user.id !== agent.userId
    ) {
      throw new BadRequestException('You can only upload photos for your own deliveries');
    }

    AppLogger.info(`Proof-of-delivery photo uploaded`, {
      agentId: id,
      uploadedBy: user.id,
      role: user.role,
      filename: file.filename,
      size: file.size,
    });

    return {
      success: true,
      message: 'Proof-of-delivery photo uploaded successfully',
      data: {
        filename: file.filename,
        path: `uploads/delivery-photos/${file.filename}`,
        size: file.size,
      },
    };
  }
}
