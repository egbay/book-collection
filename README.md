# Book Collection API

Bu proje, **NestJS** kullanılarak geliştirilen bir backend API'dır. Kitap ve inceleme (review) yönetimi, kullanıcı doğrulama, rol tabanlı erişim kontrolü ve sayfalama gibi özellikler sunar. JWT tabanlı kimlik doğrulama ve refresh token desteği ile güvenli bir şekilde çalışır. Ek olarak, Docker ile kolayca çalıştırılabilir.

---

## İçindekiler

1. [Özellikler](#özellikler)
2. [Kullanılan Teknolojiler](#kullanılan-teknolojiler)
3. [Mimari Kararlar](#mimari-kararlar)
4. [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
5. [Veritabanı Migrasyonları](#veritabanı-migrasyonları)
6. [API Endpointleri](#api-endpointleri)
7. [Planlanan Özellikler](#planlanan-özellikler)

---

## Özellikler

### Tamamlanan Özellikler

- **Kitap Yönetimi**
  - Kitaplar için CRUD işlemleri
  - Sayfalama ve filtreleme desteği
  - Ortalama puan ve popülerlik hesaplama
- **İnceleme (Review) Yönetimi**
  - İncelemeler için CRUD işlemleri
  - Kitapların istatistiklerini otomatik olarak günceller
- **Kimlik Doğrulama**
  - Kayıt olma ve giriş yapma
  - JWT ile kimlik doğrulama ve refresh token desteği
- **Rol Tabanlı Erişim Kontrolü**
  - `ADMIN` rolü: kitap ve inceleme yönetimi
  - `USER` rolü: sadece kullanıcı yetkileri
- **Loglama**
  - Başarılı ve hatalı durumlar için detaylı loglama
- **CORS Desteği**
  - Farklı kaynaklardan API'ye erişim desteği
- **Docker Desteği**
  - Docker ve Docker Compose ile kolay çalışma

---

## Kullanılan Teknolojiler

- **Backend Framework**: [NestJS](https://nestjs.com/)
- **Veritabanı**: PostgreSQL
- **ORM**: Prisma
- **Kimlik Doğrulama**: JWT ile Refresh Token desteği
- **Loglama**: `winston` ve `nestjs-winston` entegrasyonu
- **Konteynerizasyon**: Docker & Docker Compose
- **Test**:
  - Unit Test: Jest
  - Entegrasyon Testi: Supertest
  - E2E Testi: Supertest
- **Sürüm Kontrolü**: Git ve GitHub Actions ile CI/CD

---

## Mimari Kararlar

### 1. Modüler Tasarım

- Uygulama, feature-based bir modüler yapıya göre tasarlanmıştır.
- Her modül bağımsızdır ve kendi servislerini, kontrollerini ve veri modellerini içerir. Örneğin:
- `BooksModule` → Kitap CRUD işlemleri
- `ReviewsModule` → İnceleme CRUD işlemleri
- `AuthModule` → Kimlik doğrulama işlemleri

### 2. Dependency Injection (Bağımlılık Enjeksiyonu)

- NestJS'nin dependency injection mekanizması kullanılarak bağımsız ve yeniden kullanılabilir servisler oluşturulmuştur.
- Bu yapı, test edilebilirliği artırır ve kodun modüler bir yapıda kalmasını sağlar.

### 3. Prisma ORM Kullanımı

- Veritabanı işlemleri için Prisma ORM kullanılmıştır.
- Prisma’nın güçlü şema yönetimi ve tip desteği sayesinde veritabanı işlemleri kolay ve güvenilir hale getirilmiştir.

### 4. Rol Tabanlı Erişim Kontrolü (RBAC)

- Kullanıcı yetkilendirmesi şu şekilde yapılandırılmıştır:
- Admin: Tüm CRUD işlemlerini gerçekleştirebilir.
- User: Kitapları görüntüleyebilir ve inceleme ekleyebilir.
- `@Roles` decorator ve özelleştirilmiş RolesGuard ile uygulandı.

### 5. JWT ve Refresh Token Entegrasyonu

- JWT kullanılarak oturum açma ve yetkilendirme sağlanır.
- Refresh token mekanizması, uzun süreli oturumlar için kullanılır ve refresh tokenlar güvenli bir şekilde veritabanında saklanır.

### 7. Loglama

- Winston kullanılarak detaylı bir loglama sistemi eklendi:
- Bilgi logları: Başarılı işlemler için (`info` seviyesinde)
- Hata logları: Başarısız işlemler için (`error` seviyesinde)
- Loglar arasında `eventId`, `userId`, `timestamp` gibi detaylı meta bilgiler bulunur.

### 8. Sayfalama ve Filtreleme

- Kitaplar ve incelemeler için sayfalama desteği sağlandı.
- Filtreleme özellikleri ile kullanıcılar, kitapları başlık, yazar ve tür gibi kriterlere göre arayabilir.

### 9. Eşzamanlılık ve Performans Optimizasyonu

- Promise.all kullanılarak birden fazla işlem aynı anda gerçekleştirilir.
- Örneğin: Bir inceleme silindiğinde, kitabın popülerlik ve puan ortalaması eşzamanlı olarak güncellenir.

### 10. CORS ve Güvenlik

- CORS ayarları eklenerek sadece belirli domain'lerden API'ye erişim sağlanmıştır.
- `.env` dosyası ile gizli bilgiler (`JWT_SECRET`, `DATABASE_URL`) çevre değişkenlerinde saklanır.

### 11. CI/CD ve Docker Desteği

- GitHub Actions ile CI/CD pipeline yapılandırıldı.
- Docker Compose ile proje, bağımsız bir ortamda kolayca çalıştırılabilir hale getirildi.

### 12. Test Odaklı Geliştirme

- Projede unit ve entegrasyon testleri için Jest kullanıldı.
- Testler, uygulama işlevlerinin doğru çalıştığını sürekli doğrular ve proje kapsama oranı yüksek tutulmuştur.

### 13. Hata Yönetimi (Error Handling)

- Kullanıcıya daha iyi hata mesajları sağlamak için özel hata yönetimi uygulanmıştır.
- Hatalar loglanarak hızlı tespit ve çözüm sağlanır.

### 14. API Genişletilebilirliği

- API’nin genişletilebilir yapısı, yeni modüller ve özelliklerin kolayca entegre edilebilmesini sağlar. Örneğin:

- Bildirim sistemi
- Detaylı analiz panelleri

### 15. Swagger ile API Dokümantasyonu

- Swagger kullanılarak proje için interaktif bir API dokümantasyonu sağlanmıştır.
- Geliştiriciler, Swagger arayüzü üzerinden API'nin tüm endpoint'lerini görüntüleyebilir, test edebilir ve dökümantasyon detaylarına erişebilir.
- Swagger, aşağıdaki gibi konfigüre edilmiştir:
- Swagger URL'si: `/api`
- API tanımı: `OpenAPI 3.0` standardında yapılandırılmıştır.
- JWT yetkilendirme mekanizması Swagger üzerinden de test edilebilir.

---

## Kurulum ve Çalıştırma

### Gereksinimler

- Node.js (v18 veya üzeri)
- Docker ve Docker Compose
- PostgreSQL (Eğer Docker kullanılmayacaksa)

### Adımlar

#### 1. Depoyu Klonlayın

```bash
git clone https://github.com/egbay/book-collection.git
cd book-collection
```

#### 2. Paketleri Yükleyin

```bash
npm install
```

#### 3. Ortam Değişkenleri

Projenin kök dizininde bir .env dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/book_collection
JWT_SECRET=guclu_bir_jwt_sifresi
REFRESH_SECRET=guclu_bir_refresh_sifresi
PORT=3000
```

#### 4. Docker ile Çalıştırma

```bash
docker-compose up --build
```

#### 5. Lokal Çalıştırma

PostgreSQL'i başlatın ve DATABASE_URL değişkeninin doğru olduğundan emin olun.
Uygulamayı çalıştırın:

```bash
npm run start:dev
```

### Veritabanı Migrasyonları

#### Migration Oluşturma

```bash
npx prisma migrate dev --name init
```

#### Migration Uygulama

```bash
npx prisma migrate deploy
```

#### Veritabanı Şemasını Görüntüleme

```bash
npx prisma studio
```

### API Endpointleri

#### Kimlik Doğrulama

| Metot | Endpoint         | Açıklama                   | Erişim |
| ----- | ---------------- | -------------------------- | ------ |
| POST  | `/auth/register` | Yeni kullanıcı kaydı       | Public |
| POST  | `/auth/login`    | Giriş ve access token alma | Public |
| POST  | `/auth/refresh`  | Refresh token ile yenileme | Public |

#### Kitaplar

| Metot  | Endpoint     | Açıklama                   | Erişim     |
| ------ | ------------ | -------------------------- | ---------- |
| GET    | `/books`     | Kitapları listele          | USER/ADMIN |
| POST   | `/books`     | Yeni kitap ekle            | ADMIN      |
| GET    | `/books/:id` | Kitap detaylarını getir    | USER/ADMIN |
| PATCH  | `/books/:id` | Kitap bilgilerini güncelle | ADMIN      |
| DELETE | `/books/:id` | Kitap sil                  | ADMIN      |

#### İncelemeler (Reviews)

| Metot  | Endpoint       | Açıklama                    | Erişim     |
| ------ | -------------- | --------------------------- | ---------- |
| GET    | `/reviews`     | Review'leri listele         | USER/ADMIN |
| POST   | `/reviews`     | Yeni Review ekle            | ADMIN      |
| GET    | `/reviews/:id` | Review detaylarını getir    | USER/ADMIN |
| PATCH  | `/reviews/:id` | Review bilgilerini güncelle | ADMIN      |
| DELETE | `/reviews/:id` | Review sil                  | ADMIN      |

### Testler

#### Unit Testleri Çalıştırma

```bash
npm run test
```

#### Entegrasyon Testleri Çalıştırma

```bash
npm run test:e2e
```

#### Test Kapsamını Görüntüleme

```bash
npm run test:cov
```

### Swagger ile API'ye Erişim

1. Uygulamayı çalıştırdıktan sonra Swagger arayüzüne erişmek için tarayıcınızda şu adresi ziyaret edin:

```bash
http://localhost:3000/api
```

2. Swagger üzerinden:

- Tüm endpoint'leri ve dökümantasyonlarını görüntüleyebilirsiniz.
- API endpoint'lerini doğrudan test edebilirsiniz.
- JWT token ile yetkilendirme yapabilirsiniz.

3. Yetkilendirme yapmak için Swagger arayüzünde sağ üst köşedeki Authorize düğmesine tıklayın ve aşağıdaki formatta JWT token'ınızı girin:

```bash
Bearer <token>
```

### Veritabanı Kurulumu

1. Terminalde şu komutları kullanarak psql'e erişebilirsiniz:

```bash
  psql -U postgres
```

2. psql içinde şu komutu çalıştırarak yeni bir veritabanı oluşturabilirsiniz:

```sql
  CREATE DATABASE mydatabase;
```

3. Yeni bir kullanıcı oluşturun:

```sql
  CREATE USER myuser WITH PASSWORD 'mypassword';
```

4. Kullanıcıya yeni veritabanında tüm yetkileri verin:

```sql
  GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;
```

5. Komut satırından çıkmak için:

```sql
  \q
```

### Yapılabilecekler

- **Rate Limiting**
  - Fazla istek yapılmasını engelleyen rate limiting. Versiyon uyumsuzluğu nedeniyle bu versiyona eklenemedi.
- **Integration ve E2E Test**
  - Bu testlerin genişletilmesi.
