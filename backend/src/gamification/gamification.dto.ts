import { IsInt, Min, IsOptional, IsString, IsNotEmpty, Matches } from 'class-validator';

export class UpdateXpRuleDto {
  @IsInt()
  @Min(0)
  xpValue!: number;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class CreateXpRuleDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, { message: 'Identificador deve conter apenas letras minúsculas, números e underscores' })
  action!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  xpValue!: number;

  @IsOptional()
  @IsString()
  icon?: string;
}
