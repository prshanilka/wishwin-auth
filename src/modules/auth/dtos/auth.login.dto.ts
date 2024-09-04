import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class AuthLoginDto {
  @ApiProperty({
    example: faker.internet.email(),
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsString({ message: 'Email must be a valid string' })
  @IsNotEmpty({ message: 'Email is required' })
  public email: string;

  @ApiProperty({
    example: faker.internet.password(),
    description: 'The password of the user',
  })
  @IsString({ message: 'Password must be a valid string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  public password: string;
}

export class AuthOTPLoginDto {
  @ApiProperty({
    example: '+94768359941',
    description: 'The phone number of the user',
  })
  @IsPhoneNumber('LK', { message: 'Please provide a valid phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  public phone: string;

  @ApiProperty({
    example: '125456',
    description: 'OTP of the user',
  })
  @IsNumber()
  @Min(100000)
  @Max(999999)
  public otp: number;
}
