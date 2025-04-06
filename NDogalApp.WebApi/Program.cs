using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NDogalApp.Business.DataProtection;
using NDogalApp.Business.Operations.Basket;
using NDogalApp.Business.Operations.Category;
using NDogalApp.Business.Operations.Order;
using NDogalApp.Business.Operations.Product;
using NDogalApp.Business.Operations.User;
using NDogalApp.Data.Context;
using NDogalApp.Data.Repositories;
using NDogalApp.Data.UnitOfWork;
using NDogalApp.WebApi.Middleware;
using System.Text;
using Microsoft.AspNetCore.Http; // IHttpContextAccessor için

var builder = WebApplication.CreateBuilder(args);

// --- Servisleri Konteynera Ekleme ---

// ----> CORS Politikasýný Tanýmla <----
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {                 
                          policy.WithOrigins("https://localhost:7267")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

// 1. Controller Servisi
builder.Services.AddControllers()
    .AddJsonOptions(options => // Ýsteðe Baðlý: JSON serileþtirme ayarlarý
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });


// 2. Veritabaný Baðlantýsý (DbContext)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' not found in configuration.");
}
builder.Services.AddDbContext<NDogalDbContext>(options =>
    options.UseSqlServer(connectionString));

// 3. Repository ve Unit of Work
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// 4. Business Katmaný Servisleri
builder.Services.AddScoped<IUserService, UserManager>();
builder.Services.AddScoped<ICategoryService, CategoryManager>();
builder.Services.AddScoped<IProductService, ProductManager>();
builder.Services.AddScoped<IBasketService, BasketManager>();
builder.Services.AddScoped<IOrderService, OrderManager>();

// 5. Data Protection
var keysDirectory = new DirectoryInfo(Path.Combine(builder.Environment.ContentRootPath, "App_Data", "Keys"));
if (!keysDirectory.Exists)
{
    try { keysDirectory.Create(); } catch (Exception ex) { Console.WriteLine($"Error creating DataProtection keys directory: {ex.Message}"); }
}
// Klasör yazýlabilir mi kontrolü eklenebilir
builder.Services.AddDataProtection()
    .SetApplicationName("NDogalApp")
    .PersistKeysToFileSystem(keysDirectory);
// IDataProtection için özel servis kaydý
builder.Services.AddScoped<NDogalApp.Business.DataProtection.IDataProtection, NDogalApp.Business.DataProtection.DataProtection>();

// 6. JWT Authentication Ayarlarý
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"];
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"]; // Genellikle API'nin adresi

if (string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(issuer) || string.IsNullOrEmpty(audience))
{
    throw new InvalidOperationException("JWT settings (SecretKey, Issuer, Audience) are missing or empty in configuration.");
}

builder.Services.AddAuthentication(options => // Varsayýlan þemalarý ayarla
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, // Issuer'ý doðrula
            ValidIssuer = issuer,  // Beklenen issuer

            ValidateAudience = true, // Audience'ý doðrula
            ValidAudience = audience, // Beklenen audience (API'nin kendisi)

            ValidateLifetime = true, // Token süresini kontrol et
            ClockSkew = TimeSpan.Zero, // Süre toleransýný sýfýrla (anýnda geçersiz olsun)

            ValidateIssuerSigningKey = true, // Ýmza anahtarýný doðrula
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };

        // Ýsteðe baðlý: Token hatalarý için loglama
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context => {
                Console.WriteLine("JWT Authentication Failed: " + context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context => {
                Console.WriteLine("JWT Token Validated for: " + context.Principal?.Identity?.Name);
                return Task.CompletedTask;
            },
            OnChallenge = context => {
                Console.WriteLine("JWT Challenge triggered. Status: " + context.Response.StatusCode);
                // Yanýtý özelleþtirmek için context.HandleResponse() kullanýlabilir.
                return Task.CompletedTask;
            }
        };
    });

// 7. Yetkilendirme Servisleri
builder.Services.AddAuthorization(options =>
{
});

// 8. Swagger/OpenAPI Yapýlandýrmasý
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "N-Doðal App API", Version = "v1" });
    // JWT için Kilit/Yetkilendirme butonu ekle
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Scheme = "Bearer",
        BearerFormat = "JWT",
        Name = "Authorization", // Header adý
        In = ParameterLocation.Header, // Header'da gönderilecek
        Type = SecuritySchemeType.Http, // Tip HTTP
        Description = "Lütfen **Bearer** kelimesini yazmadan, sadece size verilen JWT token'ý girin. Örn: `eyJhbGciOi...`"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer" // Yukarýdaki SecurityDefinition ID'si ile eþleþmeli
                }
            },
            Array.Empty<string>() // Kapsam (scope) gerekmiyorsa boþ dizi
        }
    });
});

// 9. IHttpContextAccessor (UserManager vb. yerlerde HttpContext'e eriþim için)
builder.Services.AddHttpContextAccessor();

// 10. Logger
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
if (builder.Environment.IsDevelopment())
{
    builder.Logging.AddDebug();
}


// --- Uygulamayý Oluþturma ---
var app = builder.Build();

// --- HTTP Request Pipeline'ý Yapýlandýrma ---

// 1. Global Exception Handling (En baþa yakýn olmalý)
app.UseApiExceptionHandler();

// 2. Geliþtirme ortamýnda Swagger'ý etkinleþtir
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "N-Doðal App API V1");
        // Ýsteðe baðlý: Swagger UI'ý kök dizinde açmak için
        // c.RoutePrefix = string.Empty;
    });
}

// 3. HTTPS Yönlendirme
app.UseHttpsRedirection();

// 4. Production için HSTS
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// 5. Routing
app.UseRouting();

// 6. CORS (UseRouting'den SONRA, UseAuthentication/UseAuthorization'dan ÖNCE)
app.UseCors(MyAllowSpecificOrigins);

// 7. Authentication (Kimlik doðrulama - Token var mý, geçerli mi?)
app.UseAuthentication();

// 8. Authorization (Yetkilendirme - Token içindeki roller vb. yeterli mi?)
app.UseAuthorization();

// 9. Controller Endpoint'lerini Eþleme
app.MapControllers();

// Uygulamayý çalýþtýr
app.Run();