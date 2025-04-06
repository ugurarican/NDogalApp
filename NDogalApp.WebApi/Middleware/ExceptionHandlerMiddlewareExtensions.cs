using Microsoft.AspNetCore.Builder;

namespace NDogalApp.WebApi.Middleware
{
    public static class ExceptionHandlerMiddlewareExtensions
    {
        public static void UseApiExceptionHandler(this IApplicationBuilder app)
        {
            app.UseMiddleware<ExceptionHandlerMiddleware>();
        }
    }
}