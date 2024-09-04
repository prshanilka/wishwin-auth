import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { faker } from '@faker-js/faker';
import { District } from '@prisma/client';

export class AuthSignupDto {
  @ApiProperty({
    example: '+94768359941',
    description: 'The phone number of the user',
  })
  @IsPhoneNumber('LK', { message: 'Please provide a valid phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  public username: string;

  @ApiProperty({
    example: faker.person.firstName(),
    description: 'The first name of the user',
  })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  public firstName: string;

  @ApiProperty({
    example: faker.person.lastName(),
    description: 'The last name of the user',
  })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  public lastName: string;

  @ApiProperty({
    example: new Date().toISOString(),
    description: 'The dob of the user',
  })
  @IsDateString()
  public dob: Date;

  @ApiProperty({
    example: ' ',
    description: 'The School of the user',
  })
  @IsString({ message: 'School must be a string' })
  public school: string;

  @ApiProperty({
    example: faker.location.streetAddress({ useFullAddress: true }),
    description: 'Address of the user',
  })
  @IsNotEmpty()
  @IsString({ message: 'Address must be a string' })
  public address: string;

  @ApiProperty({
    example: District.Colombo,
    description: 'District of the user',
  })
  @IsNotEmpty()
  @IsEnum(District)
  public district: District;

  @ApiProperty({
    example: '125456',
    description: 'OTP of the user',
  })
  @IsNumber()
  @Min(100000)
  @Max(999999)
  public otp: number;
}
