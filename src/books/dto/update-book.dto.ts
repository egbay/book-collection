import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsInt()
  @Min(1500)
  @Max(new Date().getFullYear())
  publicationYear?: number;

  @IsOptional()
  @IsString()
  genre?: string;
}
