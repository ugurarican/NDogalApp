using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting; 
using Microsoft.Extensions.Logging; 
using NDogalApp.WebApi.Models;
using System;
using System.Net; 
using System.Text.Json;
using System.Threading.Tasks;

namespace NDogalApp.WebApi.Middleware
{
    public class ExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlerMiddleware> _logger;
        private readonly IHostEnvironment _env; // Ortamı kontrol etmek için

        public ExceptionHandlerMiddleware(RequestDelegate next, ILogger<ExceptionHandlerMiddleware> logger, IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                // Sonraki middleware'i veya endpoint'i çağır
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                // Hata oluşursa logla
                _logger.LogError(ex, "Beklenmedik bir hata oluştu: {ErrorMessage}", ex.Message);

                // İstemciye standart bir hata yanıtı hazırla
                await HandleExceptionAsync(httpContext, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            var response = context.Response;

            var errorDetails = new ErrorDetails();

            // Hata tipine göre StatusCode ve Mesaj belirle
            // TODO: Daha spesifik hata türleri için case'ler eklenebilir (örn: ValidationException, NotFoundException vb.)
            switch (exception)
            {
                // Örnek: Özel bir 'bulunamadı' hatası varsa 404 dön
                // case NotFoundException e:
                //     errorDetails.StatusCode = (int)HttpStatusCode.NotFound;
                //     errorDetails.Message = e.Message;
                //     break;
                // Örnek: Özel bir validasyon hatası varsa 400 dön
                // case ValidationException e:
                //     errorDetails.StatusCode = (int)HttpStatusCode.BadRequest;
                //     errorDetails.Message = e.Message; // Veya validasyon detayları
                //     break;
                case UnauthorizedAccessException e: // Yetkisiz erişim denemesi
                    errorDetails.StatusCode = (int)HttpStatusCode.Unauthorized;
                    errorDetails.Message = "Yetkisiz Erişim.";
                    break;
                default: // Diğer tüm hatalar için 500 Internal Server Error
                    errorDetails.StatusCode = (int)HttpStatusCode.InternalServerError;
                    errorDetails.Message = "Sunucuda beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
                    break;
            }

            // Geliştirme ortamındaysak detayları ekle (Güvenlik riski!)
            if (_env.IsDevelopment())
            {
                errorDetails.Details = exception.StackTrace; // veya exception.ToString()
            }

            response.StatusCode = errorDetails.StatusCode;

            // ErrorDetails nesnesini JSON'a çevir ve response'a yaz
            var jsonResponse = JsonSerializer.Serialize(errorDetails);
            await response.WriteAsync(jsonResponse);
        }
    }
}