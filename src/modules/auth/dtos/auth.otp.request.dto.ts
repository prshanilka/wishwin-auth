import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export class AuthOTPRequestDto {
  @ApiProperty({
    example: '+94768359941',
    description: 'The phone number of the user',
  })
  @IsPhoneNumber('LK', { message: 'Please provide a valid phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  public phoneNumber: string;

  @ApiProperty({
    example: true,
    description: 'Indicates whether the user is registering',
  })
  @IsNotEmpty({ message: 'Register flag is required' })
  public register: boolean;

  @ApiProperty({
    example: faker.person.firstName(),
    description: 'The first name of the user',
  })
  @ValidateIf((dto: AuthOTPRequestDto) => dto.register === true)
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required when registering' })
  public firstName?: string;

  @ApiProperty({
    example: faker.person.lastName(),
    description: 'The last name of the user',
  })
  @ValidateIf((dto: AuthOTPRequestDto) => dto.register === true)
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required when registering' })
  public lastName?: string;
}
