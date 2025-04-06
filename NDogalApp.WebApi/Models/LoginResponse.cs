using NDogalApp.Business.Operations.User.Dtos; // UserInfoDto için

namespace NDogalApp.WebApi.Models
{
    // Başarılı giriş sonrası istemciye dönecek yanıt modeli.
    public class LoginResponse
    {
        public string Message { get; set; }
        public string Token { get; set; } // Oluşturulan JWT
        public UserInfoDto User { get; set; } // Giriş yapan kullanıcı bilgileri
        public DateTime Expiration { get; set; } // Token'ın ne zaman geçersiz olacağı bilgisi
    }
}