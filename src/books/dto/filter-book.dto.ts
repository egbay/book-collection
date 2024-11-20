import { IsOptional, IsString } from 'class-validator';

export class FilterBooksDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}
