# N-Doğal App Projesi

Bu proje, ASP.NET Core Web API ve Vanilla JavaScript kullanılarak geliştirilmiş basit bir e-ticaret uygulamasıdır. Katmanlı mimari prensipleri takip edilerek oluşturulmuştur.

## Genel Bakış

Uygulama, kullanıcıların kategorilere göz atmasını, ürünleri incelemesini, sepetlerine ürün eklemesini ve sipariş vermesini sağlar. Ayrıca, yöneticilerin kategorileri, ürünleri, siparişleri ve kullanıcıları yönetebileceği bir admin paneli bulunmaktadır.

## Katmanlı Mimari

Proje aşağıdaki katmanlardan oluşmaktadır:

1.  **Data Katmanı (`NDogalApp.Data`):**
    *   Veritabanı ile etkileşimden sorumludur.
    *   Entity Framework Core (Code First) kullanır.
    *   Entity sınıfları, DbContext, Repository Pattern ve Unit of Work desenlerini içerir.
    *   Fluent API ile veritabanı yapılandırmaları yapılır.

2.  **Business Katmanı (`NDogalApp.Business`):**
    *   Uygulamanın ana iş mantığını barındırır.
    *   Service (Manager) sınıfları, DTO'lar (Data Transfer Objects) ve iş kurallarını içerir.
    *   Data katmanı ile iletişim kurarak işlemleri gerçekleştirir.
    *   Hassas verilerin şifrelenmesi için ASP.NET Core Data Protection kullanır.

3.  **API Katmanı (`NDogalApp.WebApi`):**
    *   Dış dünyaya (frontend) API endpoint'leri sunar.
    *   ASP.NET Core Web API kullanır.
    *   Controller'lar gelen istekleri alır, ilgili Business servisini çağırır ve JSON formatında yanıt döner.
    *   Kimlik doğrulama (Authentication) ve Yetkilendirme (Authorization) için JWT (JSON Web Token) kullanır.
    *   Middleware (Global Hata Yakalama) içerir.
    *   Swagger/OpenAPI arayüzü ile API'nin test edilmesini sağlar.
    *   Model doğrulama (Data Annotations) kullanır.
    *   Dependency Injection (Bağımlılık Enjeksiyonu) prensibini uygular.

4.  **Frontend Katmanı (`NDogalApp.Frontend`):**
    *   Kullanıcı arayüzünü sunar.
    *   Vanilla JavaScript (ES Modules) ile geliştirilmiştir.
    *   Single Page Application (SPA) benzeri bir yapı kullanır (sayfa yenilemeden bölümler arası geçiş).
    *   API katmanı ile iletişim kurarak verileri alır ve gösterir.
    *   CSS modüler bir yapıda organize edilmiştir.

## Özellikler

*   **Kullanıcı Yönetimi:** Kayıt olma, giriş yapma, profil görüntüleme.
*   **Admin Kullanıcı Yönetimi:** Kullanıcı listeleme, detay görme, güncelleme, silme (Soft Delete).
*   **Kategori Yönetimi (Admin):** Kategori ekleme, listeleme, güncelleme, silme (Soft Delete).
*   **Ürün Yönetimi (Admin):** Ürün ekleme, listeleme, güncelleme, kısmi güncelleme (PATCH), silme (Soft Delete).
*   **Ürün Listeleme:** Tüm ürünleri veya kategoriye göre filtrelenmiş ürünleri görme.
*   **Sepet İşlemleri:** Sepete ürün ekleme, sepeti görüntüleme, ürün miktarını güncelleme, ürünü sepetten kaldırma, sepeti boşaltma.
*   **Sipariş İşlemleri:** Sepetten sipariş oluşturma, müşteri sipariş geçmişini görme.
*   **Admin Sipariş Yönetimi:** Tüm siparişleri listeleme, duruma göre filtreleme, sipariş durumunu güncelleme, kısmi kargo işaretleme, kalan ürünleri kargolama.
*   **Kimlik Doğrulama & Yetkilendirme:** JWT tabanlı güvenli API erişimi, Rol bazlı yetkilendirme (Admin, Customer).
*   **Güvenlik:** Şifreler Data Protection ile şifrelenmektedir. Global Hata Yakalama mevcuttur.
*   **API Dokümantasyonu:** Swagger arayüzü ile API endpoint'leri belgelenmiş ve test edilebilir durumdadır.

## Teknolojiler

*   **Backend:**
    *   ASP.NET Core 8.0 (veya kullandığınız sürüm)
    *   Entity Framework Core 7.0 (veya kullandığınız sürüm)
    *   Microsoft SQL Server (veya kullandığınız veritabanı)
    *   JWT Bearer Authentication
    *   ASP.NET Core Data Protection
*   **Frontend:**
    *   HTML5
    *   CSS3
    *   Vanilla JavaScript (ES Modules)
*   **Veritabanı Yaklaşımı:** Code First

## Kurulum ve Çalıştırma

**Gereksinimler:**

*   .NET 7 SDK (veya projenizin SDK sürümü)
*   SQL Server (veya yapılandırılmış başka bir veritabanı)
*   Node.js (Frontend bağımlılıkları için - eğer varsa)
*   Bir Kod Editörü (Visual Studio, VS Code vb.)

**Adımlar:**

1.  **Depoyu Klonlama:**
    ```bash
    git clone <depo_url>
    cd <proje_klasoru>
    ```
2.  **Veritabanı Ayarları:**
    *   `NDogalApp.WebApi/appsettings.json` dosyasındaki `ConnectionStrings` bölümünü kendi SQL Server bağlantı bilgilerinize göre güncelleyin.
    *   **Migration Uygulama:** Veritabanını oluşturmak veya güncellemek için Package Manager Console veya dotnet CLI kullanın:
        ```bash
        # WebApi projesi dizinindeyken:
        dotnet ef database update
        ```
        (Eğer migration dosyaları yoksa önce `dotnet ef migrations add InitialCreate` komutunu çalıştırın.)
3.  **JWT Ayarları:**
    *   `NDogalApp.WebApi/appsettings.json` dosyasındaki `Jwt` bölümünü (özellikle `SecretKey`, `Issuer`, `Audience`) projenize uygun şekilde ayarlayın. `SecretKey` güçlü ve gizli olmalıdır. `Audience` genellikle API'nin çalıştığı adres olmalıdır.
4.  **Backend'i Çalıştırma:**
    *   Visual Studio kullanıyorsanız, `NDogalApp.WebApi` projesini başlangıç projesi olarak ayarlayıp çalıştırın (IIS Express veya Kestrel).
    *   dotnet CLI kullanıyorsanız:
        ```bash
        cd NDogalApp.WebApi
        dotnet run
        ```
    *   Tarayıcıda Swagger arayüzünün (`https://localhost:<HTTPS_PORT>/swagger`) açıldığını doğrulayın.
5.  **Frontend Ayarları:**
    *   `NDogalApp.Frontend/js/api.js` dosyasındaki `API_BASE_URL` sabitini, backend API'nizin çalıştığı **HTTPS adresine** ayarlayın.
    *   `NDogalApp.WebApi/Program.cs` dosyasındaki CORS ayarlarında (`policy.WithOrigins(...)`) bulunan adresin, frontend'i çalıştıracağınız **HTTPS adresine** izin verdiğinden emin olun.
6.  **Frontend'i Çalıştırma:**
    *   Eğer `NDogalApp.Frontend` bir ASP.NET Core projesi ise (statik dosya sunucusu): Visual Studio'dan veya `dotnet run` ile çalıştırın.
    *   Eğer sadece statik dosyalar ise (index.html, css, js): Bir HTTP sunucusu kullanarak sunmanız gerekir (Node.js http-server, VS Code Live Server eklentisi vb.). `index.html` dosyasına çift tıklamak API isteklerinde CORS sorunlarına yol açabilir.
        *   Örnek (http-server):
            ```bash
            cd NDogalApp.Frontend
            # Yüklü değilse: npm install -g http-server
            http-server -p <istediginiz_port> -o --cors
            ```
        *   VS Code Live Server: `index.html` dosyasına sağ tıklayıp "Open with Live Server" seçeneğini kullanın.

7.  **Uygulamayı Kullanma:** Frontend adresine tarayıcıdan gidin. Kayıt olabilir, giriş yapabilir ve özellikleri kullanabilirsiniz.

## Katkıda Bulunma

Katkıda bulunmak isterseniz, lütfen önce bir issue açarak veya mevcut bir issue üzerinden tartışarak başlayın.

## Lisans

Bu proje [Lisans Adı Varsa Buraya] lisansı altındadır. (Eğer bir lisans seçmediyseniz bu satırı kaldırabilir veya uygun bir lisans ekleyebilirsiniz, örn: MIT License).
