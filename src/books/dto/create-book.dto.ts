import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  author: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1500)
  @Max(new Date().getFullYear())
  publicationYear: number;

  @IsNotEmpty()
  @IsString()
  genre: string;
}
