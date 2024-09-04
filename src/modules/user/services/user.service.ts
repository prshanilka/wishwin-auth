import { Injectable } from '@nestjs/common';
import { AuthSignupDto } from 'src/modules/auth/dtos/auth.signup.dto';
import { plainToClass } from 'class-transformer';
import { AccountStatus, Roles } from '@prisma/client';

import { PrismaService } from '../../../common/services/prisma.service';
import { UserResponseDto } from '../dtos/user.response.dto';
import { UserUpdateDto } from '../dtos/user.update.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserById(userId: string): Promise<UserResponseDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    return plainToClass(UserResponseDto, user);
  }

  async getUserByEmail(email: string): Promise<UserResponseDto> {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async getUserByUserName(userName: string): Promise<UserResponseDto> {
    const user = this.prismaService.user.findUnique({
      where: { username: userName },
    });
    return plainToClass(UserResponseDto, user);
  }

  async updateUser(userId: string, data: UserUpdateDto) {
    const { firstName, lastName, email, phone, avatar } = data;
    return this.prismaService.user.update({
      data: {
        first_name: firstName?.trim(),
        last_name: lastName?.trim(),
        email,
        phone,
        avatar,
      },
      where: {
        id: userId,
      },
    });
  }

  async createUser(data: Omit<AuthSignupDto, 'otp'>) {
    return this.prismaService.user.create({
      data: {
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        school: data.school,
        district: data.district,
        address: data.address,
        dob: data.dob,
        account_status: AccountStatus.Verified,
        role: Roles.Student,
      },
    });
  }

  async softDeleteUsers(userIds: string[]) {
    await this.prismaService.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    });
    return;
  }
}
