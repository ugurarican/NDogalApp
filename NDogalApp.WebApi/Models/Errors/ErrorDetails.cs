namespace NDogalApp.WebApi.Models 
{
    public class ErrorDetails
    {
        public int StatusCode { get; set; }
        public string Message { get; set; }

        // İsteğe bağlı: Geliştirme ortamında detaylı bilgi (örn: stack trace)
        public string? Details { get; set; }

        public override string ToString()
        {
            return $"Status Code: {StatusCode}\nMessage: {Message}\nDetails: {Details}";
        }
    }
}