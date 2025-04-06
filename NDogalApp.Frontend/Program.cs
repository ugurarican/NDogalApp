// NDogalApp.Frontend/Program.cs

var builder = WebApplication.CreateBuilder(args);

// Şu an için özel bir servis eklemeye gerek yok.

var app = builder.Build();

// Geliştirme ortamında değilsen HSTS kullan (güvenlik için)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// HTTPS'e yönlendirmeyi etkinleştir
app.UseHttpsRedirection();

// Eğer istek bir dizin için gelirse (örn: /), varsayılan dosyayı (index.html) ara.
app.UseDefaultFiles();

// wwwroot klasöründeki statik dosyaları (HTML, CSS, JS, resimler vb.) sun.
app.UseStaticFiles();

app.Run();